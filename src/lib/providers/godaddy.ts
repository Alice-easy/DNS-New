/**
 * GoDaddy DNS Provider Adapter
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

// GoDaddy API 响应类型
interface GoDaddyDomain {
  domain: string;
  domainId: number;
  status: string;
  createdAt: string;
  nameServers?: string[];
}

interface GoDaddyRecord {
  type: string;
  name: string;
  data: string;
  ttl?: number;
  priority?: number;
}

export class GoDaddyProvider implements IDNSProvider {
  private baseUrl = "https://api.godaddy.com";
  private apiKey: string;
  private apiSecret: string;

  readonly meta: ProviderMeta = {
    name: "godaddy",
    displayName: "GoDaddy",
    description: "GoDaddy DNS service with basic DNS management",
    website: "https://www.godaddy.com",
    features: {
      proxied: false,
      geoRouting: false,
      loadBalancing: false,
      healthChecks: false,
    },
    credentialFields: [
      {
        name: "apiKey",
        label: "API Key",
        type: "text",
        required: true,
        placeholder: "Enter your GoDaddy API Key",
        helpText: "Create API credentials at https://developer.godaddy.com/keys",
      },
      {
        name: "apiSecret",
        label: "API Secret",
        type: "password",
        required: true,
        placeholder: "Enter your API Secret",
        helpText: "Your GoDaddy API Secret (shown only once during creation)",
      },
    ],
  };

  constructor(credentials: ProviderCredentials) {
    if (!credentials.apiKey || !credentials.apiSecret) {
      throw new Error("GoDaddy requires apiKey and apiSecret");
    }
    this.apiKey = credentials.apiKey;
    this.apiSecret = credentials.apiSecret;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `sso-key ${this.apiKey}:${this.apiSecret}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    // 处理速率限制
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get("Retry-After") || "60");
      throw new RateLimitError("godaddy", retryAfter);
    }

    // 处理认证错误
    if (response.status === 401 || response.status === 403) {
      throw new AuthenticationError("godaddy", {
        status: response.status,
        statusText: response.statusText,
      });
    }

    // 处理 404 错误
    if (response.status === 404) {
      const text = await response.text();
      throw new DNSProviderError(
        text || "Resource not found",
        "404",
        "godaddy",
        { status: 404 }
      );
    }

    // 处理其他错误
    if (!response.ok) {
      const text = await response.text();
      let errorData: { message?: string; code?: string };
      try {
        errorData = JSON.parse(text);
      } catch {
        errorData = { message: text };
      }

      throw new DNSProviderError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        errorData.code || String(response.status),
        "godaddy",
        { status: response.status, response: errorData }
      );
    }

    // DELETE 请求通常返回 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    return JSON.parse(text) as T;
  }

  async validateCredentials(): Promise<boolean> {
    try {
      // 使用 /v1/domains 验证凭据
      await this.request<GoDaddyDomain[]>("/v1/domains?limit=1");
      return true;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return false;
      }
      throw error;
    }
  }

  async listDomains(): Promise<ProviderDomain[]> {
    const domains = await this.request<GoDaddyDomain[]>("/v1/domains?limit=500");

    return domains.map((domain) => ({
      id: domain.domain,
      name: domain.domain,
      status: this.mapDomainStatus(domain.status),
      nameServers: domain.nameServers || [],
      createdAt: new Date(domain.createdAt),
      extra: {
        domainId: domain.domainId,
        originalStatus: domain.status,
      },
    }));
  }

  async getDomain(domainId: string): Promise<ProviderDomain> {
    try {
      const domain = await this.request<GoDaddyDomain>(`/v1/domains/${domainId}`);

      return {
        id: domain.domain,
        name: domain.domain,
        status: this.mapDomainStatus(domain.status),
        nameServers: domain.nameServers || [],
        createdAt: new Date(domain.createdAt),
        extra: {
          domainId: domain.domainId,
          originalStatus: domain.status,
        },
      };
    } catch (error) {
      if (error instanceof DNSProviderError && error.code === "404") {
        throw new DomainNotFoundError("godaddy", domainId);
      }
      throw error;
    }
  }

  async listRecords(domainId: string): Promise<ProviderRecord[]> {
    const records = await this.request<GoDaddyRecord[]>(
      `/v1/domains/${domainId}/records`
    );

    return records.map((record) => this.mapRecord(record, domainId));
  }

  async createRecord(domainId: string, input: CreateRecordInput): Promise<ProviderRecord> {
    const name = this.extractSubdomain(input.name, domainId);

    // GoDaddy 使用 PUT 方法替换记录
    const recordData = [
      {
        type: input.type,
        name,
        data: input.content,
        ttl: input.ttl || 600,
        priority: input.priority,
      },
    ];

    await this.request(
      `/v1/domains/${domainId}/records/${input.type}/${name}`,
      {
        method: "PUT",
        body: JSON.stringify(recordData),
      }
    );

    // 返回创建的记录
    return {
      id: `${name}-${input.type}`,
      type: input.type,
      name: input.name,
      content: input.content,
      ttl: input.ttl || 600,
      priority: input.priority,
    };
  }

  async updateRecord(
    domainId: string,
    recordId: string,
    input: UpdateRecordInput
  ): Promise<ProviderRecord> {
    // 先获取现有记录
    const existingRecords = await this.listRecords(domainId);
    const existingRecord = existingRecords.find((r) => r.id === recordId);

    if (!existingRecord) {
      throw new RecordNotFoundError("godaddy", recordId);
    }

    const name = this.extractSubdomain(input.name || existingRecord.name, domainId);
    const type = input.type || existingRecord.type;

    // GoDaddy 使用 PUT 方法替换记录
    const recordData = [
      {
        type,
        name,
        data: input.content || existingRecord.content,
        ttl: input.ttl ?? existingRecord.ttl,
        priority: input.priority ?? existingRecord.priority,
      },
    ];

    await this.request(
      `/v1/domains/${domainId}/records/${type}/${name}`,
      {
        method: "PUT",
        body: JSON.stringify(recordData),
      }
    );

    // 返回更新后的记录
    return {
      id: `${name}-${type}`,
      type,
      name: input.name || existingRecord.name,
      content: input.content || existingRecord.content,
      ttl: input.ttl ?? existingRecord.ttl,
      priority: input.priority ?? existingRecord.priority,
    };
  }

  async deleteRecord(domainId: string, recordId: string): Promise<void> {
    // 先获取记录信息
    const existingRecords = await this.listRecords(domainId);
    const record = existingRecords.find((r) => r.id === recordId);

    if (!record) {
      throw new RecordNotFoundError("godaddy", recordId);
    }

    const name = this.extractSubdomain(record.name, domainId);

    // GoDaddy 删除记录方式：PUT 空数组
    await this.request(
      `/v1/domains/${domainId}/records/${record.type}/${name}`,
      {
        method: "PUT",
        body: JSON.stringify([]),
      }
    );
  }

  async batchCreateRecords(
    domainId: string,
    inputs: CreateRecordInput[]
  ): Promise<ProviderRecord[]> {
    // GoDaddy 不支持批量创建，按顺序创建
    const results: ProviderRecord[] = [];
    for (const input of inputs) {
      const record = await this.createRecord(domainId, input);
      results.push(record);
    }
    return results;
  }

  async batchDeleteRecords(domainId: string, recordIds: string[]): Promise<void> {
    // 按顺序删除
    for (const recordId of recordIds) {
      await this.deleteRecord(domainId, recordId);
    }
  }

  private mapDomainStatus(
    status: string
  ): "active" | "pending" | "inactive" | "error" {
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return "active";
      case "PENDING":
      case "PENDING_TRANSFER":
        return "pending";
      case "CANCELLED":
      case "EXPIRED":
        return "inactive";
      default:
        return "error";
    }
  }

  /**
   * 从完整域名中提取子域名
   * 例如: www.example.com, example.com -> "www"
   * 例如: example.com, example.com -> "@"
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

  private mapRecord(record: GoDaddyRecord, domainId: string): ProviderRecord {
    const subdomain = record.name === "@" ? "" : record.name;
    const fullName = subdomain ? `${subdomain}.${domainId}` : domainId;

    return {
      id: `${record.name}-${record.type}`,
      type: record.type as DNSRecordType,
      name: fullName,
      content: record.data,
      ttl: record.ttl || 600,
      priority: record.priority,
      extra: {
        originalName: record.name,
      },
    };
  }
}
