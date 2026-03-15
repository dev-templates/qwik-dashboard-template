import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

import { prisma } from "./db";
import { seedDatabase } from "./services/seed.service";

/**
 * Check if database is already initialized
 * Checks if critical tables exist
 */
async function isDatabaseInitialized(): Promise<boolean> {
  try {
    // Try to query a critical table, will throw if table doesn't exist
    await prisma.user.findFirst();
    return true;
  } catch (_error) {
    return false;
  }
}

/**
 * Resolve SQLite database file path from DATABASE_URL.
 *
 * DATABASE_URL has two conventions:
 *   - Prisma CLI style: "file:./dev.db"        (resolved from prisma/ directory)
 *   - libsql style:     "file:./prisma/dev.db"  (resolved from project root, used in db.ts)
 *
 * Both point to the same file: <project_root>/prisma/dev.db
 * This function normalises them to an absolute path.
 */
function resolveSqlitePath(databaseUrl: string): string | null {
  if (!databaseUrl.startsWith("file:")) {
    return null;
  }

  let relativePath = databaseUrl.replace("file:", "").replace(/^\.\//, "");

  // Prisma CLI format omits the prisma/ prefix because it resolves from prisma/ dir.
  // If the path doesn't already include "prisma/", add it to resolve from project root.
  if (!relativePath.startsWith("prisma/")) {
    relativePath = join("prisma", relativePath);
  }

  return join(process.cwd(), relativePath);
}

/**
 * Check if database file exists (SQLite only)
 */
function checkDatabaseFile(): boolean {
  const databaseUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";
  const filePath = resolveSqlitePath(databaseUrl);

  if (filePath) {
    return existsSync(filePath);
  }

  // For other database types, assume database exists
  return true;
}

/**
 * Run database migrations
 */
async function runMigrations(): Promise<void> {
  const isDevelopment = process.env.NODE_ENV === "development";

  console.log("🔄 Syncing database schema...");

  try {
    if (isDevelopment) {
      // Development: use db push for quick schema sync
      execSync("bunx prisma db push", {
        stdio: "inherit",
        env: process.env,
      });
    } else {
      // Production: use migrate deploy to apply migrations
      execSync("bunx prisma migrate deploy", {
        stdio: "inherit",
        env: process.env,
      });
    }
    console.log("✅ Database schema sync completed");
  } catch (error) {
    console.error("❌ Database migration failed:", error);
    throw error;
  }
}

/**
 * Run database seed
 */
async function runSeed(): Promise<void> {
  console.log("🌱 Initializing database seed data...");

  try {
    await seedDatabase(prisma);
    console.log("✅ Seed data initialization completed");
  } catch (error) {
    console.error("❌ Seed data initialization failed:", error);
    throw error;
  }
}

/**
 * Initialize database
 * This function will be called when the server starts
 */
export async function initializeDatabase(): Promise<void> {
  try {
    console.log("🔍 Checking database status...");

    const dbFileExists = checkDatabaseFile();
    const isInitialized = await isDatabaseInitialized();

    if (!dbFileExists) {
      console.log("📦 Database file does not exist, starting initialization...");
      await runMigrations();
      await runSeed();
    } else if (!isInitialized) {
      console.log("⚠️  Database file exists but not initialized, syncing schema...");
      await runMigrations();
      await runSeed();
    } else {
      console.log("✅ Database is ready");
    }
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    console.error("Please check database configuration and DATABASE_URL environment variable");
    // Throw error in development, log but continue in production
    if (process.env.NODE_ENV === "development") {
      throw error;
    }
  }
}
