import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import * as fs from "fs";
import * as path from "path";
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
    // In production runtime, exit; in development, continue with warnings
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
}

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
export const db = drizzle(sqlite, { schema });

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

// Export schema for convenience
export * from "./schema";
