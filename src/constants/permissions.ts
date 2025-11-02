// Permission resources - each page/module that requires permission control
// Note: profile and security pages are personal pages accessible to all logged-in users
export const PERMISSION_RESOURCES = {
  USERS: "users",
  ROLES: "roles",
  DASHBOARD: "dashboard",
  SETTINGS: "settings",
} as const;

// Permission actions - simplified to read and manage
export const PERMISSION_ACTIONS = {
  READ: "read", // Can view the page and its content
  MANAGE: "manage", // Can view and modify everything on the page
} as const;

// Common permission combinations
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_READ: {
    resource: PERMISSION_RESOURCES.DASHBOARD,
    action: PERMISSION_ACTIONS.READ,
  },

  // Users
  USERS_READ: {
    resource: PERMISSION_RESOURCES.USERS,
    action: PERMISSION_ACTIONS.READ,
  },
  USERS_MANAGE: {
    resource: PERMISSION_RESOURCES.USERS,
    action: PERMISSION_ACTIONS.MANAGE,
  },

  // Roles
  ROLES_READ: {
    resource: PERMISSION_RESOURCES.ROLES,
    action: PERMISSION_ACTIONS.READ,
  },
  ROLES_MANAGE: {
    resource: PERMISSION_RESOURCES.ROLES,
    action: PERMISSION_ACTIONS.MANAGE,
  },

  // Settings
  SETTINGS_READ: {
    resource: PERMISSION_RESOURCES.SETTINGS,
    action: PERMISSION_ACTIONS.READ,
  },
  SETTINGS_MANAGE: {
    resource: PERMISSION_RESOURCES.SETTINGS,
    action: PERMISSION_ACTIONS.MANAGE,
  },
} as const;

export type PermissionResource = (typeof PERMISSION_RESOURCES)[keyof typeof PERMISSION_RESOURCES];
export type PermissionAction = (typeof PERMISSION_ACTIONS)[keyof typeof PERMISSION_ACTIONS];
