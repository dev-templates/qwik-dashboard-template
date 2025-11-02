import type { CreateRoleInput, Role, RoleFilters, RolesResponse, UpdateRoleInput } from "~/types/role";
import { prisma } from "../db";

export async function getRoles(filters: RoleFilters): Promise<RolesResponse> {
  const { search, page = 1, limit = 10 } = filters;
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { name: { contains: search } },
          { display_name: { contains: search } },
          { description: { contains: search } },
        ],
      }
    : {};

  const [roles, total] = await Promise.all([
    prisma.role.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ is_system: "desc" }, { created_at: "desc" }],
      include: {
        _count: {
          select: {
            user_roles: true,
            role_permissions: true,
          },
        },
      },
    }),
    prisma.role.count({ where }),
  ]);

  const mappedRoles: Role[] = roles.map((role) => ({
    id: String(role.id),
    name: role.name,
    displayName: role.display_name,
    description: role.description || undefined,
    isSystem: role.is_system,
    createdAt: role.created_at.toISOString(),
    updatedAt: role.updated_at.toISOString(),
    userCount: role._count.user_roles,
    permissionCount: role._count.role_permissions,
  }));

  return {
    roles: mappedRoles,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getRoleById(roleId: string) {
  const role = await prisma.role.findUnique({
    where: { id: Number(roleId) },
    include: {
      role_permissions: {
        include: {
          permission: true,
        },
      },
      _count: {
        select: {
          user_roles: true,
        },
      },
    },
  });

  if (!role) {
    return null;
  }

  return {
    id: String(role.id),
    name: role.name,
    displayName: role.display_name,
    description: role.description || undefined,
    isSystem: role.is_system,
    createdAt: role.created_at.toISOString(),
    updatedAt: role.updated_at.toISOString(),
    userCount: role._count.user_roles,
    permissions: role.role_permissions.map((rp) => ({
      id: String(rp.permission.id),
      name: rp.permission.name,
      displayName: rp.permission.display_name,
      description: rp.permission.description || undefined,
      resource: rp.permission.resource,
      action: rp.permission.action,
    })),
  };
}

export async function createRole(input: CreateRoleInput) {
  const { name, displayName, description, permissions = [] } = input;

  const existingRole = await prisma.role.findUnique({
    where: { name },
  });

  if (existingRole) {
    throw new Error("Role with this name already exists");
  }

  const role = await prisma.role.create({
    data: {
      name,
      display_name: displayName,
      description,
      role_permissions: {
        create: permissions.map((permissionId) => ({
          permission_id: Number(permissionId),
        })),
      },
    },
    include: {
      _count: {
        select: {
          user_roles: true,
          role_permissions: true,
        },
      },
    },
  });

  return {
    id: String(role.id),
    name: role.name,
    displayName: role.display_name,
    description: role.description || undefined,
    isSystem: role.is_system,
    createdAt: role.created_at.toISOString(),
    updatedAt: role.updated_at.toISOString(),
    userCount: role._count.user_roles,
    permissionCount: role._count.role_permissions,
  };
}

export async function updateRole(roleId: string, input: UpdateRoleInput) {
  const { displayName, description, permissions } = input;

  const existingRole = await prisma.role.findUnique({
    where: { id: Number(roleId) },
  });

  if (!existingRole) {
    return null;
  }

  // System roles can only update permissions and description, not display name
  const updateData: { display_name?: string; description?: string | null } = {};

  if (existingRole.name === "admin") {
    // For admin role, only allow updating description
    if (description !== undefined) updateData.description = description;
  } else {
    // For all other roles, allow updating display name and description
    if (displayName !== undefined) updateData.display_name = displayName;
    if (description !== undefined) updateData.description = description;
  }

  await prisma.$transaction(async (tx) => {
    // Allow updating permissions for all roles except admin
    if (permissions !== undefined && existingRole.name !== "admin") {
      await tx.rolePermission.deleteMany({
        where: { role_id: Number(roleId) },
      });

      if (permissions.length > 0) {
        await tx.rolePermission.createMany({
          data: permissions.map((permissionId) => ({
            role_id: Number(roleId),
            permission_id: Number(permissionId),
          })),
        });
      }
    }

    if (Object.keys(updateData).length > 0) {
      await tx.role.update({
        where: { id: Number(roleId) },
        data: updateData,
      });
    }
  });

  return getRoleById(roleId);
}

export async function deleteRole(roleId: string) {
  const role = await prisma.role.findUnique({
    where: { id: Number(roleId) },
    include: {
      _count: {
        select: {
          user_roles: true,
        },
      },
    },
  });

  if (!role) {
    return false;
  }

  if (role.name === "admin") {
    throw new Error("Administrator role cannot be deleted");
  }

  if (role._count.user_roles > 0) {
    throw new Error("Cannot delete role that is assigned to users");
  }

  await prisma.role.delete({
    where: { id: Number(roleId) },
  });

  return true;
}

export async function getAllPermissions() {
  const permissions = await prisma.permission.findMany({
    orderBy: [{ resource: "asc" }, { action: "asc" }],
  });

  return permissions.map((permission) => ({
    id: String(permission.id),
    name: permission.name,
    displayName: permission.display_name,
    description: permission.description || undefined,
    resource: permission.resource,
    action: permission.action,
    createdAt: permission.created_at.toISOString(),
    updatedAt: permission.updated_at.toISOString(),
  }));
}
