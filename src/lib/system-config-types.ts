/**
 * System Configuration Keys and Metadata
 * Non-server action exports for system configuration
 */

// 配置键定义
export const CONFIG_KEYS = {
  // 数据库配置
  DATABASE_URL: "database_url",

  // OAuth 配置
  GITHUB_CLIENT_ID: "github_client_id",
  GITHUB_CLIENT_SECRET: "github_client_secret",

  // 凭据加密密钥
  CREDENTIALS_ENCRYPTION_KEY: "credentials_encryption_key",

  // 其他可选配置
  AUTH_URL: "auth_url",

  // Turso 配置
  TURSO_DATABASE_URL: "turso_database_url",
  TURSO_AUTH_TOKEN: "turso_auth_token",
} as const;

// 敏感配置（需要加密存储）
export const SENSITIVE_KEYS: string[] = [
  CONFIG_KEYS.GITHUB_CLIENT_SECRET,
  CONFIG_KEYS.CREDENTIALS_ENCRYPTION_KEY,
  CONFIG_KEYS.TURSO_AUTH_TOKEN,
  CONFIG_KEYS.DATABASE_URL,
];

// 配置项元数据
export const CONFIG_METADATA: Record<string, {
  label: string;
  description: string;
  type: "text" | "password" | "url";
  placeholder?: string;
  category: "database" | "oauth" | "security" | "other";
}> = {
  [CONFIG_KEYS.DATABASE_URL]: {
    label: "Database URL",
    description: "数据库连接字符串（PostgreSQL/MySQL）或文件路径（SQLite）",
    type: "password",
    placeholder: "postgresql://user:password@host:5432/database",
    category: "database",
  },
  [CONFIG_KEYS.TURSO_DATABASE_URL]: {
    label: "Turso Database URL",
    description: "Turso 数据库 URL（仅当使用 Turso 时需要）",
    type: "url",
    placeholder: "libsql://your-database.turso.io",
    category: "database",
  },
  [CONFIG_KEYS.TURSO_AUTH_TOKEN]: {
    label: "Turso Auth Token",
    description: "Turso 认证令牌",
    type: "password",
    placeholder: "eyJhbGciOiJFZERTQSI...",
    category: "database",
  },
  [CONFIG_KEYS.GITHUB_CLIENT_ID]: {
    label: "GitHub Client ID",
    description: "GitHub OAuth 应用的 Client ID",
    type: "text",
    placeholder: "Iv1.xxxxxxxx",
    category: "oauth",
  },
  [CONFIG_KEYS.GITHUB_CLIENT_SECRET]: {
    label: "GitHub Client Secret",
    description: "GitHub OAuth 应用的 Client Secret",
    type: "password",
    placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    category: "oauth",
  },
  [CONFIG_KEYS.CREDENTIALS_ENCRYPTION_KEY]: {
    label: "Credentials Encryption Key",
    description: "DNS 服务商凭据的加密密钥（留空则使用 AUTH_SECRET）",
    type: "password",
    placeholder: "openssl rand -base64 32",
    category: "security",
  },
  [CONFIG_KEYS.AUTH_URL]: {
    label: "Auth URL",
    description: "生产环境的认证回调 URL",
    type: "url",
    placeholder: "https://your-domain.com",
    category: "other",
  },
};
