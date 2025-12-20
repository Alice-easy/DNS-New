/**
 * DNS Provider Types
 * Unified interface for all DNS providers
 */

// DNS Record Types
export type DNSRecordType =
  | "A"
  | "AAAA"
  | "CNAME"
  | "MX"
  | "TXT"
  | "NS"
  | "SRV"
  | "CAA"
  | "PTR";

// Domain from provider
export interface ProviderDomain {
  id: string; // Provider's domain ID
  name: string; // e.g., example.com
  status: "active" | "pending" | "inactive" | "error";
  nameServers?: string[];
  createdAt?: Date;
  extra?: Record<string, unknown>;
}

// DNS Record from provider
export interface ProviderRecord {
  id: string; // Provider's record ID
  type: DNSRecordType;
  name: string; // Full name (e.g., www.example.com) or @ for root
  content: string; // IP address or target
  ttl: number; // Time to live in seconds
  priority?: number; // For MX, SRV records
  proxied?: boolean; // Cloudflare specific
  // 智能解析线路 (用于阿里云、腾讯云等)
  line?: string; // 线路名称: 默认, 电信, 联通, 移动, 海外等
  lineId?: string; // 线路ID (服务商特定)
  extra?: Record<string, unknown>;
}

// DNS 解析线路定义
export interface DNSLine {
  id: string; // 线路ID
  name: string; // 线路名称
  parentId?: string; // 父级线路ID (用于分组)
}

// Input for creating a record
export interface CreateRecordInput {
  type: DNSRecordType;
  name: string;
  content: string;
  ttl?: number;
  priority?: number;
  proxied?: boolean;
  // 智能解析线路
  line?: string; // 线路名称
  lineId?: string; // 线路ID (优先使用)
}

// Input for updating a record
export interface UpdateRecordInput extends Partial<CreateRecordInput> {}

// Provider credentials (stored encrypted)
export interface ProviderCredentials {
  apiToken?: string;
  apiKey?: string;
  apiEmail?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  [key: string]: string | undefined;
}

// Provider metadata
export interface ProviderMeta {
  name: string; // cloudflare, alidns, dnspod
  displayName: string;
  description: string;
  website: string;
  features: {
    proxied?: boolean; // Supports proxy (Cloudflare)
    geoRouting?: boolean; // Supports geo-based routing
    loadBalancing?: boolean;
    healthChecks?: boolean;
  };
  credentialFields: {
    name: string;
    label: string;
    type: "text" | "password";
    required: boolean;
    placeholder?: string;
    helpText?: string;
  }[];
}

// DNS Provider Interface
export interface IDNSProvider {
  readonly meta: ProviderMeta;

  /**
   * Validate credentials
   * @returns true if credentials are valid
   */
  validateCredentials(): Promise<boolean>;

  /**
   * List all domains
   */
  listDomains(): Promise<ProviderDomain[]>;

  /**
   * Get a single domain by ID
   */
  getDomain(domainId: string): Promise<ProviderDomain>;

  /**
   * List all records for a domain
   */
  listRecords(domainId: string): Promise<ProviderRecord[]>;

  /**
   * Create a new DNS record
   */
  createRecord(
    domainId: string,
    record: CreateRecordInput
  ): Promise<ProviderRecord>;

  /**
   * Update an existing DNS record
   */
  updateRecord(
    domainId: string,
    recordId: string,
    record: UpdateRecordInput
  ): Promise<ProviderRecord>;

  /**
   * Delete a DNS record
   */
  deleteRecord(domainId: string, recordId: string): Promise<void>;

  /**
   * List available DNS lines for a domain (智能解析线路)
   * Only supported by some providers (Aliyun, DNSPod)
   */
  listLines?(domainId: string): Promise<DNSLine[]>;

  /**
   * Batch create records
   */
  batchCreateRecords?(
    domainId: string,
    records: CreateRecordInput[]
  ): Promise<ProviderRecord[]>;

  /**
   * Batch delete records
   */
  batchDeleteRecords?(domainId: string, recordIds: string[]): Promise<void>;
}

// Provider factory type
export type DNSProviderFactory = (
  credentials: ProviderCredentials
) => IDNSProvider;

// Error types
export class DNSProviderError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "DNSProviderError";
  }
}

export class AuthenticationError extends DNSProviderError {
  constructor(provider: string, details?: Record<string, unknown>) {
    super("Authentication failed", "AUTH_FAILED", provider, details);
    this.name = "AuthenticationError";
  }
}

export class RateLimitError extends DNSProviderError {
  constructor(
    provider: string,
    public retryAfter?: number,
    details?: Record<string, unknown>
  ) {
    super("Rate limit exceeded", "RATE_LIMIT", provider, details);
    this.name = "RateLimitError";
  }
}

export class RecordNotFoundError extends DNSProviderError {
  constructor(
    provider: string,
    recordId: string,
    details?: Record<string, unknown>
  ) {
    super(`Record not found: ${recordId}`, "RECORD_NOT_FOUND", provider, details);
    this.name = "RecordNotFoundError";
  }
}

export class DomainNotFoundError extends DNSProviderError {
  constructor(
    provider: string,
    domainId: string,
    details?: Record<string, unknown>
  ) {
    super(`Domain not found: ${domainId}`, "DOMAIN_NOT_FOUND", provider, details);
    this.name = "DomainNotFoundError";
  }
}
