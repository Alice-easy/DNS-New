import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// Users table (for NextAuth)
export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  username: text("username").unique(), // For credentials login
  email: text("email").unique(),
  emailVerified: integer("email_verified", { mode: "timestamp" }),
  password: text("password"), // Hashed password for credentials login
  image: text("image"),
  role: text("role").notNull().default("user"), // admin, user
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

// Accounts table (for NextAuth OAuth)
export const accounts = sqliteTable("accounts", {
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
export const sessions = sqliteTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

// Verification tokens (for NextAuth email verification)
export const verificationTokens = sqliteTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

// DNS Providers (Cloudflare, Aliyun, DNSPod, etc.)
export const providers = sqliteTable("providers", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // cloudflare, alidns, dnspod
  label: text("label").notNull(), // Display name
  credentials: text("credentials").notNull(), // Encrypted JSON
  status: text("status").notNull().default("active"), // active, error, disabled
  lastSyncAt: integer("last_sync_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

// Domains
export const domains = sqliteTable("domains", {
  id: text("id").primaryKey(),
  providerId: text("provider_id")
    .notNull()
    .references(() => providers.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // example.com
  remoteId: text("remote_id").notNull(), // Provider's domain ID
  status: text("status").notNull().default("active"), // active, pending, error
  syncedAt: integer("synced_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

// DNS Records
export const records = sqliteTable("records", {
  id: text("id").primaryKey(),
  domainId: text("domain_id")
    .notNull()
    .references(() => domains.id, { onDelete: "cascade" }),
  remoteId: text("remote_id").notNull(), // Provider's record ID
  type: text("type").notNull(), // A, AAAA, CNAME, MX, TXT, etc.
  name: text("name").notNull(), // @ or subdomain
  content: text("content").notNull(), // IP or target
  ttl: integer("ttl").notNull().default(300),
  priority: integer("priority"), // For MX records
  proxied: integer("proxied", { mode: "boolean" }).default(false), // Cloudflare proxy
  extra: text("extra"), // Additional provider-specific data (JSON)
  syncedAt: integer("synced_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

// Domain Shares (权限分配)
export const domainShares = sqliteTable("domain_shares", {
  id: text("id").primaryKey(),
  domainId: text("domain_id")
    .notNull()
    .references(() => domains.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  permission: text("permission").notNull(), // readonly, edit, full
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

// Audit Logs
export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(), // create, update, delete, sync
  resourceType: text("resource_type").notNull(), // provider, domain, record
  resourceId: text("resource_id").notNull(),
  details: text("details"), // JSON with change details
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

// Record Changes (变更检测)
export const recordChanges = sqliteTable("record_changes", {
  id: text("id").primaryKey(),
  domainId: text("domain_id")
    .notNull()
    .references(() => domains.id, { onDelete: "cascade" }),
  recordId: text("record_id"), // 本地记录ID，删除的记录可能为null
  remoteId: text("remote_id").notNull(), // 远程记录ID，用于匹配
  changeType: text("change_type").notNull(), // added, modified, deleted
  recordType: text("record_type").notNull(), // A, AAAA, CNAME, etc.
  recordName: text("record_name").notNull(), // 记录名称
  previousValue: text("previous_value"), // JSON: { content, ttl, priority, proxied }
  currentValue: text("current_value"), // JSON: { content, ttl, priority, proxied }
  changedFields: text("changed_fields"), // JSON array: ["content", "ttl"]
  syncBatchId: text("sync_batch_id").notNull(), // 同步批次ID
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
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
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const providersRelations = relations(providers, ({ one, many }) => ({
  user: one(users, {
    fields: [providers.userId],
    references: [users.id],
  }),
  domains: many(domains),
}));

export const domainsRelations = relations(domains, ({ one, many }) => ({
  provider: one(providers, {
    fields: [domains.providerId],
    references: [providers.id],
  }),
  records: many(records),
  shares: many(domainShares),
  recordChanges: many(recordChanges),
}));

export const domainSharesRelations = relations(domainShares, ({ one }) => ({
  domain: one(domains, {
    fields: [domainShares.domainId],
    references: [domains.id],
  }),
  user: one(users, {
    fields: [domainShares.userId],
    references: [users.id],
  }),
}));

export const recordsRelations = relations(records, ({ one }) => ({
  domain: one(domains, {
    fields: [records.domainId],
    references: [domains.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const recordChangesRelations = relations(recordChanges, ({ one }) => ({
  domain: one(domains, {
    fields: [recordChanges.domainId],
    references: [domains.id],
  }),
  user: one(users, {
    fields: [recordChanges.userId],
    references: [users.id],
  }),
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
