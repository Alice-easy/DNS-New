/**
 * Namecheap DNS Provider Adapter
 */

import {
  IDNSProvider,
  ProviderMeta,
  ProviderCredentials,
  ProviderDomain,
  ProviderRecord,
  CreateRecordInput,
  UpdateRecordInput,
  DNSRecordType,
  AuthenticationError,
  RateLimitError,
  RecordNotFoundError,
  DomainNotFoundError,
  DNSProviderError,
} from "./types";

// Namecheap API 响应类型
interface NamecheapResponse {
  ApiResponse: {
    Status: string;
    Errors?: { Error: Array<{ _: string; Number: string }> | { _: string; Number: string } };
    Warnings?: { Warning: Array<{ _: string }> | { _: string } };
    CommandResponse: Record<string, unknown>;
  };
}

interface NamecheapHost {
  HostId: string;
  Name: string;
  Type: string;
  Address: string;
  MXPref?: string;
  TTL: string;
}

interface NamecheapDomainInfo {
  DomainName: string;
  Created: string;
  Expires: string;
  IsLocked: string;
  AutoRenew: string;
}

export class NamecheapProvider implements IDNSProvider {
  private baseUrl = "https://api.namecheap.com/xml.response";
  private apiUser: string;
  private apiKey: string;
  private userName: string;
  private clientIp: string;

  readonly meta: ProviderMeta = {
    name: "namecheap",
    displayName: "Namecheap",
    description: "Namecheap DNS service with basic DNS management",
    website: "https://www.namecheap.com",
    features: {
      proxied: false,
      geoRouting: false,
      loadBalancing: false,
      healthChecks: false,
    },
    credentialFields: [
      {
        name: "apiUser",
        label: "API User",
        type: "text",
        required: true,
        placeholder: "Enter your API username",
        helpText: "Your Namecheap API username",
      },
      {
        name: "apiKey",
        label: "API Key",
        type: "password",
        required: true,
        placeholder: "Enter your API Key",
        helpText:
          "Create an API Key at https://ap.www.namecheap.com/settings/tools/apiaccess/",
      },
      {
        name: "userName",
        label: "Username",
        type: "text",
        required: true,
        placeholder: "Enter your Namecheap username",
        helpText: "Your Namecheap account username (usually same as API User)",
      },
      {
        name: "clientIp",
        label: "Client IP",
        type: "text",
        required: true,
        placeholder: "Enter your whitelisted IP address",
        helpText: "Your whitelisted IPv4 address (must be added in Namecheap API settings)",
      },
    ],
  };

  constructor(credentials: ProviderCredentials) {
    if (!credentials.apiUser || !credentials.apiKey || !credentials.userName || !credentials.clientIp) {
      throw new Error("Namecheap requires apiUser, apiKey, userName, and clientIp");
    }
    this.apiUser = credentials.apiUser;
    this.apiKey = credentials.apiKey;
    this.userName = credentials.userName;
    this.clientIp = credentials.clientIp;
  }

  private buildUrl(command: string, params: Record<string, string> = {}): string {
    const baseParams = new URLSearchParams({
      ApiUser: this.apiUser,
      ApiKey: this.apiKey,
      UserName: this.userName,
      Command: command,
      ClientIp: this.clientIp,
      ...params,
    });
    return `${this.baseUrl}?${baseParams.toString()}`;
  }

  private async request<T>(command: string, params: Record<string, string> = {}): Promise<T> {
    const url = this.buildUrl(command, params);
    const response = await fetch(url, { method: "GET" });

    // 处理速率限制
    if (response.status === 429) {
      throw new RateLimitError("namecheap", 60);
    }

    // 处理认证错误
    if (response.status === 401 || response.status === 403) {
      throw new AuthenticationError("namecheap", {
        status: response.status,
        statusText: response.statusText,
      });
    }

    const text = await response.text();
    const data = this.parseXml(text) as NamecheapResponse;

    // 检查 API 响应状态
    if (data.ApiResponse.Status !== "OK") {
      const errors = data.ApiResponse.Errors?.Error;
      const errorArray = Array.isArray(errors) ? errors : errors ? [errors] : [];
      const firstError = errorArray[0];
      const message = firstError?._ || "Unknown error";
      const code = firstError?.Number || "UNKNOWN";

      // 检查是否是认证错误
      if (code === "1011004" || code === "1011002") {
        throw new AuthenticationError("namecheap", { message, code });
      }

      throw new DNSProviderError(message, code, "namecheap", { errors: errorArray });
    }

    return data.ApiResponse.CommandResponse as T;
  }

  private parseXml(xml: string): NamecheapResponse {
    // 简单的 XML 解析器（生产环境建议使用专业库如 fast-xml-parser）
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "text/xml");

    const parseElement = (element: Element): unknown => {
      if (!element) return null;

      // 获取所有属性
      const attrs: Record<string, string> = {};
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        attrs[attr.name] = attr.value;
      }

      // 获取子元素
      const children: Record<string, unknown> = {};
      const childElements = Array.from(element.children);

      if (childElements.length === 0) {
        // 叶子节点，返回文本内容和属性
        const text = element.textContent?.trim() || "";
        if (Object.keys(attrs).length > 0) {
          return { _: text, ...attrs };
        }
        return text || null;
      }

      // 处理子元素
      for (const child of childElements) {
        const tagName = child.tagName;
        const value = parseElement(child);

        if (children[tagName]) {
          // 如果已存在同名标签，转换为数组
          if (!Array.isArray(children[tagName])) {
            children[tagName] = [children[tagName]];
          }
          (children[tagName] as unknown[]).push(value);
        } else {
          children[tagName] = value;
        }
      }

      return Object.keys(attrs).length > 0 ? { ...children, ...attrs } : children;
    };

    const apiResponse = doc.querySelector("ApiResponse");
    if (!apiResponse) {
      throw new DNSProviderError("Invalid XML response", "PARSE_ERROR", "namecheap", { xml });
    }

    return { ApiResponse: parseElement(apiResponse) } as NamecheapResponse;
  }

  async validateCredentials(): Promise<boolean> {
    try {
      // 使用 namecheap.domains.getList 验证凭据
      await this.request("namecheap.domains.getList", { PageSize: "1" });
      return true;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return false;
      }
      throw error;
    }
  }

  async listDomains(): Promise<ProviderDomain[]> {
    const response = await this.request<{
      DomainGetListResult: {
        Domain: Array<{
          ID: string;
          Name: string;
          Created: string;
          Expires: string;
          IsLocked: string;
          AutoRenew: string;
        }> | {
          ID: string;
          Name: string;
          Created: string;
          Expires: string;
          IsLocked: string;
          AutoRenew: string;
        };
      };
    }>("namecheap.domains.getList", { PageSize: "100" });

    const domains = response.DomainGetListResult?.Domain;
    const domainArray = Array.isArray(domains) ? domains : domains ? [domains] : [];

    return domainArray.map((domain) => ({
      id: domain.Name, // Namecheap 使用域名作为标识
      name: domain.Name,
      status: "active",
      nameServers: [], // Namecheap API 需要单独查询 NS
      createdAt: new Date(domain.Created),
      extra: {
        expires: domain.Expires,
        isLocked: domain.IsLocked === "true",
        autoRenew: domain.AutoRenew === "true",
      },
    }));
  }

  async getDomain(domainId: string): Promise<ProviderDomain> {
    // Namecheap 使用域名作为标识
    const [sld, tld] = this.splitDomain(domainId);

    try {
      const response = await this.request<{
        DomainGetInfoResult: NamecheapDomainInfo & {
          DnssecDetails?: unknown;
          Nameservers?: string;
        };
      }>("namecheap.domains.getInfo", { DomainName: domainId });

      const info = response.DomainGetInfoResult;

      return {
        id: domainId,
        name: domainId,
        status: "active",
        nameServers: [], // 需要解析 Nameservers 字段
        createdAt: new Date(info.Created),
        extra: {
          expires: info.Expires,
          isLocked: info.IsLocked === "true",
          autoRenew: info.AutoRenew === "true",
        },
      };
    } catch (error) {
      if (error instanceof DNSProviderError && error.message.includes("Domain not found")) {
        throw new DomainNotFoundError("namecheap", domainId);
      }
      throw error;
    }
  }

  async listRecords(domainId: string): Promise<ProviderRecord[]> {
    const [sld, tld] = this.splitDomain(domainId);

    const response = await this.request<{
      DomainDNSGetHostsResult: {
        host?: NamecheapHost[] | NamecheapHost;
      };
    }>("namecheap.domains.dns.getHosts", { SLD: sld, TLD: tld });

    const hosts = response.DomainDNSGetHostsResult?.host;
    const hostArray = Array.isArray(hosts) ? hosts : hosts ? [hosts] : [];

    return hostArray.map((host) => this.mapRecord(host, domainId));
  }

  async createRecord(domainId: string, input: CreateRecordInput): Promise<ProviderRecord> {
    // Namecheap 不支持单个记录创建，需要获取所有记录后再设置
    // 这是 Namecheap API 的限制
    const existingRecords = await this.listRecords(domainId);

    // 创建新记录
    const newRecord: NamecheapHost = {
      HostId: "", // 创建时为空
      Name: this.extractSubdomain(input.name, domainId),
      Type: input.type,
      Address: input.content,
      TTL: String(input.ttl || 1800),
    };

    if (input.priority && input.type === "MX") {
      newRecord.MXPref = String(input.priority);
    }

    // 将新记录添加到现有记录列表
    const [sld, tld] = this.splitDomain(domainId);
    await this.setHosts(sld, tld, [...existingRecords, this.mapRecord(newRecord, domainId)]);

    // 返回创建的记录（没有真实 ID）
    return this.mapRecord(newRecord, domainId);
  }

  async updateRecord(
    domainId: string,
    recordId: string,
    input: UpdateRecordInput
  ): Promise<ProviderRecord> {
    const existingRecords = await this.listRecords(domainId);
    const recordIndex = existingRecords.findIndex((r) => r.id === recordId);

    if (recordIndex === -1) {
      throw new RecordNotFoundError("namecheap", recordId);
    }

    // 更新记录
    const updatedRecord = {
      ...existingRecords[recordIndex],
      type: (input.type || existingRecords[recordIndex].type) as DNSRecordType,
      name: input.name || existingRecords[recordIndex].name,
      content: input.content || existingRecords[recordIndex].content,
      ttl: input.ttl ?? existingRecords[recordIndex].ttl,
      priority: input.priority ?? existingRecords[recordIndex].priority,
    };

    existingRecords[recordIndex] = updatedRecord;

    const [sld, tld] = this.splitDomain(domainId);
    await this.setHosts(sld, tld, existingRecords);

    return updatedRecord;
  }

  async deleteRecord(domainId: string, recordId: string): Promise<void> {
    const existingRecords = await this.listRecords(domainId);
    const filteredRecords = existingRecords.filter((r) => r.id !== recordId);

    if (filteredRecords.length === existingRecords.length) {
      throw new RecordNotFoundError("namecheap", recordId);
    }

    const [sld, tld] = this.splitDomain(domainId);
    await this.setHosts(sld, tld, filteredRecords);
  }

  async batchCreateRecords(
    domainId: string,
    inputs: CreateRecordInput[]
  ): Promise<ProviderRecord[]> {
    const existingRecords = await this.listRecords(domainId);

    const newRecords = inputs.map((input) => {
      const host: NamecheapHost = {
        HostId: "",
        Name: this.extractSubdomain(input.name, domainId),
        Type: input.type,
        Address: input.content,
        TTL: String(input.ttl || 1800),
      };

      if (input.priority && input.type === "MX") {
        host.MXPref = String(input.priority);
      }

      return this.mapRecord(host, domainId);
    });

    const [sld, tld] = this.splitDomain(domainId);
    await this.setHosts(sld, tld, [...existingRecords, ...newRecords]);

    return newRecords;
  }

  async batchDeleteRecords(domainId: string, recordIds: string[]): Promise<void> {
    const existingRecords = await this.listRecords(domainId);
    const filteredRecords = existingRecords.filter((r) => !recordIds.includes(r.id));

    const [sld, tld] = this.splitDomain(domainId);
    await this.setHosts(sld, tld, filteredRecords);
  }

  /**
   * 设置域名的所有 DNS 记录（完全替换）
   */
  private async setHosts(sld: string, tld: string, records: ProviderRecord[]): Promise<void> {
    const params: Record<string, string> = {
      SLD: sld,
      TLD: tld,
    };

    // 构建记录参数
    records.forEach((record, index) => {
      const i = index + 1;
      params[`HostName${i}`] = this.extractSubdomain(record.name, `${sld}.${tld}`);
      params[`RecordType${i}`] = record.type;
      params[`Address${i}`] = record.content;
      params[`TTL${i}`] = String(record.ttl);

      if (record.priority && record.type === "MX") {
        params[`MXPref${i}`] = String(record.priority);
      }
    });

    await this.request("namecheap.domains.dns.setHosts", params);
  }

  /**
   * 将域名拆分为 SLD 和 TLD
   * 例如: example.com -> ["example", "com"]
   */
  private splitDomain(domain: string): [string, string] {
    const parts = domain.split(".");
    if (parts.length < 2) {
      throw new Error(`Invalid domain format: ${domain}`);
    }

    // 处理多级 TLD (如 .co.uk)
    if (parts.length === 2) {
      return [parts[0], parts[1]];
    } else {
      // 简化处理：最后一个部分作为 TLD
      const tld = parts[parts.length - 1];
      const sld = parts.slice(0, -1).join(".");
      return [sld, tld];
    }
  }

  /**
   * 从完整域名中提取子域名
   * 例如: www.example.com, example.com -> "www"
   */
  private extractSubdomain(fullName: string, baseDomain: string): string {
    if (fullName === baseDomain) {
      return "@"; // 根域名
    }
    if (fullName.endsWith(`.${baseDomain}`)) {
      return fullName.slice(0, -(baseDomain.length + 1));
    }
    return fullName; // 已经是子域名格式
  }

  private mapRecord(host: NamecheapHost, domainId: string): ProviderRecord {
    const subdomain = host.Name === "@" ? "" : host.Name;
    const fullName = subdomain ? `${subdomain}.${domainId}` : domainId;

    return {
      id: host.HostId || `${host.Name}-${host.Type}-${host.Address}`, // 生成伪 ID
      type: host.Type as DNSRecordType,
      name: fullName,
      content: host.Address,
      ttl: parseInt(host.TTL || "1800"),
      priority: host.MXPref ? parseInt(host.MXPref) : undefined,
      extra: {
        originalName: host.Name,
      },
    };
  }
}
