"use server";

/**
 * System Configuration Server Actions
 * 管理系统配置（存储在数据库中）
 */

import { auth } from "@/lib/auth";
import { db, systemConfig } from "@/lib/db";
import { isAdmin } from "@/lib/permissions";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { encrypt, decrypt } from "@/lib/crypto";
import { CONFIG_KEYS, SENSITIVE_KEYS, CONFIG_METADATA } from "@/lib/system-config-types";

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
