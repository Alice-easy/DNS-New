/**
 * PostgreSQL Schema
 * For Vercel Postgres, Neon, Supabase, etc.
 */

import { pgTable, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users table (for NextAuth)
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  username: text("username").unique(),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  password: text("password"),
  image: text("image"),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at", { mode: "date" }).$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", { mode: "date" }).$defaultFn(() => new Date()),
});

// Accounts table (for NextAuth OAuth)
export const accounts = pgTable("accounts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

// Sessions table (for NextAuth)
export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

// Verification tokens
export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

// DNS Providers
export const providers = pgTable("providers", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  label: text("label").notNull(),
  credentials: text("credentials").notNull(),
  status: text("status").notNull().default("active"),
  lastSyncAt: timestamp("last_sync_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", { mode: "date" }).$defaultFn(() => new Date()),
});

// Domains
export const domains = pgTable("domains", {
  id: text("id").primaryKey(),
  providerId: text("provider_id")
    .notNull()
    .references(() => providers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  remoteId: text("remote_id").notNull(),
  status: text("status").notNull().default("active"),
  syncedAt: timestamp("synced_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", { mode: "date" }).$defaultFn(() => new Date()),
});

// DNS Records
export const records = pgTable("records", {
  id: text("id").primaryKey(),
  domainId: text("domain_id")
    .notNull()
    .references(() => domains.id, { onDelete: "cascade" }),
  remoteId: text("remote_id").notNull(),
  type: text("type").notNull(),
  name: text("name").notNull(),
  content: text("content").notNull(),
  ttl: integer("ttl").notNull().default(300),
  priority: integer("priority"),
  proxied: boolean("proxied").default(false),
  line: text("line"),
  lineId: text("line_id"),
  extra: text("extra"),
  syncedAt: timestamp("synced_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", { mode: "date" }).$defaultFn(() => new Date()),
});

// Domain Shares
export const domainShares = pgTable("domain_shares", {
  id: text("id").primaryKey(),
  domainId: text("domain_id")
    .notNull()
    .references(() => domains.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  permission: text("permission").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", { mode: "date" }).$defaultFn(() => new Date()),
});

// Audit Logs
export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id").notNull(),
  details: text("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { mode: "date" }).$defaultFn(() => new Date()),
});

// Record Changes
export const recordChanges = pgTable("record_changes", {
  id: text("id").primaryKey(),
  domainId: text("domain_id")
    .notNull()
    .references(() => domains.id, { onDelete: "cascade" }),
  recordId: text("record_id"),
  remoteId: text("remote_id").notNull(),
  changeType: text("change_type").notNull(),
  recordType: text("record_type").notNull(),
  recordName: text("record_name").notNull(),
  previousValue: text("previous_value"),
  currentValue: text("current_value"),
  changedFields: text("changed_fields"),
  syncBatchId: text("sync_batch_id").notNull(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { mode: "date" }).$defaultFn(() => new Date()),
});

// Monitor Tasks
export const monitorTasks = pgTable("monitor_tasks", {
  id: text("id").primaryKey(),
  domainId: text("domain_id")
    .notNull()
    .references(() => domains.id, { onDelete: "cascade" }),
  recordId: text("record_id")
    .notNull()
    .references(() => records.id, { onDelete: "cascade" }),
  enabled: boolean("enabled").notNull().default(true),
  checkInterval: integer("check_interval").notNull().default(300),
  checkAvailability: boolean("check_availability").notNull().default(true),
  checkLatency: boolean("check_latency").notNull().default(true),
  checkCorrectness: boolean("check_correctness").notNull().default(true),
  lastCheckAt: timestamp("last_check_at", { mode: "date" }),
  nextCheckAt: timestamp("next_check_at", { mode: "date" }),
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { mode: "date" }).$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", { mode: "date" }).$defaultFn(() => new Date()),
});

// Monitor Results
export const monitorResults = pgTable("monitor_results", {
  id: text("id").primaryKey(),
  taskId: text("task_id")
    .notNull()
    .references(() => monitorTasks.id, { onDelete: "cascade" }),
  domainId: text("domain_id")
    .notNull()
    .references(() => domains.id, { onDelete: "cascade" }),
  recordId: text("record_id")
    .notNull()
    .references(() => records.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  isAvailable: boolean("is_available"),
  latency: integer("latency"),
  isCorrect: boolean("is_correct"),
  expectedValue: text("expected_value"),
  actualValue: text("actual_value"),
  errorMessage: text("error_message"),
  checkedAt: timestamp("checked_at", { mode: "date" }).$defaultFn(() => new Date()),
});

// Alert Rules
export const alertRules = pgTable("alert_rules", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  triggerType: text("trigger_type").notNull(),
  conditions: text("conditions").notNull(),
  consecutiveFailures: integer("consecutive_failures").notNull().default(1),
  cooldownMinutes: integer("cooldown_minutes").notNull().default(30),
  lastTriggeredAt: timestamp("last_triggered_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", { mode: "date" }).$defaultFn(() => new Date()),
});

// Notification Channels
export const notificationChannels = pgTable("notification_channels", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  config: text("config").notNull(),
  verified: boolean("verified").notNull().default(false),
  lastTestAt: timestamp("last_test_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", { mode: "date" }).$defaultFn(() => new Date()),
});

// Alert Rule Channels
export const alertRuleChannels = pgTable("alert_rule_channels", {
  id: text("id").primaryKey(),
  ruleId: text("rule_id")
    .notNull()
    .references(() => alertRules.id, { onDelete: "cascade" }),
  channelId: text("channel_id")
    .notNull()
    .references(() => notificationChannels.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date" }).$defaultFn(() => new Date()),
});

// Alert History
export const alertHistory = pgTable("alert_history", {
  id: text("id").primaryKey(),
  ruleId: text("rule_id")
    .notNull()
    .references(() => alertRules.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  severity: text("severity").notNull().default("warning"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  domainId: text("domain_id").references(() => domains.id, { onDelete: "set null" }),
  recordId: text("record_id").references(() => records.id, { onDelete: "set null" }),
  taskId: text("task_id").references(() => monitorTasks.id, { onDelete: "set null" }),
  triggerData: text("trigger_data"),
  notificationsSent: integer("notifications_sent").notNull().default(0),
  notificationsFailed: integer("notifications_failed").notNull().default(0),
  triggeredAt: timestamp("triggered_at", { mode: "date" }).$defaultFn(() => new Date()),
  resolvedAt: timestamp("resolved_at", { mode: "date" }),
  acknowledgedAt: timestamp("acknowledged_at", { mode: "date" }),
  acknowledgedBy: text("acknowledged_by").references(() => users.id, { onDelete: "set null" }),
});

// Relations (same as SQLite)
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  providers: many(providers),
  domainShares: many(domainShares),
  auditLogs: many(auditLogs),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const providersRelations = relations(providers, ({ one, many }) => ({
  user: one(users, { fields: [providers.userId], references: [users.id] }),
  domains: many(domains),
}));

export const domainsRelations = relations(domains, ({ one, many }) => ({
  provider: one(providers, { fields: [domains.providerId], references: [providers.id] }),
  records: many(records),
  shares: many(domainShares),
  recordChanges: many(recordChanges),
  monitorTasks: many(monitorTasks),
}));

export const domainSharesRelations = relations(domainShares, ({ one }) => ({
  domain: one(domains, { fields: [domainShares.domainId], references: [domains.id] }),
  user: one(users, { fields: [domainShares.userId], references: [users.id] }),
}));

export const recordsRelations = relations(records, ({ one, many }) => ({
  domain: one(domains, { fields: [records.domainId], references: [domains.id] }),
  monitorTasks: many(monitorTasks),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));

export const recordChangesRelations = relations(recordChanges, ({ one }) => ({
  domain: one(domains, { fields: [recordChanges.domainId], references: [domains.id] }),
  user: one(users, { fields: [recordChanges.userId], references: [users.id] }),
}));

export const monitorTasksRelations = relations(monitorTasks, ({ one, many }) => ({
  domain: one(domains, { fields: [monitorTasks.domainId], references: [domains.id] }),
  record: one(records, { fields: [monitorTasks.recordId], references: [records.id] }),
  createdByUser: one(users, { fields: [monitorTasks.createdBy], references: [users.id] }),
  results: many(monitorResults),
}));

export const monitorResultsRelations = relations(monitorResults, ({ one }) => ({
  task: one(monitorTasks, { fields: [monitorResults.taskId], references: [monitorTasks.id] }),
  domain: one(domains, { fields: [monitorResults.domainId], references: [domains.id] }),
  record: one(records, { fields: [monitorResults.recordId], references: [records.id] }),
}));

export const alertRulesRelations = relations(alertRules, ({ one, many }) => ({
  user: one(users, { fields: [alertRules.userId], references: [users.id] }),
  channels: many(alertRuleChannels),
  history: many(alertHistory),
}));

export const notificationChannelsRelations = relations(notificationChannels, ({ one, many }) => ({
  user: one(users, { fields: [notificationChannels.userId], references: [users.id] }),
  alertRuleChannels: many(alertRuleChannels),
}));

export const alertRuleChannelsRelations = relations(alertRuleChannels, ({ one }) => ({
  rule: one(alertRules, { fields: [alertRuleChannels.ruleId], references: [alertRules.id] }),
  channel: one(notificationChannels, { fields: [alertRuleChannels.channelId], references: [notificationChannels.id] }),
}));

export const alertHistoryRelations = relations(alertHistory, ({ one }) => ({
  rule: one(alertRules, { fields: [alertHistory.ruleId], references: [alertRules.id] }),
  user: one(users, { fields: [alertHistory.userId], references: [users.id] }),
  domain: one(domains, { fields: [alertHistory.domainId], references: [domains.id] }),
  record: one(records, { fields: [alertHistory.recordId], references: [records.id] }),
  task: one(monitorTasks, { fields: [alertHistory.taskId], references: [monitorTasks.id] }),
  acknowledgedByUser: one(users, { fields: [alertHistory.acknowledgedBy], references: [users.id] }),
}));

// System Configuration
export const systemConfig = pgTable("system_config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  encrypted: boolean("encrypted").default(false),
  description: text("description"),
  updatedAt: timestamp("updated_at", { mode: "date" }).$defaultFn(() => new Date()),
  updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
});

export const systemConfigRelations = relations(systemConfig, ({ one }) => ({
  updatedByUser: one(users, { fields: [systemConfig.updatedBy], references: [users.id] }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Provider = typeof providers.$inferSelect;
export type NewProvider = typeof providers.$inferInsert;
export type Domain = typeof domains.$inferSelect;
export type NewDomain = typeof domains.$inferInsert;
export type DomainShare = typeof domainShares.$inferSelect;
export type NewDomainShare = typeof domainShares.$inferInsert;
export type Record = typeof records.$inferSelect;
export type NewRecord = typeof records.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type RecordChange = typeof recordChanges.$inferSelect;
export type NewRecordChange = typeof recordChanges.$inferInsert;
export type MonitorTask = typeof monitorTasks.$inferSelect;
export type NewMonitorTask = typeof monitorTasks.$inferInsert;
export type MonitorResult = typeof monitorResults.$inferSelect;
export type NewMonitorResult = typeof monitorResults.$inferInsert;
export type AlertRule = typeof alertRules.$inferSelect;
export type NewAlertRule = typeof alertRules.$inferInsert;
export type NotificationChannel = typeof notificationChannels.$inferSelect;
export type NewNotificationChannel = typeof notificationChannels.$inferInsert;
export type AlertRuleChannel = typeof alertRuleChannels.$inferSelect;
export type NewAlertRuleChannel = typeof alertRuleChannels.$inferInsert;
export type AlertHistoryItem = typeof alertHistory.$inferSelect;
export type NewAlertHistoryItem = typeof alertHistory.$inferInsert;
export type SystemConfig = typeof systemConfig.$inferSelect;
export type NewSystemConfig = typeof systemConfig.$inferInsert;
