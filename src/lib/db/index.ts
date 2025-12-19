import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import * as fs from "fs";
import * as path from "path";

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

// Export schema for convenience
export * from "./schema";
