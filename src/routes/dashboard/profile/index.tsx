import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { LuInfo } from "@qwikest/icons/lucide";
import { siteConfig } from "~/config/site";
import { useAuthUser } from "~/hooks/useAuth";
import { formatDateTime } from "~/utils/date";

// Use the auth hook instead of directly accessing sharedMap
export const useUserData = useAuthUser;

export default component$(() => {
  const userData = useUserData();

  return (
    <div class="max-w-4xl">
      <div class="px-4 sm:px-0">
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Profile</h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage your personal information and preferences</p>
      </div>

      {/* Profile Information */}
      <div class="mt-6 bg-white dark:bg-gray-800 shadow sm:rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-white">Personal Information</h3>
          <div class="mt-5 border-t border-gray-200 dark:border-gray-700">
            <dl class="divide-y divide-gray-200 dark:divide-gray-700">
              <div class="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Full name</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                  {userData.value?.name || "Not set"}
                </dd>
              </div>
              <div class="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Username</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                  {userData.value?.username}
                </dd>
              </div>
              <div class="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Email address</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                  {userData.value?.email}
                </dd>
              </div>
              <div class="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Account status</dt>
                <dd class="mt-1 text-sm sm:mt-0 sm:col-span-2">
                  <span class="inline-flex px-2 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Active
                  </span>
                </dd>
              </div>
              <div class="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Role</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                  {userData.value?.roles?.map((r) => r.role.display_name).join(", ") || "User"}
                </dd>
              </div>
              <div class="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Member since</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                  {formatDateTime(userData.value?.created_at)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Coming Soon Notice */}
      <div class="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <LuInfo class="h-5 w-5 text-blue-400" />
          </div>
          <div class="ml-3 flex-1">
            <p class="text-sm text-blue-700 dark:text-blue-200">
              Profile editing functionality will be available soon. Stay tuned!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: `Profile - ${siteConfig.name}`,
  meta: [
    {
      name: "description",
      content: "Manage your profile information",
    },
  ],
};
