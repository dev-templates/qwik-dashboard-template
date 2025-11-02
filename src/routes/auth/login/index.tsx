import { component$ } from "@builder.io/qwik";
import { type DocumentHead, Form, routeAction$, z, zod$ } from "@builder.io/qwik-city";
import { LuLock, LuXCircle } from "@qwikest/icons/lucide";
import { Button } from "~/components/ui/Button";
import { siteConfig } from "~/config/site";
import { authConfig } from "~/server/auth/config";
import { prisma } from "~/server/db";
import { login } from "~/server/services/auth.service";
import { getIpAddress } from "~/utils/ip";

export const useLoginAction = routeAction$(
  async (data, { cookie, fail, redirect, request }) => {
    const ipAddress = getIpAddress(request);
    const userAgent = request.headers.get("user-agent") || undefined;

    let loginResult: Awaited<ReturnType<typeof login>>;
    try {
      loginResult = await login(
        {
          email: data.email,
          password: data.password,
        },
        ipAddress,
        userAgent,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return fail(401, {
        error: errorMessage,
      });
    }

    const { session, user, pendingToken } = loginResult;

    // If 2FA is required, store pending token and redirect to 2FA page
    if (pendingToken) {
      cookie.set("pending_auth", pendingToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 5, // 5 minutes
        path: "/",
      });
      throw redirect(302, "/auth/verify-2fa");
    }

    // Set session cookie
    cookie.set(authConfig.session.cookieName, session.token, authConfig.session.cookieOptions);

    // Check if 2FA enforcement is required
    if (!user.two_factor_enabled) {
      let force2FASetting: { value: string } | null = null;
      try {
        force2FASetting = await prisma.setting.findUnique({
          where: { key: "force_two_factor" },
        });
      } catch {
        // Ignore error, proceed without force 2FA
      }

      if (force2FASetting && force2FASetting.value === "true") {
        // Need to enforce 2FA setup
        throw redirect(302, "/auth/setup-2fa");
      }
    }

    // Redirect to dashboard using Qwik's built-in redirect
    throw redirect(302, "/dashboard");
  },
  zod$({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(1, "Password is required"),
  }),
);

export default component$(() => {
  const action = useLoginAction();
  const actionData = action.value;

  return (
    <>
      <div>
        <img class="mx-auto h-12 w-auto" src="/logo.svg" alt="Qwik Dashboard" />
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">Sign in to your account</h2>
        <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">Demo accounts available below</p>
      </div>

      <Form action={action} class="mt-8 space-y-6">
        <input type="hidden" name="remember" value="true" />
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="email" class="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              placeholder="Email address"
            />
          </div>
          <div>
            <label for="password" class="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              placeholder="Password"
            />
          </div>
        </div>

        {actionData?.failed && (
          <div class="rounded-md bg-red-50 dark:bg-red-900 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <LuXCircle class="h-5 w-5 text-red-400" />
              </div>
              <div class="ml-3">
                {actionData.fieldErrors?.email && (
                  <p class="text-sm font-medium text-red-800 dark:text-red-200">{actionData.fieldErrors.email}</p>
                )}
                {actionData.fieldErrors?.password && (
                  <p class="text-sm font-medium text-red-800 dark:text-red-200">{actionData.fieldErrors.password}</p>
                )}
                {actionData.error && (
                  <h3 class="text-sm font-medium text-red-800 dark:text-red-200">{actionData.error}</h3>
                )}
              </div>
            </div>
          </div>
        )}

        <div>
          <Button type="submit" variant="primary" loading={action.isRunning} class="w-full relative">
            <span class="absolute left-0 inset-y-0 flex items-center pl-3">
              <LuLock class="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" />
            </span>
            {action.isRunning ? "Signing in..." : "Sign in"}
          </Button>
        </div>
      </Form>

      <div class="mt-6">
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300 dark:border-gray-600" />
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">Demo accounts</span>
          </div>
        </div>

        <div class="mt-6 text-sm text-gray-600 dark:text-gray-400">
          <p class="mb-2">Admin: admin@example.com / password123</p>
          <p class="mb-2">Editor: editor@example.com / password123</p>
          <p>User: user@example.com / password123</p>
        </div>
      </div>
    </>
  );
});

export const head: DocumentHead = {
  title: `Login - ${siteConfig.name}`,
  meta: [
    {
      name: "description",
      content: "Login to your Qwik Dashboard account",
    },
  ],
};
