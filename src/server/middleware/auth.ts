import type { RequestHandler } from "@builder.io/qwik-city";
import { SHARED_MAP_KEYS } from "~/constants/shared-map-keys";
import type { AuthUser } from "~/types/auth";
import { authConfig } from "../auth/config";
import { prisma } from "../db";
import { getUserBySession, hasPermission } from "../services/auth.service";

declare module "@builder.io/qwik-city" {
  interface RequestEventCommon {
    authUser?: AuthUser;
    sessionId?: string;
  }
}

export const authMiddleware: RequestHandler = async ({ cookie, sharedMap, next, pathname, redirect }) => {
  const sessionCookie = cookie.get(authConfig.session.cookieName);

  if (!sessionCookie) {
    sharedMap.set(SHARED_MAP_KEYS.AUTH_USER, null);
    await next();
    return;
  }

  const sessionId = sessionCookie.value;
  let user: AuthUser | null;

  try {
    user = await getUserBySession(sessionId);
  } catch {
    // Session invalid or error occurred
    sharedMap.set(SHARED_MAP_KEYS.AUTH_USER, null);
    await next();
    return;
  }

  if (user) {
    sharedMap.set(SHARED_MAP_KEYS.AUTH_USER, user);
    sharedMap.set(SHARED_MAP_KEYS.SESSION_ID, sessionId);

    // Check if 2FA setup is required
    // Exclude paths that don't need checking
    const excludedPaths = ["/auth/setup-2fa", "/auth/login", "/logout", "/api", "/_qwik", "/assets", "/favicon"];

    const shouldCheckForce2FA = !excludedPaths.some((path) => pathname.startsWith(path));

    if (shouldCheckForce2FA && !user.two_factor_enabled) {
      // Check if system enforces 2FA
      let force2FASetting: { value: string } | null = null;
      try {
        force2FASetting = await prisma.setting.findUnique({
          where: { key: "force_two_factor" },
        });
      } catch {
        // Ignore error, proceed without force 2FA check
      }

      if (force2FASetting && force2FASetting.value === "true") {
        // Force redirect to 2FA setup page
        throw redirect(302, "/auth/setup-2fa");
      }
    }
  } else {
    // Clear invalid session cookie
    cookie.delete(authConfig.session.cookieName);
    sharedMap.set(SHARED_MAP_KEYS.AUTH_USER, null);
  }

  await next(); // Continue middleware chain
};

export const requireAuth: RequestHandler = async ({ sharedMap, redirect, pathname }) => {
  const authUser = sharedMap.get(SHARED_MAP_KEYS.AUTH_USER);

  if (!authUser) {
    throw redirect(302, `/auth/login?redirect=${encodeURIComponent(pathname)}`);
  }
};

export const requirePermission = (resource: string, action: string): RequestHandler => {
  return async ({ sharedMap, redirect }) => {
    const authUser = sharedMap.get(SHARED_MAP_KEYS.AUTH_USER) as AuthUser | undefined;

    if (!authUser) {
      throw redirect(302, "/auth/login");
    }

    if (!hasPermission(authUser, resource, action)) {
      throw redirect(302, "/403");
    }
  };
};

export async function checkPermission(sessionToken: string, resource: string, action: string): Promise<boolean> {
  if (!sessionToken) return false;

  try {
    const user = await getUserBySession(sessionToken);
    if (!user) return false;

    return hasPermission(user, resource, action);
  } catch (_error) {
    return false;
  }
}
