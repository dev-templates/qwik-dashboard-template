import type { UserStatus } from "~/types/user";

// User role options for select dropdowns
export const USER_ROLE_OPTIONS = [
  { value: "user", label: "User" },
  { value: "editor", label: "Editor" },
  { value: "admin", label: "Admin" },
];

// User role options including "all" for filters
export const USER_ROLE_FILTER_OPTIONS = [{ value: "all", label: "All Roles" }, ...USER_ROLE_OPTIONS];

// User status options for select dropdowns
export const USER_STATUS_OPTIONS = [
  { value: "active" as UserStatus, label: "Active" },
  { value: "inactive" as UserStatus, label: "Inactive" },
  { value: "suspended" as UserStatus, label: "Suspended" },
];

// User status options including "all" for filters
export const USER_STATUS_FILTER_OPTIONS = [{ value: "all", label: "All Statuses" }, ...USER_STATUS_OPTIONS];

// Role display configurations
export const ROLE_DISPLAY_CONFIG = {
  admin: {
    colorClass: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  },
  editor: {
    colorClass: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  user: {
    colorClass: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  },
} as const;

// Status display configurations
export const STATUS_DISPLAY_CONFIG = {
  active: {
    colorClass: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  inactive: {
    colorClass: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  },
  suspended: {
    colorClass: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  },
} as const;
