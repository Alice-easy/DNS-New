/**
 * System Configuration Keys and Metadata
 * Non-server action exports for system configuration
 */

// 配置键定义 - 仅保留 OAuth 配置
export const CONFIG_KEYS = {
  // OAuth 配置
  GITHUB_CLIENT_ID: "github_client_id",
  GITHUB_CLIENT_SECRET: "github_client_secret",
} as const;

// 敏感配置（需要加密存储）
export const SENSITIVE_KEYS: string[] = [CONFIG_KEYS.GITHUB_CLIENT_SECRET];

// 配置项元数据
export const CONFIG_METADATA: Record<
  string,
  {
    label: string;
    description: string;
    type: "text" | "password" | "url";
    placeholder?: string;
    category: "oauth";
  }
> = {
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
};
