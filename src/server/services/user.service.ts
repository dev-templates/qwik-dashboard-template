import type { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { AuthUser } from "~/types/auth";
import type { CreateUserInput, UpdateUserInput, User, UserFilters, UsersResponse } from "~/types/user";
import { prisma } from "../db";

// Convert database user to User type
// biome-ignore lint/suspicious/noExplicitAny: Prisma returns complex types
function toUser(dbUser: any): User {
  return {
    id: String(dbUser.id),
    email: dbUser.email,
    username: dbUser.username,
    name: dbUser.name || "",
    role: dbUser.user_roles?.[0]?.role?.name || "user",
    status: dbUser.is_active ? "active" : "inactive",
    createdAt: dbUser.created_at.toISOString(),
    updatedAt: dbUser.updated_at.toISOString(),
    lastLogin: dbUser.last_login_at?.toISOString(),
    twoFactorEnabled: dbUser.two_factor_enabled,
  };
}

// Get users with filters
export async function getUsers(filters: UserFilters = {}): Promise<UsersResponse> {
  const where: Prisma.UserWhereInput = {};

  // Apply search filter
  if (filters.search) {
    where.OR = [
      { email: { contains: filters.search } },
      { username: { contains: filters.search } },
      { name: { contains: filters.search } },
    ];
  }

  // Apply role filter
  if (filters.role && filters.role !== "all") {
    where.user_roles = {
      some: {
        role: {
          name: filters.role,
        },
      },
    };
  }

  // Apply status filter
  if (filters.status && filters.status !== "all") {
    if (filters.status === "active") {
      where.is_active = true;
    } else if (filters.status === "inactive") {
      where.is_active = false;
    }
    // Note: "suspended" status would need a separate field in the database
  }

  // Get total count
  const total = await prisma.user.count({ where });

  // Pagination
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const skip = (page - 1) * limit;

  // Get users
  const users = await prisma.user.findMany({
    where,
    skip,
    take: limit,
    include: {
      user_roles: {
        include: {
          role: true,
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
  });

  return {
    users: users.map(toUser),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// Get user by ID
export async function getUserById(id: string): Promise<User | null> {
  const dbUser = await prisma.user.findUnique({
    where: { id: parseInt(id) },
    include: {
      user_roles: {
        include: {
          role: true,
        },
      },
    },
  });

  return dbUser ? toUser(dbUser) : null;
}

// Create user
export async function createUser(input: CreateUserInput): Promise<User> {
  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: input.email }, { username: input.username }],
    },
  });

  if (existingUser) {
    throw new Error("User with this email or username already exists");
  }

  // Hash password
  const password_hash = await bcrypt.hash(input.password, 10);

  // Get role
  const role = await prisma.role.findUnique({
    where: { name: input.role },
  });

  if (!role) {
    throw new Error("Invalid role");
  }

  // Create user
  const newUser = await prisma.user.create({
    data: {
      email: input.email,
      username: input.username,
      password_hash,
      name: input.name,
      is_active: true,
      is_verified: true, // For admin-created users
      user_roles: {
        create: {
          role_id: role.id,
        },
      },
    },
    include: {
      user_roles: {
        include: {
          role: true,
        },
      },
    },
  });

  return toUser(newUser);
}

// Update user
export async function updateUser(id: string, input: UpdateUserInput): Promise<User | null> {
  const userId = parseInt(id);
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      user_roles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!dbUser) {
    return null;
  }

  // Check if email or username is being changed to an existing one
  if (input.email || input.username) {
    const existingUser = await prisma.user.findFirst({
      where: {
        AND: [
          { id: { not: userId } },
          {
            OR: [input.email ? { email: input.email } : {}, input.username ? { username: input.username } : {}],
          },
        ],
      },
    });

    if (existingUser) {
      throw new Error("User with this email or username already exists");
    }
  }

  // Update basic user info
  const updateData: Prisma.UserUpdateInput = {
    email: input.email,
    username: input.username,
    name: input.name,
  };

  // Update status if provided
  if (input.status !== undefined) {
    updateData.is_active = input.status === "active";
  }

  // Start transaction to update user and role
  const updatedUser = await prisma.$transaction(async (tx) => {
    // Update user
    const _user = await tx.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Update role if changed
    if (input.role && input.role !== dbUser.user_roles?.[0]?.role?.name) {
      // Delete existing role
      await tx.userRole.deleteMany({
        where: { user_id: userId },
      });

      // Add new role
      const newRole = await tx.role.findUnique({
        where: { name: input.role },
      });

      if (newRole) {
        await tx.userRole.create({
          data: {
            user_id: userId,
            role_id: newRole.id,
          },
        });
      }
    }

    // Fetch updated user with roles
    return await tx.user.findUnique({
      where: { id: userId },
      include: {
        user_roles: {
          include: {
            role: true,
          },
        },
      },
    });
  });

  return updatedUser ? toUser(updatedUser) : null;
}

// Delete user
export async function deleteUser(id: string): Promise<boolean> {
  try {
    const userId = parseInt(id);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return false;
    }

    // Delete user (will cascade delete related records)
    await prisma.user.delete({
      where: { id: userId },
    });

    return true;
  } catch (error) {
    console.error("Error deleting user:", error);
    return false;
  }
}

// Toggle user status
export async function toggleUserStatus(id: string): Promise<User | null> {
  const userId = parseInt(id);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      user_roles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      is_active: !user.is_active,
    },
    include: {
      user_roles: {
        include: {
          role: true,
        },
      },
    },
  });

  return toUser(updatedUser);
}

// Get user as AuthUser (with full permission structure)
export async function getUserAsAuthUser(id: string): Promise<AuthUser | null> {
  const userId = parseInt(id);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      user_roles: {
        include: {
          role: {
            include: {
              role_permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  // Transform to AuthUser format
  const {
    password_hash: _,
    two_factor_secret: __,
    recovery_codes: ___,
    verification_token: ____,
    user_roles,
    ...sanitized
  } = user;

  const roles = user_roles.map((ur) => ({
    role: {
      id: ur.role.id,
      name: ur.role.name,
      display_name: ur.role.display_name,
      permissions: ur.role.role_permissions.map((rp) => ({
        permission: rp.permission,
      })),
    },
  }));

  return {
    ...sanitized,
    roles,
  } as AuthUser;
}
