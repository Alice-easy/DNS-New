/**
 * AWS Route53 DNS Provider Adapter
 * https://docs.aws.amazon.com/Route53/latest/APIReference/Welcome.html
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

// AWS Route53 API 响应类型
interface Route53HostedZone {
  Id: string;
  Name: string;
  CallerReference: string;
  Config?: {
    Comment?: string;
    PrivateZone?: boolean;
  };
  ResourceRecordSetCount?: number;
}

interface Route53ResourceRecordSet {
  Name: string;
  Type: string;
  TTL?: number;
  ResourceRecords?: Array<{ Value: string }>;
  SetIdentifier?: string;
  Weight?: number;
  Region?: string;
  GeoLocation?: {
    ContinentCode?: string;
    CountryCode?: string;
    SubdivisionCode?: string;
  };
}

interface Route53Change {
  Action: "CREATE" | "DELETE" | "UPSERT";
  ResourceRecordSet: Route53ResourceRecordSet;
}

export class Route53Provider implements IDNSProvider {
  private accessKeyId: string;
  private secretAccessKey: string;
  private endpoint = "https://route53.amazonaws.com";
  private region = "us-east-1"; // Route53 是全球服务，使用 us-east-1
  private service = "route53";

  readonly meta: ProviderMeta = {
    name: "route53",
    displayName: "AWS Route53",
    description: "Amazon Route53 DNS service with advanced routing policies",
    website: "https://aws.amazon.com/route53/",
    features: {
      geoRouting: true,
      loadBalancing: true,
      healthChecks: true,
    },
    credentialFields: [
      {
        name: "accessKeyId",
        label: "Access Key ID",
        type: "text",
        required: true,
        placeholder: "AKIA...",
        helpText:
          "Create Access Key at https://console.aws.amazon.com/iam/home#/security_credentials",
      },
      {
        name: "secretAccessKey",
        label: "Secret Access Key",
        type: "password",
        required: true,
        placeholder: "Enter your Secret Access Key",
        helpText: "Keep your Secret Access Key secure",
      },
    ],
  };

  constructor(credentials: ProviderCredentials) {
    if (!credentials.accessKeyId || !credentials.secretAccessKey) {
      throw new Error("AWS Access Key ID and Secret Access Key are required");
    }
    this.accessKeyId = credentials.accessKeyId;
    this.secretAccessKey = credentials.secretAccessKey;
  }

  /**
   * AWS Signature Version 4 签名认证
   */
  private async request<T>(
    method: string,
    path: string,
    body?: string
  ): Promise<T> {
    const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
    const dateStamp = timestamp.split("T")[0].replace(/-/g, "");

    const bodyString = body || "";
    const bodyHash = crypto.createHash("sha256").update(bodyString).digest("hex");

    // 构建规范请求
    const canonicalUri = path;
    const canonicalQueryString = "";
    const canonicalHeaders = `host:route53.amazonaws.com\nx-amz-date:${timestamp}\n`;
    const signedHeaders = "host;x-amz-date";
    const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${bodyHash}`;

    // 创建待签字符串
    const algorithm = "AWS4-HMAC-SHA256";
    const credentialScope = `${dateStamp}/${this.region}/${this.service}/aws4_request`;
    const canonicalRequestHash = crypto
      .createHash("sha256")
      .update(canonicalRequest)
      .digest("hex");
    const stringToSign = `${algorithm}\n${timestamp}\n${credentialScope}\n${canonicalRequestHash}`;

    // 计算签名
    const kDate = crypto
      .createHmac("sha256", `AWS4${this.secretAccessKey}`)
      .update(dateStamp)
      .digest();
    const kRegion = crypto.createHmac("sha256", kDate).update(this.region).digest();
    const kService = crypto.createHmac("sha256", kRegion).update(this.service).digest();
    const kSigning = crypto.createHmac("sha256", kService).update("aws4_request").digest();
    const signature = crypto.createHmac("sha256", kSigning).update(stringToSign).digest("hex");

    // 构建 Authorization 头
    const authorization = `${algorithm} Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    // 发送请求
    const url = `${this.endpoint}${path}`;
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "text/xml",
        "X-Amz-Date": timestamp,
        Authorization: authorization,
      },
      body: bodyString || undefined,
    });

    // 处理速率限制
    if (response.status === 429 || response.status === 503) {
      throw new RateLimitError("route53", 60);
    }

    // 处理认证错误
    if (response.status === 401 || response.status === 403) {
      throw new AuthenticationError("route53", {
        status: response.status,
        statusText: response.statusText,
      });
    }

    // 处理 404 错误
    if (response.status === 404) {
      throw new DNSProviderError("Resource not found", "404", "route53", { status: 404 });
    }

    // 处理其他错误
    if (!response.ok) {
      const text = await response.text();
      const errorMatch = text.match(/<Message>(.*?)<\/Message>/);
      const codeMatch = text.match(/<Code>(.*?)<\/Code>/);
      const message = errorMatch ? errorMatch[1] : `HTTP ${response.status}`;
      const code = codeMatch ? codeMatch[1] : String(response.status);

      throw new DNSProviderError(message, code, "route53", {
        status: response.status,
        xml: text,
      });
    }

    const text = await response.text();
    return this.parseXml(text) as T;
  }

  /**
   * 简单的 XML 解析器
   */
  private parseXml(xml: string): unknown {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "text/xml");

    const parseElement = (element: Element): unknown => {
      if (!element) return null;

      const children: Record<string, unknown> = {};
      const childElements = Array.from(element.children);

      if (childElements.length === 0) {
        return element.textContent?.trim() || null;
      }

      for (const child of childElements) {
        const tagName = child.tagName;
        const value = parseElement(child);

        if (children[tagName]) {
          if (!Array.isArray(children[tagName])) {
            children[tagName] = [children[tagName]];
          }
          (children[tagName] as unknown[]).push(value);
        } else {
          children[tagName] = value;
        }
      }

      return children;
    };

    return parseElement(doc.documentElement);
  }

  async validateCredentials(): Promise<boolean> {
    try {
      await this.request("GET", "/2013-04-01/hostedzone?maxitems=1");
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
      HostedZones?: { HostedZone: Route53HostedZone[] | Route53HostedZone };
    }>("GET", "/2013-04-01/hostedzone?maxitems=100");

    const zones = response.HostedZones?.HostedZone;
    const zoneArray = Array.isArray(zones) ? zones : zones ? [zones] : [];

    return zoneArray.map((zone) => ({
      id: zone.Id.replace("/hostedzone/", ""),
      name: zone.Name.replace(/\.$/, ""),
      status: zone.Config?.PrivateZone ? "inactive" : "active",
      nameServers: [],
      createdAt: new Date(),
      extra: {
        comment: zone.Config?.Comment,
        privateZone: zone.Config?.PrivateZone,
        recordCount: zone.ResourceRecordSetCount,
      },
    }));
  }

  async getDomain(domainId: string): Promise<ProviderDomain> {
    try {
      const response = await this.request<{ HostedZone: Route53HostedZone }>(
        "GET",
        `/2013-04-01/hostedzone/${domainId}`
      );

      const zone = response.HostedZone;

      return {
        id: zone.Id.replace("/hostedzone/", ""),
        name: zone.Name.replace(/\.$/, ""),
        status: zone.Config?.PrivateZone ? "inactive" : "active",
        nameServers: [],
        createdAt: new Date(),
        extra: {
          comment: zone.Config?.Comment,
          privateZone: zone.Config?.PrivateZone,
          recordCount: zone.ResourceRecordSetCount,
        },
      };
    } catch (error) {
      if (error instanceof DNSProviderError && error.code === "404") {
        throw new DomainNotFoundError("route53", domainId);
      }
      throw error;
    }
  }

  async listRecords(domainId: string): Promise<ProviderRecord[]> {
    const response = await this.request<{
      ResourceRecordSets?: {
        ResourceRecordSet: Route53ResourceRecordSet[] | Route53ResourceRecordSet;
      };
    }>("GET", `/2013-04-01/hostedzone/${domainId}/rrset?maxitems=300`);

    const recordSets = response.ResourceRecordSets?.ResourceRecordSet;
    const recordSetArray = Array.isArray(recordSets) ? recordSets : recordSets ? [recordSets] : [];

    // 过滤掉 NS 和 SOA 记录（系统记录）
    const userRecords = recordSetArray.filter(
      (rs) => rs.Type !== "NS" && rs.Type !== "SOA"
    );

    return userRecords.map((recordSet) => this.mapRecord(recordSet));
  }

  async createRecord(domainId: string, input: CreateRecordInput): Promise<ProviderRecord> {
    const name = input.name.endsWith(".") ? input.name : `${input.name}.`;

    const changeBatch: { Changes: Route53Change[] } = {
      Changes: [
        {
          Action: "CREATE" as const,
          ResourceRecordSet: {
            Name: name,
            Type: input.type,
            TTL: input.ttl || 300,
            ResourceRecords: [{ Value: input.content }],
          },
        },
      ],
    };

    await this.changeResourceRecordSets(domainId, changeBatch);

    return {
      id: `${name}-${input.type}`,
      type: input.type,
      name: input.name,
      content: input.content,
      ttl: input.ttl || 300,
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
      throw new RecordNotFoundError("route53", recordId);
    }

    const name = (input.name || existingRecord.name).endsWith(".")
      ? input.name || existingRecord.name
      : `${input.name || existingRecord.name}.`;

    // Route53 使用 UPSERT 操作
    const changeBatch: { Changes: Route53Change[] } = {
      Changes: [
        {
          Action: "UPSERT" as const,
          ResourceRecordSet: {
            Name: name,
            Type: input.type || existingRecord.type,
            TTL: input.ttl ?? existingRecord.ttl,
            ResourceRecords: [{ Value: input.content || existingRecord.content }],
          },
        },
      ],
    };

    await this.changeResourceRecordSets(domainId, changeBatch);

    return {
      id: `${name}-${input.type || existingRecord.type}`,
      type: (input.type || existingRecord.type) as DNSRecordType,
      name: input.name || existingRecord.name,
      content: input.content || existingRecord.content,
      ttl: input.ttl ?? existingRecord.ttl,
      priority: input.priority ?? existingRecord.priority,
    };
  }

  async deleteRecord(domainId: string, recordId: string): Promise<void> {
    const existingRecords = await this.listRecords(domainId);
    const record = existingRecords.find((r) => r.id === recordId);

    if (!record) {
      throw new RecordNotFoundError("route53", recordId);
    }

    const name = record.name.endsWith(".") ? record.name : `${record.name}.`;

    const changeBatch: { Changes: Route53Change[] } = {
      Changes: [
        {
          Action: "DELETE" as const,
          ResourceRecordSet: {
            Name: name,
            Type: record.type,
            TTL: record.ttl,
            ResourceRecords: [{ Value: record.content }],
          },
        },
      ],
    };

    await this.changeResourceRecordSets(domainId, changeBatch);
  }

  async batchCreateRecords(
    domainId: string,
    inputs: CreateRecordInput[]
  ): Promise<ProviderRecord[]> {
    // Route53 支持批量操作
    const changes: Route53Change[] = inputs.map((input) => {
      const name = input.name.endsWith(".") ? input.name : `${input.name}.`;
      return {
        Action: "CREATE" as const,
        ResourceRecordSet: {
          Name: name,
          Type: input.type,
          TTL: input.ttl || 300,
          ResourceRecords: [{ Value: input.content }],
        },
      };
    });

    await this.changeResourceRecordSets(domainId, { Changes: changes });

    return inputs.map((input) => ({
      id: `${input.name}-${input.type}`,
      type: input.type,
      name: input.name,
      content: input.content,
      ttl: input.ttl || 300,
      priority: input.priority,
    }));
  }

  async batchDeleteRecords(domainId: string, recordIds: string[]): Promise<void> {
    const existingRecords = await this.listRecords(domainId);
    const recordsToDelete = existingRecords.filter((r) => recordIds.includes(r.id));

    const changes: Route53Change[] = recordsToDelete.map((record) => {
      const name = record.name.endsWith(".") ? record.name : `${record.name}.`;
      return {
        Action: "DELETE" as const,
        ResourceRecordSet: {
          Name: name,
          Type: record.type,
          TTL: record.ttl,
          ResourceRecords: [{ Value: record.content }],
        },
      };
    });

    if (changes.length > 0) {
      await this.changeResourceRecordSets(domainId, { Changes: changes });
    }
  }

  /**
   * Route53 统一的记录变更接口
   */
  private async changeResourceRecordSets(
    hostedZoneId: string,
    changeBatch: { Changes: Route53Change[] }
  ): Promise<void> {
    const xmlBody = this.buildChangeResourceRecordSetsXml(changeBatch);
    await this.request(
      "POST",
      `/2013-04-01/hostedzone/${hostedZoneId}/rrset/`,
      xmlBody
    );
  }

  /**
   * 构建 ChangeResourceRecordSets 请求的 XML
   */
  private buildChangeResourceRecordSetsXml(changeBatch: {
    Changes: Route53Change[];
  }): string {
    const changes = changeBatch.Changes.map((change) => {
      const rrset = change.ResourceRecordSet;
      const records = rrset.ResourceRecords?.map(
        (rr) => `<ResourceRecord><Value>${this.escapeXml(rr.Value)}</Value></ResourceRecord>`
      ).join("");

      return `
        <Change>
          <Action>${change.Action}</Action>
          <ResourceRecordSet>
            <Name>${this.escapeXml(rrset.Name)}</Name>
            <Type>${rrset.Type}</Type>
            ${rrset.TTL ? `<TTL>${rrset.TTL}</TTL>` : ""}
            ${records ? `<ResourceRecords>${records}</ResourceRecords>` : ""}
          </ResourceRecordSet>
        </Change>
      `;
    }).join("");

    return `<?xml version="1.0" encoding="UTF-8"?>
      <ChangeResourceRecordSetsRequest xmlns="https://route53.amazonaws.com/doc/2013-04-01/">
        <ChangeBatch>
          <Changes>
            ${changes}
          </Changes>
        </ChangeBatch>
      </ChangeResourceRecordSetsRequest>`;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  private mapRecord(recordSet: Route53ResourceRecordSet): ProviderRecord {
    const value = recordSet.ResourceRecords?.[0]?.Value || "";

    return {
      id: `${recordSet.Name}-${recordSet.Type}`,
      type: recordSet.Type as DNSRecordType,
      name: recordSet.Name.replace(/\.$/, ""),
      content: value,
      ttl: recordSet.TTL || 300,
      extra: {
        setIdentifier: recordSet.SetIdentifier,
        weight: recordSet.Weight,
        region: recordSet.Region,
        geoLocation: recordSet.GeoLocation,
      },
    };
  }
}
