import { routeLoader$ } from "@builder.io/qwik-city";
import { SHARED_MAP_KEYS } from "~/constants/shared-map-keys";
import { hasPermission } from "~/server/services/auth.service";
import type { AuthUser } from "~/types/auth";

/**
 * Hook to get authenticated user data from sharedMap
 * This should be used in all pages that need user information
 */
export const useAuthUser = routeLoader$(async ({ sharedMap }) => {
  const authUser = sharedMap.get(SHARED_MAP_KEYS.AUTH_USER) as AuthUser | undefined;
  return authUser;
});

/**
 * Hook to check if current user has specific permission
 * Returns both the user and permission check result
 */
export const useCheckPermission = (resource: string, action: string) => {
  return routeLoader$(async ({ sharedMap }) => {
    const authUser = sharedMap.get(SHARED_MAP_KEYS.AUTH_USER) as AuthUser | undefined;

    if (!authUser) {
      return {
        user: null,
        hasPermission: false,
      };
    }

    return {
      user: authUser,
      hasPermission: hasPermission(authUser, resource, action),
    };
  });
};

/**
 * Hook to get user with multiple permission checks
 * Useful for pages that need to check multiple permissions
 */
export const useAuthWithPermissions = (permissions: Array<{ resource: string; action: string }>) => {
  return routeLoader$(async ({ sharedMap }) => {
    const authUser = sharedMap.get(SHARED_MAP_KEYS.AUTH_USER) as AuthUser | undefined;

    if (!authUser) {
      return {
        user: null,
        permissions: permissions.reduce(
          (acc, perm) => {
            acc[`${perm.resource}:${perm.action}`] = false;
            return acc;
          },
          {} as Record<string, boolean>,
        ),
      };
    }

    const permissionResults = permissions.reduce(
      (acc, perm) => {
        acc[`${perm.resource}:${perm.action}`] = hasPermission(authUser, perm.resource, perm.action);
        return acc;
      },
      {} as Record<string, boolean>,
    );

    return {
      user: authUser,
      permissions: permissionResults,
    };
  });
};

/**
 * Hook that requires specific permission and redirects if not authorized
 * This is a factory function that returns a routeLoader
 */
export const useRequirePermission = (resource: string, action: string, redirectTo = "/403") => {
  return routeLoader$(async ({ sharedMap, redirect }) => {
    const authUser = sharedMap.get(SHARED_MAP_KEYS.AUTH_USER) as AuthUser | undefined;

    if (!authUser) {
      throw redirect(302, "/auth/login");
    }

    if (!hasPermission(authUser, resource, action)) {
      throw redirect(302, redirectTo);
    }

    return authUser;
  });
};
