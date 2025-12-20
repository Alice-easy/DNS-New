"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  alertRules,
  alertRuleChannels,
  notificationChannels,
  alertHistory,
  domains,
  records,
  monitorTasks,
  users,
} from "@/lib/db/schema";
import { eq, desc, and, inArray, sql, gte } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { getUserDomains } from "@/lib/permissions";

// ==================== Types ====================

export type TriggerType = "monitor_failed" | "monitor_latency" | "record_changed";
export type ChannelType = "email" | "webhook" | "telegram" | "discord";
export type AlertStatus = "triggered" | "resolved" | "acknowledged";
export type AlertSeverity = "info" | "warning" | "critical";

interface AlertConditions {
  domainId?: string;
  recordId?: string;
  taskId?: string;
  threshold?: number; // For latency alerts (ms)
  changeTypes?: string[]; // For record_changed: ["added", "modified", "deleted"]
}

interface ChannelConfig {
  email?: string;
  webhookUrl?: string;
  telegramChatId?: string;
  telegramBotToken?: string;
  discordWebhookUrl?: string;
}

// ==================== Notification Channels ====================

interface CreateChannelInput {
  name: string;
  type: ChannelType;
  config: ChannelConfig;
}

/**
 * Create a new notification channel
 */
export async function createNotificationChannel(input: CreateChannelInput) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const channelId = nanoid();

  await db.insert(notificationChannels).values({
    id: channelId,
    userId: session.user.id,
    name: input.name,
    type: input.type,
    config: JSON.stringify(input.config),
    enabled: true,
    verified: false,
  });

  revalidatePath("/alerts");
  return { success: true, channelId };
}

/**
 * Update a notification channel
 */
export async function updateNotificationChannel(
  channelId: string,
  updates: {
    name?: string;
    enabled?: boolean;
    config?: ChannelConfig;
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Check ownership
  const [channel] = await db
    .select()
    .from(notificationChannels)
    .where(eq(notificationChannels.id, channelId));

  if (!channel || channel.userId !== session.user.id) {
    return { success: false, error: "Channel not found or access denied" };
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.enabled !== undefined) updateData.enabled = updates.enabled;
  if (updates.config !== undefined) updateData.config = JSON.stringify(updates.config);

  await db
    .update(notificationChannels)
    .set(updateData)
    .where(eq(notificationChannels.id, channelId));

  revalidatePath("/alerts");
  return { success: true };
}

/**
 * Delete a notification channel
 */
export async function deleteNotificationChannel(channelId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Check ownership
  const [channel] = await db
    .select()
    .from(notificationChannels)
    .where(eq(notificationChannels.id, channelId));

  if (!channel || channel.userId !== session.user.id) {
    return { success: false, error: "Channel not found or access denied" };
  }

  await db.delete(notificationChannels).where(eq(notificationChannels.id, channelId));

  revalidatePath("/alerts");
  return { success: true };
}

/**
 * Get all notification channels for current user
 */
export async function getNotificationChannels() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const channels = await db
    .select()
    .from(notificationChannels)
    .where(eq(notificationChannels.userId, session.user.id))
    .orderBy(desc(notificationChannels.createdAt));

  return channels.map((channel) => ({
    ...channel,
    config: JSON.parse(channel.config) as ChannelConfig,
  }));
}

/**
 * Test a notification channel
 */
export async function testNotificationChannel(channelId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Check ownership
  const [channel] = await db
    .select()
    .from(notificationChannels)
    .where(eq(notificationChannels.id, channelId));

  if (!channel || channel.userId !== session.user.id) {
    return { success: false, error: "Channel not found or access denied" };
  }

  const config = JSON.parse(channel.config) as ChannelConfig;

  try {
    // Send test notification based on channel type
    const result = await sendNotification(
      channel.type as ChannelType,
      config,
      "🧪 测试通知 / Test Notification",
      "这是来自 DNS Manager 的测试通知。如果您收到此消息，说明通知渠道配置正确！\n\nThis is a test notification from DNS Manager. If you received this message, the notification channel is configured correctly!"
    );

    if (result.success) {
      // Mark as verified
      await db
        .update(notificationChannels)
        .set({ verified: true, lastTestAt: new Date(), updatedAt: new Date() })
        .where(eq(notificationChannels.id, channelId));
    }

    revalidatePath("/alerts");
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Test failed",
    };
  }
}

// ==================== Alert Rules ====================

interface CreateRuleInput {
  name: string;
  triggerType: TriggerType;
  conditions: AlertConditions;
  consecutiveFailures?: number;
  cooldownMinutes?: number;
  channelIds: string[];
}

/**
 * Create a new alert rule
 */
export async function createAlertRule(input: CreateRuleInput) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const ruleId = nanoid();

  // Create rule
  await db.insert(alertRules).values({
    id: ruleId,
    userId: session.user.id,
    name: input.name,
    enabled: true,
    triggerType: input.triggerType,
    conditions: JSON.stringify(input.conditions),
    consecutiveFailures: input.consecutiveFailures || 1,
    cooldownMinutes: input.cooldownMinutes || 30,
  });

  // Link channels
  if (input.channelIds.length > 0) {
    await db.insert(alertRuleChannels).values(
      input.channelIds.map((channelId) => ({
        id: nanoid(),
        ruleId,
        channelId,
      }))
    );
  }

  revalidatePath("/alerts");
  return { success: true, ruleId };
}

/**
 * Update an alert rule
 */
export async function updateAlertRule(
  ruleId: string,
  updates: {
    name?: string;
    enabled?: boolean;
    triggerType?: TriggerType;
    conditions?: AlertConditions;
    consecutiveFailures?: number;
    cooldownMinutes?: number;
    channelIds?: string[];
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Check ownership
  const [rule] = await db
    .select()
    .from(alertRules)
    .where(eq(alertRules.id, ruleId));

  if (!rule || rule.userId !== session.user.id) {
    return { success: false, error: "Rule not found or access denied" };
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.enabled !== undefined) updateData.enabled = updates.enabled;
  if (updates.triggerType !== undefined) updateData.triggerType = updates.triggerType;
  if (updates.conditions !== undefined) updateData.conditions = JSON.stringify(updates.conditions);
  if (updates.consecutiveFailures !== undefined) updateData.consecutiveFailures = updates.consecutiveFailures;
  if (updates.cooldownMinutes !== undefined) updateData.cooldownMinutes = updates.cooldownMinutes;

  await db.update(alertRules).set(updateData).where(eq(alertRules.id, ruleId));

  // Update channel links if provided
  if (updates.channelIds !== undefined) {
    // Remove existing links
    await db.delete(alertRuleChannels).where(eq(alertRuleChannels.ruleId, ruleId));

    // Add new links
    if (updates.channelIds.length > 0) {
      await db.insert(alertRuleChannels).values(
        updates.channelIds.map((channelId) => ({
          id: nanoid(),
          ruleId,
          channelId,
        }))
      );
    }
  }

  revalidatePath("/alerts");
  return { success: true };
}

/**
 * Delete an alert rule
 */
export async function deleteAlertRule(ruleId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Check ownership
  const [rule] = await db
    .select()
    .from(alertRules)
    .where(eq(alertRules.id, ruleId));

  if (!rule || rule.userId !== session.user.id) {
    return { success: false, error: "Rule not found or access denied" };
  }

  await db.delete(alertRules).where(eq(alertRules.id, ruleId));

  revalidatePath("/alerts");
  return { success: true };
}

/**
 * Get all alert rules for current user
 */
export async function getAlertRules() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const rules = await db
    .select()
    .from(alertRules)
    .where(eq(alertRules.userId, session.user.id))
    .orderBy(desc(alertRules.createdAt));

  // Get channel links for each rule
  const rulesWithChannels = await Promise.all(
    rules.map(async (rule) => {
      const links = await db
        .select({
          channelId: alertRuleChannels.channelId,
          channelName: notificationChannels.name,
          channelType: notificationChannels.type,
        })
        .from(alertRuleChannels)
        .innerJoin(notificationChannels, eq(alertRuleChannels.channelId, notificationChannels.id))
        .where(eq(alertRuleChannels.ruleId, rule.id));

      return {
        ...rule,
        conditions: JSON.parse(rule.conditions) as AlertConditions,
        channels: links,
      };
    })
  );

  return rulesWithChannels;
}

// ==================== Alert History ====================

interface GetAlertHistoryOptions {
  ruleId?: string;
  status?: AlertStatus;
  days?: number;
  limit?: number;
}

/**
 * Get alert history for current user
 */
export async function getAlertHistory(options?: GetAlertHistoryOptions) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const limit = options?.limit || 50;
  const conditions = [eq(alertHistory.userId, session.user.id)];

  if (options?.ruleId) {
    conditions.push(eq(alertHistory.ruleId, options.ruleId));
  }

  if (options?.status) {
    conditions.push(eq(alertHistory.status, options.status));
  }

  if (options?.days) {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - options.days);
    conditions.push(gte(alertHistory.triggeredAt, daysAgo));
  }

  const history = await db
    .select({
      id: alertHistory.id,
      ruleId: alertHistory.ruleId,
      status: alertHistory.status,
      severity: alertHistory.severity,
      title: alertHistory.title,
      message: alertHistory.message,
      domainId: alertHistory.domainId,
      domainName: domains.name,
      recordId: alertHistory.recordId,
      taskId: alertHistory.taskId,
      triggerData: alertHistory.triggerData,
      notificationsSent: alertHistory.notificationsSent,
      notificationsFailed: alertHistory.notificationsFailed,
      triggeredAt: alertHistory.triggeredAt,
      resolvedAt: alertHistory.resolvedAt,
      acknowledgedAt: alertHistory.acknowledgedAt,
    })
    .from(alertHistory)
    .leftJoin(domains, eq(alertHistory.domainId, domains.id))
    .where(and(...conditions))
    .orderBy(desc(alertHistory.triggeredAt))
    .limit(limit);

  return history;
}

/**
 * Acknowledge an alert
 */
export async function acknowledgeAlert(alertId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Check ownership
  const [alert] = await db
    .select()
    .from(alertHistory)
    .where(eq(alertHistory.id, alertId));

  if (!alert || alert.userId !== session.user.id) {
    return { success: false, error: "Alert not found or access denied" };
  }

  await db
    .update(alertHistory)
    .set({
      status: "acknowledged",
      acknowledgedAt: new Date(),
      acknowledgedBy: session.user.id,
    })
    .where(eq(alertHistory.id, alertId));

  revalidatePath("/alerts");
  return { success: true };
}

/**
 * Get alert statistics
 */
export async function getAlertStats(days: number = 7) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - days);

  const [stats] = await db
    .select({
      totalAlerts: sql<number>`count(*)`,
      triggeredCount: sql<number>`sum(case when status = 'triggered' then 1 else 0 end)`,
      acknowledgedCount: sql<number>`sum(case when status = 'acknowledged' then 1 else 0 end)`,
      resolvedCount: sql<number>`sum(case when status = 'resolved' then 1 else 0 end)`,
      criticalCount: sql<number>`sum(case when severity = 'critical' then 1 else 0 end)`,
      warningCount: sql<number>`sum(case when severity = 'warning' then 1 else 0 end)`,
    })
    .from(alertHistory)
    .where(
      and(
        eq(alertHistory.userId, session.user.id),
        gte(alertHistory.triggeredAt, daysAgo)
      )
    );

  const [ruleCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(alertRules)
    .where(eq(alertRules.userId, session.user.id));

  const [channelCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(notificationChannels)
    .where(eq(notificationChannels.userId, session.user.id));

  return {
    totalAlerts: Number(stats.totalAlerts) || 0,
    triggeredCount: Number(stats.triggeredCount) || 0,
    acknowledgedCount: Number(stats.acknowledgedCount) || 0,
    resolvedCount: Number(stats.resolvedCount) || 0,
    criticalCount: Number(stats.criticalCount) || 0,
    warningCount: Number(stats.warningCount) || 0,
    ruleCount: Number(ruleCount.count) || 0,
    channelCount: Number(channelCount.count) || 0,
  };
}

// ==================== Notification Sending ====================

/**
 * Send notification to a channel
 */
async function sendNotification(
  type: ChannelType,
  config: ChannelConfig,
  title: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  switch (type) {
    case "webhook":
      return sendWebhookNotification(config.webhookUrl!, title, message);
    case "discord":
      return sendDiscordNotification(config.discordWebhookUrl!, title, message);
    case "telegram":
      return sendTelegramNotification(
        config.telegramBotToken!,
        config.telegramChatId!,
        title,
        message
      );
    case "email":
      // Email requires SMTP configuration - placeholder for now
      return { success: false, error: "Email notifications not configured" };
    default:
      return { success: false, error: `Unknown channel type: ${type}` };
  }
}

async function sendWebhookNotification(
  webhookUrl: string,
  title: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        message,
        timestamp: new Date().toISOString(),
        source: "DNS Manager",
      }),
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Webhook failed",
    };
  }
}

async function sendDiscordNotification(
  webhookUrl: string,
  title: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title,
            description: message,
            color: 0xff6b6b, // Red color for alerts
            timestamp: new Date().toISOString(),
            footer: { text: "DNS Manager" },
          },
        ],
      }),
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Discord webhook failed",
    };
  }
}

async function sendTelegramNotification(
  botToken: string,
  chatId: string,
  title: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const text = `*${title}*\n\n${message}`;
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "Markdown",
        }),
      }
    );

    if (!response.ok) {
      const data = await response.json();
      return { success: false, error: data.description || `HTTP ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Telegram failed",
    };
  }
}

// ==================== Alert Triggering ====================

/**
 * Trigger an alert (called by monitoring or change detection)
 */
export async function triggerAlert(
  userId: string,
  ruleId: string,
  data: {
    severity: AlertSeverity;
    title: string;
    message: string;
    domainId?: string;
    recordId?: string;
    taskId?: string;
    triggerData?: Record<string, unknown>;
  }
) {
  // Get the rule to check cooldown
  const [rule] = await db
    .select()
    .from(alertRules)
    .where(eq(alertRules.id, ruleId));

  if (!rule || !rule.enabled) {
    return { success: false, error: "Rule not found or disabled" };
  }

  // Check cooldown
  if (rule.lastTriggeredAt) {
    const cooldownEnd = new Date(rule.lastTriggeredAt.getTime() + rule.cooldownMinutes * 60 * 1000);
    if (new Date() < cooldownEnd) {
      return { success: false, error: "Rule is in cooldown" };
    }
  }

  // Create alert history entry
  const alertId = nanoid();
  await db.insert(alertHistory).values({
    id: alertId,
    ruleId,
    userId,
    status: "triggered",
    severity: data.severity,
    title: data.title,
    message: data.message,
    domainId: data.domainId,
    recordId: data.recordId,
    taskId: data.taskId,
    triggerData: data.triggerData ? JSON.stringify(data.triggerData) : null,
  });

  // Update rule's lastTriggeredAt
  await db
    .update(alertRules)
    .set({ lastTriggeredAt: new Date(), updatedAt: new Date() })
    .where(eq(alertRules.id, ruleId));

  // Get channels for this rule
  const channels = await db
    .select({
      id: notificationChannels.id,
      type: notificationChannels.type,
      config: notificationChannels.config,
      enabled: notificationChannels.enabled,
    })
    .from(alertRuleChannels)
    .innerJoin(notificationChannels, eq(alertRuleChannels.channelId, notificationChannels.id))
    .where(
      and(
        eq(alertRuleChannels.ruleId, ruleId),
        eq(notificationChannels.enabled, true)
      )
    );

  // Send notifications
  let sent = 0;
  let failed = 0;

  for (const channel of channels) {
    const config = JSON.parse(channel.config) as ChannelConfig;
    const result = await sendNotification(
      channel.type as ChannelType,
      config,
      data.title,
      data.message
    );

    if (result.success) {
      sent++;
    } else {
      failed++;
    }
  }

  // Update notification counts
  await db
    .update(alertHistory)
    .set({ notificationsSent: sent, notificationsFailed: failed })
    .where(eq(alertHistory.id, alertId));

  revalidatePath("/alerts");
  return { success: true, alertId, notificationsSent: sent, notificationsFailed: failed };
}
