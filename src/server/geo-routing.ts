"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  geoRoutingRules,
  geoRoutingTargets,
  domains,
} from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { checkDomainPermission, hasPermission, getUserDomains } from "@/lib/permissions";
import type { RecordType, LoadBalancing } from "@/lib/geo-constants";

// Re-export types from geo-constants
export type { RecordType, LoadBalancing } from "@/lib/geo-constants";

interface CreateRuleInput {
  domainId: string;
  name: string;
  recordName: string;
  recordType?: RecordType;
  defaultTarget: string;
  defaultTtl?: number;
  loadBalancing?: LoadBalancing;
  healthCheck?: boolean;
  healthCheckInterval?: number;
}

interface CreateTargetInput {
  ruleId: string;
  region: string;
  country?: string;
  target: string;
  ttl?: number;
  weight?: number;
  priority?: number;
}

// ==================== Geo Routing Rules ====================

/**
 * Create a new geo routing rule
 */
export async function createGeoRoutingRule(input: CreateRuleInput) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Check permission - need "full" permission
  const permission = await checkDomainPermission(session.user.id, input.domainId);
  if (!permission || !hasPermission(permission.permission, "full")) {
    return { success: false, error: "Permission denied" };
  }

  const ruleId = nanoid();

  await db.insert(geoRoutingRules).values({
    id: ruleId,
    domainId: input.domainId,
    name: input.name,
    recordName: input.recordName,
    recordType: input.recordType || "A",
    defaultTarget: input.defaultTarget,
    defaultTtl: input.defaultTtl || 300,
    loadBalancing: input.loadBalancing || "round_robin",
    healthCheck: input.healthCheck || false,
    healthCheckInterval: input.healthCheckInterval || 60,
    createdBy: session.user.id,
  });

  revalidatePath("/geo-dns");
  return { success: true, ruleId };
}

/**
 * Update a geo routing rule
 */
export async function updateGeoRoutingRule(
  ruleId: string,
  updates: {
    name?: string;
    enabled?: boolean;
    defaultTarget?: string;
    defaultTtl?: number;
    loadBalancing?: LoadBalancing;
    healthCheck?: boolean;
    healthCheckInterval?: number;
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Get rule to check permission
  const [rule] = await db
    .select()
    .from(geoRoutingRules)
    .where(eq(geoRoutingRules.id, ruleId));

  if (!rule) {
    return { success: false, error: "Rule not found" };
  }

  // Check permission
  const permission = await checkDomainPermission(session.user.id, rule.domainId);
  if (!permission || !hasPermission(permission.permission, "full")) {
    return { success: false, error: "Permission denied" };
  }

  await db
    .update(geoRoutingRules)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(geoRoutingRules.id, ruleId));

  revalidatePath("/geo-dns");
  return { success: true };
}

/**
 * Delete a geo routing rule
 */
export async function deleteGeoRoutingRule(ruleId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Get rule to check permission
  const [rule] = await db
    .select()
    .from(geoRoutingRules)
    .where(eq(geoRoutingRules.id, ruleId));

  if (!rule) {
    return { success: false, error: "Rule not found" };
  }

  // Check permission
  const permission = await checkDomainPermission(session.user.id, rule.domainId);
  if (!permission || !hasPermission(permission.permission, "full")) {
    return { success: false, error: "Permission denied" };
  }

  await db.delete(geoRoutingRules).where(eq(geoRoutingRules.id, ruleId));

  revalidatePath("/geo-dns");
  return { success: true };
}

/**
 * Get all geo routing rules for current user
 */
export async function getGeoRoutingRules() {
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

  const rules = await db
    .select({
      id: geoRoutingRules.id,
      domainId: geoRoutingRules.domainId,
      domainName: domains.name,
      name: geoRoutingRules.name,
      recordName: geoRoutingRules.recordName,
      recordType: geoRoutingRules.recordType,
      enabled: geoRoutingRules.enabled,
      defaultTarget: geoRoutingRules.defaultTarget,
      defaultTtl: geoRoutingRules.defaultTtl,
      loadBalancing: geoRoutingRules.loadBalancing,
      healthCheck: geoRoutingRules.healthCheck,
      healthCheckInterval: geoRoutingRules.healthCheckInterval,
      createdAt: geoRoutingRules.createdAt,
    })
    .from(geoRoutingRules)
    .innerJoin(domains, eq(geoRoutingRules.domainId, domains.id))
    .where(sql`${geoRoutingRules.domainId} IN ${accessibleDomainIds}`)
    .orderBy(desc(geoRoutingRules.createdAt));

  // Get targets for each rule
  const rulesWithTargets = await Promise.all(
    rules.map(async (rule) => {
      const targets = await db
        .select()
        .from(geoRoutingTargets)
        .where(eq(geoRoutingTargets.ruleId, rule.id))
        .orderBy(geoRoutingTargets.priority);

      return {
        ...rule,
        targets,
      };
    })
  );

  return rulesWithTargets;
}

/**
 * Get a single geo routing rule with targets
 */
export async function getGeoRoutingRule(ruleId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const [rule] = await db
    .select({
      id: geoRoutingRules.id,
      domainId: geoRoutingRules.domainId,
      domainName: domains.name,
      name: geoRoutingRules.name,
      recordName: geoRoutingRules.recordName,
      recordType: geoRoutingRules.recordType,
      enabled: geoRoutingRules.enabled,
      defaultTarget: geoRoutingRules.defaultTarget,
      defaultTtl: geoRoutingRules.defaultTtl,
      loadBalancing: geoRoutingRules.loadBalancing,
      healthCheck: geoRoutingRules.healthCheck,
      healthCheckInterval: geoRoutingRules.healthCheckInterval,
      createdAt: geoRoutingRules.createdAt,
    })
    .from(geoRoutingRules)
    .innerJoin(domains, eq(geoRoutingRules.domainId, domains.id))
    .where(eq(geoRoutingRules.id, ruleId));

  if (!rule) {
    return null;
  }

  // Check permission
  const permission = await checkDomainPermission(session.user.id, rule.domainId);
  if (!permission) {
    return null;
  }

  const targets = await db
    .select()
    .from(geoRoutingTargets)
    .where(eq(geoRoutingTargets.ruleId, ruleId))
    .orderBy(geoRoutingTargets.priority);

  return { ...rule, targets };
}

// ==================== Geo Routing Targets ====================

/**
 * Add a target to a geo routing rule
 */
export async function addGeoRoutingTarget(input: CreateTargetInput) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Get rule to check permission
  const [rule] = await db
    .select()
    .from(geoRoutingRules)
    .where(eq(geoRoutingRules.id, input.ruleId));

  if (!rule) {
    return { success: false, error: "Rule not found" };
  }

  // Check permission
  const permission = await checkDomainPermission(session.user.id, rule.domainId);
  if (!permission || !hasPermission(permission.permission, "full")) {
    return { success: false, error: "Permission denied" };
  }

  const targetId = nanoid();

  await db.insert(geoRoutingTargets).values({
    id: targetId,
    ruleId: input.ruleId,
    region: input.region,
    country: input.country,
    target: input.target,
    ttl: input.ttl || 300,
    weight: input.weight || 100,
    priority: input.priority || 0,
  });

  revalidatePath("/geo-dns");
  return { success: true, targetId };
}

/**
 * Update a geo routing target
 */
export async function updateGeoRoutingTarget(
  targetId: string,
  updates: {
    region?: string;
    country?: string;
    target?: string;
    ttl?: number;
    weight?: number;
    priority?: number;
    enabled?: boolean;
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Get target and rule to check permission
  const [targetData] = await db
    .select({
      target: geoRoutingTargets,
      domainId: geoRoutingRules.domainId,
    })
    .from(geoRoutingTargets)
    .innerJoin(geoRoutingRules, eq(geoRoutingTargets.ruleId, geoRoutingRules.id))
    .where(eq(geoRoutingTargets.id, targetId));

  if (!targetData) {
    return { success: false, error: "Target not found" };
  }

  // Check permission
  const permission = await checkDomainPermission(session.user.id, targetData.domainId);
  if (!permission || !hasPermission(permission.permission, "full")) {
    return { success: false, error: "Permission denied" };
  }

  await db
    .update(geoRoutingTargets)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(geoRoutingTargets.id, targetId));

  revalidatePath("/geo-dns");
  return { success: true };
}

/**
 * Delete a geo routing target
 */
export async function deleteGeoRoutingTarget(targetId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Get target and rule to check permission
  const [targetData] = await db
    .select({
      target: geoRoutingTargets,
      domainId: geoRoutingRules.domainId,
    })
    .from(geoRoutingTargets)
    .innerJoin(geoRoutingRules, eq(geoRoutingTargets.ruleId, geoRoutingRules.id))
    .where(eq(geoRoutingTargets.id, targetId));

  if (!targetData) {
    return { success: false, error: "Target not found" };
  }

  // Check permission
  const permission = await checkDomainPermission(session.user.id, targetData.domainId);
  if (!permission || !hasPermission(permission.permission, "full")) {
    return { success: false, error: "Permission denied" };
  }

  await db.delete(geoRoutingTargets).where(eq(geoRoutingTargets.id, targetId));

  revalidatePath("/geo-dns");
  return { success: true };
}

// ==================== Statistics ====================

/**
 * Get geo routing statistics
 */
export async function getGeoRoutingStats() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Get user's accessible domains
  const userDomains = await getUserDomains(session.user.id);
  const accessibleDomainIds = userDomains.map((d) => d.domain.id);

  if (accessibleDomainIds.length === 0) {
    return {
      totalRules: 0,
      enabledRules: 0,
      totalTargets: 0,
      healthyTargets: 0,
    };
  }

  const [ruleStats] = await db
    .select({
      totalRules: sql<number>`count(*)`,
      enabledRules: sql<number>`sum(case when enabled = 1 then 1 else 0 end)`,
    })
    .from(geoRoutingRules)
    .where(sql`${geoRoutingRules.domainId} IN ${accessibleDomainIds}`);

  const [targetStats] = await db
    .select({
      totalTargets: sql<number>`count(*)`,
      healthyTargets: sql<number>`sum(case when ${geoRoutingTargets.isHealthy} = 1 then 1 else 0 end)`,
    })
    .from(geoRoutingTargets)
    .innerJoin(geoRoutingRules, eq(geoRoutingTargets.ruleId, geoRoutingRules.id))
    .where(sql`${geoRoutingRules.domainId} IN ${accessibleDomainIds}`);

  return {
    totalRules: Number(ruleStats.totalRules) || 0,
    enabledRules: Number(ruleStats.enabledRules) || 0,
    totalTargets: Number(targetStats.totalTargets) || 0,
    healthyTargets: Number(targetStats.healthyTargets) || 0,
  };
}

/**
 * Get accessible domains for geo routing
 */
export async function getAccessibleDomainsForGeoRouting() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const userDomains = await getUserDomains(session.user.id);

  // Only return domains where user has full permission
  return userDomains
    .filter((d) => hasPermission(d.permission, "full"))
    .map((d) => ({
      id: d.domain.id,
      name: d.domain.name,
    }));
}
