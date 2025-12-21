import { defineConfig } from "drizzle-kit";

// Database type from environment variable
const DATABASE_TYPE = process.env.DATABASE_TYPE || "sqlite";

// Get the appropriate configuration based on database type
function getConfig() {
  switch (DATABASE_TYPE) {
    case "postgres":
      return {
        schema: "./src/lib/db/schema-pg.ts",
        out: "./drizzle/postgres",
        dialect: "postgresql" as const,
        dbCredentials: {
          url: process.env.DATABASE_URL || "",
        },
      };

    case "mysql":
      return {
        schema: "./src/lib/db/schema-mysql.ts",
        out: "./drizzle/mysql",
        dialect: "mysql" as const,
        dbCredentials: {
          url: process.env.DATABASE_URL || "",
        },
      };

    case "turso":
      return {
        schema: "./src/lib/db/schema.ts",
        out: "./drizzle/turso",
        dialect: "turso" as const,
        dbCredentials: {
          url: process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || "",
          authToken: process.env.TURSO_AUTH_TOKEN,
        },
      };

    case "sqlite":
    default:
      return {
        schema: "./src/lib/db/schema.ts",
        out: "./drizzle/sqlite",
        dialect: "sqlite" as const,
        dbCredentials: {
          url: process.env.DATABASE_URL || "./data/sqlite.db",
        },
      };
  }
}

export default defineConfig(getConfig());
