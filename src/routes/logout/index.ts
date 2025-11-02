import type { RequestHandler } from "@builder.io/qwik-city";
import { authConfig } from "~/server/auth/config";
import { logout } from "~/server/services/auth.service";

const handleLogout: RequestHandler = async ({ cookie, redirect }) => {
  const sessionCookie = cookie.get(authConfig.session.cookieName);

  if (sessionCookie?.value) {
    try {
      await logout(sessionCookie.value);
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  // Clear session cookie
  cookie.delete(authConfig.session.cookieName, { path: "/" });

  // Redirect to login
  throw redirect(302, "/auth/login");
};

// Support all HTTP methods for logout
export const onRequest = handleLogout;
