"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  monitorTasks,
  monitorResults,
  domains,
  records,
  users,
} from "@/lib/db/schema";
import { eq, desc, and, gte, sql, inArray, lte } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { getUserDomains, checkDomainPermission, hasPermission } from "@/lib/permissions";
import { checkDNSRecord, type DNSRecordType } from "@/lib/dns-checker";

// ==================== Monitor Task Management ====================

interface CreateMonitorTaskInput {
  domainId: string;
  recordId: string;
  checkInterval?: number;
  checkAvailability?: boolean;
  checkLatency?: boolean;
  checkCorrectness?: boolean;
}

/**
 * Create a new monitor task
 */
export async function createMonitorTask(input: CreateMonitorTaskInput) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Check permission - need "full" permission
  const permission = await checkDomainPermission(session.user.id, input.domainId);
  if (!permission || !hasPermission(permission.permission, "full")) {
    return { success: false, error: "Permission denied" };
  }

  // Verify record belongs to domain
  const [record] = await db
    .select()
    .from(records)
    .where(
      and(eq(records.id, input.recordId), eq(records.domainId, input.domainId))
    );

  if (!record) {
    return { success: false, error: "Record not found" };
  }

  // Check if task already exists for this record
  const [existingTask] = await db
    .select()
    .from(monitorTasks)
    .where(eq(monitorTasks.recordId, input.recordId));

  if (existingTask) {
    return { success: false, error: "Monitor task already exists for this record" };
  }

  const now = new Date();
  const taskId = nanoid();

  await db.insert(monitorTasks).values({
    id: taskId,
    domainId: input.domainId,
    recordId: input.recordId,
    enabled: true,
    checkInterval: input.checkInterval || 300,
    checkAvailability: input.checkAvailability ?? true,
    checkLatency: input.checkLatency ?? true,
    checkCorrectness: input.checkCorrectness ?? true,
    nextCheckAt: now,
    createdBy: session.user.id,
  });

  revalidatePath("/monitoring");
  return { success: true, taskId };
}

/**
 * Update a monitor task
 */
export async function updateMonitorTask(
  taskId: string,
  updates: {
    enabled?: boolean;
    checkInterval?: number;
    checkAvailability?: boolean;
    checkLatency?: boolean;
    checkCorrectness?: boolean;
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Get task to check permission
  const [task] = await db
    .select()
    .from(monitorTasks)
    .where(eq(monitorTasks.id, taskId));

  if (!task) {
    return { success: false, error: "Task not found" };
  }

  // Check permission
  const permission = await checkDomainPermission(session.user.id, task.domainId);
  if (!permission || !hasPermission(permission.permission, "full")) {
    return { success: false, error: "Permission denied" };
  }

  await db
    .update(monitorTasks)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(monitorTasks.id, taskId));

  revalidatePath("/monitoring");
  return { success: true };
}

/**
 * Delete a monitor task
 */
export async function deleteMonitorTask(taskId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Get task to check permission
  const [task] = await db
    .select()
    .from(monitorTasks)
    .where(eq(monitorTasks.id, taskId));

  if (!task) {
    return { success: false, error: "Task not found" };
  }

  // Check permission
  const permission = await checkDomainPermission(session.user.id, task.domainId);
  if (!permission || !hasPermission(permission.permission, "full")) {
    return { success: false, error: "Permission denied" };
  }

  await db.delete(monitorTasks).where(eq(monitorTasks.id, taskId));

  revalidatePath("/monitoring");
  return { success: true };
}

/**
 * Get all monitor tasks for current user
 */
export async function getMonitorTasks() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Get user's accessible domains
  const userDomains = await getUserDomains(session.user.id);
  const accessibleDomainIds = userDomains.map((d) => d.domain.id);

  if (accessibleDomainIds.length === 0) {
    return [];
  }

  const tasks = await db
    .select({
      id: monitorTasks.id,
      domainId: monitorTasks.domainId,
      domainName: domains.name,
      recordId: monitorTasks.recordId,
      recordType: records.type,
      recordName: records.name,
      recordContent: records.content,
      enabled: monitorTasks.enabled,
      checkInterval: monitorTasks.checkInterval,
      checkAvailability: monitorTasks.checkAvailability,
      checkLatency: monitorTasks.checkLatency,
      checkCorrectness: monitorTasks.checkCorrectness,
      lastCheckAt: monitorTasks.lastCheckAt,
      nextCheckAt: monitorTasks.nextCheckAt,
      createdAt: monitorTasks.createdAt,
    })
    .from(monitorTasks)
    .innerJoin(domains, eq(monitorTasks.domainId, domains.id))
    .innerJoin(records, eq(monitorTasks.recordId, records.id))
    .where(inArray(monitorTasks.domainId, accessibleDomainIds))
    .orderBy(desc(monitorTasks.createdAt));

  // Get latest result for each task
  const tasksWithResults = await Promise.all(
    tasks.map(async (task) => {
      const [latestResult] = await db
        .select()
        .from(monitorResults)
        .where(eq(monitorResults.taskId, task.id))
        .orderBy(desc(monitorResults.checkedAt))
        .limit(1);

      return {
        ...task,
        lastResult: latestResult || null,
      };
    })
  );

  return tasksWithResults;
}

// ==================== Monitor Check Execution ====================

/**
 * Execute a single monitor check
 */
export async function executeMonitorCheck(taskId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Get task with record and domain info
  const [task] = await db
    .select({
      id: monitorTasks.id,
      domainId: monitorTasks.domainId,
      domainName: domains.name,
      recordId: monitorTasks.recordId,
      recordType: records.type,
      recordName: records.name,
      recordContent: records.content,
      checkAvailability: monitorTasks.checkAvailability,
      checkLatency: monitorTasks.checkLatency,
      checkCorrectness: monitorTasks.checkCorrectness,
      checkInterval: monitorTasks.checkInterval,
    })
    .from(monitorTasks)
    .innerJoin(domains, eq(monitorTasks.domainId, domains.id))
    .innerJoin(records, eq(monitorTasks.recordId, records.id))
    .where(eq(monitorTasks.id, taskId));

  if (!task) {
    return { success: false, error: "Task not found" };
  }

  // Check permission
  const permission = await checkDomainPermission(session.user.id, task.domainId);
  if (!permission) {
    return { success: false, error: "Permission denied" };
  }

  // Execute DNS check
  const result = await checkDNSRecord(
    task.recordType as DNSRecordType,
    task.recordName,
    task.domainName,
    task.recordContent,
    {
      checkAvailability: task.checkAvailability ?? true,
      checkLatency: task.checkLatency ?? true,
      checkCorrectness: task.checkCorrectness ?? true,
    }
  );

  const now = new Date();

  // Save result
  await db.insert(monitorResults).values({
    id: nanoid(),
    taskId: task.id,
    domainId: task.domainId,
    recordId: task.recordId,
    status: result.status,
    isAvailable: result.isAvailable,
    latency: result.latency ?? null,
    isCorrect: result.isCorrect ?? null,
    expectedValue: result.expectedValue,
    actualValue: result.actualValue ?? null,
    errorMessage: result.errorMessage ?? null,
    checkedAt: now,
  });

  // Update task timestamps
  const nextCheckAt = new Date(now.getTime() + (task.checkInterval || 300) * 1000);
  await db
    .update(monitorTasks)
    .set({
      lastCheckAt: now,
      nextCheckAt,
      updatedAt: now,
    })
    .where(eq(monitorTasks.id, taskId));

  revalidatePath("/monitoring");
  return { success: true, result };
}

/**
 * Execute checks for all enabled tasks that are due
 */
export async function executeDueMonitorChecks() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Only admins can run batch checks
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id));

  if (user?.role !== "admin") {
    return { success: false, error: "Admin only" };
  }

  const now = new Date();

  // Get all due tasks (nextCheckAt <= now)
  const dueTasks = await db
    .select({
      id: monitorTasks.id,
    })
    .from(monitorTasks)
    .where(
      and(
        eq(monitorTasks.enabled, true),
        lte(monitorTasks.nextCheckAt, now)
      )
    );

  // Execute checks
  const results = await Promise.all(
    dueTasks.map((task) => executeMonitorCheck(task.id))
  );

  return {
    success: true,
    executed: results.length,
    results,
  };
}

// ==================== Monitor Results Query ====================

interface GetMonitorResultsOptions {
  taskId?: string;
  domainId?: string;
  days?: number;
  limit?: number;
}

/**
 * Get monitor results history
 */
export async function getMonitorResults(options?: GetMonitorResultsOptions) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const limit = options?.limit || 100;

  // Get user's accessible domains
  const userDomains = await getUserDomains(session.user.id);
  const accessibleDomainIds = userDomains.map((d) => d.domain.id);

  if (accessibleDomainIds.length === 0) {
    return [];
  }

  const conditions = [inArray(monitorResults.domainId, accessibleDomainIds)];

  if (options?.taskId) {
    conditions.push(eq(monitorResults.taskId, options.taskId));
  }

  if (options?.domainId) {
    conditions.push(eq(monitorResults.domainId, options.domainId));
  }

  if (options?.days) {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - options.days);
    conditions.push(gte(monitorResults.checkedAt, daysAgo));
  }

  const results = await db
    .select({
      id: monitorResults.id,
      taskId: monitorResults.taskId,
      domainId: monitorResults.domainId,
      domainName: domains.name,
      recordId: monitorResults.recordId,
      recordType: records.type,
      recordName: records.name,
      status: monitorResults.status,
      isAvailable: monitorResults.isAvailable,
      latency: monitorResults.latency,
      isCorrect: monitorResults.isCorrect,
      expectedValue: monitorResults.expectedValue,
      actualValue: monitorResults.actualValue,
      errorMessage: monitorResults.errorMessage,
      checkedAt: monitorResults.checkedAt,
    })
    .from(monitorResults)
    .innerJoin(domains, eq(monitorResults.domainId, domains.id))
    .innerJoin(records, eq(monitorResults.recordId, records.id))
    .where(and(...conditions))
    .orderBy(desc(monitorResults.checkedAt))
    .limit(limit);

  return results;
}

/**
 * Get monitor statistics
 */
export async function getMonitorStats(days: number = 7) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Get user's accessible domains
  const userDomains = await getUserDomains(session.user.id);
  const accessibleDomainIds = userDomains.map((d) => d.domain.id);

  if (accessibleDomainIds.length === 0) {
    return {
      totalTasks: 0,
      enabledTasks: 0,
      totalChecks: 0,
      successRate: 0,
      avgLatency: 0,
    };
  }

  // Get task counts
  const [taskStats] = await db
    .select({
      totalTasks: sql<number>`count(*)`,
      enabledTasks: sql<number>`sum(case when enabled = 1 then 1 else 0 end)`,
    })
    .from(monitorTasks)
    .where(inArray(monitorTasks.domainId, accessibleDomainIds));

  // Get check stats
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - days);

  const [checkStats] = await db
    .select({
      totalChecks: sql<number>`count(*)`,
      successCount: sql<number>`sum(case when status = 'success' then 1 else 0 end)`,
      avgLatency: sql<number>`avg(latency)`,
    })
    .from(monitorResults)
    .where(
      and(
        inArray(monitorResults.domainId, accessibleDomainIds),
        gte(monitorResults.checkedAt, daysAgo)
      )
    );

  const totalChecks = Number(checkStats.totalChecks) || 0;
  const successCount = Number(checkStats.successCount) || 0;

  return {
    totalTasks: Number(taskStats.totalTasks) || 0,
    enabledTasks: Number(taskStats.enabledTasks) || 0,
    totalChecks,
    successRate: totalChecks > 0 ? Math.round((successCount / totalChecks) * 100) : 0,
    avgLatency: Math.round(Number(checkStats.avgLatency) || 0),
  };
}

/**
 * Get records available for monitoring (not yet monitored)
 */
export async function getAvailableRecordsForMonitoring(domainId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Check permission
  const permission = await checkDomainPermission(session.user.id, domainId);
  if (!permission) {
    return [];
  }

  // Get records that don't have a monitor task yet
  const allRecords = await db
    .select()
    .from(records)
    .where(eq(records.domainId, domainId));

  const existingTasks = await db
    .select({ recordId: monitorTasks.recordId })
    .from(monitorTasks)
    .where(eq(monitorTasks.domainId, domainId));

  const monitoredRecordIds = new Set(existingTasks.map((t) => t.recordId));

  return allRecords.filter((record) => !monitoredRecordIds.has(record.id));
}
