/**
 * System Configuration Keys and Metadata
 * Non-server action exports for system configuration
 */

// 配置键定义
export const CONFIG_KEYS = {
  // 站点配置
  AUTH_URL: "auth_url",

  // GitHub OAuth
  GITHUB_CLIENT_ID: "github_client_id",
  GITHUB_CLIENT_SECRET: "github_client_secret",

  // Google OAuth
  GOOGLE_CLIENT_ID: "google_client_id",
  GOOGLE_CLIENT_SECRET: "google_client_secret",

  // Discord OAuth
  DISCORD_CLIENT_ID: "discord_client_id",
  DISCORD_CLIENT_SECRET: "discord_client_secret",

  // Gitee OAuth (码云)
  GITEE_CLIENT_ID: "gitee_client_id",
  GITEE_CLIENT_SECRET: "gitee_client_secret",
} as const;

// 敏感配置（需要加密存储）
export const SENSITIVE_KEYS: string[] = [
  CONFIG_KEYS.GITHUB_CLIENT_SECRET,
  CONFIG_KEYS.GOOGLE_CLIENT_SECRET,
  CONFIG_KEYS.DISCORD_CLIENT_SECRET,
  CONFIG_KEYS.GITEE_CLIENT_SECRET,
];

// 配置项元数据
export const CONFIG_METADATA: Record<
  string,
  {
    label: string;
    description: string;
    type: "text" | "password" | "url";
    placeholder?: string;
    category: "site" | "github" | "google" | "discord" | "gitee";
    order: number;
  }
> = {
  // 站点配置
  [CONFIG_KEYS.AUTH_URL]: {
    label: "Auth URL",
    description: "OAuth 回调地址（绑定的域名或公网 IP，如 https://dns.example.com）",
    type: "url",
    placeholder: "https://dns.example.com",
    category: "site",
    order: 0,
  },

  // GitHub OAuth
  [CONFIG_KEYS.GITHUB_CLIENT_ID]: {
    label: "Client ID",
    description: "GitHub OAuth App 的 Client ID",
    type: "text",
    placeholder: "Iv1.xxxxxxxx",
    category: "github",
    order: 1,
  },
  [CONFIG_KEYS.GITHUB_CLIENT_SECRET]: {
    label: "Client Secret",
    description: "GitHub OAuth App 的 Client Secret",
    type: "password",
    placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    category: "github",
    order: 2,
  },

  // Google OAuth
  [CONFIG_KEYS.GOOGLE_CLIENT_ID]: {
    label: "Client ID",
    description: "Google Cloud Console 的 OAuth Client ID",
    type: "text",
    placeholder: "xxxxx.apps.googleusercontent.com",
    category: "google",
    order: 3,
  },
  [CONFIG_KEYS.GOOGLE_CLIENT_SECRET]: {
    label: "Client Secret",
    description: "Google OAuth Client Secret",
    type: "password",
    placeholder: "GOCSPX-xxxxxx",
    category: "google",
    order: 4,
  },

  // Discord OAuth
  [CONFIG_KEYS.DISCORD_CLIENT_ID]: {
    label: "Client ID",
    description: "Discord Developer Portal 的 Application ID",
    type: "text",
    placeholder: "123456789012345678",
    category: "discord",
    order: 5,
  },
  [CONFIG_KEYS.DISCORD_CLIENT_SECRET]: {
    label: "Client Secret",
    description: "Discord OAuth Client Secret",
    type: "password",
    placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    category: "discord",
    order: 6,
  },

  // Gitee OAuth
  [CONFIG_KEYS.GITEE_CLIENT_ID]: {
    label: "Client ID",
    description: "Gitee 第三方应用的 Client ID",
    type: "text",
    placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    category: "gitee",
    order: 7,
  },
  [CONFIG_KEYS.GITEE_CLIENT_SECRET]: {
    label: "Client Secret",
    description: "Gitee OAuth Client Secret",
    type: "password",
    placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    category: "gitee",
    order: 8,
  },
};

// OAuth 提供商信息
export const OAUTH_PROVIDERS = {
  github: {
    name: "GitHub",
    icon: "github",
    color: "#24292e",
    docsUrl: "https://github.com/settings/developers",
    callbackPath: "/api/auth/callback/github",
  },
  google: {
    name: "Google",
    icon: "google",
    color: "#4285f4",
    docsUrl: "https://console.cloud.google.com/apis/credentials",
    callbackPath: "/api/auth/callback/google",
  },
  discord: {
    name: "Discord",
    icon: "discord",
    color: "#5865f2",
    docsUrl: "https://discord.com/developers/applications",
    callbackPath: "/api/auth/callback/discord",
  },
  gitee: {
    name: "Gitee",
    icon: "gitee",
    color: "#c71d23",
    docsUrl: "https://gitee.com/oauth/applications",
    callbackPath: "/api/auth/callback/gitee",
  },
} as const;
