"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { providers, domains, records, recordChanges } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { createProvider } from "@/lib/providers";
import { decryptCredentials } from "@/lib/crypto";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { getUserDomains, checkDomainPermission, hasPermission } from "@/lib/permissions";
import { detectRecordChanges } from "@/lib/change-detection";

export async function getDomains() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // 使用新的权限系统获取用户可访问的域名
  const userDomains = await getUserDomains(session.user.id);

  return userDomains.map((item) => ({
    id: item.domain.id,
    name: item.domain.name,
    status: item.domain.status,
    syncedAt: item.domain.syncedAt,
    createdAt: item.domain.createdAt,
    providerId: item.domain.providerId,
    providerName: item.provider.name,
    providerLabel: item.provider.label,
    permission: item.permission,
    isOwner: item.isOwner,
  })).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getDomainWithRecords(domainId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // 检查权限
  const permission = await checkDomainPermission(session.user.id, domainId);
  if (!permission) {
    return null;
  }

  // Get domain with provider info
  const [domain] = await db
    .select({
      id: domains.id,
      name: domains.name,
      status: domains.status,
      remoteId: domains.remoteId,
      syncedAt: domains.syncedAt,
      providerId: domains.providerId,
      providerName: providers.name,
      providerLabel: providers.label,
      providerCredentials: providers.credentials,
    })
    .from(domains)
    .innerJoin(providers, eq(domains.providerId, providers.id))
    .where(eq(domains.id, domainId));

  if (!domain) {
    return null;
  }

  // Get records from database
  const domainRecords = await db
    .select()
    .from(records)
    .where(eq(records.domainId, domainId))
    .orderBy(records.type, records.name);

  return {
    ...domain,
    providerCredentials: undefined, // Don't expose
    records: domainRecords,
    permission: permission.permission,
    isOwner: permission.isOwner,
  };
}

export async function syncDomainRecords(domainId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // 检查权限 - 需要 full 权限才能同步
  const permission = await checkDomainPermission(session.user.id, domainId);
  if (!permission || !hasPermission(permission.permission, "full")) {
    return { success: false, error: "Permission denied" };
  }

  // Get domain with provider
  const [domain] = await db
    .select({
      id: domains.id,
      remoteId: domains.remoteId,
      providerId: domains.providerId,
      providerName: providers.name,
      providerCredentials: providers.credentials,
    })
    .from(domains)
    .innerJoin(providers, eq(domains.providerId, providers.id))
    .where(eq(domains.id, domainId));

  if (!domain) {
    return { success: false, error: "Domain not found" };
  }

  try {
    const credentials = decryptCredentials(domain.providerCredentials);
    const provider = createProvider(domain.providerName, credentials);

    // 1. 获取本地记录
    const localRecords = await db
      .select()
      .from(records)
      .where(eq(records.domainId, domainId));

    // 2. 获取远程记录
    const remoteRecords = await provider.listRecords(domain.remoteId);

    // 3. 检测变更
    const changes = detectRecordChanges(localRecords, remoteRecords);

    // 4. 生成同步批次ID
    const syncBatchId = nanoid();

    // 5. 记录变更（如果有变更）
    if (changes.length > 0) {
      for (const change of changes) {
        await db.insert(recordChanges).values({
          id: nanoid(),
          domainId,
          recordId: change.localRecordId ?? null,
          remoteId: change.remoteId,
          changeType: change.changeType,
          recordType: change.recordType,
          recordName: change.recordName,
          previousValue: change.previousValue
            ? JSON.stringify(change.previousValue)
            : null,
          currentValue: change.currentValue
            ? JSON.stringify(change.currentValue)
            : null,
          changedFields: change.changedFields
            ? JSON.stringify(change.changedFields)
            : null,
          syncBatchId,
          userId: session.user.id,
        });
      }
    }

    // 6. 更新本地记录
    // 删除已删除的记录
    const deletedRemoteIds = changes
      .filter((c) => c.changeType === "deleted")
      .map((c) => c.remoteId);

    if (deletedRemoteIds.length > 0) {
      await db
        .delete(records)
        .where(
          and(
            eq(records.domainId, domainId),
            inArray(records.remoteId, deletedRemoteIds)
          )
        );
    }

    // 插入新增的记录
    for (const change of changes.filter((c) => c.changeType === "added")) {
      const remoteRecord = remoteRecords.find((r) => r.id === change.remoteId)!;
      await db.insert(records).values({
        id: nanoid(),
        domainId,
        remoteId: remoteRecord.id,
        type: remoteRecord.type,
        name: remoteRecord.name,
        content: remoteRecord.content,
        ttl: remoteRecord.ttl,
        priority: remoteRecord.priority ?? null,
        proxied: remoteRecord.proxied ?? false,
        extra: remoteRecord.extra ? JSON.stringify(remoteRecord.extra) : null,
        syncedAt: new Date(),
      });
    }

    // 更新修改的记录
    for (const change of changes.filter((c) => c.changeType === "modified")) {
      const remoteRecord = remoteRecords.find((r) => r.id === change.remoteId)!;
      await db
        .update(records)
        .set({
          type: remoteRecord.type,
          name: remoteRecord.name,
          content: remoteRecord.content,
          ttl: remoteRecord.ttl,
          priority: remoteRecord.priority ?? null,
          proxied: remoteRecord.proxied ?? false,
          extra: remoteRecord.extra
            ? JSON.stringify(remoteRecord.extra)
            : null,
          syncedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(records.id, change.localRecordId!));
    }

    // 7. 更新域名同步时间
    await db
      .update(domains)
      .set({
        syncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(domains.id, domainId));

    revalidatePath(`/domains/${domainId}`);
    revalidatePath("/domains");
    revalidatePath("/changes");

    return {
      success: true,
      recordsCount: remoteRecords.length,
      changes: {
        added: changes.filter((c) => c.changeType === "added").length,
        modified: changes.filter((c) => c.changeType === "modified").length,
        deleted: changes.filter((c) => c.changeType === "deleted").length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Sync failed",
    };
  }
}
