export const ROLE_FILTER_OPTIONS = [
  { value: "all", label: "All Roles" },
  { value: "system", label: "System Roles" },
  { value: "user", label: "User Roles" },
];

export const SYSTEM_ROLE_BADGE_CONFIG = {
  system: {
    colorClass: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
    label: "System",
  },
  user: {
    colorClass: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    label: "User",
  },
};
