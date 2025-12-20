"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { providers, domains, records } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createProvider } from "@/lib/providers";
import { decryptCredentials } from "@/lib/crypto";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { getUserDomains, checkDomainPermission, hasPermission } from "@/lib/permissions";

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

    // Fetch records from provider
    const remoteRecords = await provider.listRecords(domain.remoteId);

    // Delete existing records for this domain
    await db.delete(records).where(eq(records.domainId, domainId));

    // Insert new records
    for (const record of remoteRecords) {
      await db.insert(records).values({
        id: nanoid(),
        domainId,
        remoteId: record.id,
        type: record.type,
        name: record.name,
        content: record.content,
        ttl: record.ttl,
        priority: record.priority ?? null,
        proxied: record.proxied ?? false,
        extra: record.extra ? JSON.stringify(record.extra) : null,
        syncedAt: new Date(),
      });
    }

    // Update domain sync time
    await db
      .update(domains)
      .set({
        syncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(domains.id, domainId));

    revalidatePath(`/domains/${domainId}`);
    revalidatePath("/domains");
    return { success: true, recordsCount: remoteRecords.length };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Sync failed",
    };
  }
}
