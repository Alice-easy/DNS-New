/**
 * Tencent Cloud DNSPod Provider Adapter
 * https://cloud.tencent.com/document/api/1427/56153
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
  AuthenticationError,
  RateLimitError,
  RecordNotFoundError,
  DomainNotFoundError,
  DNSProviderError,
} from "./types";

// DNSPod API response types
interface DNSPodResponse<T> {
  Response: T & {
    RequestId: string;
    Error?: {
      Code: string;
      Message: string;
    };
  };
}

interface DNSPodDomain {
  DomainId: number;
  Name: string;
  Status: string;
  DNSStatus: string;
  Grade: string;
}

interface DNSPodDomainList {
  DomainCountInfo: { AllTotal: number };
  DomainList: DNSPodDomain[];
}

interface DNSPodRecord {
  RecordId: number;
  Name: string; // subdomain
  Type: string;
  Value: string;
  TTL: number;
  MX?: number;
  Status: string;
  Line: string;
  LineId: string;
  UpdatedOn: string;
}

interface DNSPodRecordList {
  RecordCountInfo: { TotalCount: number };
  RecordList: DNSPodRecord[];
}

interface DNSPodCreateRecord {
  RecordId: number;
}

export class DNSPodProvider implements IDNSProvider {
  private secretId: string;
  private secretKey: string;
  private endpoint = "dnspod.tencentcloudapi.com";
  private service = "dnspod";
  private version = "2021-03-23";
  private region = "";

  readonly meta: ProviderMeta = {
    name: "dnspod",
    displayName: "DNSPod",
    description: "Tencent Cloud DNSPod service (腾讯云 DNSPod)",
    website: "https://console.dnspod.cn",
    features: {
      geoRouting: true,
      loadBalancing: true,
    },
    credentialFields: [
      {
        name: "secretId",
        label: "SecretId",
        type: "text",
        required: true,
        placeholder: "AKIDz8krbsJ5...",
        helpText:
          "Create API Key at https://console.cloud.tencent.com/cam/capi",
      },
      {
        name: "secretKey",
        label: "SecretKey",
        type: "password",
        required: true,
        placeholder: "Enter your SecretKey",
        helpText: "Keep your SecretKey secure",
      },
    ],
  };

  constructor(credentials: ProviderCredentials) {
    if (!credentials.secretId || !credentials.secretKey) {
      throw new Error("DNSPod SecretId and SecretKey are required");
    }
    this.secretId = credentials.secretId;
    this.secretKey = credentials.secretKey;
  }

  private sha256(message: string): string {
    return crypto.createHash("sha256").update(message).digest("hex");
  }

  private hmacSha256(key: Buffer | string, message: string): Buffer {
    return crypto.createHmac("sha256", key).update(message).digest();
  }

  private async request<T>(
    action: string,
    params: Record<string, unknown> = {}
  ): Promise<T> {
    const timestamp = Math.floor(Date.now() / 1000);
    const date = new Date(timestamp * 1000).toISOString().split("T")[0];

    const payload = JSON.stringify(params);
    const hashedPayload = this.sha256(payload);

    // Build canonical request
    const httpRequestMethod = "POST";
    const canonicalUri = "/";
    const canonicalQueryString = "";
    const canonicalHeaders = [
      `content-type:application/json; charset=utf-8`,
      `host:${this.endpoint}`,
      `x-tc-action:${action.toLowerCase()}`,
    ].join("\n") + "\n";
    const signedHeaders = "content-type;host;x-tc-action";

    const canonicalRequest = [
      httpRequestMethod,
      canonicalUri,
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      hashedPayload,
    ].join("\n");

    // Build string to sign
    const algorithm = "TC3-HMAC-SHA256";
    const credentialScope = `${date}/${this.service}/tc3_request`;
    const hashedCanonicalRequest = this.sha256(canonicalRequest);
    const stringToSign = [
      algorithm,
      timestamp.toString(),
      credentialScope,
      hashedCanonicalRequest,
    ].join("\n");

    // Calculate signature
    const secretDate = this.hmacSha256(`TC3${this.secretKey}`, date);
    const secretService = this.hmacSha256(secretDate, this.service);
    const secretSigning = this.hmacSha256(secretService, "tc3_request");
    const signature = this.hmacSha256(secretSigning, stringToSign).toString("hex");

    // Build authorization header
    const authorization = [
      `${algorithm} Credential=${this.secretId}/${credentialScope}`,
      `SignedHeaders=${signedHeaders}`,
      `Signature=${signature}`,
    ].join(", ");

    const response = await fetch(`https://${this.endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Host: this.endpoint,
        "X-TC-Action": action,
        "X-TC-Version": this.version,
        "X-TC-Timestamp": timestamp.toString(),
        "X-TC-Region": this.region,
        Authorization: authorization,
      },
      body: payload,
    });

    const data: DNSPodResponse<T> = await response.json();

    // Handle errors
    if (data.Response.Error) {
      const error = data.Response.Error;
      if (
        error.Code === "AuthFailure.SecretIdNotFound" ||
        error.Code === "AuthFailure.SignatureFailure" ||
        error.Code === "AuthFailure.InvalidSecretId"
      ) {
        throw new AuthenticationError("dnspod", { code: error.Code, message: error.Message });
      }
      if (error.Code === "RequestLimitExceeded") {
        throw new RateLimitError("dnspod", 60, { message: error.Message });
      }
      if (error.Code === "InvalidParameter.DomainNotExist") {
        throw new DomainNotFoundError("dnspod", String(params.Domain || "unknown"), {
          message: error.Message,
        });
      }
      if (error.Code === "InvalidParameter.RecordIdInvalid") {
        throw new RecordNotFoundError("dnspod", String(params.RecordId || "unknown"), {
          message: error.Message,
        });
      }
      throw new DNSProviderError(error.Message, error.Code, "dnspod", {
        code: error.Code,
      });
    }

    return data.Response as T;
  }

  async validateCredentials(): Promise<boolean> {
    try {
      await this.request<DNSPodDomainList>("DescribeDomainList", {
        Limit: 1,
        Offset: 0,
      });
      return true;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return false;
      }
      throw error;
    }
  }

  async listDomains(): Promise<ProviderDomain[]> {
    const data = await this.request<DNSPodDomainList>("DescribeDomainList", {
      Limit: 100,
      Offset: 0,
    });

    const domains = data.DomainList || [];
    return domains.map((domain) => ({
      id: String(domain.DomainId),
      name: domain.Name,
      status: this.mapDomainStatus(domain.Status),
      extra: {
        grade: domain.Grade,
        dnsStatus: domain.DNSStatus,
      },
    }));
  }

  async getDomain(domainId: string): Promise<ProviderDomain> {
    // DNSPod uses domain name for most operations
    const domains = await this.listDomains();
    const domain = domains.find((d) => d.id === domainId || d.name === domainId);
    if (!domain) {
      throw new DomainNotFoundError("dnspod", domainId);
    }
    return domain;
  }

  async listRecords(domainId: string): Promise<ProviderRecord[]> {
    const domain = await this.getDomain(domainId);

    const data = await this.request<DNSPodRecordList>("DescribeRecordList", {
      Domain: domain.name,
      Limit: 3000,
      Offset: 0,
    });

    const records = data.RecordList || [];
    return records.map((record) => this.mapRecord(record, domain.name));
  }

  async createRecord(
    domainId: string,
    input: CreateRecordInput
  ): Promise<ProviderRecord> {
    const domain = await this.getDomain(domainId);

    // Parse subdomain from full name
    const subDomain = this.extractSubdomain(input.name, domain.name);

    const params: Record<string, unknown> = {
      Domain: domain.name,
      SubDomain: subDomain,
      RecordType: input.type,
      Value: input.content,
      RecordLine: "默认",
      TTL: input.ttl || 600,
    };

    if (input.priority !== undefined && input.type === "MX") {
      params.MX = input.priority;
    }

    const data = await this.request<DNSPodCreateRecord>("CreateRecord", params);

    return {
      id: String(data.RecordId),
      type: input.type,
      name: subDomain === "@" ? domain.name : `${subDomain}.${domain.name}`,
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
    const domain = await this.getDomain(domainId);

    // Get existing record
    const records = await this.listRecords(domainId);
    const existing = records.find((r) => r.id === recordId);
    if (!existing) {
      throw new RecordNotFoundError("dnspod", recordId);
    }

    const subDomain = input.name
      ? this.extractSubdomain(input.name, domain.name)
      : this.extractSubdomain(existing.name, domain.name);

    const params: Record<string, unknown> = {
      Domain: domain.name,
      RecordId: parseInt(recordId),
      SubDomain: subDomain,
      RecordType: input.type || existing.type,
      Value: input.content || existing.content,
      RecordLine: "默认",
      TTL: input.ttl ?? existing.ttl,
    };

    const priority = input.priority ?? existing.priority;
    if (priority !== undefined && (input.type || existing.type) === "MX") {
      params.MX = priority;
    }

    await this.request("ModifyRecord", params);

    return {
      id: recordId,
      type: (input.type || existing.type) as DNSRecordType,
      name: subDomain === "@" ? domain.name : `${subDomain}.${domain.name}`,
      content: input.content || existing.content,
      ttl: input.ttl ?? existing.ttl,
      priority,
    };
  }

  async deleteRecord(domainId: string, recordId: string): Promise<void> {
    const domain = await this.getDomain(domainId);

    await this.request("DeleteRecord", {
      Domain: domain.name,
      RecordId: parseInt(recordId),
    });
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

  private mapDomainStatus(status: string): "active" | "pending" | "inactive" | "error" {
    switch (status) {
      case "ENABLE":
        return "active";
      case "PAUSE":
        return "inactive";
      case "SPAM":
        return "error";
      default:
        return "pending";
    }
  }

  private mapRecord(record: DNSPodRecord, domainName: string): ProviderRecord {
    const fullName = record.Name === "@" ? domainName : `${record.Name}.${domainName}`;
    return {
      id: String(record.RecordId),
      type: record.Type as DNSRecordType,
      name: fullName,
      content: record.Value,
      ttl: record.TTL,
      priority: record.MX,
      extra: {
        status: record.Status,
        line: record.Line,
        lineId: record.LineId,
        updatedOn: record.UpdatedOn,
      },
    };
  }
}
