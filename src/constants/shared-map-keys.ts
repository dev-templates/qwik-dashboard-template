/**
 * Shared map keys used across the application
 * This centralizes all the string keys used in sharedMap to avoid typos and make refactoring easier
 */

export const SHARED_MAP_KEYS = {
  /** The authenticated user object stored in the shared map */
  AUTH_USER: "authUser",
  /** The session ID for the current request */
  SESSION_ID: "sessionId",
} as const;

// Type-safe helper to get the auth user from shared map
export type SharedMapAuthUser = "authUser";
