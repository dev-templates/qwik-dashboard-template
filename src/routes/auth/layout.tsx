import { component$, Slot } from "@builder.io/qwik";
import type { RequestHandler } from "@builder.io/qwik-city";
import { SHARED_MAP_KEYS } from "~/constants/shared-map-keys";

export const onRequest: RequestHandler = async ({ sharedMap, redirect, pathname }) => {
  const authUser = sharedMap.get(SHARED_MAP_KEYS.AUTH_USER);

  // Allow access to setup-2fa page for logged-in users who need to set up 2FA
  if (pathname === "/auth/setup-2fa" || pathname.startsWith("/auth/setup-2fa/")) {
    // Don't do any redirects on setup-2fa page
    return;
  }

  // If already logged in, redirect to dashboard
  if (authUser) {
    throw redirect(302, "/dashboard");
  }
};

export default component$(() => {
  return (
    <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <Slot />
      </div>
    </div>
  );
});
