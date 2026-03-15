import bcrypt from "bcryptjs";
import type { PrismaClient } from "../../generated/prisma/client";

/**
 * Seed database with default roles, permissions, and demo users.
 *
 * This is the single source of truth for seed logic, consumed by both:
 *   - `prisma/seed.ts`       (standalone CLI script)
 *   - `src/server/db-init.ts` (auto-init on first request)
 */
export async function seedDatabase(prisma: PrismaClient): Promise<void> {
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

  console.log("✅ Roles created");

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

  console.log("✅ Permissions created");

  // Assign all permissions to admin role
  // IMPORTANT: Admin role should always have ALL permissions to prevent system lockout
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

  console.log("✅ Role permissions assigned");

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

  console.log("✅ Demo users created");
  console.log("");
  console.log("Demo user credentials:");
  console.log("Admin: admin@example.com / password123");
  console.log("Editor: editor@example.com / password123");
  console.log("User: user@example.com / password123");
}
