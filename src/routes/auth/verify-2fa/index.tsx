import { component$ } from "@builder.io/qwik";
import { type DocumentHead, Form, routeAction$, z, zod$ } from "@builder.io/qwik-city";
import { LuShield, LuXCircle } from "@qwikest/icons/lucide";
import { Button } from "~/components/ui/Button";
import { OTPInput } from "~/components/ui/OTPInput";
import { siteConfig } from "~/config/site";
import { authConfig } from "~/server/auth/config";
import { verifyPendingLogin } from "~/server/services/auth.service";
import { getIpAddress } from "~/utils/ip";

export const useVerify2FAAction = routeAction$(
  async (data, { cookie, fail, redirect, request }) => {
    const pendingToken = cookie.get("pending_auth")?.value;

    if (!pendingToken) {
      throw redirect(302, "/auth/login");
    }

    const ipAddress = getIpAddress(request);
    const userAgent = request.headers.get("user-agent") || undefined;

    let verifyResult: Awaited<ReturnType<typeof verifyPendingLogin>>;
    try {
      verifyResult = await verifyPendingLogin(pendingToken, data.twoFactorCode, ipAddress, userAgent);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return fail(401, {
        error: errorMessage,
      });
    }

    const { session, requiresSetup } = verifyResult;

    // Clear pending auth cookie
    cookie.delete("pending_auth");

    // Set session cookie
    cookie.set(authConfig.session.cookieName, session.token, authConfig.session.cookieOptions);

    // Check if 2FA setup is required
    if (requiresSetup) {
      throw redirect(302, "/auth/setup-2fa");
    }

    // Redirect to dashboard
    throw redirect(302, "/dashboard");
  },
  zod$({
    twoFactorCode: z.string().length(6, "Authentication code must be 6 digits"),
  }),
);

export default component$(() => {
  const action = useVerify2FAAction();
  const actionData = action.value;

  return (
    <>
      <div>
        <img class="mx-auto h-12 w-auto" src="/logo.svg" alt="Qwik Dashboard" />
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Two-Factor Authentication
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      <Form action={action} class="mt-8 space-y-6">
        <div class="space-y-4">
          <div class="flex justify-center">
            <LuShield class="h-16 w-16 text-indigo-600 dark:text-indigo-400" />
          </div>

          <div class="space-y-2">
            <p class="block text-sm font-medium text-gray-700 dark:text-gray-300 text-center">Authentication Code</p>
            <OTPInput name="twoFactorCode" length={6} autoFocus={true} />
          </div>
        </div>

        {actionData?.failed && (
          <div class="rounded-md bg-red-50 dark:bg-red-900 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <LuXCircle class="h-5 w-5 text-red-400" />
              </div>
              <div class="ml-3">
                {actionData.fieldErrors?.twoFactorCode && (
                  <p class="text-sm font-medium text-red-800 dark:text-red-200">
                    {actionData.fieldErrors.twoFactorCode}
                  </p>
                )}
                {actionData.error && (
                  <h3 class="text-sm font-medium text-red-800 dark:text-red-200">{actionData.error}</h3>
                )}
              </div>
            </div>
          </div>
        )}

        <div>
          <Button type="submit" variant="primary" loading={action.isRunning} class="w-full">
            {action.isRunning ? "Verifying..." : "Verify"}
          </Button>
        </div>

        <div class="text-center">
          <a
            href="/auth/login"
            class="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Back to login
          </a>
        </div>
      </Form>
    </>
  );
});

export const head: DocumentHead = {
  title: `Two-Factor Authentication - ${siteConfig.name}`,
  meta: [
    {
      name: "description",
      content: "Verify your two-factor authentication code",
    },
  ],
};
