import { component$ } from "@builder.io/qwik";
import { Form, routeAction$, routeLoader$, z, zod$ } from "@builder.io/qwik-city";
import { LuShield } from "@qwikest/icons/lucide";
import { Box, Button, PageHeader } from "~/components/ui";
import { SHARED_MAP_KEYS } from "~/constants/shared-map-keys";
import { useAuthWithPermissions } from "~/hooks/useAuth";
import { prisma } from "~/server/db";
import { hasPermission } from "~/server/services/auth.service";
import type { AuthUser } from "~/types/auth";

// Use the auth hook to check permissions
export const useAuthData = useAuthWithPermissions([
  { resource: "settings", action: "read" },
  { resource: "settings", action: "update" },
]);

export const useLoadSettings = routeLoader$(async ({ sharedMap }) => {
  const authUser = sharedMap.get(SHARED_MAP_KEYS.AUTH_USER) as AuthUser | undefined;

  if (!authUser || !hasPermission(authUser, "settings", "read")) {
    return {
      success: false,
      forceTwoFactor: false,
    };
  }

  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "force_two_factor" },
    });

    return {
      success: true,
      forceTwoFactor: setting?.value === "true",
    };
  } catch (_e) {
    return {
      success: false,
      forceTwoFactor: false,
    };
  }
});

export const useUpdateSettings = routeAction$(
  async (data, { fail, sharedMap }) => {
    const authUser = sharedMap.get(SHARED_MAP_KEYS.AUTH_USER) as AuthUser | undefined;

    if (!authUser || !hasPermission(authUser, "settings", "update")) {
      return fail(403, {
        error: "No permission to modify system settings",
      });
    }

    try {
      // In Qwik, when checkbox is checked, it sends name attribute as key and value attribute as value
      // When unchecked, the key won't appear in FormData
      const forceTwoFactor = "forceTwoFactor" in data;

      // Update or create setting
      await prisma.setting.upsert({
        where: { key: "force_two_factor" },
        update: {
          value: forceTwoFactor.toString(),
          type: "boolean",
        },
        create: {
          key: "force_two_factor",
          value: forceTwoFactor.toString(),
          type: "boolean",
          description: "Force all users to enable two-factor authentication",
        },
      });

      return {
        success: true,
        message: "Settings updated",
      };
    } catch (_e) {
      return fail(500, {
        error: "Failed to update settings",
      });
    }
  },
  zod$({
    forceTwoFactor: z.string().optional(),
  }),
);

export default component$(() => {
  const updateSettings = useUpdateSettings();
  const loadSettings = useLoadSettings();
  const authData = useAuthData();

  return (
    <div class="space-y-6">
      <PageHeader title="System Settings" />

      {!authData.value?.permissions["settings:read"] && (
        <div class="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p class="text-sm text-red-600 dark:text-red-400">You don't have permission to view system settings.</p>
        </div>
      )}

      <div class="grid gap-6">
        {/* Security Settings */}
        <Box>
          <div class="mb-4 flex items-center gap-2">
            <LuShield class="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Security Settings</h2>
          </div>

          <Form action={updateSettings} class="space-y-6">
            <div class="flex items-center justify-between rounded-lg border p-4">
              <div class="space-y-0.5">
                <label for="forceTwoFactor" class="text-base font-medium text-gray-900 dark:text-white">
                  Force Two-Factor Authentication
                </label>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Require all users to enable two-factor authentication on first login
                </p>
              </div>
              <input
                id="forceTwoFactor"
                type="checkbox"
                name="forceTwoFactor"
                value="true"
                checked={loadSettings.value?.forceTwoFactor || false}
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div class="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                loading={updateSettings.isRunning}
                disabled={!authData.value?.permissions["settings:update"]}
                title={
                  !authData.value?.permissions["settings:update"]
                    ? "You don't have permission to modify settings"
                    : undefined
                }
              >
                {updateSettings.isRunning ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </Form>

          {updateSettings.value?.success && (
            <div class="mt-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p class="text-sm text-green-600 dark:text-green-400">{updateSettings.value.message}</p>
            </div>
          )}

          {updateSettings.value?.fieldErrors && (
            <div class="mt-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p class="text-sm text-red-600 dark:text-red-400">Save failed, please check your input.</p>
            </div>
          )}

          {updateSettings.value &&
            "message" in updateSettings.value &&
            updateSettings.value.message &&
            !updateSettings.value.success && (
              <div class="mt-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p class="text-sm text-red-600 dark:text-red-400">{updateSettings.value.message}</p>
              </div>
            )}
        </Box>
      </div>
    </div>
  );
});
