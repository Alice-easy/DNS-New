/**
 * Huawei Cloud DNS Provider Adapter
 * https://support.huaweicloud.com/api-dns/zh-cn_topic_0132421999.html
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

// 华为云 API 响应类型
interface HuaweiCloudZone {
  id: string;
  name: string;
  zone_type: string;
  status: string;
  masters?: string[];
  created_at: string;
  updated_at: string;
  record_num: number;
}

interface HuaweiCloudRecordSet {
  id: string;
  name: string;
  type: string;
  ttl: number;
  records: string[];
  status: string;
  line?: string;
  weight?: number;
  create_at?: string;
  update_at?: string;
}

interface HuaweiCloudLine {
  line_id: string;
  line_name: string;
  parent_line_id?: string;
}

export class HuaweiCloudDNSProvider implements IDNSProvider {
  private accessKeyId: string;
  private secretAccessKey: string;
  private endpoint = "https://dns.myhuaweicloud.com";
  private region = "cn-north-1"; // 默认区域

  readonly meta: ProviderMeta = {
    name: "huaweicloud",
    displayName: "Huawei Cloud DNS",
    description: "Huawei Cloud DNS service (华为云解析 DNS)",
    website: "https://console.huaweicloud.com/dns",
    features: {
      geoRouting: true,
      loadBalancing: false,
    },
    credentialFields: [
      {
        name: "accessKeyId",
        label: "Access Key ID",
        type: "text",
        required: true,
        placeholder: "Enter your Access Key ID",
        helpText:
          "Create Access Key at https://console.huaweicloud.com/iam/#/mine/accessKey",
      },
      {
        name: "secretAccessKey",
        label: "Secret Access Key",
        type: "password",
        required: true,
        placeholder: "Enter your Secret Access Key",
        helpText: "Keep your Secret Access Key secure",
      },
      {
        name: "region",
        label: "Region",
        type: "text",
        required: false,
        placeholder: "cn-north-1",
        helpText: "华为云区域 (默认: cn-north-1)",
      },
    ],
  };

  constructor(credentials: ProviderCredentials) {
    if (!credentials.accessKeyId || !credentials.secretAccessKey) {
      throw new Error("Huawei Cloud Access Key ID and Secret Access Key are required");
    }
    this.accessKeyId = credentials.accessKeyId;
    this.secretAccessKey = credentials.secretAccessKey;
    if (credentials.region) {
      this.region = credentials.region;
    }
  }

  /**
   * 华为云 AK/SK 签名认证 (类似 AWS Signature V4)
   */
  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
    const date = timestamp.split("T")[0].replace(/-/g, "");

    const bodyString = body ? JSON.stringify(body) : "";
    const bodyHash = crypto.createHash("sha256").update(bodyString).digest("hex");

    // 构建规范请求
    const canonicalUri = path;
    const canonicalQueryString = "";
    const canonicalHeaders = `content-type:application/json\nhost:dns.myhuaweicloud.com\nx-sdk-date:${timestamp}\n`;
    const signedHeaders = "content-type;host;x-sdk-date";
    const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${bodyHash}`;

    // 创建待签字符串
    const algorithm = "SDK-HMAC-SHA256";
    const credentialScope = `${date}/${this.region}/dns/sdk_request`;
    const canonicalRequestHash = crypto
      .createHash("sha256")
      .update(canonicalRequest)
      .digest("hex");
    const stringToSign = `${algorithm}\n${timestamp}\n${credentialScope}\n${canonicalRequestHash}`;

    // 计算签名
    const kDate = crypto
      .createHmac("sha256", `SDK${this.secretAccessKey}`)
      .update(date)
      .digest();
    const kRegion = crypto.createHmac("sha256", kDate).update(this.region).digest();
    const kService = crypto.createHmac("sha256", kRegion).update("dns").digest();
    const kSigning = crypto.createHmac("sha256", kService).update("sdk_request").digest();
    const signature = crypto.createHmac("sha256", kSigning).update(stringToSign).digest("hex");

    // 构建 Authorization 头
    const authorization = `${algorithm} Access=${this.accessKeyId}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    // 发送请求
    const url = `${this.endpoint}${path}`;
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Sdk-Date": timestamp,
        Authorization: authorization,
      },
      body: bodyString || undefined,
    });

    // 处理速率限制
    if (response.status === 429) {
      throw new RateLimitError("huaweicloud", 60);
    }

    // 处理认证错误
    if (response.status === 401 || response.status === 403) {
      throw new AuthenticationError("huaweicloud", {
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
        "huaweicloud",
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
        "huaweicloud",
        { status: response.status, response: errorData }
      );
    }

    // DELETE 请求通常返回 202 Accepted
    if (response.status === 202 || response.status === 204) {
      return {} as T;
    }

    const data = await response.json();
    return data as T;
  }

  async validateCredentials(): Promise<boolean> {
    try {
      // 使用列出公网域名接口验证凭据
      await this.request<{ zones: HuaweiCloudZone[] }>("GET", "/v2/zones?limit=1");
      return true;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return false;
      }
      throw error;
    }
  }

  async listDomains(): Promise<ProviderDomain[]> {
    const response = await this.request<{ zones: HuaweiCloudZone[] }>(
      "GET",
      "/v2/zones?limit=500"
    );

    return response.zones.map((zone) => ({
      id: zone.id,
      name: zone.name.replace(/\.$/, ""), // 移除末尾的点
      status: this.mapZoneStatus(zone.status),
      nameServers: zone.masters || [],
      createdAt: new Date(zone.created_at),
      extra: {
        zoneType: zone.zone_type,
        recordNum: zone.record_num,
        originalStatus: zone.status,
      },
    }));
  }

  async getDomain(domainId: string): Promise<ProviderDomain> {
    try {
      const zone = await this.request<HuaweiCloudZone>("GET", `/v2/zones/${domainId}`);

      return {
        id: zone.id,
        name: zone.name.replace(/\.$/, ""),
        status: this.mapZoneStatus(zone.status),
        nameServers: zone.masters || [],
        createdAt: new Date(zone.created_at),
        extra: {
          zoneType: zone.zone_type,
          recordNum: zone.record_num,
          originalStatus: zone.status,
        },
      };
    } catch (error) {
      if (error instanceof DNSProviderError && error.code === "404") {
        throw new DomainNotFoundError("huaweicloud", domainId);
      }
      throw error;
    }
  }

  async listRecords(domainId: string): Promise<ProviderRecord[]> {
    const response = await this.request<{ recordsets: HuaweiCloudRecordSet[] }>(
      "GET",
      `/v2/zones/${domainId}/recordsets?limit=500`
    );

    // 过滤掉 NS 和 SOA 记录（系统记录）
    const userRecords = response.recordsets.filter(
      (rs) => rs.type !== "NS" && rs.type !== "SOA"
    );

    return userRecords.map((recordset) => this.mapRecord(recordset));
  }

  async createRecord(domainId: string, input: CreateRecordInput): Promise<ProviderRecord> {
    // 华为云要求域名以 . 结尾
    const name = input.name.endsWith(".") ? input.name : `${input.name}.`;

    const body = {
      name,
      type: input.type,
      ttl: input.ttl || 300,
      records: [input.content],
      line: input.line || "default_view",
    };

    const recordset = await this.request<HuaweiCloudRecordSet>(
      "POST",
      `/v2.1/zones/${domainId}/recordsets`,
      body
    );

    return this.mapRecord(recordset);
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
      throw new RecordNotFoundError("huaweicloud", recordId);
    }

    const name = (input.name || existingRecord.name).endsWith(".")
      ? input.name || existingRecord.name
      : `${input.name || existingRecord.name}.`;

    const body = {
      name,
      type: input.type || existingRecord.type,
      ttl: input.ttl ?? existingRecord.ttl,
      records: [input.content || existingRecord.content],
      line: input.line || existingRecord.line || "default_view",
    };

    const recordset = await this.request<HuaweiCloudRecordSet>(
      "PUT",
      `/v2.1/zones/${domainId}/recordsets/${recordId}`,
      body
    );

    return this.mapRecord(recordset);
  }

  async deleteRecord(domainId: string, recordId: string): Promise<void> {
    try {
      await this.request("DELETE", `/v2/zones/${domainId}/recordsets/${recordId}`);
    } catch (error) {
      if (error instanceof DNSProviderError && error.code === "404") {
        throw new RecordNotFoundError("huaweicloud", recordId);
      }
      throw error;
    }
  }

  async batchCreateRecords(
    domainId: string,
    inputs: CreateRecordInput[]
  ): Promise<ProviderRecord[]> {
    // 华为云不支持批量创建，按顺序创建
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

  /**
   * 获取智能解析线路列表
   */
  async listLines(domainId: string): Promise<DNSLine[]> {
    // 华为云的线路是预定义的，不需要 API 查询
    // 返回常用线路
    return [
      { id: "default_view", name: "默认" },
      { id: "Dianxin", name: "电信" },
      { id: "Liantong", name: "联通" },
      { id: "Yidong", name: "移动" },
      { id: "Jiaoyuwang", name: "教育网" },
      { id: "Tietong", name: "铁通" },
    ];
  }

  private mapZoneStatus(
    status: string
  ): "active" | "pending" | "inactive" | "error" {
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return "active";
      case "PENDING":
      case "PENDING_CREATE":
        return "pending";
      case "DELETED":
      case "ERROR":
        return "error";
      default:
        return "inactive";
    }
  }

  private mapRecord(recordset: HuaweiCloudRecordSet): ProviderRecord {
    return {
      id: recordset.id,
      type: recordset.type as DNSRecordType,
      name: recordset.name.replace(/\.$/, ""), // 移除末尾的点
      content: recordset.records[0] || "",
      ttl: recordset.ttl,
      line: recordset.line,
      extra: {
        records: recordset.records,
        status: recordset.status,
        weight: recordset.weight,
      },
    };
  }
}
