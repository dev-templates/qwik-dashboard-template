import { $, component$, useSignal, useTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Form, routeAction$, routeLoader$, useLocation, useNavigate, z, zod$ } from "@builder.io/qwik-city";
import { LuAlertTriangle, LuPlus, LuShield, LuUsers, LuXCircle } from "@qwikest/icons/lucide";
import {
  Badge,
  Box,
  Button,
  Input,
  Modal,
  PageHeader,
  Table,
  TableBody,
  TableCell,
  TableFoot,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from "~/components/ui";
import { siteConfig } from "~/config/site";
import { PERMISSION_ACTIONS, PERMISSION_RESOURCES } from "~/constants/permissions";
import { SHARED_MAP_KEYS } from "~/constants/shared-map-keys";
import { requirePermission } from "~/server/middleware/auth";
import {
  createRole,
  deleteRole,
  getAllPermissions,
  getRoleById,
  getRoles,
  updateRole,
} from "~/server/services/role.service";
import type { AuthUser } from "~/types/auth";
import type { CreateRoleInput, Permission, Role, RoleFilters, UpdateRoleInput } from "~/types/role";
import { formatDateTime } from "~/utils/date";

// Middleware to check if user has permission to view roles
export const onRequest = requirePermission(PERMISSION_RESOURCES.ROLES, PERMISSION_ACTIONS.READ);

// Load roles data
export const useRolesData = routeLoader$(async ({ query, sharedMap }) => {
  const authUser = sharedMap.get(SHARED_MAP_KEYS.AUTH_USER) as AuthUser | undefined;
  const filters: RoleFilters = {
    search: query.get("search") || undefined,
    page: Number(query.get("page")) || 1,
    limit: Number(query.get("pageSize")) || 10,
  };

  try {
    const [rolesData, permissions] = await Promise.all([getRoles(filters), getAllPermissions()]);

    // Check if user has manage permission
    const { hasPermission } = await import("~/server/services/auth.service");
    const canManage = authUser ? hasPermission(authUser, PERMISSION_RESOURCES.ROLES, PERMISSION_ACTIONS.MANAGE) : false;

    return {
      ...rolesData,
      permissions,
      filters,
      canManage,
    };
  } catch (error) {
    console.error("Error loading roles:", error);
    return {
      roles: [],
      permissions: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
      filters,
      canManage: false,
    };
  }
});

// Action to create a new role
export const useCreateRole = routeAction$(
  async (data, { fail, sharedMap }) => {
    const authUser = sharedMap.get(SHARED_MAP_KEYS.AUTH_USER) as AuthUser | undefined;

    // Import and check permission
    const { hasPermission } = await import("~/server/services/auth.service");
    if (!authUser || !hasPermission(authUser, PERMISSION_RESOURCES.ROLES, PERMISSION_ACTIONS.MANAGE)) {
      return fail(403, {
        error: "You don't have permission to create roles",
      });
    }

    try {
      const createRoleInput: CreateRoleInput = {
        name: data.name,
        displayName: data.displayName,
        description: data.description || undefined,
        permissions: data.permissions || [],
      };

      const newRole = await createRole(createRoleInput);

      return {
        success: true,
        role: newRole,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create role";
      return fail(400, {
        error: message,
      });
    }
  },
  zod$({
    name: z
      .string()
      .min(1, "Role name is required")
      .regex(/^[a-z0-9_]+$/, "Role name must contain only lowercase letters, numbers, and underscores"),
    displayName: z.string().min(1, "Display name is required"),
    description: z.string().optional(),
    permissions: z
      .string()
      .transform((val) => {
        try {
          return JSON.parse(val);
        } catch {
          return [];
        }
      })
      .pipe(z.array(z.string())),
  }),
);

// Action to update role
export const useUpdateRole = routeAction$(
  async (data, { fail, sharedMap }) => {
    const authUser = sharedMap.get(SHARED_MAP_KEYS.AUTH_USER) as AuthUser | undefined;

    // Import and check permission
    const { hasPermission } = await import("~/server/services/auth.service");
    if (!authUser || !hasPermission(authUser, PERMISSION_RESOURCES.ROLES, PERMISSION_ACTIONS.MANAGE)) {
      return fail(403, {
        error: "You don't have permission to update roles",
      });
    }

    try {
      const updateInput: UpdateRoleInput = {
        displayName: data.displayName || undefined,
        description: data.description !== undefined ? data.description : undefined,
        permissions: data.permissions || undefined,
      };

      const updatedRole = await updateRole(data.roleId, updateInput);

      if (!updatedRole) {
        return fail(404, {
          error: "Role not found",
        });
      }

      return {
        success: true,
        role: updatedRole,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update role";
      return fail(400, {
        error: message,
      });
    }
  },
  zod$({
    roleId: z.string().min(1, "Role ID is required"),
    displayName: z.string().min(1, "Display name is required").optional(),
    description: z.string().optional(),
    permissions: z
      .string()
      .transform((val) => {
        try {
          return JSON.parse(val);
        } catch {
          return undefined;
        }
      })
      .pipe(z.array(z.string()).optional()),
  }),
);

// Action to get role details
export const useGetRoleDetails = routeAction$(
  async (data, { fail, sharedMap }) => {
    const authUser = sharedMap.get(SHARED_MAP_KEYS.AUTH_USER) as AuthUser | undefined;

    // Check if user has read permission
    const { hasPermission } = await import("~/server/services/auth.service");
    if (!authUser || !hasPermission(authUser, PERMISSION_RESOURCES.ROLES, PERMISSION_ACTIONS.READ)) {
      return fail(403, {
        error: "You don't have permission to view roles",
      });
    }

    try {
      const role = await getRoleById(data.roleId);
      if (!role) {
        return fail(404, {
          error: "Role not found",
        });
      }
      return {
        success: true,
        role,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get role details";
      return fail(400, {
        error: message,
      });
    }
  },
  zod$({
    roleId: z.string().min(1, "Role ID is required"),
  }),
);

// Action to delete role
export const useDeleteRole = routeAction$(
  async (data, { fail, sharedMap }) => {
    const authUser = sharedMap.get(SHARED_MAP_KEYS.AUTH_USER) as AuthUser | undefined;

    // Check if user has manage permission
    const { hasPermission } = await import("~/server/services/auth.service");
    if (!authUser || !hasPermission(authUser, PERMISSION_RESOURCES.ROLES, PERMISSION_ACTIONS.MANAGE)) {
      return fail(403, {
        error: "You don't have permission to delete roles",
      });
    }

    try {
      const success = await deleteRole(data.roleId);
      if (!success) {
        return fail(404, {
          error: "Role not found",
        });
      }
      return {
        success: true,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete role";
      return fail(400, {
        error: message,
      });
    }
  },
  zod$({
    roleId: z.string().min(1, "Role ID is required"),
  }),
);

export default component$(() => {
  const rolesData = useRolesData();
  const createRoleAction = useCreateRole();
  const updateRoleAction = useUpdateRole();
  const getRoleDetailsAction = useGetRoleDetails();
  const deleteRoleAction = useDeleteRole();
  const navigate = useNavigate();
  const location = useLocation();

  // Modal state
  const showAddRoleModal = useSignal(false);
  const showEditRoleModal = useSignal(false);
  const showDeleteConfirmModal = useSignal(false);
  const editingRole = useSignal<(Role & { permissions?: Permission[] }) | null>(null);
  const deletingRole = useSignal<Role | null>(null);
  const loadingRoleId = useSignal<string | null>(null);

  // Form fields for new role
  const newRoleName = useSignal("");
  const newRoleDisplayName = useSignal("");
  const newRoleDescription = useSignal("");
  const newRolePermissions = useSignal<string[]>([]);

  // Form fields for edit role
  const editRoleDisplayName = useSignal("");
  const editRoleDescription = useSignal("");
  const editRolePermissions = useSignal<string[]>([]);

  const searchInput = useSignal(rolesData.value.filters.search || "");

  const handleSearch = $(() => {
    const params = new URLSearchParams();
    if (searchInput.value) params.set("search", searchInput.value);
    navigate(`${location.url.pathname}?${params.toString()}`);
  });

  const handleEditRole = $(async (role: Role) => {
    loadingRoleId.value = role.id;
    try {
      const result = await getRoleDetailsAction.submit({ roleId: role.id });
      if (result.value?.success && result.value.role) {
        const fullRole = result.value.role;
        editingRole.value = fullRole as Role & { permissions?: Permission[] };
        editRoleDisplayName.value = fullRole.displayName;
        editRoleDescription.value = fullRole.description || "";
        editRolePermissions.value = fullRole.permissions?.map((p: { id: string }) => p.id) || [];
        showEditRoleModal.value = true;
      }
    } finally {
      loadingRoleId.value = null;
    }
  });

  const handleDeleteRole = $((role: Role) => {
    deletingRole.value = role;
    showDeleteConfirmModal.value = true;
  });

  const togglePermission = $((permissionId: string, isNewRole: boolean) => {
    const permissions = isNewRole ? newRolePermissions : editRolePermissions;
    const currentPermissions = [...permissions.value];
    const index = currentPermissions.indexOf(permissionId);

    if (index > -1) {
      currentPermissions.splice(index, 1);
    } else {
      currentPermissions.push(permissionId);
    }

    permissions.value = currentPermissions;
  });

  // Group permissions by resource
  const groupedPermissions = rolesData.value.permissions.reduce(
    (acc, permission) => {
      if (!acc[permission.resource]) {
        acc[permission.resource] = [];
      }
      acc[permission.resource].push(permission);
      return acc;
    },
    {} as Record<string, Permission[]>,
  );

  // Handle create role success
  useTask$(({ track }) => {
    track(() => createRoleAction.value);
    if (createRoleAction.value?.success) {
      showAddRoleModal.value = false;
      // Reset form
      newRoleName.value = "";
      newRoleDisplayName.value = "";
      newRoleDescription.value = "";
      newRolePermissions.value = [];
      window.location.reload();
    }
  });

  // Handle update role success
  useTask$(({ track }) => {
    track(() => updateRoleAction.value);
    if (updateRoleAction.value?.success) {
      showEditRoleModal.value = false;
      editingRole.value = null;
      window.location.reload();
    }
  });

  // Handle delete role success
  useTask$(({ track }) => {
    track(() => deleteRoleAction.value);
    if (deleteRoleAction.value?.success) {
      showDeleteConfirmModal.value = false;
      deletingRole.value = null;
      window.location.reload();
    }
  });

  return (
    <div class="h-full flex flex-col">
      {/* Header - fixed size */}
      <div class="flex-shrink-0">
        <PageHeader title="Roles">
          {rolesData.value.canManage && (
            <Button
              type="button"
              variant="primary"
              onClick$={() => {
                showAddRoleModal.value = true;
              }}
            >
              <LuPlus class="mr-2 -ml-1 h-5 w-5" />
              Add Role
            </Button>
          )}
        </PageHeader>
      </div>

      {/* Search - fixed size */}
      <div class="flex-shrink-0 mt-6">
        <Box>
          <div class="flex items-end gap-4">
            <div class="flex-1 max-w-md">
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
                placeholder="Search by name or description"
              />
            </div>
            <Button type="button" onClick$={handleSearch}>
              Search
            </Button>
          </div>
        </Box>
      </div>

      {/* Roles table - takes remaining space */}
      <Table class="mt-6">
        <TableHead>
          <TableRow>
            <TableHeader class="w-auto">Role</TableHeader>
            <TableHeader align="center">Type</TableHeader>
            <TableHeader align="center">Users</TableHeader>
            <TableHeader align="center">Permissions</TableHeader>
            <TableHeader align="center">Created</TableHeader>
            <TableHeader align="right">Actions</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {rolesData.value.roles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                No roles found
              </TableCell>
            </TableRow>
          ) : (
            rolesData.value.roles.map((role) => (
              <TableRow key={role.id} hoverable>
                <TableCell>
                  <div>
                    <div class="text-sm font-medium text-gray-900 dark:text-white">{role.displayName}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">{role.name}</div>
                    {role.description && (
                      <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">{role.description}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell align="center">
                  <Badge variant={role.isSystem ? "primary" : "default"}>{role.isSystem ? "System" : "User"}</Badge>
                </TableCell>
                <TableCell align="center">
                  <div class="flex items-center justify-center text-sm text-gray-900 dark:text-white">
                    <LuUsers class="mr-1.5 h-4 w-4 text-gray-400" />
                    {role.userCount || 0}
                  </div>
                </TableCell>
                <TableCell align="center">
                  <div class="flex items-center justify-center text-sm text-gray-900 dark:text-white">
                    <LuShield class="mr-1.5 h-4 w-4 text-gray-400" />
                    {role.permissionCount || 0}
                  </div>
                </TableCell>
                <TableCell align="center">{formatDateTime(role.createdAt)}</TableCell>
                <TableCell align="right">
                  <div class="flex justify-end space-x-2">
                    {rolesData.value.canManage ? (
                      <>
                        <button
                          type="button"
                          onClick$={() => handleEditRole(role)}
                          disabled={loadingRoleId.value === role.id}
                          class="cursor-pointer text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {loadingRoleId.value === role.id ? "Loading..." : "Edit"}
                        </button>
                        {role.name !== "admin" && (
                          <button
                            type="button"
                            onClick$={() => handleDeleteRole(role)}
                            class="cursor-pointer text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Delete
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick$={() => handleEditRole(role)}
                        disabled={loadingRoleId.value === role.id}
                        class="cursor-pointer text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 disabled:cursor-not-allowed disabled:opacity-50"
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
      <TableFoot totalItems={rolesData.value.total} />

      {/* Add Role Modal */}
      <Modal
        show={showAddRoleModal.value}
        onClose$={() => {
          showAddRoleModal.value = false;
          // Reset form
          newRoleName.value = "";
          newRoleDisplayName.value = "";
          newRoleDescription.value = "";
          newRolePermissions.value = [];
        }}
        title="Add New Role"
        size="lg"
      >
        <Form action={createRoleAction}>
          <div class="space-y-4">
            {/* Error messages */}
            {createRoleAction.value?.failed && (
              <div class="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <LuXCircle class="h-5 w-5 text-red-400" />
                  </div>
                  <div class="ml-3">
                    {createRoleAction.value.fieldErrors?.name && (
                      <p class="text-sm text-red-800 dark:text-red-200">{createRoleAction.value.fieldErrors.name}</p>
                    )}
                    {createRoleAction.value.fieldErrors?.displayName && (
                      <p class="text-sm text-red-800 dark:text-red-200">
                        {createRoleAction.value.fieldErrors.displayName}
                      </p>
                    )}
                    {createRoleAction.value.error && (
                      <p class="text-sm text-red-800 dark:text-red-200">{createRoleAction.value.error}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <Input
                label="Internal Name"
                type="text"
                name="name"
                id="new-role-name"
                required
                value={newRoleName.value}
                onInput$={(_, el) => {
                  newRoleName.value = el.value;
                }}
                placeholder="e.g., content_editor"
                pattern="[a-z0-9_]+"
              />
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Lowercase letters, numbers, and underscores only
              </p>
            </div>

            <Input
              label="Display Name"
              type="text"
              name="displayName"
              id="new-role-display-name"
              required
              value={newRoleDisplayName.value}
              onInput$={(_, el) => {
                newRoleDisplayName.value = el.value;
              }}
              placeholder="e.g., Content Editor"
            />

            <Textarea
              label="Description (Optional)"
              name="description"
              id="new-role-description"
              rows={3}
              value={newRoleDescription.value}
              onInput$={(_, el) => {
                newRoleDescription.value = el.value;
              }}
              placeholder="Describe the purpose of this role"
            />

            <div>
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Permissions</h4>
              <div class="space-y-4 max-h-64 overflow-y-auto">
                {Object.entries(groupedPermissions).map(([resource, permissions]) => (
                  <div key={resource} class="border rounded-lg p-3 dark:border-gray-600">
                    <h5 class="text-sm font-semibold text-gray-900 dark:text-white capitalize mb-2">
                      {resource.replace(/_/g, " ")}
                    </h5>
                    <div class="grid grid-cols-2 gap-2">
                      {permissions.map((permission) => (
                        <label key={permission.id} class="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newRolePermissions.value.includes(permission.id)}
                            onChange$={() => togglePermission(permission.id, true)}
                            class="cursor-pointer h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                          />
                          <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">{permission.displayName}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <input type="hidden" name="permissions" value={JSON.stringify(newRolePermissions.value)} />

            <div class="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick$={() => {
                  showAddRoleModal.value = false;
                  // Reset form
                  newRoleName.value = "";
                  newRoleDisplayName.value = "";
                  newRoleDescription.value = "";
                  newRolePermissions.value = [];
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={createRoleAction.isRunning}>
                {createRoleAction.isRunning ? "Creating..." : "Create Role"}
              </Button>
            </div>
          </div>
        </Form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        show={showEditRoleModal.value}
        onClose$={() => {
          showEditRoleModal.value = false;
          editingRole.value = null;
        }}
        title={rolesData.value.canManage ? "Edit Role" : "View Role"}
        size="lg"
      >
        <Form action={updateRoleAction}>
          <div class="space-y-4">
            {updateRoleAction.value?.failed && (
              <div class="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <LuXCircle class="h-5 w-5 text-red-400" />
                  </div>
                  <div class="ml-3">
                    {updateRoleAction.value.fieldErrors?.displayName && (
                      <p class="text-sm text-red-800 dark:text-red-200">
                        {updateRoleAction.value.fieldErrors.displayName}
                      </p>
                    )}
                    {updateRoleAction.value.error && (
                      <p class="text-sm text-red-800 dark:text-red-200">{updateRoleAction.value.error}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <input type="hidden" name="roleId" value={editingRole.value?.id || ""} />

            <div>
              <div class="block text-sm font-medium text-gray-700 dark:text-gray-300">Internal Name</div>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{editingRole.value?.name}</p>
            </div>

            <Input
              label="Display Name"
              type="text"
              name="displayName"
              id="edit-role-display-name"
              required
              value={editRoleDisplayName.value}
              onInput$={(_, el) => {
                editRoleDisplayName.value = el.value;
              }}
              disabled={editingRole.value?.name === "admin" || !rolesData.value.canManage}
            />

            <Textarea
              label="Description (Optional)"
              name="description"
              id="edit-role-description"
              rows={3}
              value={editRoleDescription.value}
              onInput$={(_, el) => {
                editRoleDescription.value = el.value;
              }}
              disabled={!rolesData.value.canManage}
              placeholder="Describe the purpose of this role"
            />

            <div>
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Permissions</h4>
              {editingRole.value?.name === "admin" ? (
                <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
                  <p class="text-sm text-yellow-800 dark:text-yellow-200">
                    Administrator role always has all permissions and cannot be modified to prevent system lockout.
                  </p>
                </div>
              ) : (
                <div class="space-y-4 max-h-64 overflow-y-auto">
                  {Object.entries(groupedPermissions).map(([resource, permissions]) => (
                    <div key={resource} class="border rounded-lg p-3 dark:border-gray-600">
                      <h5 class="text-sm font-semibold text-gray-900 dark:text-white capitalize mb-2">
                        {resource.replace(/_/g, " ")}
                      </h5>
                      <div class="grid grid-cols-2 gap-2">
                        {permissions.map((permission) => (
                          <label key={permission.id} class="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editRolePermissions.value.includes(permission.id)}
                              onChange$={() => rolesData.value.canManage && togglePermission(permission.id, false)}
                              disabled={!rolesData.value.canManage}
                              class="cursor-pointer h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">{permission.displayName}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <input type="hidden" name="permissions" value={JSON.stringify(editRolePermissions.value)} />

            <div class="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick$={() => {
                  showEditRoleModal.value = false;
                  editingRole.value = null;
                }}
              >
                {rolesData.value.canManage ? "Cancel" : "Close"}
              </Button>
              {rolesData.value.canManage && (
                <Button type="submit" variant="primary" loading={updateRoleAction.isRunning}>
                  {updateRoleAction.isRunning ? "Saving..." : "Save Changes"}
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
          deletingRole.value = null;
        }}
        size="sm"
      >
        <div class="sm:flex sm:items-start">
          <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 sm:mx-0 sm:h-10 sm:w-10">
            <LuAlertTriangle class="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
            <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">Delete Role</h3>
            <div class="mt-2">
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Are you sure you want to delete the role "{deletingRole.value?.displayName}"? This action cannot be
                undone.
              </p>
            </div>
          </div>
        </div>

        {deleteRoleAction.value?.failed && (
          <div class="mt-4 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <LuXCircle class="h-5 w-5 text-red-400" />
              </div>
              <div class="ml-3">
                <p class="text-sm text-red-800 dark:text-red-200">{deleteRoleAction.value.error}</p>
              </div>
            </div>
          </div>
        )}

        <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
          <Form action={deleteRoleAction} class="sm:ml-3">
            <input type="hidden" name="roleId" value={deletingRole.value?.id || ""} />
            <Button type="submit" variant="danger" loading={deleteRoleAction.isRunning}>
              {deleteRoleAction.isRunning ? "Deleting..." : "Delete"}
            </Button>
          </Form>
          <Button
            type="button"
            variant="secondary"
            onClick$={() => {
              showDeleteConfirmModal.value = false;
              deletingRole.value = null;
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
  title: `Roles - ${siteConfig.name}`,
  meta: [
    {
      name: "description",
      content: "Manage roles and permissions in your Qwik dashboard",
    },
  ],
};
