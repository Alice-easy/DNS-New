"use server";

/**
 * System Configuration Server Actions
 * 管理系统配置（存储在数据库中）
 */

import { auth } from "@/lib/auth";
import { db, systemConfig } from "@/lib/db";
import { isAdmin } from "@/lib/permissions";
import { eq, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { encrypt, decrypt } from "@/lib/crypto";
import { CONFIG_KEYS, SENSITIVE_KEYS, CONFIG_METADATA } from "@/lib/system-config-types";
import {
  users,
  accounts,
  sessions,
  providers,
  domains,
  records,
  domainShares,
  auditLogs,
  recordChanges,
  monitorTasks,
  monitorResults,
  alertRules,
  notificationChannels,
  alertHistory,
} from "@/lib/db/schema";

/**
 * 获取单个配置值
 */
export async function getConfig(key: string): Promise<string | null> {
  const result = await db.query.systemConfig.findFirst({
    where: eq(systemConfig.key, key),
  });

  if (!result) return null;

  // 如果是加密存储的，需要解密
  if (result.encrypted && result.value) {
    try {
      return decrypt(result.value);
    } catch {
      return null;
    }
  }

  return result.value;
}

/**
 * 获取所有配置（敏感值会被掩码处理）
 */
export async function getAllConfigs(): Promise<
  Array<{
    key: string;
    value: string;
    hasValue: boolean;
    encrypted: boolean;
    description: string | null;
    updatedAt: Date | null;
  }>
> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const admin = await isAdmin(session.user.id);
  if (!admin) {
    throw new Error("Admin access required");
  }

  const configs = await db.query.systemConfig.findMany();

  // 返回配置列表，敏感值用掩码替代
  return Object.keys(CONFIG_METADATA).map((key) => {
    const config = configs.find((c) => c.key === key);
    const isSensitive = SENSITIVE_KEYS.includes(key);

    return {
      key,
      value: config && isSensitive ? "••••••••" : (config?.value || ""),
      hasValue: !!config?.value,
      encrypted: config?.encrypted || false,
      description: config?.description || null,
      updatedAt: config?.updatedAt || null,
    };
  });
}

/**
 * 设置配置值
 */
export async function setConfig(
  key: string,
  value: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const admin = await isAdmin(session.user.id);
  if (!admin) {
    return { success: false, error: "Admin access required" };
  }

  // 验证配置键
  if (!Object.values(CONFIG_KEYS).includes(key as (typeof CONFIG_KEYS)[keyof typeof CONFIG_KEYS])) {
    return { success: false, error: "Invalid config key" };
  }

  try {
    const isSensitive = SENSITIVE_KEYS.includes(key);
    const finalValue = isSensitive && value ? encrypt(value) : value;

    // Upsert 配置
    const existing = await db.query.systemConfig.findFirst({
      where: eq(systemConfig.key, key),
    });

    if (existing) {
      await db
        .update(systemConfig)
        .set({
          value: finalValue,
          encrypted: isSensitive,
          updatedAt: new Date(),
          updatedBy: session.user.id,
        })
        .where(eq(systemConfig.key, key));
    } else {
      await db.insert(systemConfig).values({
        key,
        value: finalValue,
        encrypted: isSensitive,
        description: CONFIG_METADATA[key]?.description,
        updatedAt: new Date(),
        updatedBy: session.user.id,
      });
    }

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to set config:", error);
    return { success: false, error: "Failed to save configuration" };
  }
}

/**
 * 删除配置值
 */
export async function deleteConfig(
  key: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const admin = await isAdmin(session.user.id);
  if (!admin) {
    return { success: false, error: "Admin access required" };
  }

  try {
    await db.delete(systemConfig).where(eq(systemConfig.key, key));
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete config:", error);
    return { success: false, error: "Failed to delete configuration" };
  }
}

/**
 * 获取运行时配置值（优先从数据库读取，其次从环境变量）
 */
export async function getRuntimeConfig(key: string, envKey?: string): Promise<string | null> {
  // 首先尝试从数据库获取
  const dbValue = await getConfig(key);
  if (dbValue) return dbValue;

  // 回退到环境变量
  const envValue = envKey ? process.env[envKey] : process.env[key.toUpperCase()];
  return envValue || null;
}

/**
 * 获取数据库类型信息
 */
export async function getDatabaseInfo(): Promise<{
  type: string;
  isEdgeCompatible: boolean;
  configured: boolean;
}> {
  const dbType = process.env.DATABASE_TYPE || "sqlite";

  return {
    type: dbType,
    isEdgeCompatible: dbType === "turso" || dbType === "postgres",
    configured: true, // SQLite 默认配置好了
  };
}

/**
 * 获取数据库统计信息（仅管理员）
 */
export async function getDatabaseStats(): Promise<{
  type: string;
  tables: Array<{
    name: string;
    rowCount: number;
  }>;
  totalRows: number;
  dbSize?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const admin = await isAdmin(session.user.id);
  if (!admin) {
    throw new Error("Admin access required");
  }

  const dbType = process.env.DATABASE_TYPE || "sqlite";

  // 使用 Drizzle ORM 查询各表行数
  const tableQueries = await Promise.all([
    db.select({ count: count() }).from(users).then(r => ({ name: "users", rowCount: r[0]?.count || 0 })),
    db.select({ count: count() }).from(accounts).then(r => ({ name: "accounts", rowCount: r[0]?.count || 0 })),
    db.select({ count: count() }).from(sessions).then(r => ({ name: "sessions", rowCount: r[0]?.count || 0 })),
    db.select({ count: count() }).from(providers).then(r => ({ name: "providers", rowCount: r[0]?.count || 0 })),
    db.select({ count: count() }).from(domains).then(r => ({ name: "domains", rowCount: r[0]?.count || 0 })),
    db.select({ count: count() }).from(records).then(r => ({ name: "records", rowCount: r[0]?.count || 0 })),
    db.select({ count: count() }).from(domainShares).then(r => ({ name: "domain_shares", rowCount: r[0]?.count || 0 })),
    db.select({ count: count() }).from(auditLogs).then(r => ({ name: "audit_logs", rowCount: r[0]?.count || 0 })),
    db.select({ count: count() }).from(recordChanges).then(r => ({ name: "record_changes", rowCount: r[0]?.count || 0 })),
    db.select({ count: count() }).from(monitorTasks).then(r => ({ name: "monitor_tasks", rowCount: r[0]?.count || 0 })),
    db.select({ count: count() }).from(monitorResults).then(r => ({ name: "monitor_results", rowCount: r[0]?.count || 0 })),
    db.select({ count: count() }).from(alertRules).then(r => ({ name: "alert_rules", rowCount: r[0]?.count || 0 })),
    db.select({ count: count() }).from(notificationChannels).then(r => ({ name: "notification_channels", rowCount: r[0]?.count || 0 })),
    db.select({ count: count() }).from(alertHistory).then(r => ({ name: "alert_history", rowCount: r[0]?.count || 0 })),
    db.select({ count: count() }).from(systemConfig).then(r => ({ name: "system_config", rowCount: r[0]?.count || 0 })),
  ]);

  const tables = tableQueries.filter(t => t.rowCount > 0);
  const totalRows = tableQueries.reduce((sum, t) => sum + t.rowCount, 0);

  // 获取数据库大小（仅 SQLite，使用文件大小）
  let dbSize: string | undefined;
  if (dbType === "sqlite") {
    try {
      const fs = await import("fs");
      const dbPath = process.env.DATABASE_URL || "./data/sqlite.db";
      const stats = fs.statSync(dbPath);
      dbSize = formatBytes(stats.size);
    } catch {
      dbSize = "N/A";
    }
  }

  return {
    type: dbType,
    tables,
    totalRows,
    dbSize,
  };
}

// 格式化字节大小
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * 获取 OAuth 配置状态（用于登录页面动态显示）
 * 此函数不需要认证，返回的是是否配置而非实际值
 */
export async function getOAuthStatus(): Promise<{
  github: boolean;
  google: boolean;
  discord: boolean;
  gitee: boolean;
}> {
  // 检查环境变量配置
  const githubFromEnv = !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
  const googleFromEnv = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const discordFromEnv = !!(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET);
  const giteeFromEnv = !!(process.env.GITEE_CLIENT_ID && process.env.GITEE_CLIENT_SECRET);

  // 如果环境变量已配置，直接返回
  const result = {
    github: githubFromEnv,
    google: googleFromEnv,
    discord: discordFromEnv,
    gitee: giteeFromEnv,
  };

  // 检查数据库配置（如果环境变量未配置）
  try {
    if (!result.github) {
      const githubClientId = await getConfig(CONFIG_KEYS.GITHUB_CLIENT_ID);
      const githubClientSecret = await getConfig(CONFIG_KEYS.GITHUB_CLIENT_SECRET);
      result.github = !!(githubClientId && githubClientSecret);
    }

    if (!result.google) {
      const googleClientId = await getConfig(CONFIG_KEYS.GOOGLE_CLIENT_ID);
      const googleClientSecret = await getConfig(CONFIG_KEYS.GOOGLE_CLIENT_SECRET);
      result.google = !!(googleClientId && googleClientSecret);
    }

    if (!result.discord) {
      const discordClientId = await getConfig(CONFIG_KEYS.DISCORD_CLIENT_ID);
      const discordClientSecret = await getConfig(CONFIG_KEYS.DISCORD_CLIENT_SECRET);
      result.discord = !!(discordClientId && discordClientSecret);
    }

    if (!result.gitee) {
      const giteeClientId = await getConfig(CONFIG_KEYS.GITEE_CLIENT_ID);
      const giteeClientSecret = await getConfig(CONFIG_KEYS.GITEE_CLIENT_SECRET);
      result.gitee = !!(giteeClientId && giteeClientSecret);
    }

    return result;
  } catch {
    // 数据库可能还没初始化
    return result;
  }
}
