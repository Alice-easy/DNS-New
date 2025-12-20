"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { providers, domains, records } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createProvider } from "@/lib/providers";
import { decryptCredentials } from "@/lib/crypto";
import { validateDNSRecord } from "@/lib/dns-validation";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import type { CreateRecordInput, UpdateRecordInput } from "@/lib/providers/types";
import { checkDomainPermission, hasPermission, type Permission } from "@/lib/permissions";

async function getProviderForDomain(domainId: string) {
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
    throw new Error("Domain not found");
  }

  const credentials = decryptCredentials(domain.providerCredentials);
  const provider = createProvider(domain.providerName, credentials);

  return { domain, provider };
}

// 检查用户对域名的权限
async function checkRecordPermission(
  userId: string,
  domainId: string,
  requiredPermission: "readonly" | "edit" | "full"
): Promise<{ allowed: boolean; permission?: Permission }> {
  const permissionInfo = await checkDomainPermission(userId, domainId);
  if (!permissionInfo) {
    return { allowed: false };
  }

  if (!hasPermission(permissionInfo.permission, requiredPermission)) {
    return { allowed: false, permission: permissionInfo.permission };
  }

  return { allowed: true, permission: permissionInfo.permission };
}

export async function createRecord(
  domainId: string,
  input: CreateRecordInput
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // 检查权限 - 需要 edit 权限
  const permCheck = await checkRecordPermission(session.user.id, domainId, "edit");
  if (!permCheck.allowed) {
    return { success: false, error: "Permission denied" };
  }

  // Validate input before sending to provider
  const validation = validateDNSRecord({
    type: input.type,
    name: input.name,
    content: input.content,
    ttl: input.ttl,
    priority: input.priority,
  });

  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    const { domain, provider } = await getProviderForDomain(domainId);

    // Create record on provider
    const remoteRecord = await provider.createRecord(domain.remoteId, input);

    // Save to local database
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
      syncedAt: new Date(),
    });

    revalidatePath(`/domains/${domainId}`);
    return { success: true, record: remoteRecord };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create record",
    };
  }
}

export async function updateRecord(
  domainId: string,
  recordId: string,
  input: UpdateRecordInput
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // 检查权限 - 需要 edit 权限
  const permCheck = await checkRecordPermission(session.user.id, domainId, "edit");
  if (!permCheck.allowed) {
    return { success: false, error: "Permission denied" };
  }

  // Validate input before sending to provider (only if all required fields are provided)
  if (input.type && input.name && input.content) {
    const validation = validateDNSRecord({
      type: input.type,
      name: input.name,
      content: input.content,
      ttl: input.ttl,
      priority: input.priority,
    });

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
  }

  try {
    const { domain, provider } = await getProviderForDomain(domainId);

    // Get local record to find remote ID
    const [localRecord] = await db
      .select()
      .from(records)
      .where(and(eq(records.id, recordId), eq(records.domainId, domainId)));

    if (!localRecord) {
      return { success: false, error: "Record not found" };
    }

    // Update on provider
    const remoteRecord = await provider.updateRecord(
      domain.remoteId,
      localRecord.remoteId,
      input
    );

    // Update local database
    await db
      .update(records)
      .set({
        type: remoteRecord.type,
        name: remoteRecord.name,
        content: remoteRecord.content,
        ttl: remoteRecord.ttl,
        priority: remoteRecord.priority ?? null,
        proxied: remoteRecord.proxied ?? false,
        syncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(records.id, recordId));

    revalidatePath(`/domains/${domainId}`);
    return { success: true, record: remoteRecord };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update record",
    };
  }
}

export async function deleteRecord(domainId: string, recordId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // 检查权限 - 需要 edit 权限
  const permCheck = await checkRecordPermission(session.user.id, domainId, "edit");
  if (!permCheck.allowed) {
    return { success: false, error: "Permission denied" };
  }

  try {
    const { domain, provider } = await getProviderForDomain(domainId);

    // Get local record to find remote ID
    const [localRecord] = await db
      .select()
      .from(records)
      .where(and(eq(records.id, recordId), eq(records.domainId, domainId)));

    if (!localRecord) {
      return { success: false, error: "Record not found" };
    }

    // Delete from provider
    await provider.deleteRecord(domain.remoteId, localRecord.remoteId);

    // Delete from local database
    await db.delete(records).where(eq(records.id, recordId));

    revalidatePath(`/domains/${domainId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete record",
    };
  }
}
