/**
 * Database Adapter Layer
 * Supports SQLite, PostgreSQL, MySQL, and Turso (libSQL)
 *
 * Configuration via DATABASE_TYPE environment variable:
 * - sqlite (default): Local SQLite database
 * - postgres: PostgreSQL (Vercel Postgres, Neon, Supabase, etc.)
 * - mysql: MySQL/MariaDB
 * - turso: Turso (libSQL, edge-compatible SQLite)
 */

import { validateEnv } from "../env";

// Check if we're in Next.js build phase
const isBuildPhase =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.argv.some((arg) => arg.includes("next") && arg.includes("build"));

// Validate environment variables at startup (skip during build)
if (!isBuildPhase) {
  try {
    validateEnv();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
}

// Database type from environment variable
type DatabaseType = "sqlite" | "postgres" | "mysql" | "turso";
const DATABASE_TYPE = (process.env.DATABASE_TYPE || "sqlite") as DatabaseType;

// Dynamic import and initialization based on database type
async function initializeDatabase() {
  switch (DATABASE_TYPE) {
    case "postgres": {
      const { drizzle } = await import("drizzle-orm/postgres-js");
      const postgres = (await import("postgres")).default;
      const schema = await import("./schema-pg");

      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) {
        throw new Error("DATABASE_URL is required for PostgreSQL");
      }

      const client = postgres(connectionString, { prepare: false });
      return { db: drizzle(client, { schema }), schema };
    }

    case "mysql": {
      const { drizzle } = await import("drizzle-orm/mysql2");
      const mysql = await import("mysql2/promise");
      const schema = await import("./schema-mysql");

      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) {
        throw new Error("DATABASE_URL is required for MySQL");
      }

      const connection = await mysql.createConnection(connectionString);
      return { db: drizzle(connection, { schema, mode: "default" }), schema };
    }

    case "turso": {
      const { drizzle } = await import("drizzle-orm/libsql");
      const { createClient } = await import("@libsql/client");
      const schema = await import("./schema"); // Turso uses SQLite schema

      const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
      const authToken = process.env.TURSO_AUTH_TOKEN;

      if (!url) {
        throw new Error("TURSO_DATABASE_URL or DATABASE_URL is required for Turso");
      }

      const client = createClient({
        url,
        authToken,
      });

      return { db: drizzle(client, { schema }), schema };
    }

    case "sqlite":
    default: {
      const { drizzle } = await import("drizzle-orm/better-sqlite3");
      const Database = (await import("better-sqlite3")).default;
      const schema = await import("./schema");
      const fs = await import("fs");
      const path = await import("path");

      const DB_PATH = process.env.DATABASE_URL || "./data/sqlite.db";

      // Ensure data directory exists
      const dbDir = path.dirname(DB_PATH);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Create SQLite connection
      const sqlite = new Database(DB_PATH);
      sqlite.pragma("journal_mode = WAL");

      // Graceful shutdown
      const cleanup = () => {
        try {
          sqlite.close();
          console.log("Database connection closed");
        } catch {
          // Ignore errors during cleanup
        }
      };

      process.on("SIGTERM", cleanup);
      process.on("SIGINT", cleanup);
      process.on("beforeExit", cleanup);

      return { db: drizzle(sqlite, { schema }), schema };
    }
  }
}

// Synchronous initialization for compatibility
// This uses top-level await which requires ESM
let dbInstance: Awaited<ReturnType<typeof initializeDatabase>> | null = null;

// For synchronous access (backward compatibility)
function getDbSync() {
  if (!dbInstance) {
    throw new Error(
      "Database not initialized. Call initDb() first or use getDb() for async access."
    );
  }
  return dbInstance;
}

// Export database type for conditional logic
export function getDatabaseType(): DatabaseType {
  return DATABASE_TYPE;
}

// Check if using edge-compatible database
export function isEdgeCompatible(): boolean {
  return DATABASE_TYPE === "turso" || DATABASE_TYPE === "postgres";
}

// Lazy initialization wrapper
let initPromise: Promise<void> | null = null;

export async function initDb() {
  if (dbInstance) return;
  if (initPromise) {
    await initPromise;
    return;
  }

  initPromise = (async () => {
    dbInstance = await initializeDatabase();
    console.log(`Database initialized: ${DATABASE_TYPE}`);
  })();

  await initPromise;
}

// Async database getter
export async function getDb() {
  await initDb();
  return getDbSync().db;
}

// Async schema getter
export async function getSchema() {
  await initDb();
  return getDbSync().schema;
}

// For backward compatibility - synchronous exports
// These will throw if database is not initialized
export { getDbSync as db };

// Re-export schema types (from SQLite schema as base)
export type {
  User,
  NewUser,
  Provider,
  NewProvider,
  Domain,
  NewDomain,
  DomainShare,
  NewDomainShare,
  Record,
  NewRecord,
  AuditLog,
  NewAuditLog,
  RecordChange,
  NewRecordChange,
  MonitorTask,
  NewMonitorTask,
  MonitorResult,
  NewMonitorResult,
  AlertRule,
  NewAlertRule,
  NotificationChannel,
  NewNotificationChannel,
  AlertRuleChannel,
  NewAlertRuleChannel,
  AlertHistoryItem,
  NewAlertHistoryItem,
} from "./schema";
