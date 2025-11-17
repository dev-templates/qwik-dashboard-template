import { $, component$, Slot, useSignal, useTask$ } from "@builder.io/qwik";
import type { RequestHandler } from "@builder.io/qwik-city";
import { routeLoader$, useLocation } from "@builder.io/qwik-city";
import {
  LuCheck,
  LuHome,
  LuLock,
  LuMenu,
  LuMonitor,
  LuMoon,
  LuSettings,
  LuShield,
  LuSun,
  LuUser,
  LuUsers,
  LuX,
} from "@qwikest/icons/lucide";
import { PERMISSION_ACTIONS, PERMISSION_RESOURCES } from "~/constants/permissions";
import { SHARED_MAP_KEYS } from "~/constants/shared-map-keys";
import { requireAuth } from "~/server/middleware/auth";
import type { AuthUser } from "~/types/auth";
import { applyTheme, getThemeFromStorage, setThemeToStorage, type Theme } from "~/utils/theme";

export const onRequest: RequestHandler = requireAuth;

export const onGet: RequestHandler = async ({ cacheControl }) => {
  cacheControl({
    maxAge: 0,
    noCache: true,
    noStore: true,
  });
};

export const useUserData = routeLoader$(async ({ sharedMap }) => {
  const authUser = sharedMap.get(SHARED_MAP_KEYS.AUTH_USER) as AuthUser | undefined;

  if (!authUser) {
    return {
      user: null,
      permissions: {
        usersRead: false,
        rolesRead: false,
        settingsRead: false,
      },
    };
  }

  const { hasPermission } = await import("~/server/services/auth.service");

  // Check permissions for navigation
  const permissions = {
    usersRead: hasPermission(authUser, PERMISSION_RESOURCES.USERS, PERMISSION_ACTIONS.READ),
    rolesRead: hasPermission(authUser, PERMISSION_RESOURCES.ROLES, PERMISSION_ACTIONS.READ),
    settingsRead: hasPermission(authUser, PERMISSION_RESOURCES.SETTINGS, PERMISSION_ACTIONS.READ),
  };

  return {
    user: authUser,
    permissions,
  };
});

export default component$(() => {
  const isMenuOpen = useSignal(false);
  const isProfileMenuOpen = useSignal(false);
  const isThemeMenuOpen = useSignal(false);
  // Initialize theme from localStorage on client side
  const currentTheme = useSignal<Theme>(typeof window !== "undefined" ? getThemeFromStorage() : "system");
  const userData = useUserData();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.url.pathname === path;
  };

  // Apply theme changes reactively
  useTask$(({ track }) => {
    track(() => currentTheme.value);
    if (typeof window !== "undefined") {
      applyTheme(currentTheme.value);
    }
  });

  const handleThemeChange = $((theme: Theme) => {
    currentTheme.value = theme;
    setThemeToStorage(theme);
    applyTheme(theme);
    isThemeMenuOpen.value = false;
  });

  // Build navigation menu based on user permissions
  const navigationGroups = [];

  // Main group - always visible
  navigationGroups.push({
    name: "Main",
    items: [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: LuHome,
      },
    ],
  });

  // Administration group - based on permissions
  const adminItems = [];

  // Check permissions for each admin section
  if (userData.value.permissions.usersRead) {
    adminItems.push({
      name: "Users",
      href: "/dashboard/users",
      icon: LuUsers,
    });
  }

  if (userData.value.permissions.rolesRead) {
    adminItems.push({
      name: "Roles & Permissions",
      href: "/dashboard/roles",
      icon: LuShield,
    });
  }

  if (userData.value.permissions.settingsRead) {
    adminItems.push({
      name: "System Settings",
      href: "/dashboard/settings",
      icon: LuSettings,
    });
  }

  // Only add administration group if user has access to at least one item
  if (adminItems.length > 0) {
    navigationGroups.push({
      name: "Administration",
      items: adminItems,
    });
  }

  // Personal group - always visible
  navigationGroups.push({
    name: "Personal",
    items: [
      {
        name: "Profile",
        href: "/dashboard/profile",
        icon: LuUser,
      },
      {
        name: "Security",
        href: "/dashboard/security",
        icon: LuLock,
      },
    ],
  });

  return (
    <div class="flex flex-col h-full bg-gray-100 dark:bg-gray-900 overflow-hidden">
      <div class="flex h-full overflow-hidden">
        {/* Sidebar - Desktop */}
        <div class="hidden md:flex md:flex-shrink-0">
          <div class="flex flex-col w-64">
            <div class="flex flex-col flex-grow bg-white dark:bg-gray-800 shadow-lg">
              {/* Logo */}
              <div class="flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-700">
                <img class="h-8 w-auto" src="/logo.svg" alt="Qwik Dashboard" />
              </div>

              {/* Navigation */}
              <nav class="flex-1 px-2 py-4 space-y-8 overflow-y-auto">
                {navigationGroups.map((group) => (
                  <div key={group.name}>
                    <h3 class="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      {group.name}
                    </h3>
                    <div class="mt-1 space-y-1">
                      {group.items.map((item) => (
                        <a
                          key={item.name}
                          href={item.href}
                          class={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            isActive(item.href)
                              ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
                              : "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white"
                          }`}
                        >
                          <item.icon
                            class={`mr-3 h-5 w-5 ${
                              isActive(item.href)
                                ? "text-indigo-500 dark:text-indigo-400"
                                : "text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400"
                            }`}
                          />
                          {item.name}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>

              {/* User section at bottom */}
              <div class="border-t border-gray-200 dark:border-gray-700">
                {/* Theme toggle */}
                <div class="px-4 py-3">
                  <div class="relative">
                    <button
                      type="button"
                      onClick$={() => {
                        isThemeMenuOpen.value = !isThemeMenuOpen.value;
                      }}
                      class="group w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md bg-gray-50 hover:bg-gray-100 hover:text-gray-900 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white"
                    >
                      {currentTheme.value === "light" ? (
                        <LuSun class="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400" />
                      ) : currentTheme.value === "dark" ? (
                        <LuMoon class="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400" />
                      ) : (
                        <LuMonitor class="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400" />
                      )}
                      <span class="flex-1 text-left">Theme: {currentTheme.value}</span>
                    </button>

                    {isThemeMenuOpen.value && (
                      <div class="absolute bottom-full left-0 mb-1 w-full rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-700">
                        <div class="py-1">
                          <button
                            type="button"
                            onClick$={() => handleThemeChange("light")}
                            class="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600"
                          >
                            <LuSun class="mr-3 h-5 w-5" />
                            Light
                            {currentTheme.value === "light" && <LuCheck class="ml-auto h-5 w-5 text-indigo-600" />}
                          </button>
                          <button
                            type="button"
                            onClick$={() => handleThemeChange("dark")}
                            class="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600"
                          >
                            <LuMoon class="mr-3 h-5 w-5" />
                            Dark
                            {currentTheme.value === "dark" && <LuCheck class="ml-auto h-5 w-5 text-indigo-600" />}
                          </button>
                          <button
                            type="button"
                            onClick$={() => handleThemeChange("system")}
                            class="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600"
                          >
                            <LuMonitor class="mr-3 h-5 w-5" />
                            System
                            {currentTheme.value === "system" && <LuCheck class="ml-auto h-5 w-5 text-indigo-600" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* User profile */}
                <div class="px-4 py-3">
                  <div class="relative">
                    <button
                      type="button"
                      onClick$={() => {
                        isProfileMenuOpen.value = !isProfileMenuOpen.value;
                      }}
                      class="group w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md bg-gray-50 hover:bg-gray-100 hover:text-gray-900 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white"
                    >
                      <img
                        class="h-8 w-8 rounded-full mr-3"
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                          userData.value.user?.name || userData.value.user?.username || "User",
                        )}&background=6366f1&color=fff`}
                        alt=""
                      />
                      <div class="flex-1 text-left">
                        <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {userData.value.user?.name || userData.value.user?.username || "User"}
                        </p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{userData.value.user?.email}</p>
                      </div>
                    </button>

                    {isProfileMenuOpen.value && (
                      <div class="absolute bottom-full left-0 mb-1 w-full rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-700">
                        <div class="py-1">
                          <a
                            href="/dashboard/profile"
                            class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600"
                          >
                            Your Profile
                          </a>
                          <a
                            href="/dashboard/settings"
                            class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600"
                          >
                            Settings
                          </a>
                          <hr class="my-1 border-gray-200 dark:border-gray-600" />
                          <a
                            href="/logout"
                            class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600"
                          >
                            Sign out
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile sidebar */}
        {isMenuOpen.value && (
          <div class="fixed inset-0 z-40 md:hidden">
            <div
              class="fixed inset-0 bg-gray-600 bg-opacity-75"
              onClick$={() => {
                isMenuOpen.value = false;
              }}
            />

            <div class="relative flex flex-col max-w-xs w-full bg-white dark:bg-gray-800 h-full shadow-xl">
              {/* Mobile sidebar content - same as desktop */}
              <div class="flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-700">
                <img class="h-8 w-auto" src="/logo.svg" alt="Qwik Dashboard" />
                <span class="ml-2 text-xl font-semibold text-gray-800 dark:text-white">Dashboard</span>
                <button
                  type="button"
                  onClick$={() => {
                    isMenuOpen.value = false;
                  }}
                  class="ml-auto -mr-2 p-2 rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <span class="sr-only">Close menu</span>
                  <LuX class="h-6 w-6" />
                </button>
              </div>

              {/* Navigation - same as desktop */}
              <nav class="flex-1 px-2 py-4 space-y-8 overflow-y-auto">
                {navigationGroups.map((group) => (
                  <div key={group.name}>
                    <h3 class="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      {group.name}
                    </h3>
                    <div class="mt-1 space-y-1">
                      {group.items.map((item) => (
                        <a
                          key={item.name}
                          href={item.href}
                          class={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            isActive(item.href)
                              ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
                              : "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white"
                          }`}
                        >
                          <item.icon
                            class={`mr-3 h-5 w-5 ${
                              isActive(item.href)
                                ? "text-indigo-500 dark:text-indigo-400"
                                : "text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400"
                            }`}
                          />
                          {item.name}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>

              {/* Mobile user section - simplified */}
              <div class="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
                <div class="flex items-center">
                  <img
                    class="h-10 w-10 rounded-full"
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                      userData.value.user?.name || userData.value.user?.username || "User",
                    )}&background=6366f1&color=fff`}
                    alt=""
                  />
                  <div class="ml-3">
                    <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {userData.value.user?.name || userData.value.user?.username || "User"}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{userData.value.user?.email}</p>
                  </div>
                </div>
                <div class="mt-3 space-y-1">
                  <button
                    type="button"
                    onClick$={() => handleThemeChange(currentTheme.value === "dark" ? "light" : "dark")}
                    class="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-md"
                  >
                    {currentTheme.value === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
                  </button>
                  <a
                    href="/dashboard/profile"
                    class="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-md"
                  >
                    Your Profile
                  </a>
                  <a
                    href="/logout"
                    class="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-md"
                  >
                    Sign out
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <div class="flex-1 flex flex-col min-h-0 min-w-0">
          {/* Top bar - Mobile only */}
          <div class="md:hidden bg-white dark:bg-gray-800 shadow flex-shrink-0">
            <div class="flex items-center justify-between h-16 px-4">
              <button
                type="button"
                onClick$={() => {
                  isMenuOpen.value = true;
                }}
                class="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <span class="sr-only">Open menu</span>
                <LuMenu class="h-6 w-6" />
              </button>
              <img class="h-8 w-auto" src="/logo.svg" alt="Qwik Dashboard" />
              <div class="w-10" /> {/* Spacer for centering logo */}
            </div>
          </div>

          {/* Page content */}
          <main class="flex-1 flex flex-col min-h-0 bg-gray-100 dark:bg-gray-900">
            <div class="h-full flex flex-col py-6 px-4 sm:px-6 lg:px-8">
              <Slot />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
});
