import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import bcrypt from "bcryptjs";

import { prisma } from "./db";

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
      execSync("bunx prisma db push --skip-generate", {
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
    // Create default roles
    const adminRole = await prisma.role.upsert({
      where: { name: "admin" },
      update: {},
      create: {
        name: "admin",
        display_name: "Administrator",
        description: "Full system access",
        is_system: true,
      },
    });

    const editorRole = await prisma.role.upsert({
      where: { name: "editor" },
      update: {},
      create: {
        name: "editor",
        display_name: "Editor",
        description: "Can create and edit content",
        is_system: false,
      },
    });

    const userRole = await prisma.role.upsert({
      where: { name: "user" },
      update: {},
      create: {
        name: "user",
        display_name: "User",
        description: "Basic user access",
        is_system: false,
      },
    });

    // Create permissions
    const resources = ["users", "roles", "settings", "dashboard"];
    const actions = ["read", "manage"];

    const permissions: Awaited<ReturnType<typeof prisma.permission.upsert>>[] = [];
    for (const resource of resources) {
      for (const action of actions) {
        const permission = await prisma.permission.upsert({
          where: {
            resource_action: {
              resource,
              action,
            },
          },
          update: {},
          create: {
            name: `${resource}.${action}`,
            display_name: `${action.charAt(0).toUpperCase() + action.slice(1)} ${resource}`,
            description: `Can ${action} ${resource}`,
            resource,
            action,
          },
        });
        permissions.push(permission);
      }
    }

    // Assign all permissions to admin role
    for (const permission of permissions) {
      await prisma.rolePermission.upsert({
        where: {
          role_id_permission_id: {
            role_id: adminRole.id,
            permission_id: permission.id,
          },
        },
        update: {},
        create: {
          role_id: adminRole.id,
          permission_id: permission.id,
        },
      });
    }

    // Assign specific permissions to editor role
    const editorPermissions = permissions.filter(
      (p) => p.action === "read" && ["dashboard", "users"].includes(p.resource),
    );

    for (const permission of editorPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          role_id_permission_id: {
            role_id: editorRole.id,
            permission_id: permission.id,
          },
        },
        update: {},
        create: {
          role_id: editorRole.id,
          permission_id: permission.id,
        },
      });
    }

    // Assign minimal permissions to user role
    const userPermissions = permissions.filter((p) => p.action === "read" && ["dashboard"].includes(p.resource));

    for (const permission of userPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          role_id_permission_id: {
            role_id: userRole.id,
            permission_id: permission.id,
          },
        },
        update: {},
        create: {
          role_id: userRole.id,
          permission_id: permission.id,
        },
      });
    }

    // Create demo users
    const hashedPassword = await bcrypt.hash("password123", 10);

    // Admin user
    const adminUser = await prisma.user.upsert({
      where: { email: "admin@example.com" },
      update: {},
      create: {
        email: "admin@example.com",
        username: "admin",
        password_hash: hashedPassword,
        name: "Admin User",
        is_active: true,
        is_verified: true,
      },
    });

    await prisma.userRole.upsert({
      where: {
        user_id_role_id: {
          user_id: adminUser.id,
          role_id: adminRole.id,
        },
      },
      update: {},
      create: {
        user_id: adminUser.id,
        role_id: adminRole.id,
      },
    });

    // Editor user
    const editorUser = await prisma.user.upsert({
      where: { email: "editor@example.com" },
      update: {},
      create: {
        email: "editor@example.com",
        username: "editor",
        password_hash: hashedPassword,
        name: "Editor User",
        is_active: true,
        is_verified: true,
      },
    });

    await prisma.userRole.upsert({
      where: {
        user_id_role_id: {
          user_id: editorUser.id,
          role_id: editorRole.id,
        },
      },
      update: {},
      create: {
        user_id: editorUser.id,
        role_id: editorRole.id,
      },
    });

    // Regular user
    const regularUser = await prisma.user.upsert({
      where: { email: "user@example.com" },
      update: {},
      create: {
        email: "user@example.com",
        username: "user",
        password_hash: hashedPassword,
        name: "Regular User",
        is_active: true,
        is_verified: true,
      },
    });

    await prisma.userRole.upsert({
      where: {
        user_id_role_id: {
          user_id: regularUser.id,
          role_id: userRole.id,
        },
      },
      update: {},
      create: {
        user_id: regularUser.id,
        role_id: userRole.id,
      },
    });

    console.log("✅ Seed data initialization completed");
    console.log("");
    console.log("Demo user credentials:");
    console.log("Admin: admin@example.com / password123");
    console.log("Editor: editor@example.com / password123");
    console.log("User: user@example.com / password123");
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
