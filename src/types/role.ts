export interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  permissionCount?: number;
  userCount?: number;
}

export interface Permission {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  resource: string;
  action: string;
  createdAt: string;
  updatedAt: string;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  permission: Permission;
  grantedAt: string;
}

export interface CreateRoleInput {
  name: string;
  displayName: string;
  description?: string;
  permissions?: string[];
}

export interface UpdateRoleInput {
  displayName?: string;
  description?: string;
  permissions?: string[];
}

export interface RoleFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export interface RolesResponse {
  roles: Role[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
