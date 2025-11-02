import { $, component$, useSignal, useTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Form, routeAction$, routeLoader$, useNavigate, z, zod$ } from "@builder.io/qwik-city";
import { LuAlertTriangle, LuCheckCircle, LuPlus, LuX, LuXCircle } from "@qwikest/icons/lucide";
import {
  Badge,
  Box,
  Button,
  Input,
  Modal,
  PageHeader,
  Select,
  Table,
  TableBody,
  TableCell,
  TableFoot,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui";
import { siteConfig } from "~/config/site";
import { PERMISSION_ACTIONS, PERMISSION_RESOURCES } from "~/constants/permissions";
import { SHARED_MAP_KEYS } from "~/constants/shared-map-keys";
import { USER_STATUS_FILTER_OPTIONS, USER_STATUS_OPTIONS } from "~/constants/user";
import { requirePermission } from "~/server/middleware/auth";
import { getRoles } from "~/server/services/role.service";
import { createUser, deleteUser, getUsers, toggleUserStatus, updateUser } from "~/server/services/user.service";
import type { AuthUser } from "~/types/auth";
import type { CreateUserInput, UpdateUserInput, User, UserFilters, UserStatus } from "~/types/user";
import { formatDateTime } from "~/utils/date";

// Middleware to check if user has permission to view users
export const onRequest = requirePermission(PERMISSION_RESOURCES.USERS, PERMISSION_ACTIONS.READ);

// Load users data
export const useUsersData = routeLoader$(async ({ query, sharedMap }) => {
  const authUser = sharedMap.get(SHARED_MAP_KEYS.AUTH_USER) as AuthUser | undefined;
  const filters: UserFilters = {
    search: query.get("search") || undefined,
    role: (query.get("role") as UserFilters["role"]) || "all",
    status: (query.get("status") as UserFilters["status"]) || "all",
    page: Number(query.get("page")) || 1,
    limit: Number(query.get("pageSize")) || 10,
  };

  try {
    // Load users and roles in parallel
    const [data, rolesData] = await Promise.all([
      getUsers(filters),
      getRoles({ page: 1, limit: 100 }), // Load all roles
    ]);

    // Import hasPermission function
    const { hasPermission } = await import("~/server/services/auth.service");

    // Check if user has manage permission
    const canManage = authUser ? hasPermission(authUser, PERMISSION_RESOURCES.USERS, PERMISSION_ACTIONS.MANAGE) : false;

    return {
      ...data,
      filters,
      canManage,
      roles: rolesData.roles,
    };
  } catch (error) {
    console.error("Error loading users:", error);
    return {
      users: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
      filters,
      canManage: false,
      roles: [],
    };
  }
});

// Action to create a new user
export const useCreateUser = routeAction$(
  async (data, { fail, sharedMap }) => {
    const authUser = sharedMap.get(SHARED_MAP_KEYS.AUTH_USER) as AuthUser | undefined;

    // Import and check permission
    const { hasPermission } = await import("~/server/services/auth.service");
    if (!authUser || !hasPermission(authUser, PERMISSION_RESOURCES.USERS, PERMISSION_ACTIONS.MANAGE)) {
      return fail(403, {
        error: "You don't have permission to create users",
      });
    }

    try {
      const createUserInput: CreateUserInput = {
        email: data.email,
        username: data.username,
        password: data.password,
        name: data.name || undefined,
        role: data.role,
      };

      const newUser = await createUser(createUserInput);

      return {
        success: true,
        user: newUser,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create user";
      return fail(400, {
        error: message,
      });
    }
  },
  zod$({
    email: z.string().email("Invalid email format"),
    username: z
      .string()
      .min(1, "Username is required")
      .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, hyphens and underscores"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    name: z.string().optional(),
    role: z.string().min(1, "Role is required"),
  }),
);

// Action to update user
export const useUpdateUser = routeAction$(
  async (data, { fail, sharedMap }) => {
    const authUser = sharedMap.get(SHARED_MAP_KEYS.AUTH_USER) as AuthUser | undefined;

    // Import and check permission
    const { hasPermission } = await import("~/server/services/auth.service");
    if (!authUser || !hasPermission(authUser, PERMISSION_RESOURCES.USERS, PERMISSION_ACTIONS.MANAGE)) {
      return fail(403, {
        error: "You don't have permission to update users",
      });
    }

    try {
      const updateInput: UpdateUserInput = {
        email: data.email,
        username: data.username,
        name: data.name || undefined,
        role: data.role,
        status: data.status as UserStatus,
      };

      const updatedUser = await updateUser(data.userId, updateInput);

      if (!updatedUser) {
        return fail(404, {
          error: "User not found",
        });
      }

      return {
        success: true,
        user: updatedUser,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update user";
      return fail(400, {
        error: message,
      });
    }
  },
  zod$({
    userId: z.string().min(1, "User ID is required"),
    email: z.string().email("Invalid email format"),
    username: z
      .string()
      .min(1, "Username is required")
      .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, hyphens and underscores"),
    name: z.string().optional(),
    role: z.string().min(1, "Role is required"),
    status: z.enum(["active", "inactive", "suspended"], {
      errorMap: () => ({ message: "Invalid status value" }),
    }),
  }),
);

// Action to delete user
export const useDeleteUser = routeAction$(
  async (data, { sharedMap, fail }) => {
    const authUser = sharedMap.get(SHARED_MAP_KEYS.AUTH_USER) as AuthUser | undefined;

    if (!authUser) {
      return fail(403, {
        error: "Not logged in",
      });
    }

    // Use hasPermission function for permission check
    const { hasPermission } = await import("~/server/services/auth.service");
    if (!hasPermission(authUser, PERMISSION_RESOURCES.USERS, PERMISSION_ACTIONS.MANAGE)) {
      return fail(403, {
        error: "You don't have permission to delete users",
      });
    }

    // Prevent admin from deleting themselves
    if (data.userId === String(authUser.id)) {
      return fail(400, {
        error: "You cannot delete your own account",
      });
    }

    try {
      const success = await deleteUser(data.userId);
      if (!success) {
        return fail(404, {
          error: "User not found",
        });
      }
      return {
        success: true,
      };
    } catch (_error) {
      return fail(500, {
        error: "Failed to delete user",
      });
    }
  },
  zod$({
    userId: z.string().min(1, "User ID is required"),
  }),
);

// Action to toggle user status
export const useToggleUserStatus = routeAction$(
  async (data, { sharedMap, fail }) => {
    const authUser = sharedMap.get(SHARED_MAP_KEYS.AUTH_USER) as AuthUser | undefined;

    if (!authUser) {
      return fail(403, {
        error: "Not logged in",
      });
    }

    // Use hasPermission function for permission check
    const { hasPermission } = await import("~/server/services/auth.service");
    if (!hasPermission(authUser, PERMISSION_RESOURCES.USERS, PERMISSION_ACTIONS.MANAGE)) {
      return fail(403, {
        error: "You don't have permission to update users",
      });
    }

    // Prevent admin from disabling themselves
    // Compare as strings since userId comes as string from form
    if (data.userId === String(authUser.id)) {
      return fail(400, {
        error: "You cannot disable your own account",
      });
    }

    try {
      const updatedUser = await toggleUserStatus(data.userId);
      if (!updatedUser) {
        return fail(404, {
          error: "User not found",
        });
      }
      return {
        success: true,
        user: updatedUser,
      };
    } catch (_error) {
      return fail(500, {
        error: "Failed to update user status",
      });
    }
  },
  zod$({
    userId: z.string().min(1, "User ID is required"),
  }),
);

export default component$(() => {
  const usersData = useUsersData();
  const toggleStatus = useToggleUserStatus();
  const deleteUserAction = useDeleteUser();
  const createUserAction = useCreateUser();
  const updateUserAction = useUpdateUser();
  const navigate = useNavigate();

  // Modal state
  const showAddUserModal = useSignal(false);
  const showEditUserModal = useSignal(false);
  const showDeleteConfirmModal = useSignal(false);
  const editingUser = useSignal<User | null>(null);
  const deletingUser = useSignal<User | null>(null);

  // Form fields for new user
  const newUserEmail = useSignal("");
  const newUserUsername = useSignal("");
  const newUserPassword = useSignal("");
  const newUserName = useSignal("");
  const newUserRole = useSignal("user");

  // Form fields for edit user
  const editUserEmail = useSignal("");
  const editUserUsername = useSignal("");
  const editUserName = useSignal("");
  const editUserRole = useSignal("user");
  const editUserStatus = useSignal<UserStatus>("active");

  const searchInput = useSignal(usersData.value.filters.search || "");
  const roleFilter = useSignal(usersData.value.filters.role || "all");
  const statusFilter = useSignal(usersData.value.filters.status || "all");

  // Create role options from database roles
  const roleOptions = usersData.value.roles.map((role) => ({
    value: role.name,
    label: role.displayName,
  }));

  // Create role filter options with "All Roles" option
  const roleFilterOptions = [{ value: "all", label: "All Roles" }, ...roleOptions];

  // Helper function to get role display name
  const getRoleDisplayName = (roleName: string) => {
    const role = usersData.value.roles.find((r) => r.name === roleName);
    return role?.displayName || roleName;
  };

  const handleSearch = $(() => {
    const params = new URLSearchParams();
    if (searchInput.value) params.set("search", searchInput.value);
    if (roleFilter.value && roleFilter.value !== "all") params.set("role", roleFilter.value);
    if (statusFilter.value && statusFilter.value !== "all") params.set("status", statusFilter.value);

    navigate(`/dashboard/users?${params.toString()}`);
  });

  const handleEditUser = $((user: User) => {
    editingUser.value = user;
    editUserEmail.value = user.email;
    editUserUsername.value = user.username;
    editUserName.value = user.name || "";
    editUserRole.value = user.role;
    editUserStatus.value = user.status;
    showEditUserModal.value = true;
  });

  const handleDeleteUser = $((user: User) => {
    deletingUser.value = user;
    showDeleteConfirmModal.value = true;
  });

  // Show success/error messages
  useTask$(({ track }) => {
    track(() => toggleStatus.value);
    if (toggleStatus.value?.success) {
      // Refresh the page data
      // window.location.reload();
    }
  });

  // Handle create user success
  useTask$(({ track }) => {
    track(() => createUserAction.value);
    if (createUserAction.value?.success) {
      showAddUserModal.value = false;
      // Reset form
      newUserEmail.value = "";
      newUserUsername.value = "";
      newUserPassword.value = "";
      newUserName.value = "";
      newUserRole.value = "user";
      // Refresh the page data without full reload
      // window.location.reload();
    }
  });

  // Handle update user success
  useTask$(({ track }) => {
    track(() => updateUserAction.value);
    if (updateUserAction.value?.success) {
      showEditUserModal.value = false;
      editingUser.value = null;
      // Refresh the page data without full reload
      // window.location.reload();
    }
  });

  // Handle delete user success
  useTask$(({ track }) => {
    track(() => deleteUserAction.value);
    if (deleteUserAction.value?.success) {
      showDeleteConfirmModal.value = false;
      deletingUser.value = null;
      // Refresh the page data without full reload
      window.location.reload();
    }
  });

  return (
    <div class="h-full flex flex-col">
      {/* Header - fixed size */}
      <div class="flex-shrink-0">
        <PageHeader title="Users">
          {usersData.value.canManage && (
            <Button
              type="button"
              variant="primary"
              onClick$={() => {
                showAddUserModal.value = true;
              }}
            >
              <LuPlus class="mr-2 -ml-1 h-5 w-5" />
              Add User
            </Button>
          )}
        </PageHeader>
      </div>

      {/* Filters - fixed size */}
      <div class="flex-shrink-0 mt-6">
        <Box>
          <div class="flex flex-wrap items-end gap-4">
            <div class="flex-1 min-w-[280px] max-w-md">
              <Input
                label="Search"
                type="text"
                id="search"
                value={searchInput.value}
                onInput$={(_, el) => {
                  searchInput.value = el.value;
                }}
                onKeyPress$={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                placeholder="Search by name, email, or username"
              />
            </div>

            <div class="w-40">
              <Select
                label="Role"
                id="role"
                name="role"
                value={roleFilter.value}
                options={roleFilterOptions}
                onChange$={(_, el) => {
                  roleFilter.value = el.value;
                  handleSearch();
                }}
              />
            </div>

            <div class="w-40">
              <Select
                label="Status"
                id="status"
                name="status"
                value={statusFilter.value}
                options={USER_STATUS_FILTER_OPTIONS}
                onChange$={(_, el) => {
                  statusFilter.value = el.value as NonNullable<UserFilters["status"]>;
                  handleSearch();
                }}
              />
            </div>

            <div class="ml-auto">
              <Button type="button" onClick$={handleSearch}>
                Search
              </Button>
            </div>
          </div>
        </Box>
      </div>

      {/* Error message - fixed size */}
      {toggleStatus.value?.failed && (
        <div class="flex-shrink-0 mt-6 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <LuXCircle class="h-5 w-5 text-red-400" />
            </div>
            <div class="ml-3">
              <p class="text-sm text-red-800 dark:text-red-200">{toggleStatus.value.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Users table - takes remaining space */}
      <Table class="mt-6">
        <TableHead>
          <TableRow>
            <TableHeader class="min-w-[300px]">User</TableHeader>
            <TableHeader align="center" class="min-w-[140px]">
              Role
            </TableHeader>
            <TableHeader align="center" class="min-w-[100px]">
              Status
            </TableHeader>
            <TableHeader align="center" class="min-w-[80px]">
              2FA
            </TableHeader>
            <TableHeader align="center" class="min-w-[180px]">
              Last Login
            </TableHeader>
            <TableHeader align="right" class="min-w-[200px]">
              Actions
            </TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {usersData.value.users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                No users found
              </TableCell>
            </TableRow>
          ) : (
            usersData.value.users.map((user) => (
              <TableRow key={user.id} hoverable>
                <TableCell>
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <img
                        class="h-10 w-10 rounded-full"
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                          user.name || user.username,
                        )}&background=6366f1&color=fff`}
                        alt=""
                      />
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900 dark:text-white">{user.name || user.username}</div>
                      <div class="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell align="center">
                  <Badge variant={user.role === "admin" ? "info" : "success"}>{getRoleDisplayName(user.role)}</Badge>
                </TableCell>
                <TableCell align="center">
                  <Badge
                    variant={user.status === "active" ? "success" : user.status === "inactive" ? "warning" : "danger"}
                  >
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell align="center">
                  <div class="flex justify-center items-center">
                    {user.twoFactorEnabled ? (
                      <LuCheckCircle class="h-5 w-5 text-green-500" />
                    ) : (
                      <LuX class="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </TableCell>
                <TableCell align="center">{formatDateTime(user.lastLogin)}</TableCell>
                <TableCell align="right">
                  <div class="flex justify-end space-x-2">
                    {usersData.value.canManage ? (
                      <>
                        <button
                          type="button"
                          onClick$={() => handleEditUser(user)}
                          class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick$={async () => {
                            await toggleStatus.submit({ userId: user.id });
                          }}
                          class="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                        >
                          {user.status === "active" ? "Disable" : "Enable"}
                        </button>
                        <button
                          type="button"
                          onClick$={() => handleDeleteUser(user)}
                          class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick$={() => handleEditUser(user)}
                        class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        View
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <TableFoot totalItems={usersData.value.total} />

      {/* Add User Modal */}
      <Modal
        show={showAddUserModal.value}
        onClose$={() => {
          showAddUserModal.value = false;
          // Reset form
          newUserEmail.value = "";
          newUserUsername.value = "";
          newUserPassword.value = "";
          newUserName.value = "";
          newUserRole.value = "user";
        }}
        title="Add New User"
        size="md"
      >
        <Form action={createUserAction}>
          <div class="space-y-4">
            {/* Error messages */}
            {createUserAction.value?.failed && (
              <div class="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <LuXCircle class="h-5 w-5 text-red-400" />
                  </div>
                  <div class="ml-3">
                    {createUserAction.value.fieldErrors?.email && (
                      <p class="text-sm text-red-800 dark:text-red-200">{createUserAction.value.fieldErrors.email}</p>
                    )}
                    {createUserAction.value.fieldErrors?.username && (
                      <p class="text-sm text-red-800 dark:text-red-200">
                        {createUserAction.value.fieldErrors.username}
                      </p>
                    )}
                    {createUserAction.value.fieldErrors?.password && (
                      <p class="text-sm text-red-800 dark:text-red-200">
                        {createUserAction.value.fieldErrors.password}
                      </p>
                    )}
                    {createUserAction.value.fieldErrors?.role && (
                      <p class="text-sm text-red-800 dark:text-red-200">{createUserAction.value.fieldErrors.role}</p>
                    )}
                    {createUserAction.value.error && (
                      <p class="text-sm text-red-800 dark:text-red-200">{createUserAction.value.error}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Input
              label="Email"
              type="email"
              name="email"
              id="new-user-email"
              required
              value={newUserEmail.value}
              onInput$={(_, el) => {
                newUserEmail.value = el.value;
              }}
              autoComplete="off"
            />

            <Input
              label="Username"
              type="text"
              name="username"
              id="new-user-username"
              required
              value={newUserUsername.value}
              onInput$={(_, el) => {
                newUserUsername.value = el.value;
              }}
              autoComplete="off"
            />

            <Input
              label="Name (Optional)"
              type="text"
              name="name"
              id="new-user-name"
              value={newUserName.value}
              onInput$={(_, el) => {
                newUserName.value = el.value;
              }}
              autoComplete="off"
            />

            <Input
              label="Password"
              type="password"
              name="password"
              id="new-user-password"
              required
              minLength={8}
              value={newUserPassword.value}
              onInput$={(_, el) => {
                newUserPassword.value = el.value;
              }}
              autoComplete="new-password"
            />

            <Select
              label="Role"
              id="new-user-role"
              name="role"
              value={newUserRole.value}
              options={roleOptions}
              onChange$={(_, el) => {
                newUserRole.value = el.value;
              }}
            />

            <div class="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick$={() => {
                  showAddUserModal.value = false;
                  // Reset form
                  newUserEmail.value = "";
                  newUserUsername.value = "";
                  newUserPassword.value = "";
                  newUserName.value = "";
                  newUserRole.value = "user";
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={createUserAction.isRunning}>
                {createUserAction.isRunning ? "Creating..." : "Create User"}
              </Button>
            </div>
          </div>
        </Form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        show={showEditUserModal.value}
        onClose$={() => {
          showEditUserModal.value = false;
          editingUser.value = null;
        }}
        title={editingUser.value ? "Edit User" : "View User"}
        size="lg"
      >
        <Form action={updateUserAction} class="space-y-6">
          <div class="space-y-4">
            {updateUserAction.value?.failed && (
              <div class="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <LuXCircle class="h-5 w-5 text-red-400" />
                  </div>
                  <div class="ml-3">
                    {updateUserAction.value.fieldErrors?.email && (
                      <p class="text-sm text-red-800 dark:text-red-200">{updateUserAction.value.fieldErrors.email}</p>
                    )}
                    {updateUserAction.value.fieldErrors?.username && (
                      <p class="text-sm text-red-800 dark:text-red-200">
                        {updateUserAction.value.fieldErrors.username}
                      </p>
                    )}
                    {updateUserAction.value.fieldErrors?.status && (
                      <p class="text-sm text-red-800 dark:text-red-200">{updateUserAction.value.fieldErrors.status}</p>
                    )}
                    {updateUserAction.value.error && (
                      <p class="text-sm text-red-800 dark:text-red-200">{updateUserAction.value.error}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <input type="hidden" name="userId" value={editingUser.value?.id || ""} />

            <Input
              label="Email"
              type="email"
              name="email"
              id="edit-user-email"
              required
              value={editUserEmail.value}
              onInput$={(_, el) => {
                editUserEmail.value = el.value;
              }}
              disabled={!usersData.value.canManage}
            />

            <Input
              label="Username"
              type="text"
              name="username"
              id="edit-user-username"
              required
              value={editUserUsername.value}
              onInput$={(_, el) => {
                editUserUsername.value = el.value;
              }}
              disabled={!usersData.value.canManage}
            />

            <Input
              label="Name (Optional)"
              type="text"
              name="name"
              id="edit-user-name"
              value={editUserName.value}
              onInput$={(_, el) => {
                editUserName.value = el.value;
              }}
              disabled={!usersData.value.canManage}
            />

            <Select
              label="Role"
              id="edit-user-role"
              name="role"
              value={editUserRole.value}
              options={roleOptions}
              onChange$={(_, el) => {
                editUserRole.value = el.value;
              }}
              disabled={!usersData.value.canManage}
            />

            <Select
              label="Status"
              id="edit-user-status"
              name="status"
              value={editUserStatus.value}
              options={USER_STATUS_OPTIONS}
              onChange$={(_, el) => {
                editUserStatus.value = el.value as UserStatus;
              }}
              disabled={!usersData.value.canManage}
            />

            <div class="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick$={() => {
                  showEditUserModal.value = false;
                  editingUser.value = null;
                }}
              >
                {usersData.value.canManage ? "Cancel" : "Close"}
              </Button>
              {usersData.value.canManage && (
                <Button type="submit" variant="primary" loading={updateUserAction.isRunning}>
                  {updateUserAction.isRunning ? "Saving..." : "Save Changes"}
                </Button>
              )}
            </div>
          </div>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteConfirmModal.value}
        onClose$={() => {
          showDeleteConfirmModal.value = false;
          deletingUser.value = null;
        }}
        size="sm"
      >
        <div class="sm:flex sm:items-start">
          <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 sm:mx-0 sm:h-10 sm:w-10">
            <LuAlertTriangle class="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
            <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">Delete User</h3>
            <div class="mt-2">
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Are you sure you want to delete user "{deletingUser.value?.name || deletingUser.value?.username}"? This
                action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        {deleteUserAction.value?.failed && (
          <div class="mt-4 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <title>Error</title>
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm text-red-800 dark:text-red-200">{deleteUserAction.value.error}</p>
              </div>
            </div>
          </div>
        )}

        <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
          <Form action={deleteUserAction} class="sm:ml-3">
            <input type="hidden" name="userId" value={deletingUser.value?.id || ""} />
            <Button type="submit" variant="danger" loading={deleteUserAction.isRunning}>
              {deleteUserAction.isRunning ? "Deleting..." : "Delete"}
            </Button>
          </Form>
          <Button
            type="button"
            variant="secondary"
            onClick$={() => {
              showDeleteConfirmModal.value = false;
              deletingUser.value = null;
            }}
            class="mt-3 sm:mt-0"
          >
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
});

export const head: DocumentHead = {
  title: `Users - ${siteConfig.name}`,
  meta: [
    {
      name: "description",
      content: "Manage users in your Qwik dashboard",
    },
  ],
};
