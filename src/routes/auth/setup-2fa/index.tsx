import { $, component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Form, routeAction$, routeLoader$, z, zod$ } from "@builder.io/qwik-city";
import { LuCheck, LuCopy, LuShield } from "@qwikest/icons/lucide";
import { Button } from "~/components/ui/Button";
import { OTPInput } from "~/components/ui/OTPInput";
import { siteConfig } from "~/config/site";
import { SHARED_MAP_KEYS } from "~/constants/shared-map-keys";
import * as authService from "~/server/services/auth.service";

export const useCheckForce2FA = routeLoader$(async ({ sharedMap, redirect }) => {
  const authUser = sharedMap.get(SHARED_MAP_KEYS.AUTH_USER);

  if (!authUser) {
    throw redirect(302, "/auth/login");
  }

  // If user already has 2FA enabled, redirect to dashboard
  if (authUser.two_factor_enabled) {
    throw redirect(302, "/dashboard");
  }

  const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";
  // Generate 2FA setup
  const setup = await authService.setup2FA(authUser.id, hostname);

  // Import server-side config
  const { authConfig } = await import("~/server/auth/config.server");

  return {
    user: authUser,
    setup,
    issuer: authConfig.twoFactor.issuer,
  };
});

export const useEnable2FA = routeAction$(
  async (data, { sharedMap, redirect, fail }) => {
    const authUser = sharedMap.get(SHARED_MAP_KEYS.AUTH_USER);

    if (!authUser) {
      return fail(403, {
        error: "Not logged in",
      });
    }

    let result: { success: boolean; error?: string };
    try {
      result = await authService.enable2FA(authUser.id, data.secret, data.token);
    } catch (_error) {
      return fail(500, {
        error: "Failed to enable 2FA",
      });
    }

    if (result.success) {
      // After successful enablement, redirect to dashboard
      throw redirect(302, "/dashboard");
    } else {
      return fail(400, {
        error: result.error || "Verification failed",
      });
    }
  },
  zod$({
    secret: z.string().min(1, "Secret is required"),
    token: z.string().length(6, "Verification code must be 6 digits"),
  }),
);

export default component$(() => {
  const data = useCheckForce2FA();
  const enable2FA = useEnable2FA();
  const copiedSecret = useSignal(false);

  // Build OTP URI - using custom format
  const otpUri = (() => {
    if (!data.value?.setup?.secret || !data.value?.user?.email || !data.value?.issuer) {
      return "";
    }
    const issuer = data.value.issuer;
    const account = data.value.user.email;
    const secret = data.value.setup.secret;
    const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";

    // URL encode parameters
    const encodedIssuer = encodeURIComponent(issuer);
    const encodedAccount = encodeURIComponent(account);

    return `otpauth://totp/${encodeURIComponent(hostname)}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}`;
  })();

  const copyToClipboard = $((text: string) => {
    navigator.clipboard.writeText(text);
    copiedSecret.value = true;
    setTimeout(() => {
      copiedSecret.value = false;
    }, 2000);
  });

  return (
    <div class="w-full max-w-2xl mx-auto">
      <div class="text-center mb-8">
        <LuShield class="mx-auto h-12 w-12 text-primary" />
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">Set up Two-Factor Authentication</h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          To protect your account security, the system requires you to enable two-factor authentication
        </p>
      </div>

      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div class="space-y-6">
          {/* QR code */}
          {data.value?.setup?.qrCode && (
            <>
              <div class="flex justify-center">
                <img src={data.value.setup.qrCode} alt="2FA QR Code" class="flex-1 rounded-lg " />
              </div>

              {/* Authenticator link */}
              <div class="space-y-2">
                <label for="secret-input" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Authenticator link
                </label>
                <div class="flex items-center gap-2 w-full">
                  <input
                    id="secret-input"
                    value={otpUri}
                    readOnly
                    class="block w-full h-10 px-3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs font-mono dark:bg-gray-700 dark:border-gray-600 dark:text-white flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick$={() => copyToClipboard(otpUri)}
                    class="shrink-0 flex items-center"
                  >
                    {copiedSecret.value ? (
                      <>
                        <LuCheck class="h-4 w-4 mr-1" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <LuCopy class="h-4 w-4 mr-1" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div class="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p class="text-sm text-blue-600 dark:text-blue-400">
                  Use Google Authenticator, Microsoft Authenticator or other supported apps to scan the QR code
                </p>
              </div>

              {/* Verification form */}
              <Form action={enable2FA} class="space-y-4">
                <input type="hidden" name="secret" value={data.value.setup.secret} />
                <div class="space-y-2">
                  <p class="block text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                    Enter verification code
                  </p>
                  <OTPInput name="token" length={6} class="mt-2" />
                </div>
                <div class="flex justify-center">
                  <Button type="submit" loading={enable2FA.isRunning}>
                    {enable2FA.isRunning ? "Verifying..." : "Verify and continue"}
                  </Button>
                </div>
              </Form>

              {enable2FA.value?.failed && (
                <div class="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  {enable2FA.value.fieldErrors?.token && (
                    <p class="text-sm text-red-600 dark:text-red-400">{enable2FA.value.fieldErrors.token}</p>
                  )}
                  {enable2FA.value.error && (
                    <p class="text-sm text-red-600 dark:text-red-400">{enable2FA.value.error}</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: `Set up Two-Factor Authentication - ${siteConfig.name}`,
  meta: [
    {
      name: "description",
      content: "Set up two-factor authentication to protect your account",
    },
  ],
};
