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
import type { CreateRecordInput, UpdateRecordInput, DNSRecordType } from "@/lib/providers/types";
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
      line: remoteRecord.line ?? null,
      lineId: remoteRecord.lineId ?? null,
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
        line: remoteRecord.line ?? null,
        lineId: remoteRecord.lineId ?? null,
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

// Type for exported record (uses string for type to allow import from external sources)
export interface ExportedRecord {
  type: string;
  name: string;
  content: string;
  ttl: number;
  priority?: number;
  proxied?: boolean;
}

// Valid DNS record types for validation
const VALID_RECORD_TYPES: DNSRecordType[] = ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV", "CAA", "PTR"];

function isValidRecordType(type: string): type is DNSRecordType {
  return VALID_RECORD_TYPES.includes(type.toUpperCase() as DNSRecordType);
}

// Export records for a domain
export async function exportRecords(
  domainId: string,
  format: "json" | "csv" = "json"
): Promise<{ success: boolean; data?: string; filename?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // 检查权限 - 只读权限即可
  const permCheck = await checkRecordPermission(session.user.id, domainId, "readonly");
  if (!permCheck.allowed) {
    return { success: false, error: "Permission denied" };
  }

  try {
    // Get domain info
    const [domain] = await db
      .select({ name: domains.name })
      .from(domains)
      .where(eq(domains.id, domainId));

    if (!domain) {
      return { success: false, error: "Domain not found" };
    }

    // Get all records for the domain
    const domainRecords = await db
      .select({
        type: records.type,
        name: records.name,
        content: records.content,
        ttl: records.ttl,
        priority: records.priority,
        proxied: records.proxied,
      })
      .from(records)
      .where(eq(records.domainId, domainId));

    const exportData: ExportedRecord[] = domainRecords.map((r) => ({
      type: r.type,
      name: r.name,
      content: r.content,
      ttl: r.ttl,
      priority: r.priority ?? undefined,
      proxied: r.proxied ?? undefined,
    }));

    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `${domain.name}-dns-records-${timestamp}`;

    if (format === "json") {
      return {
        success: true,
        data: JSON.stringify(exportData, null, 2),
        filename: `${filename}.json`,
      };
    } else {
      // CSV format
      const headers = ["type", "name", "content", "ttl", "priority", "proxied"];
      const csvRows = [
        headers.join(","),
        ...exportData.map((r) =>
          [
            r.type,
            `"${r.name}"`,
            `"${r.content.replace(/"/g, '""')}"`,
            r.ttl,
            r.priority ?? "",
            r.proxied ?? "",
          ].join(",")
        ),
      ];
      return {
        success: true,
        data: csvRows.join("\n"),
        filename: `${filename}.csv`,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to export records",
    };
  }
}

// Import records for a domain
export async function importRecords(
  domainId: string,
  recordsData: ExportedRecord[]
): Promise<{ success: boolean; imported: number; failed: number; errors: string[] }> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // 检查权限 - 需要 edit 权限
  const permCheck = await checkRecordPermission(session.user.id, domainId, "edit");
  if (!permCheck.allowed) {
    return { success: false, imported: 0, failed: 0, errors: ["Permission denied"] };
  }

  let imported = 0;
  let failed = 0;
  const errors: string[] = [];

  try {
    const { domain, provider } = await getProviderForDomain(domainId);

    for (const recordData of recordsData) {
      try {
        // Validate record type
        const recordType = recordData.type.toUpperCase();
        if (!isValidRecordType(recordType)) {
          errors.push(`${recordData.name}: Invalid record type "${recordData.type}"`);
          failed++;
          continue;
        }

        // Validate each record
        const validation = validateDNSRecord({
          type: recordType,
          name: recordData.name,
          content: recordData.content,
          ttl: recordData.ttl,
          priority: recordData.priority,
        });

        if (!validation.valid) {
          errors.push(`${recordData.name}: ${validation.error}`);
          failed++;
          continue;
        }

        // Create record on provider
        const input: CreateRecordInput = {
          type: recordType,
          name: recordData.name,
          content: recordData.content,
          ttl: recordData.ttl,
          priority: recordData.priority,
          proxied: recordData.proxied,
        };

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

        imported++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        errors.push(`${recordData.name}: ${errorMsg}`);
        failed++;
      }
    }

    revalidatePath(`/domains/${domainId}`);
    return { success: true, imported, failed, errors };
  } catch (error) {
    return {
      success: false,
      imported,
      failed,
      errors: [error instanceof Error ? error.message : "Failed to import records"],
    };
  }
}

// 获取域名可用的解析线路列表
export async function getDomainLines(domainId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // 检查权限 - 只读权限即可
  const permCheck = await checkRecordPermission(session.user.id, domainId, "readonly");
  if (!permCheck.allowed) {
    return { success: false, error: "Permission denied", lines: [] };
  }

  try {
    const { domain, provider } = await getProviderForDomain(domainId);

    // 检查 provider 是否支持线路功能
    if (!provider.listLines) {
      // 返回默认线路（适用于不支持智能解析的服务商，如 Cloudflare）
      return {
        success: true,
        lines: [{ id: "default", name: "默认" }],
        supportsLines: false,
      };
    }

    const lines = await provider.listLines(domain.remoteId);
    return {
      success: true,
      lines,
      supportsLines: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get lines",
      lines: [],
    };
  }
}

// 获取服务商是否支持线路功能
export async function getProviderFeatures(domainId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    const { provider } = await getProviderForDomain(domainId);
    return {
      success: true,
      features: {
        geoRouting: provider.meta.features.geoRouting ?? false,
        proxied: provider.meta.features.proxied ?? false,
        loadBalancing: provider.meta.features.loadBalancing ?? false,
      },
      providerName: provider.meta.name,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get provider features",
    };
  }
}
