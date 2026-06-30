export const permissionCatalog = [
  ["auth.me", "Read the current authenticated user context"],
  ["users.manage", "Manage organization users and invitations"],
  ["users.admin.create", "Create organization admin users"],
  ["roles.manage", "Manage organization roles and permissions"],
  ["products.read", "Read products and categories"],
  ["products.write", "Create and update products and categories"],
  ["products.delete", "Archive or delete products"],
  ["warehouses.read", "Read warehouses and bins"],
  ["warehouses.write", "Create and update warehouses and bins"],
  ["inventory.read", "Read inventory and stock movements"],
  ["inventory.write", "Create stock in, stock out, adjustment, and transfer records"],
  ["orders.read", "Read orders and order details"],
  ["orders.write", "Create orders and update order status"],
  ["shipments.read", "Read shipments and tracking history"],
  ["shipments.write", "Create shipments and update shipment status"],
  ["analytics.read", "Read dashboard and analytics data"],
  ["notifications.read", "Read in-app notifications"],
  ["notifications.write", "Update notification state"],
  ["audit.read", "Read audit log entries"],
] as const;

export type PermissionKey = (typeof permissionCatalog)[number][0];
export type DefaultRoleName = "owner" | "admin" | "manager" | "staff";

export const permissionKeys = permissionCatalog.map(([key]) => key) as PermissionKey[];

export const defaultRoleTemplates = {
  owner: permissionKeys,
  admin: permissionKeys.filter((key) => key !== "audit.read" && key !== "users.admin.create"),
  manager: [
    "auth.me",
    "products.read",
    "products.write",
    "warehouses.read",
    "warehouses.write",
    "inventory.read",
    "inventory.write",
    "orders.read",
    "orders.write",
    "shipments.read",
    "shipments.write",
    "analytics.read",
    "notifications.read",
    "notifications.write",
  ],
  staff: [
    "auth.me",
    "products.read",
    "warehouses.read",
    "inventory.read",
    "orders.read",
    "shipments.read",
    "notifications.read",
  ],
} as const satisfies Record<DefaultRoleName, readonly PermissionKey[]>;

export const defaultRoleNames = Object.keys(defaultRoleTemplates) as DefaultRoleName[];
