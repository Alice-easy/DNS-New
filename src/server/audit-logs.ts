"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLogs, users, domains, providers } from "@/lib/db/schema";
import { eq, desc, and, gte, sql, or, like } from "drizzle-orm";
import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { isAdmin } from "@/lib/permissions";

export type AuditAction = "create" | "update" | "delete" | "sync" | "import" | "export";
export type ResourceType = "provider" | "domain" | "record" | "user" | "share";

interface LogAuditParams {
  action: AuditAction;
  resourceType: ResourceType;
  resourceId: string;
  details?: Record<string, unknown>;
}

// Log an audit event
export async function logAudit(params: LogAuditParams) {
  const session = await auth();
  if (!session?.user?.id) return;

  const headersList = await headers();
  const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";
  const userAgent = headersList.get("user-agent") || "unknown";

  try {
    await db.insert(auditLogs).values({
      id: nanoid(),
      userId: session.user.id,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      details: params.details ? JSON.stringify(params.details) : null,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error("Failed to log audit event:", error);
  }
}

// Get audit logs with pagination
export async function getAuditLogs(options?: {
  page?: number;
  limit?: number;
  action?: AuditAction;
  resourceType?: ResourceType;
  userId?: string;
  search?: string;
  days?: number;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const page = options?.page || 1;
  const limit = options?.limit || 50;
  const offset = (page - 1) * limit;

  // Build where conditions
  const conditions = [];

  // Non-admin users can only see their own logs
  const userIsAdmin = await isAdmin(session.user.id);
  if (!userIsAdmin) {
    conditions.push(eq(auditLogs.userId, session.user.id));
  } else if (options?.userId) {
    conditions.push(eq(auditLogs.userId, options.userId));
  }

  if (options?.action) {
    conditions.push(eq(auditLogs.action, options.action));
  }

  if (options?.resourceType) {
    conditions.push(eq(auditLogs.resourceType, options.resourceType));
  }

  if (options?.days) {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - options.days);
    conditions.push(gte(auditLogs.createdAt, daysAgo));
  }

  if (options?.search) {
    conditions.push(
      or(
        like(auditLogs.resourceId, `%${options.search}%`),
        like(auditLogs.details, `%${options.search}%`)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(auditLogs)
    .where(whereClause);

  // Get logs with user info
  const logs = await db
    .select({
      id: auditLogs.id,
      userId: auditLogs.userId,
      userName: users.name,
      userEmail: users.email,
      action: auditLogs.action,
      resourceType: auditLogs.resourceType,
      resourceId: auditLogs.resourceId,
      details: auditLogs.details,
      ipAddress: auditLogs.ipAddress,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .where(whereClause)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    logs: logs.map((log) => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
    })),
    pagination: {
      page,
      limit,
      total: Number(count),
      totalPages: Math.ceil(Number(count) / limit),
    },
  };
}

// Get audit log statistics
export async function getAuditStats() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const userIsAdmin = await isAdmin(session.user.id);
  const userCondition = userIsAdmin ? undefined : eq(auditLogs.userId, session.user.id);

  // Get stats for last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [stats] = await db
    .select({
      total: sql<number>`count(*)`,
      creates: sql<number>`sum(case when action = 'create' then 1 else 0 end)`,
      updates: sql<number>`sum(case when action = 'update' then 1 else 0 end)`,
      deletes: sql<number>`sum(case when action = 'delete' then 1 else 0 end)`,
      syncs: sql<number>`sum(case when action = 'sync' then 1 else 0 end)`,
    })
    .from(auditLogs)
    .where(userCondition ? and(userCondition, gte(auditLogs.createdAt, sevenDaysAgo)) : gte(auditLogs.createdAt, sevenDaysAgo));

  return {
    total: Number(stats.total) || 0,
    creates: Number(stats.creates) || 0,
    updates: Number(stats.updates) || 0,
    deletes: Number(stats.deletes) || 0,
    syncs: Number(stats.syncs) || 0,
  };
}

// Get resource name for display
export async function getResourceName(resourceType: ResourceType, resourceId: string): Promise<string> {
  try {
    switch (resourceType) {
      case "domain": {
        const [domain] = await db
          .select({ name: domains.name })
          .from(domains)
          .where(eq(domains.id, resourceId));
        return domain?.name || resourceId;
      }
      case "provider": {
        const [provider] = await db
          .select({ label: providers.label })
          .from(providers)
          .where(eq(providers.id, resourceId));
        return provider?.label || resourceId;
      }
      case "user": {
        const [user] = await db
          .select({ name: users.name, email: users.email })
          .from(users)
          .where(eq(users.id, resourceId));
        return user?.name || user?.email || resourceId;
      }
      default:
        return resourceId;
    }
  } catch {
    return resourceId;
  }
}
