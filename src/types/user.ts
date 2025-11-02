// User status types
export type UserStatus = "active" | "inactive" | "suspended";

export interface User {
  id: string;
  email: string;
  username: string;
  name?: string;
  role: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  twoFactorEnabled: boolean;
}

export interface CreateUserInput {
  email: string;
  username: string;
  password: string;
  name?: string;
  role: string;
}

export interface UpdateUserInput {
  email?: string;
  username?: string;
  name?: string;
  role?: string;
  status?: UserStatus;
}

export interface UserFilters {
  search?: string;
  role?: string; // Can be any role name or "all"
  status?: UserStatus | "all";
  page?: number;
  limit?: number;
}

export interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
