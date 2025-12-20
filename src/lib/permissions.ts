/**
 * 权限管理工具函数
 */

import { db } from "@/lib/db";
import { domains, providers, domainShares, users } from "@/lib/db/schema";
import { eq, and, or } from "drizzle-orm";

export type Permission = "readonly" | "edit" | "full" | "owner";

export interface DomainPermission {
  domainId: string;
  userId: string;
  permission: Permission;
  isOwner: boolean;
}

/**
 * 检查用户对域名的权限
 * @param userId 用户ID
 * @param domainId 域名ID
 * @returns 权限信息，如果无权限则返回 null
 */
export async function checkDomainPermission(
  userId: string,
  domainId: string
): Promise<DomainPermission | null> {
  // 查询域名信息及其所属的 provider
  const [domain] = await db
    .select({
      domain: domains,
      provider: providers,
    })
    .from(domains)
    .innerJoin(providers, eq(domains.providerId, providers.id))
    .where(eq(domains.id, domainId));

  if (!domain) {
    return null;
  }

  // 检查是否是所有者（拥有 provider 的用户）
  if (domain.provider.userId === userId) {
    return {
      domainId,
      userId,
      permission: "owner",
      isOwner: true,
    };
  }

  // 检查是否有共享权限
  const [share] = await db
    .select()
    .from(domainShares)
    .where(
      and(eq(domainShares.domainId, domainId), eq(domainShares.userId, userId))
    );

  if (share) {
    return {
      domainId,
      userId,
      permission: share.permission as Permission,
      isOwner: false,
    };
  }

  return null;
}

/**
 * 检查用户是否有指定的最低权限
 * @param permission 用户的实际权限
 * @param required 需要的最低权限
 * @returns 是否有足够权限
 */
export function hasPermission(
  permission: Permission,
  required: "readonly" | "edit" | "full"
): boolean {
  const levels: Record<Permission, number> = {
    readonly: 1,
    edit: 2,
    full: 3,
    owner: 4,
  };

  return levels[permission] >= levels[required];
}

/**
 * 检查用户是否是管理员
 * @param userId 用户ID
 * @returns 是否是管理员
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId));

  return user?.role === "admin";
}

/**
 * 获取用户可访问的所有域名列表
 * @param userId 用户ID
 * @returns 域名列表及权限信息
 */
export async function getUserDomains(userId: string): Promise<
  Array<{
    domain: typeof domains.$inferSelect;
    provider: typeof providers.$inferSelect;
    permission: Permission;
    isOwner: boolean;
  }>
> {
  // 获取用户拥有的域名（通过 provider）
  const ownedDomains = await db
    .select({
      domain: domains,
      provider: providers,
    })
    .from(domains)
    .innerJoin(providers, eq(domains.providerId, providers.id))
    .where(eq(providers.userId, userId));

  const ownedResult = ownedDomains.map((item) => ({
    domain: item.domain,
    provider: item.provider,
    permission: "owner" as Permission,
    isOwner: true,
  }));

  // 获取共享给用户的域名
  const sharedDomains = await db
    .select({
      domain: domains,
      provider: providers,
      permission: domainShares.permission,
    })
    .from(domainShares)
    .innerJoin(domains, eq(domainShares.domainId, domains.id))
    .innerJoin(providers, eq(domains.providerId, providers.id))
    .where(eq(domainShares.userId, userId));

  const sharedResult = sharedDomains.map((item) => ({
    domain: item.domain,
    provider: item.provider,
    permission: item.permission as Permission,
    isOwner: false,
  }));

  return [...ownedResult, ...sharedResult];
}
