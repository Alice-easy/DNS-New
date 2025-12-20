"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { recordChanges, users, domains } from "@/lib/db/schema";
import { eq, desc, and, gte, sql, or, like, inArray } from "drizzle-orm";
import { getUserDomains } from "@/lib/permissions";

export type ChangeTypeFilter = "added" | "modified" | "deleted";

interface GetRecordChangesOptions {
  page?: number;
  limit?: number;
  domainId?: string;
  changeType?: ChangeTypeFilter;
  days?: number;
  search?: string;
}

/**
 * Get record changes list with filtering and pagination
 */
export async function getRecordChanges(options?: GetRecordChangesOptions) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const page = options?.page || 1;
  const limit = options?.limit || 50;
  const offset = (page - 1) * limit;

  // Get user's accessible domains
  const userDomains = await getUserDomains(session.user.id);
  const accessibleDomainIds = userDomains.map((d) => d.domain.id);

  if (accessibleDomainIds.length === 0) {
    return {
      changes: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
    };
  }

  // Build query conditions
  const conditions = [inArray(recordChanges.domainId, accessibleDomainIds)];

  if (options?.domainId) {
    conditions.push(eq(recordChanges.domainId, options.domainId));
  }

  if (options?.changeType) {
    conditions.push(eq(recordChanges.changeType, options.changeType));
  }

  if (options?.days) {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - options.days);
    conditions.push(gte(recordChanges.createdAt, daysAgo));
  }

  if (options?.search) {
    const searchCondition = or(
      like(recordChanges.recordName, `%${options.search}%`),
      like(recordChanges.recordType, `%${options.search}%`)
    );
    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  const whereClause = and(...conditions);

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(recordChanges)
    .where(whereClause);

  // Get change records
  const changes = await db
    .select({
      id: recordChanges.id,
      domainId: recordChanges.domainId,
      domainName: domains.name,
      recordId: recordChanges.recordId,
      remoteId: recordChanges.remoteId,
      changeType: recordChanges.changeType,
      recordType: recordChanges.recordType,
      recordName: recordChanges.recordName,
      previousValue: recordChanges.previousValue,
      currentValue: recordChanges.currentValue,
      changedFields: recordChanges.changedFields,
      syncBatchId: recordChanges.syncBatchId,
      userId: recordChanges.userId,
      userName: users.name,
      createdAt: recordChanges.createdAt,
    })
    .from(recordChanges)
    .leftJoin(users, eq(recordChanges.userId, users.id))
    .leftJoin(domains, eq(recordChanges.domainId, domains.id))
    .where(whereClause)
    .orderBy(desc(recordChanges.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    changes: changes.map((change) => ({
      ...change,
      previousValue: change.previousValue
        ? JSON.parse(change.previousValue)
        : null,
      currentValue: change.currentValue
        ? JSON.parse(change.currentValue)
        : null,
      changedFields: change.changedFields
        ? JSON.parse(change.changedFields)
        : null,
    })),
    pagination: {
      page,
      limit,
      total: Number(count),
      totalPages: Math.ceil(Number(count) / limit),
    },
  };
}

/**
 * Get change statistics for the last N days
 */
export async function getChangeStats(days: number = 7) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Get user's accessible domains
  const userDomains = await getUserDomains(session.user.id);
  const accessibleDomainIds = userDomains.map((d) => d.domain.id);

  if (accessibleDomainIds.length === 0) {
    return { total: 0, added: 0, modified: 0, deleted: 0 };
  }

  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - days);

  const [stats] = await db
    .select({
      total: sql<number>`count(*)`,
      added: sql<number>`sum(case when change_type = 'added' then 1 else 0 end)`,
      modified: sql<number>`sum(case when change_type = 'modified' then 1 else 0 end)`,
      deleted: sql<number>`sum(case when change_type = 'deleted' then 1 else 0 end)`,
    })
    .from(recordChanges)
    .where(
      and(
        inArray(recordChanges.domainId, accessibleDomainIds),
        gte(recordChanges.createdAt, daysAgo)
      )
    );

  return {
    total: Number(stats.total) || 0,
    added: Number(stats.added) || 0,
    modified: Number(stats.modified) || 0,
    deleted: Number(stats.deleted) || 0,
  };
}

/**
 * Get user's accessible domains for filtering
 */
export async function getAccessibleDomains() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const userDomains = await getUserDomains(session.user.id);
  return userDomains.map((d) => ({
    id: d.domain.id,
    name: d.domain.name,
  }));
}
