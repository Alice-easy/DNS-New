/**
 * Database Entry Point
 *
 * Supports multiple database types via DATABASE_TYPE environment variable:
 * - sqlite (default): Local SQLite database using better-sqlite3
 * - postgres: PostgreSQL (Vercel Postgres, Neon, Supabase, etc.)
 * - mysql: MySQL/MariaDB
 * - turso: Turso (libSQL, edge-compatible SQLite)
 *
 * Environment Variables:
 * - DATABASE_TYPE: Database type (sqlite, postgres, mysql, turso)
 * - DATABASE_URL: Connection string or file path
 * - TURSO_DATABASE_URL: Turso database URL (optional, falls back to DATABASE_URL)
 * - TURSO_AUTH_TOKEN: Turso authentication token
 */

import { drizzle, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import * as fs from "fs";
import * as path from "path";
import { validateEnv } from "../env";

// Database type from environment
const DATABASE_TYPE = process.env.DATABASE_TYPE || "sqlite";

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

// Database instance type
type DbInstance = BetterSQLite3Database<typeof schema>;

// For SQLite (default) - synchronous initialization
let db: DbInstance;

if (DATABASE_TYPE === "sqlite") {
  const DB_PATH = process.env.DATABASE_URL || "./data/sqlite.db";

  // Ensure data directory exists
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Create SQLite connection
  const sqlite = new Database(DB_PATH);

  // Enable WAL mode for better performance
  sqlite.pragma("journal_mode = WAL");

  // Create Drizzle instance
  db = drizzle(sqlite, { schema });

  // Graceful shutdown - close database connection
  function cleanup() {
    try {
      sqlite.close();
      console.log("Database connection closed");
    } catch {
      // Ignore errors during cleanup
    }
  }

  // Register cleanup handlers for graceful shutdown
  process.on("SIGTERM", cleanup);
  process.on("SIGINT", cleanup);
  process.on("beforeExit", cleanup);
} else {
  // For non-SQLite databases, we still need to initialize SQLite for build
  // But the actual runtime will use the adapter.ts for async initialization
  console.warn(
    `Database type "${DATABASE_TYPE}" detected. ` +
    `For production, use "import { getDb } from '@/lib/db/adapter'" for async initialization.`
  );

  // Create a dummy SQLite for build phase (won't be used in runtime)
  const DB_PATH = "./data/sqlite.db";
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  db = drizzle(sqlite, { schema });
}

export { db };

// Export schema for convenience
export * from "./schema";

// Export helper functions
export function getDatabaseType() {
  return DATABASE_TYPE;
}

export function isEdgeCompatible() {
  return DATABASE_TYPE === "turso" || DATABASE_TYPE === "postgres";
}
