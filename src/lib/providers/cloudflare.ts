/**
 * Cloudflare DNS Provider Adapter
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

// Cloudflare API response types
interface CloudflareResponse<T> {
  success: boolean;
  errors: { code: number; message: string }[];
  messages: string[];
  result: T;
  result_info?: {
    page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
  };
}

interface CloudflareZone {
  id: string;
  name: string;
  status: string;
  name_servers: string[];
  created_on: string;
}

interface CloudflareDNSRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  ttl: number;
  priority?: number;
  proxied?: boolean;
  created_on: string;
  modified_on: string;
}

export class CloudflareProvider implements IDNSProvider {
  private baseUrl = "https://api.cloudflare.com/client/v4";
  private apiToken: string;

  readonly meta: ProviderMeta = {
    name: "cloudflare",
    displayName: "Cloudflare",
    description: "Cloudflare DNS with proxy and CDN features",
    website: "https://cloudflare.com",
    features: {
      proxied: true,
      geoRouting: true,
      loadBalancing: true,
      healthChecks: true,
    },
    credentialFields: [
      {
        name: "apiToken",
        label: "API Token",
        type: "password",
        required: true,
        placeholder: "Enter your Cloudflare API Token",
        helpText:
          "Create an API Token at https://dash.cloudflare.com/profile/api-tokens with Zone:Read and DNS:Edit permissions",
      },
    ],
  };

  constructor(credentials: ProviderCredentials) {
    if (!credentials.apiToken) {
      throw new Error("Cloudflare API Token is required");
    }
    this.apiToken = credentials.apiToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get("Retry-After") || "60");
      throw new RateLimitError("cloudflare", retryAfter);
    }

    // Handle authentication errors
    if (response.status === 401 || response.status === 403) {
      throw new AuthenticationError("cloudflare", {
        status: response.status,
        statusText: response.statusText,
      });
    }

    const data: CloudflareResponse<T> = await response.json();

    if (!data.success) {
      const error = data.errors[0];
      throw new DNSProviderError(
        error?.message || "Unknown error",
        String(error?.code || "UNKNOWN"),
        "cloudflare",
        { errors: data.errors }
      );
    }

    return data.result;
  }

  async validateCredentials(): Promise<boolean> {
    try {
      // 使用 /zones 端点验证，兼容 User Token 和 Account Token
      // 只要 Token 有 Zone:Read 权限就能通过验证
      await this.request<CloudflareZone[]>("/zones?per_page=1");
      return true;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return false;
      }
      throw error;
    }
  }

  async listDomains(): Promise<ProviderDomain[]> {
    const zones = await this.request<CloudflareZone[]>("/zones?per_page=50");

    return zones.map((zone) => ({
      id: zone.id,
      name: zone.name,
      status: this.mapZoneStatus(zone.status),
      nameServers: zone.name_servers,
      createdAt: new Date(zone.created_on),
      extra: { originalStatus: zone.status },
    }));
  }

  async getDomain(domainId: string): Promise<ProviderDomain> {
    try {
      const zone = await this.request<CloudflareZone>(`/zones/${domainId}`);

      return {
        id: zone.id,
        name: zone.name,
        status: this.mapZoneStatus(zone.status),
        nameServers: zone.name_servers,
        createdAt: new Date(zone.created_on),
        extra: { originalStatus: zone.status },
      };
    } catch (error) {
      if (
        error instanceof DNSProviderError &&
        error.code === "1003"
      ) {
        throw new DomainNotFoundError("cloudflare", domainId);
      }
      throw error;
    }
  }

  async listRecords(domainId: string): Promise<ProviderRecord[]> {
    const records = await this.request<CloudflareDNSRecord[]>(
      `/zones/${domainId}/dns_records?per_page=100`
    );

    return records.map((record) => this.mapRecord(record));
  }

  async createRecord(
    domainId: string,
    input: CreateRecordInput
  ): Promise<ProviderRecord> {
    const proxied = input.proxied ?? false;
    // TTL=1 表示自动，仅在 proxied=true 时有效
    // 当 proxied=false 且 ttl=1 时，使用默认值 300（5分钟）
    const ttl = input.ttl === 1 && !proxied ? 300 : (input.ttl || 1);

    const record = await this.request<CloudflareDNSRecord>(
      `/zones/${domainId}/dns_records`,
      {
        method: "POST",
        body: JSON.stringify({
          type: input.type,
          name: input.name,
          content: input.content,
          ttl,
          priority: input.priority,
          proxied,
        }),
      }
    );

    return this.mapRecord(record);
  }

  async updateRecord(
    domainId: string,
    recordId: string,
    input: UpdateRecordInput
  ): Promise<ProviderRecord> {
    // First get existing record
    let existingRecord: CloudflareDNSRecord;
    try {
      existingRecord = await this.request<CloudflareDNSRecord>(
        `/zones/${domainId}/dns_records/${recordId}`
      );
    } catch (error) {
      if (
        error instanceof DNSProviderError &&
        error.code === "1003"
      ) {
        throw new RecordNotFoundError("cloudflare", recordId);
      }
      throw error;
    }

    const proxied = input.proxied ?? existingRecord.proxied ?? false;
    const rawTtl = input.ttl ?? existingRecord.ttl;
    // TTL=1 表示自动，仅在 proxied=true 时有效
    // 当 proxied=false 且 ttl=1 时，使用默认值 300（5分钟）
    const ttl = rawTtl === 1 && !proxied ? 300 : rawTtl;

    // Update with new values
    const record = await this.request<CloudflareDNSRecord>(
      `/zones/${domainId}/dns_records/${recordId}`,
      {
        method: "PUT",
        body: JSON.stringify({
          type: input.type || existingRecord.type,
          name: input.name || existingRecord.name,
          content: input.content || existingRecord.content,
          ttl,
          priority: input.priority ?? existingRecord.priority,
          proxied,
        }),
      }
    );

    return this.mapRecord(record);
  }

  async deleteRecord(domainId: string, recordId: string): Promise<void> {
    try {
      await this.request(`/zones/${domainId}/dns_records/${recordId}`, {
        method: "DELETE",
      });
    } catch (error) {
      if (
        error instanceof DNSProviderError &&
        error.code === "1003"
      ) {
        throw new RecordNotFoundError("cloudflare", recordId);
      }
      throw error;
    }
  }

  async batchCreateRecords(
    domainId: string,
    inputs: CreateRecordInput[]
  ): Promise<ProviderRecord[]> {
    // Cloudflare doesn't have a batch API, so we create sequentially
    const results: ProviderRecord[] = [];
    for (const input of inputs) {
      const record = await this.createRecord(domainId, input);
      results.push(record);
    }
    return results;
  }

  async batchDeleteRecords(
    domainId: string,
    recordIds: string[]
  ): Promise<void> {
    // Delete sequentially
    for (const recordId of recordIds) {
      await this.deleteRecord(domainId, recordId);
    }
  }

  private mapZoneStatus(
    status: string
  ): "active" | "pending" | "inactive" | "error" {
    switch (status) {
      case "active":
        return "active";
      case "pending":
      case "initializing":
        return "pending";
      case "moved":
      case "deactivated":
        return "inactive";
      default:
        return "error";
    }
  }

  private mapRecord(record: CloudflareDNSRecord): ProviderRecord {
    return {
      id: record.id,
      type: record.type as DNSRecordType,
      name: record.name,
      content: record.content,
      ttl: record.ttl,
      priority: record.priority,
      proxied: record.proxied,
      extra: {
        createdOn: record.created_on,
        modifiedOn: record.modified_on,
      },
    };
  }
}
