/**
 * MySQL Schema
 * For MySQL, MariaDB, PlanetScale, etc.
 */

import { mysqlTable, text, int, datetime, boolean, varchar } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

// Users table (for NextAuth)
export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  username: varchar("username", { length: 255 }).unique(),
  email: varchar("email", { length: 255 }).unique(),
  emailVerified: datetime("email_verified", { mode: "date" }),
  password: text("password"),
  image: text("image"),
  role: varchar("role", { length: 50 }).notNull().default("user"),
  createdAt: datetime("created_at", { mode: "date" }).$defaultFn(() => new Date()),
  updatedAt: datetime("updated_at", { mode: "date" }).$defaultFn(() => new Date()),
});

// Accounts table (for NextAuth OAuth)
export const accounts = mysqlTable("accounts", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 255 }).notNull(),
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: int("expires_at"),
  token_type: varchar("token_type", { length: 255 }),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

// Sessions table (for NextAuth)
export const sessions = mysqlTable("sessions", {
  sessionToken: varchar("session_token", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: datetime("expires", { mode: "date" }).notNull(),
});

// Verification tokens
export const verificationTokens = mysqlTable("verification_tokens", {
  identifier: varchar("identifier", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull(),
  expires: datetime("expires", { mode: "date" }).notNull(),
});

// DNS Providers
export const providers = mysqlTable("providers", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  credentials: text("credentials").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  lastSyncAt: datetime("last_sync_at", { mode: "date" }),
  createdAt: datetime("created_at", { mode: "date" }).$defaultFn(() => new Date()),
  updatedAt: datetime("updated_at", { mode: "date" }).$defaultFn(() => new Date()),
});

// Domains
export const domains = mysqlTable("domains", {
  id: varchar("id", { length: 36 }).primaryKey(),
  providerId: varchar("provider_id", { length: 36 })
    .notNull()
    .references(() => providers.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  remoteId: varchar("remote_id", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  syncedAt: datetime("synced_at", { mode: "date" }),
  createdAt: datetime("created_at", { mode: "date" }).$defaultFn(() => new Date()),
  updatedAt: datetime("updated_at", { mode: "date" }).$defaultFn(() => new Date()),
});

// DNS Records
export const records = mysqlTable("records", {
  id: varchar("id", { length: 36 }).primaryKey(),
  domainId: varchar("domain_id", { length: 36 })
    .notNull()
    .references(() => domains.id, { onDelete: "cascade" }),
  remoteId: varchar("remote_id", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  content: text("content").notNull(),
  ttl: int("ttl").notNull().default(300),
  priority: int("priority"),
  proxied: boolean("proxied").default(false),
  line: varchar("line", { length: 255 }),
  lineId: varchar("line_id", { length: 255 }),
  extra: text("extra"),
  syncedAt: datetime("synced_at", { mode: "date" }),
  createdAt: datetime("created_at", { mode: "date" }).$defaultFn(() => new Date()),
  updatedAt: datetime("updated_at", { mode: "date" }).$defaultFn(() => new Date()),
});

// Domain Shares
export const domainShares = mysqlTable("domain_shares", {
  id: varchar("id", { length: 36 }).primaryKey(),
  domainId: varchar("domain_id", { length: 36 })
    .notNull()
    .references(() => domains.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  permission: varchar("permission", { length: 50 }).notNull(),
  createdAt: datetime("created_at", { mode: "date" }).$defaultFn(() => new Date()),
  updatedAt: datetime("updated_at", { mode: "date" }).$defaultFn(() => new Date()),
});

// Audit Logs
export const auditLogs = mysqlTable("audit_logs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 255 }).notNull(),
  resourceType: varchar("resource_type", { length: 255 }).notNull(),
  resourceId: varchar("resource_id", { length: 255 }).notNull(),
  details: text("details"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: datetime("created_at", { mode: "date" }).$defaultFn(() => new Date()),
});

// Record Changes
export const recordChanges = mysqlTable("record_changes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  domainId: varchar("domain_id", { length: 36 })
    .notNull()
    .references(() => domains.id, { onDelete: "cascade" }),
  recordId: varchar("record_id", { length: 36 }),
  remoteId: varchar("remote_id", { length: 255 }).notNull(),
  changeType: varchar("change_type", { length: 50 }).notNull(),
  recordType: varchar("record_type", { length: 50 }).notNull(),
  recordName: varchar("record_name", { length: 255 }).notNull(),
  previousValue: text("previous_value"),
  currentValue: text("current_value"),
  changedFields: text("changed_fields"),
  syncBatchId: varchar("sync_batch_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
  createdAt: datetime("created_at", { mode: "date" }).$defaultFn(() => new Date()),
});

// Monitor Tasks
export const monitorTasks = mysqlTable("monitor_tasks", {
  id: varchar("id", { length: 36 }).primaryKey(),
  domainId: varchar("domain_id", { length: 36 })
    .notNull()
    .references(() => domains.id, { onDelete: "cascade" }),
  recordId: varchar("record_id", { length: 36 })
    .notNull()
    .references(() => records.id, { onDelete: "cascade" }),
  enabled: boolean("enabled").notNull().default(true),
  checkInterval: int("check_interval").notNull().default(300),
  checkAvailability: boolean("check_availability").notNull().default(true),
  checkLatency: boolean("check_latency").notNull().default(true),
  checkCorrectness: boolean("check_correctness").notNull().default(true),
  lastCheckAt: datetime("last_check_at", { mode: "date" }),
  nextCheckAt: datetime("next_check_at", { mode: "date" }),
  createdBy: varchar("created_by", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
  createdAt: datetime("created_at", { mode: "date" }).$defaultFn(() => new Date()),
  updatedAt: datetime("updated_at", { mode: "date" }).$defaultFn(() => new Date()),
});

// Monitor Results
export const monitorResults = mysqlTable("monitor_results", {
  id: varchar("id", { length: 36 }).primaryKey(),
  taskId: varchar("task_id", { length: 36 })
    .notNull()
    .references(() => monitorTasks.id, { onDelete: "cascade" }),
  domainId: varchar("domain_id", { length: 36 })
    .notNull()
    .references(() => domains.id, { onDelete: "cascade" }),
  recordId: varchar("record_id", { length: 36 })
    .notNull()
    .references(() => records.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 50 }).notNull(),
  isAvailable: boolean("is_available"),
  latency: int("latency"),
  isCorrect: boolean("is_correct"),
  expectedValue: text("expected_value"),
  actualValue: text("actual_value"),
  errorMessage: text("error_message"),
  checkedAt: datetime("checked_at", { mode: "date" }).$defaultFn(() => new Date()),
});

// Alert Rules
export const alertRules = mysqlTable("alert_rules", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  enabled: boolean("enabled").notNull().default(true),
  triggerType: varchar("trigger_type", { length: 255 }).notNull(),
  conditions: text("conditions").notNull(),
  consecutiveFailures: int("consecutive_failures").notNull().default(1),
  cooldownMinutes: int("cooldown_minutes").notNull().default(30),
  lastTriggeredAt: datetime("last_triggered_at", { mode: "date" }),
  createdAt: datetime("created_at", { mode: "date" }).$defaultFn(() => new Date()),
  updatedAt: datetime("updated_at", { mode: "date" }).$defaultFn(() => new Date()),
});

// Notification Channels
export const notificationChannels = mysqlTable("notification_channels", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  enabled: boolean("enabled").notNull().default(true),
  config: text("config").notNull(),
  verified: boolean("verified").notNull().default(false),
  lastTestAt: datetime("last_test_at", { mode: "date" }),
  createdAt: datetime("created_at", { mode: "date" }).$defaultFn(() => new Date()),
  updatedAt: datetime("updated_at", { mode: "date" }).$defaultFn(() => new Date()),
});

// Alert Rule Channels
export const alertRuleChannels = mysqlTable("alert_rule_channels", {
  id: varchar("id", { length: 36 }).primaryKey(),
  ruleId: varchar("rule_id", { length: 36 })
    .notNull()
    .references(() => alertRules.id, { onDelete: "cascade" }),
  channelId: varchar("channel_id", { length: 36 })
    .notNull()
    .references(() => notificationChannels.id, { onDelete: "cascade" }),
  createdAt: datetime("created_at", { mode: "date" }).$defaultFn(() => new Date()),
});

// Alert History
export const alertHistory = mysqlTable("alert_history", {
  id: varchar("id", { length: 36 }).primaryKey(),
  ruleId: varchar("rule_id", { length: 36 })
    .notNull()
    .references(() => alertRules.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 50 }).notNull(),
  severity: varchar("severity", { length: 50 }).notNull().default("warning"),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  domainId: varchar("domain_id", { length: 36 }).references(() => domains.id, { onDelete: "set null" }),
  recordId: varchar("record_id", { length: 36 }).references(() => records.id, { onDelete: "set null" }),
  taskId: varchar("task_id", { length: 36 }).references(() => monitorTasks.id, { onDelete: "set null" }),
  triggerData: text("trigger_data"),
  notificationsSent: int("notifications_sent").notNull().default(0),
  notificationsFailed: int("notifications_failed").notNull().default(0),
  triggeredAt: datetime("triggered_at", { mode: "date" }).$defaultFn(() => new Date()),
  resolvedAt: datetime("resolved_at", { mode: "date" }),
  acknowledgedAt: datetime("acknowledged_at", { mode: "date" }),
  acknowledgedBy: varchar("acknowledged_by", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
});

// Relations
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
