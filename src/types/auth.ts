import type { Permission, User } from "@prisma/client";

export interface JWTPayload {
  userId: number;
  email: string;
  username: string;
  sessionId: string;
}

export interface AuthUser
  extends Omit<User, "password_hash" | "two_factor_secret" | "recovery_codes" | "verification_token"> {
  roles: Array<{
    role: {
      id: number;
      name: string;
      display_name: string;
      permissions: Array<{
        permission: Permission;
      }>;
    };
  }>;
}

export interface LoginCredentials {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  name?: string;
}

export interface TwoFactorSetupData {
  secret: string;
  qrCode: string;
  otpauth: string;
}

export interface SessionData {
  user: AuthUser;
  sessionId: string;
  token: string;
  expiresAt: Date;
}

export interface PermissionCheck {
  resource: string;
  action: string;
}
