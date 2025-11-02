import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { LuSettings, LuShield, LuUser, LuUsers } from "@qwikest/icons/lucide";
import { Box, PageHeader } from "~/components/ui";
import { siteConfig } from "~/config/site";
import { useAuthUser } from "~/hooks/useAuth";

// Use the auth hook instead of directly accessing sharedMap
export const useUserData = useAuthUser;

export default component$(() => {
  const userData = useUserData();

  return (
    <div class="space-y-6">
      <PageHeader title="Dashboard" />

      {/* Welcome message */}
      <Box>
        <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-white">
          Welcome back, {userData.value?.name || userData.value?.username}!
        </h3>
        <div class="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
          <p>You're logged in as {userData.value?.email}</p>
        </div>
        <div class="mt-3 text-sm">
          <p class="font-medium text-gray-700 dark:text-gray-300">
            Your roles: {userData.value?.roles?.map((r) => r.role.display_name).join(", ") || "None"}
          </p>
        </div>
      </Box>

      {/* Personal Stats - for all users */}
      <div>
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Your Activity</h2>
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Box>
            <dt class="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Login Count (30 days)</dt>
            <dd class="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">12</dd>
          </Box>

          <Box>
            <dt class="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Last Login</dt>
            <dd class="mt-1 text-xl font-semibold tracking-tight text-gray-900 dark:text-white">Today</dd>
          </Box>

          <Box>
            <dt class="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Account Status</dt>
            <dd class="mt-1 text-xl font-semibold tracking-tight text-green-600 dark:text-green-400">Active</dd>
          </Box>
        </div>
      </div>

      {/* Admin Section - Only visible to admins */}
      {userData.value?.roles?.some((r) => r.role.name === "admin") && (
        <>
          {/* System Stats - Admin only */}
          <div>
            <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">System Overview</h2>
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Box>
                <dt class="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</dt>
                <dd class="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">3</dd>
              </Box>

              <Box>
                <dt class="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Active Sessions</dt>
                <dd class="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">1</dd>
              </Box>

              <Box>
                <dt class="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Total Roles</dt>
                <dd class="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">3</dd>
              </Box>
            </div>
          </div>
          {/* Administration Actions */}
          <div>
            <h2 class="text-lg font-medium text-gray-900 dark:text-white">Administration</h2>
            <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <a
                href="/dashboard/users"
                class="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
              >
                <div>
                  <span class="inline-flex rounded-lg bg-purple-500 p-3">
                    <LuUsers class="h-6 w-6 text-white" />
                  </span>
                </div>
                <div class="mt-4">
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white">Manage Users</h3>
                  <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    View and manage user accounts and permissions
                  </p>
                </div>
              </a>

              <a
                href="/dashboard/roles"
                class="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
              >
                <div>
                  <span class="inline-flex rounded-lg bg-red-500 p-3">
                    <LuShield class="h-6 w-6 text-white" />
                  </span>
                </div>
                <div class="mt-4">
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white">Manage Roles</h3>
                  <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Configure roles and permissions</p>
                </div>
              </a>

              <a
                href="/dashboard/settings"
                class="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
              >
                <div>
                  <span class="inline-flex rounded-lg bg-gray-500 p-3">
                    <LuSettings class="h-6 w-6 text-white" />
                  </span>
                </div>
                <div class="mt-4">
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white">System Settings</h3>
                  <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Configure system-wide settings</p>
                </div>
              </a>
            </div>
          </div>
        </>
      )}

      {/* Quick actions - for all users */}
      <div>
        <h2 class="text-lg font-medium text-gray-900 dark:text-white">Quick Actions</h2>
        <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <a
            href="/dashboard/profile"
            class="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
          >
            <div>
              <span class="inline-flex rounded-lg bg-indigo-500 p-3">
                <LuUser class="h-6 w-6 text-white" />
              </span>
            </div>
            <div class="mt-4">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">Edit Profile</h3>
              <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Update your personal information and preferences
              </p>
            </div>
          </a>

          <a
            href="/dashboard/security"
            class="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
          >
            <div>
              <span class="inline-flex rounded-lg bg-green-500 p-3">
                <LuShield class="h-6 w-6 text-white" />
              </span>
            </div>
            <div class="mt-4">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">Security Settings</h3>
              <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Manage your password and two-factor authentication
              </p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: `Dashboard - ${siteConfig.name}`,
  meta: [
    {
      name: "description",
      content: "Qwik Dashboard - Enterprise-grade dashboard template",
    },
  ],
};
