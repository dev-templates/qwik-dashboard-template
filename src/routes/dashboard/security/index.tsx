import { $, component$, useSignal, useTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Form, routeAction$, useNavigate, z, zod$ } from "@builder.io/qwik-city";
import { LuCheck, LuCopy, LuKey, LuMonitor, LuShield } from "@qwikest/icons/lucide";
import { Button } from "~/components/ui/Button";
import { OTPInput } from "~/components/ui/OTPInput";
import { siteConfig } from "~/config/site";
import { SHARED_MAP_KEYS } from "~/constants/shared-map-keys";
import { useAuthUser } from "~/hooks/useAuth";
import { prisma } from "~/server/db";
import * as authService from "~/server/services/auth.service";
import type { AuthUser } from "~/types/auth";

// Use the auth hook instead of directly accessing sharedMap
export const useUserData = useAuthUser;

export const useSetup2FA = routeAction$(async (_, { sharedMap, url, fail }) => {
  const authUser = sharedMap.get(SHARED_MAP_KEYS.AUTH_USER) as AuthUser | undefined;
  if (!authUser) {
    return fail(403, {
      error: "Not logged in",
    });
  }

  try {
    const hostname = url.hostname;
    const result = await authService.setup2FA(authUser.id, hostname);
    return {
      success: true,
      ...result,
    };
  } catch (_error) {
    return fail(500, {
      error: "Failed to set up 2FA",
    });
  }
}, zod$({}));

export const useEnable2FA = routeAction$(
  async (data, { sharedMap, fail }) => {
    const authUser = sharedMap.get(SHARED_MAP_KEYS.AUTH_USER) as AuthUser | undefined;
    if (!authUser) {
      return fail(403, {
        error: "Not logged in",
      });
    }

    try {
      const result = await authService.enable2FA(authUser.id, data.secret, data.token);

      if (result.success) {
        return {
          success: true,
        };
      } else {
        return fail(400, {
          error: result.error || "Verification failed",
        });
      }
    } catch (_error) {
      return fail(500, {
        error: "Failed to enable 2FA",
      });
    }
  },
  zod$({
    secret: z.string().min(1, "Secret is required"),
    token: z.string().length(6, "Verification code must be 6 digits"),
  }),
);

export const useDisable2FA = routeAction$(
  async (data, { sharedMap, fail }) => {
    const authUser = sharedMap.get(SHARED_MAP_KEYS.AUTH_USER) as AuthUser | undefined;
    if (!authUser) {
      return fail(403, {
        error: "Not logged in",
      });
    }

    try {
      // Need to get user's two_factor_secret from database
      const user = await prisma.user.findUnique({
        where: { id: authUser.id },
        select: { two_factor_secret: true },
      });

      if (!user?.two_factor_secret) {
        return fail(400, {
          error: "2FA not enabled",
        });
      }

      // Verify 2FA token
      const isValid = await authService.verify2FAToken(user.two_factor_secret, data.token);

      if (!isValid) {
        return fail(400, {
          error: "Invalid verification code",
        });
      }

      // Disable 2FA
      await prisma.user.update({
        where: { id: authUser.id },
        data: {
          two_factor_enabled: false,
          two_factor_secret: null,
        },
      });

      return {
        success: true,
      };
    } catch (_error) {
      return fail(500, {
        error: "Failed to disable 2FA",
      });
    }
  },
  zod$({
    token: z.string().length(6, "Verification code must be 6 digits"),
  }),
);

export default component$(() => {
  const userData = useUserData();
  const setup2FA = useSetup2FA();
  const enable2FA = useEnable2FA();
  const disable2FA = useDisable2FA();
  const nav = useNavigate();

  const showQRCode = useSignal(false);
  const copiedSecret = useSignal(false);

  useTask$(({ track }) => {
    track(() => setup2FA.value);
    if (setup2FA.value?.success) {
      showQRCode.value = true;
    }
  });

  // When 2FA is successfully enabled or disabled, refresh the page
  useTask$(({ track }) => {
    track(() => enable2FA.value);
    if (enable2FA.value?.success) {
      nav("/dashboard/security");
    }
  });

  useTask$(({ track }) => {
    track(() => disable2FA.value);
    if (disable2FA.value?.success) {
      nav("/dashboard/security");
    }
  });

  const copyToClipboard = $((text: string) => {
    navigator.clipboard.writeText(text);
    copiedSecret.value = true;
    setTimeout(() => {
      copiedSecret.value = false;
    }, 2000);
  });

  // Build OTP URI
  const otpUri = (() => {
    if (!setup2FA.value?.secret || !userData.value?.email) {
      return "";
    }
    const issuer = siteConfig.name;
    const account = userData.value.email;
    const secret = setup2FA.value.secret;
    const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";

    // URL encode parameters
    const encodedIssuer = encodeURIComponent(issuer);
    const encodedAccount = encodeURIComponent(account);

    return `otpauth://totp/${encodeURIComponent(hostname)}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}`;
  })();

  return (
    <div class="max-w-4xl">
      <div class="px-4 sm:px-0">
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Security Settings</h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage your password and security preferences</p>
      </div>

      {/* Two-Factor Authentication */}
      <div class="mt-6 bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6">
        <div class="text-center mb-6">
          <LuShield class="mx-auto h-12 w-12 text-primary" />
          <h3 class="mt-4 text-xl font-semibold text-gray-900 dark:text-white">Two-Factor Authentication (2FA)</h3>
        </div>

        {userData.value?.two_factor_enabled ? (
          <div class="space-y-4">
            <p class="text-sm text-green-600 dark:text-green-400">✓ Two-factor authentication is enabled</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Your account is protected by two-factor authentication
            </p>

            <Form action={disable2FA} class="mt-4 space-y-4">
              <div class="space-y-2">
                <p class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enter verification code to disable 2FA
                </p>
                <OTPInput name="token" length={6} />
              </div>
              <Button type="submit" variant="danger" loading={disable2FA.isRunning}>
                {disable2FA.isRunning ? "Disabling..." : "Disable Two-Factor Authentication"}
              </Button>
            </Form>

            {disable2FA.value?.error && (
              <div class="mt-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p class="text-sm text-red-600 dark:text-red-400">{disable2FA.value.error}</p>
              </div>
            )}

            {disable2FA.value?.success && (
              <div class="mt-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p class="text-sm text-green-600 dark:text-green-400">
                  Two-factor authentication has been successfully disabled, refreshing page...
                </p>
              </div>
            )}
          </div>
        ) : (
          <div class="space-y-4">
            <p class="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
              Add an extra layer of security to your account
            </p>

            {!showQRCode.value ? (
              <Form action={setup2FA} class="flex justify-center">
                <Button type="submit" loading={setup2FA.isRunning}>
                  {setup2FA.isRunning ? "Setting up..." : "Enable Two-Factor Authentication"}
                </Button>
              </Form>
            ) : (
              <div class="space-y-6">
                {/* QR code */}
                {setup2FA.value?.qrCode && (
                  <>
                    <div class="flex justify-center">
                      <img src={setup2FA.value.qrCode} alt="2FA QR Code" class="rounded-lg" />
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
                      <input type="hidden" name="secret" value={setup2FA.value.secret} />
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

                    {enable2FA.value?.error && (
                      <div class="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p class="text-sm text-red-600 dark:text-red-400">{enable2FA.value.error}</p>
                      </div>
                    )}
                  </>
                )}

                {/* Successfully enabled 2FA */}
                {enable2FA.value?.success && (
                  <div class="mt-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <p class="text-sm text-green-600 dark:text-green-400">
                      Two-factor authentication has been successfully enabled!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Change Password */}
      <div class="mt-6 bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6">
        <div class="mb-4 flex items-center gap-2">
          <LuKey class="h-5 w-5 text-primary" />
          <h3 class="text-lg font-medium">Change Password</h3>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400">Update your password to keep your account secure</p>
        <div class="mt-4">
          <Button variant="secondary" disabled>
            Change Password
          </Button>
          <span class="ml-3 text-sm text-gray-500 dark:text-gray-400">Coming soon</span>
        </div>
      </div>

      {/* Active Sessions */}
      <div class="mt-6 bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6">
        <div class="mb-4 flex items-center gap-2">
          <LuMonitor class="h-5 w-5 text-primary" />
          <h3 class="text-lg font-medium">Active Sessions</h3>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Manage your active sessions on different devices</p>
        <div class="space-y-3">
          <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div class="flex items-center space-x-3">
              <LuMonitor class="h-6 w-6 text-gray-400" />
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">Current session</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Your current browser</p>
              </div>
            </div>
            <span class="inline-flex px-2 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: `Security Settings - ${siteConfig.name}`,
  meta: [
    {
      name: "description",
      content: "Manage your security settings and two-factor authentication",
    },
  ],
};
