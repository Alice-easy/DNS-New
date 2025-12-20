/**
 * Aliyun DNS Provider Adapter
 * https://help.aliyun.com/document_detail/29739.html
 */

import crypto from "crypto";
import {
  IDNSProvider,
  ProviderMeta,
  ProviderCredentials,
  ProviderDomain,
  ProviderRecord,
  CreateRecordInput,
  UpdateRecordInput,
  DNSRecordType,
  DNSLine,
  AuthenticationError,
  RateLimitError,
  RecordNotFoundError,
  DomainNotFoundError,
  DNSProviderError,
} from "./types";

// Aliyun API response types
interface AliyunResponse<T> {
  RequestId: string;
  Code?: string;
  Message?: string;
  [key: string]: T | string | undefined;
}

interface AliyunDomain {
  DomainId: string;
  DomainName: string;
  DnsServers: { DnsServer: string[] };
  VersionCode: string;
}

interface AliyunDomainList {
  Domains: { Domain: AliyunDomain[] };
  TotalCount: number;
}

interface AliyunRecord {
  RecordId: string;
  RR: string; // subdomain
  Type: string;
  Value: string;
  TTL: number;
  Priority?: number;
  Status: string;
  Line: string;
}

interface AliyunRecordList {
  DomainRecords: { Record: AliyunRecord[] };
  TotalCount: number;
}

// 阿里云解析线路响应
interface AliyunRecordLine {
  LineCode: string;
  LineName: string;
  LineDisplayName: string;
  FatherCode?: string;
}

interface AliyunRecordLineList {
  RecordLines: { RecordLine: AliyunRecordLine[] };
}

export class AliyunDNSProvider implements IDNSProvider {
  private accessKeyId: string;
  private accessKeySecret: string;
  private endpoint = "https://alidns.aliyuncs.com";

  readonly meta: ProviderMeta = {
    name: "alidns",
    displayName: "Aliyun DNS",
    description: "Aliyun Cloud DNS service (阿里云解析 DNS)",
    website: "https://dns.console.aliyun.com",
    features: {
      geoRouting: true,
      loadBalancing: true,
    },
    credentialFields: [
      {
        name: "accessKeyId",
        label: "AccessKey ID",
        type: "text",
        required: true,
        placeholder: "LTAI5t...",
        helpText:
          "Create AccessKey at https://ram.console.aliyun.com/manage/ak",
      },
      {
        name: "accessKeySecret",
        label: "AccessKey Secret",
        type: "password",
        required: true,
        placeholder: "Enter your AccessKey Secret",
        helpText: "Keep your AccessKey Secret secure",
      },
    ],
  };

  constructor(credentials: ProviderCredentials) {
    if (!credentials.accessKeyId || !credentials.accessKeySecret) {
      throw new Error("Aliyun AccessKey ID and Secret are required");
    }
    this.accessKeyId = credentials.accessKeyId;
    this.accessKeySecret = credentials.accessKeySecret;
  }

  private percentEncode(str: string): string {
    return encodeURIComponent(str)
      .replace(/\+/g, "%20")
      .replace(/\*/g, "%2A")
      .replace(/%7E/g, "~");
  }

  private async request<T>(
    action: string,
    params: Record<string, string> = {}
  ): Promise<T> {
    const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
    const nonce = crypto.randomUUID();

    // Common parameters
    const commonParams: Record<string, string> = {
      Format: "JSON",
      Version: "2015-01-09",
      AccessKeyId: this.accessKeyId,
      SignatureMethod: "HMAC-SHA1",
      Timestamp: timestamp,
      SignatureVersion: "1.0",
      SignatureNonce: nonce,
      Action: action,
      ...params,
    };

    // Sort and encode parameters
    const sortedParams = Object.keys(commonParams)
      .sort()
      .map((key) => `${this.percentEncode(key)}=${this.percentEncode(commonParams[key])}`)
      .join("&");

    // Create signature
    const stringToSign = `GET&${this.percentEncode("/")}&${this.percentEncode(sortedParams)}`;
    const signature = crypto
      .createHmac("sha1", `${this.accessKeySecret}&`)
      .update(stringToSign)
      .digest("base64");

    // Build URL
    const url = `${this.endpoint}/?${sortedParams}&Signature=${this.percentEncode(signature)}`;

    const response = await fetch(url);
    const data: AliyunResponse<T> = await response.json();

    // Handle errors
    if (data.Code) {
      if (data.Code === "InvalidAccessKeyId.NotFound" || data.Code === "SignatureDoesNotMatch") {
        throw new AuthenticationError("alidns", { code: data.Code, message: data.Message });
      }
      if (data.Code === "Throttling") {
        throw new RateLimitError("alidns", 60, { message: data.Message });
      }
      if (data.Code === "DomainNotFound") {
        throw new DomainNotFoundError("alidns", params.DomainName || "unknown", { message: data.Message });
      }
      if (data.Code === "DomainRecordNotBelongToUser") {
        throw new RecordNotFoundError("alidns", params.RecordId || "unknown", { message: data.Message });
      }
      throw new DNSProviderError(
        data.Message || "Unknown error",
        data.Code,
        "alidns",
        { code: data.Code }
      );
    }

    return data as unknown as T;
  }

  async validateCredentials(): Promise<boolean> {
    try {
      await this.request<AliyunDomainList>("DescribeDomains", { PageSize: "1" });
      return true;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return false;
      }
      throw error;
    }
  }

  async listDomains(): Promise<ProviderDomain[]> {
    const data = await this.request<AliyunDomainList>("DescribeDomains", {
      PageSize: "100",
    });

    const domains = data.Domains?.Domain || [];
    return domains.map((domain) => ({
      id: domain.DomainId,
      name: domain.DomainName,
      status: "active" as const,
      nameServers: domain.DnsServers?.DnsServer || [],
      extra: { versionCode: domain.VersionCode },
    }));
  }

  async getDomain(domainId: string): Promise<ProviderDomain> {
    // Aliyun uses domain name as identifier in most APIs
    // We need to list and find
    const domains = await this.listDomains();
    const domain = domains.find((d) => d.id === domainId || d.name === domainId);
    if (!domain) {
      throw new DomainNotFoundError("alidns", domainId);
    }
    return domain;
  }

  async listRecords(domainId: string): Promise<ProviderRecord[]> {
    // domainId here is the domain name for Aliyun
    const domain = await this.getDomain(domainId);

    const data = await this.request<AliyunRecordList>("DescribeDomainRecords", {
      DomainName: domain.name,
      PageSize: "500",
    });

    const records = data.DomainRecords?.Record || [];
    return records.map((record) => this.mapRecord(record, domain.name));
  }

  async createRecord(
    domainId: string,
    input: CreateRecordInput
  ): Promise<ProviderRecord> {
    const domain = await this.getDomain(domainId);

    // Parse subdomain from full name
    const rr = this.extractSubdomain(input.name, domain.name);

    const params: Record<string, string> = {
      DomainName: domain.name,
      RR: rr,
      Type: input.type,
      Value: input.content,
      TTL: String(input.ttl || 600),
    };

    if (input.priority !== undefined) {
      params.Priority = String(input.priority);
    }

    // 智能解析线路支持
    if (input.lineId) {
      params.Line = input.lineId;
    } else if (input.line) {
      params.Line = input.line;
    }

    const data = await this.request<{ RecordId: string }>("AddDomainRecord", params);

    return {
      id: data.RecordId,
      type: input.type,
      name: rr === "@" ? domain.name : `${rr}.${domain.name}`,
      content: input.content,
      ttl: input.ttl || 600,
      priority: input.priority,
      line: input.line,
      lineId: input.lineId,
    };
  }

  async updateRecord(
    domainId: string,
    recordId: string,
    input: UpdateRecordInput
  ): Promise<ProviderRecord> {
    const domain = await this.getDomain(domainId);

    // Get existing record first
    const records = await this.listRecords(domainId);
    const existing = records.find((r) => r.id === recordId);
    if (!existing) {
      throw new RecordNotFoundError("alidns", recordId);
    }

    const rr = input.name
      ? this.extractSubdomain(input.name, domain.name)
      : this.extractSubdomain(existing.name, domain.name);

    const params: Record<string, string> = {
      RecordId: recordId,
      RR: rr,
      Type: input.type || existing.type,
      Value: input.content || existing.content,
      TTL: String(input.ttl ?? existing.ttl),
    };

    const priority = input.priority ?? existing.priority;
    if (priority !== undefined) {
      params.Priority = String(priority);
    }

    // 智能解析线路支持
    const lineId = input.lineId ?? existing.lineId;
    const line = input.line ?? existing.line;
    if (lineId) {
      params.Line = lineId;
    } else if (line) {
      params.Line = line;
    }

    await this.request("UpdateDomainRecord", params);

    return {
      id: recordId,
      type: (input.type || existing.type) as DNSRecordType,
      name: rr === "@" ? domain.name : `${rr}.${domain.name}`,
      content: input.content || existing.content,
      ttl: input.ttl ?? existing.ttl,
      priority,
      line: line,
      lineId: lineId,
    };
  }

  async deleteRecord(domainId: string, recordId: string): Promise<void> {
    await this.request("DeleteDomainRecord", { RecordId: recordId });
  }

  /**
   * 获取域名可用的解析线路列表
   */
  async listLines(domainId: string): Promise<DNSLine[]> {
    const domain = await this.getDomain(domainId);

    const data = await this.request<AliyunRecordLineList>("DescribeSupportLines", {
      DomainName: domain.name,
    });

    const lines = data.RecordLines?.RecordLine || [];
    return lines.map((line) => ({
      id: line.LineCode,
      name: line.LineDisplayName || line.LineName,
      parentId: line.FatherCode,
    }));
  }

  private extractSubdomain(fullName: string, domainName: string): string {
    if (fullName === domainName || fullName === "@") {
      return "@";
    }
    const suffix = `.${domainName}`;
    if (fullName.endsWith(suffix)) {
      return fullName.slice(0, -suffix.length);
    }
    return fullName;
  }

  private mapRecord(record: AliyunRecord, domainName: string): ProviderRecord {
    const fullName = record.RR === "@" ? domainName : `${record.RR}.${domainName}`;
    return {
      id: record.RecordId,
      type: record.Type as DNSRecordType,
      name: fullName,
      content: record.Value,
      ttl: record.TTL,
      priority: record.Priority,
      line: record.Line,
      lineId: record.Line, // Aliyun 使用同一个值
      extra: {
        status: record.Status,
      },
    };
  }
}
