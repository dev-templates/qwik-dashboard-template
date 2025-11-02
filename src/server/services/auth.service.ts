import { createId } from "@paralleldrive/cuid2";
import type { LoginAttempt, Permission, Session, User } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import QRCode from "qrcode";
import speakeasy from "speakeasy";
import type { AuthUser, JWTPayload, LoginCredentials, RegisterData, TwoFactorSetupData } from "~/types/auth";
import { authConfig } from "../auth/config";
import { prisma } from "../db";

// Generate JWT token
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, authConfig.jwt.secret);
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, authConfig.jwt.secret) as JWTPayload;
  } catch {
    return null;
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, authConfig.bcrypt.rounds);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Register new user
export async function register(data: RegisterData): Promise<AuthUser> {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: data.email }, { username: data.username }],
    },
  });

  if (existingUser) {
    throw new Error("User with this email or username already exists");
  }

  const password_hash = await hashPassword(data.password);
  const verification_token = createId();

  const user = await prisma.user.create({
    data: {
      email: data.email,
      username: data.username,
      password_hash,
      name: data.name,
      verification_token,
      user_roles: {
        create: {
          role: {
            connect: { name: "user" }, // Default role
          },
        },
      },
    },
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

  return sanitizeUser(user);
}

// Login user
export async function login(
  credentials: LoginCredentials,
  ipAddress: string,
  userAgent?: string,
): Promise<{ user: AuthUser; session: Session; pendingToken?: string }> {
  const user = await prisma.user.findUnique({
    where: { email: credentials.email },
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

  // Track login attempt
  const loginAttempt: Omit<LoginAttempt, "id" | "attempted_at"> = {
    email: credentials.email,
    ip_address: ipAddress,
    success: false,
    failure_reason: "",
    user_id: null,
    user_agent: userAgent || null,
  };

  if (!user) {
    loginAttempt.failure_reason = "Invalid credentials";
    await prisma.loginAttempt.create({ data: loginAttempt });
    throw new Error("Invalid credentials");
  }

  if (!user.is_active) {
    loginAttempt.failure_reason = "Account is disabled";
    loginAttempt.user_id = user.id;
    await prisma.loginAttempt.create({ data: loginAttempt });
    throw new Error("Account is disabled");
  }

  if (!user.is_verified) {
    loginAttempt.failure_reason = "Account not verified";
    loginAttempt.user_id = user.id;
    await prisma.loginAttempt.create({ data: loginAttempt });
    throw new Error("Please verify your email address");
  }

  // Check recent failed login attempts
  const recentFailedAttempts = await prisma.loginAttempt.count({
    where: {
      email: credentials.email,
      success: false,
      attempted_at: {
        gte: new Date(Date.now() - authConfig.loginAttempts.lockoutDuration),
      },
    },
  });

  if (recentFailedAttempts >= authConfig.loginAttempts.maxAttempts) {
    loginAttempt.failure_reason = "Account locked due to too many failed attempts";
    loginAttempt.user_id = user.id;
    await prisma.loginAttempt.create({ data: loginAttempt });
    throw new Error("Account temporarily locked due to too many failed login attempts");
  }

  const isValidPassword = await verifyPassword(credentials.password, user.password_hash);
  if (!isValidPassword) {
    loginAttempt.failure_reason = "Invalid credentials";
    loginAttempt.user_id = user.id;
    await prisma.loginAttempt.create({ data: loginAttempt });
    throw new Error("Invalid credentials");
  }

  // If 2FA is enabled and no code provided, create a pending token
  if (user.two_factor_enabled && !credentials.twoFactorCode) {
    // Create a temporary pending auth token
    const pendingToken = createId();
    const pendingExpiry = new Date();
    pendingExpiry.setMinutes(pendingExpiry.getMinutes() + 5); // 5 minutes expiry

    // Store pending auth in database
    await prisma.pendingAuth.create({
      data: {
        token: pendingToken,
        user_id: user.id,
        expires_at: pendingExpiry,
        ip_address: ipAddress,
        user_agent: userAgent || null,
      },
    });

    // Log partial success
    loginAttempt.success = true;
    loginAttempt.user_id = user.id;
    loginAttempt.failure_reason = null;
    await prisma.loginAttempt.create({ data: loginAttempt });

    return {
      user: sanitizeUser(user),
      session: {} as Session, // Empty session as it's not created yet
      pendingToken,
    };
  }

  // Verify 2FA if enabled and code provided
  if (user.two_factor_enabled && credentials.twoFactorCode) {
    if (!user.two_factor_secret) {
      throw new Error("Two-factor authentication is not properly configured");
    }

    const isValid2FA = verify2FAToken(user.two_factor_secret, credentials.twoFactorCode);

    if (!isValid2FA) {
      loginAttempt.failure_reason = "Invalid 2FA code";
      loginAttempt.user_id = user.id;
      await prisma.loginAttempt.create({ data: loginAttempt });
      throw new Error("Invalid two-factor authentication code");
    }
  }

  // Create session
  const sessionId = createId();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  const session = await prisma.session.create({
    data: {
      id: sessionId,
      user_id: user.id,
      token: createId(),
      ip_address: ipAddress,
      expires_at: expiresAt,
    },
  });

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { last_login_at: new Date() },
  });

  // Log successful login
  loginAttempt.success = true;
  loginAttempt.user_id = user.id;
  loginAttempt.failure_reason = null;
  await prisma.loginAttempt.create({ data: loginAttempt });

  return {
    user: sanitizeUser(user),
    session,
  };
}

// Setup 2FA
export async function setup2FA(userId: number, hostname: string): Promise<TwoFactorSetupData> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const secret = speakeasy.generateSecret({
    name: `${hostname}:${user.email}`,
    issuer: authConfig.twoFactor.issuer,
  });

  // Manually build otpauth URL with issuer parameter
  const otpauthUrl = speakeasy.otpauthURL({
    secret: secret.base32,
    label: `${hostname}:${user.email}`,
    issuer: authConfig.twoFactor.issuer,
    encoding: "base32",
  });

  // Save secret (encrypted in production)
  await prisma.user.update({
    where: { id: userId },
    data: {
      two_factor_secret: secret.base32,
    },
  });

  const qrCode = await QRCode.toDataURL(otpauthUrl);

  return {
    secret: secret.base32,
    qrCode: qrCode,
    otpauth: otpauthUrl,
  };
}

// Enable 2FA
export async function enable2FA(
  userId: number,
  secret: string,
  token: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { success: false, error: "User not found" };
  }

  const isValid = verify2FAToken(secret, token);
  if (!isValid) {
    return { success: false, error: "Invalid verification code" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      two_factor_enabled: true,
      two_factor_secret: secret,
    },
  });

  return { success: true };
}

// Verify 2FA token
export function verify2FAToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: authConfig.twoFactor.window,
  });
}

// Get user by session
export async function getUserBySession(sessionToken: string): Promise<AuthUser | null> {
  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    include: {
      user: {
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
      },
    },
  });

  if (!session || session.expires_at < new Date()) {
    return null;
  }

  return sanitizeUser(session.user);
}

// Check permission
export function hasPermission(user: AuthUser, resource: string, action: string): boolean {
  for (const userRole of user.roles) {
    for (const rolePermission of userRole.role.permissions) {
      const perm = rolePermission.permission;
      if (perm.resource === resource && perm.action === action) {
        return true;
      }
    }
  }
  return false;
}

// Define user with roles type
type UserWithRoles = User & {
  user_roles: Array<{
    role: {
      id: number;
      name: string;
      display_name: string;
      role_permissions: Array<{
        permission: Permission;
      }>;
    };
  }>;
};

// Sanitize user data (remove sensitive fields)
function sanitizeUser(user: UserWithRoles): AuthUser {
  const {
    password_hash: _password_hash,
    two_factor_secret: _two_factor_secret,
    recovery_codes: _recovery_codes,
    verification_token: _verification_token,
    user_roles,
    ...sanitized
  } = user;

  // Transform user_roles to match AuthUser format
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

// Verify pending login with 2FA code
export async function verifyPendingLogin(
  pendingToken: string,
  twoFactorCode: string,
  ipAddress: string,
  userAgent?: string,
): Promise<{ user: AuthUser; session: Session; requiresSetup: boolean }> {
  // Find pending auth
  const pendingAuth = await prisma.pendingAuth.findUnique({
    where: { token: pendingToken },
    include: {
      user: {
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
      },
    },
  });

  if (!pendingAuth || pendingAuth.expires_at < new Date()) {
    // Clean up expired token
    if (pendingAuth) {
      await prisma.pendingAuth.delete({ where: { id: pendingAuth.id } });
    }
    throw new Error("Invalid or expired authentication token");
  }

  const user = pendingAuth.user;

  // Verify 2FA code
  if (!user.two_factor_secret) {
    throw new Error("Two-factor authentication is not properly configured");
  }

  const isValid2FA = verify2FAToken(user.two_factor_secret, twoFactorCode);
  if (!isValid2FA) {
    // Log failed attempt
    await prisma.loginAttempt.create({
      data: {
        email: user.email,
        ip_address: ipAddress,
        success: false,
        failure_reason: "Invalid 2FA code during verification",
        user_id: user.id,
        user_agent: userAgent || null,
      },
    });
    throw new Error("Invalid two-factor authentication code");
  }

  // Create session
  const sessionId = createId();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  const session = await prisma.session.create({
    data: {
      id: sessionId,
      user_id: user.id,
      token: createId(),
      ip_address: ipAddress,
      expires_at: expiresAt,
    },
  });

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { last_login_at: new Date() },
  });

  // Clean up pending auth
  await prisma.pendingAuth.delete({ where: { id: pendingAuth.id } });

  // Check if 2FA setup is required
  let requiresSetup = false;
  if (!user.two_factor_enabled) {
    const force2FASetting = await prisma.setting.findUnique({
      where: { key: "force_two_factor" },
    });
    requiresSetup = force2FASetting?.value === "true";
  }

  return {
    user: sanitizeUser(user),
    session,
    requiresSetup,
  };
}

// Logout
export async function logout(sessionId: string): Promise<void> {
  try {
    await prisma.session.delete({
      where: { id: sessionId },
    });
  } catch (error) {
    // Ignore error if session doesn't exist
    if (error instanceof Error && "code" in error && error.code !== "P2025") {
      throw error;
    }
  }
}

// Verify email
export async function verifyEmail(token: string): Promise<boolean> {
  const user = await prisma.user.findFirst({
    where: { verification_token: token },
  });

  if (!user) throw new Error("Invalid verification token");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      is_verified: true,
      verification_token: null,
    },
  });

  return true;
}
