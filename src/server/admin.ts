"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, domainShares, domains, providers } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { isAdmin } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";

// 确保当前用户是管理员
async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const admin = await isAdmin(session.user.id);
  if (!admin) {
    throw new Error("Admin access required");
  }

  return session.user.id;
}

// 获取所有用户列表
export async function getUsers() {
  await requireAdmin();

  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(users.createdAt);

  return allUsers;
}

// 更新用户角色
export async function updateUserRole(userId: string, role: "admin" | "user") {
  const currentUserId = await requireAdmin();

  // 不能更改自己的角色
  if (userId === currentUserId) {
    return { success: false, error: "Cannot change your own role" };
  }

  try {
    await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId));

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update role",
    };
  }
}

// 删除用户
export async function deleteUser(userId: string) {
  const currentUserId = await requireAdmin();

  // 不能删除自己
  if (userId === currentUserId) {
    return { success: false, error: "Cannot delete yourself" };
  }

  try {
    await db.delete(users).where(eq(users.id, userId));

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete user",
    };
  }
}

// 获取所有域名（管理员用，包含所有用户的域名）
export async function getAllDomains() {
  await requireAdmin();

  const allDomains = await db
    .select({
      id: domains.id,
      name: domains.name,
      status: domains.status,
      providerId: domains.providerId,
      providerName: providers.name,
      providerLabel: providers.label,
      ownerId: providers.userId,
      ownerName: users.name,
      ownerEmail: users.email,
    })
    .from(domains)
    .innerJoin(providers, eq(domains.providerId, providers.id))
    .innerJoin(users, eq(providers.userId, users.id))
    .orderBy(domains.name);

  return allDomains;
}

// 获取域名的共享列表
export async function getDomainShares(domainId: string) {
  await requireAdmin();

  const shares = await db
    .select({
      id: domainShares.id,
      domainId: domainShares.domainId,
      userId: domainShares.userId,
      permission: domainShares.permission,
      userName: users.name,
      userEmail: users.email,
      createdAt: domainShares.createdAt,
    })
    .from(domainShares)
    .innerJoin(users, eq(domainShares.userId, users.id))
    .where(eq(domainShares.domainId, domainId));

  return shares;
}

// 添加域名共享
export async function addDomainShare(
  domainId: string,
  userId: string,
  permission: "readonly" | "edit" | "full"
) {
  await requireAdmin();

  // 检查是否已存在
  const [existing] = await db
    .select()
    .from(domainShares)
    .where(
      and(
        eq(domainShares.domainId, domainId),
        eq(domainShares.userId, userId)
      )
    );

  if (existing) {
    return { success: false, error: "Share already exists" };
  }

  // 检查用户是否是域名所有者
  const [domain] = await db
    .select({
      ownerId: providers.userId,
    })
    .from(domains)
    .innerJoin(providers, eq(domains.providerId, providers.id))
    .where(eq(domains.id, domainId));

  if (domain?.ownerId === userId) {
    return { success: false, error: "Cannot share domain with its owner" };
  }

  try {
    await db.insert(domainShares).values({
      id: nanoid(),
      domainId,
      userId,
      permission,
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add share",
    };
  }
}

// 更新域名共享权限
export async function updateDomainShare(
  shareId: string,
  permission: "readonly" | "edit" | "full"
) {
  await requireAdmin();

  try {
    await db
      .update(domainShares)
      .set({ permission, updatedAt: new Date() })
      .where(eq(domainShares.id, shareId));

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update share",
    };
  }
}

// 删除域名共享
export async function deleteDomainShare(shareId: string) {
  await requireAdmin();

  try {
    await db.delete(domainShares).where(eq(domainShares.id, shareId));

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete share",
    };
  }
}

// 获取可共享给的用户列表（排除域名所有者）
export async function getShareableUsers(domainId: string) {
  await requireAdmin();

  // 获取域名所有者
  const [domain] = await db
    .select({
      ownerId: providers.userId,
    })
    .from(domains)
    .innerJoin(providers, eq(domains.providerId, providers.id))
    .where(eq(domains.id, domainId));

  if (!domain) {
    return [];
  }

  // 获取已共享的用户 ID
  const existingShares = await db
    .select({ userId: domainShares.userId })
    .from(domainShares)
    .where(eq(domainShares.domainId, domainId));

  const excludeIds = [domain.ownerId, ...existingShares.map((s) => s.userId)];

  // 获取其他用户
  const availableUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(
      excludeIds.length > 0
        ? and(...excludeIds.map((id) => ne(users.id, id)))
        : undefined
    );

  return availableUsers;
}
