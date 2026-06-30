export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  organizationId: string;
  organizationName: string;
  roles: string[];
  permissions: string[];
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

export type AdminUserCreateMutation = {
  name: string;
  email: string;
  password: string;
};

export type AdminUserResponse = {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  roles: string[];
  createdAt: string;
};

export type ProductStatus = "ACTIVE" | "ARCHIVED";
export type ProductStockStatus = "Active" | "Low stock" | "Archived";

export type ProductResponse = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  unit: string;
  price: number;
  reorderLevel: number;
  status: ProductStatus;
  category: { id: string; name: string } | null;
  stockQuantity: number;
  stockStatus: ProductStockStatus;
  inventoryValue: number;
  locationSummary: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductMutation = {
  name: string;
  sku?: string;
  description?: string | null;
  categoryId?: string | null;
  unit: string;
  price: number;
  reorderLevel: number;
  status?: ProductStatus;
};

export type ProductListResponse = {
  data: ProductResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type WarehouseResponse = {
  id: string;
  name: string;
  code: string;
  address: string | null;
  binsCount: number;
  totalQuantity: number;
  bins: WarehouseBinResponse[];
  createdAt: string;
  updatedAt: string;
};

export type WarehouseBinResponse = {
  id: string;
  code: string;
  totalQuantity: number;
  createdAt: string;
  updatedAt: string;
};

export type InventoryResponse = {
  id: string;
  product: { id: string; sku: string; name: string; unit: string };
  warehouse: { id: string; code: string; name: string };
  bin: { id: string; code: string };
  quantity: number;
  productTotalQuantity: number;
  reorderLevel: number;
  risk: "Healthy" | "Watch" | "Low" | "Critical";
  inventoryValue: number;
  updatedAt: string;
};

export type StockMovementType =
  | "STOCK_IN"
  | "STOCK_OUT"
  | "RESERVE"
  | "RELEASE"
  | "TRANSFER"
  | "ADJUSTMENT"
  | "FULFILLMENT";

export type StockMovementResponse = {
  id: string;
  type: StockMovementType;
  quantity: number;
  reference: string | null;
  product: { id: string; sku: string; name: string };
  warehouse: { id: string; code: string; name: string };
  createdAt: string;
};

export type OrderStatus = "DRAFT" | "CONFIRMED" | "RESERVED" | "FULFILLED" | "CANCELLED";

export type OrderResponse = {
  id: string;
  orderNumber: string;
  customerName: string;
  status: OrderStatus;
  totalAmount: number;
  items: Array<{
    id: string;
    product: { id: string; sku: string; name: string; unit: string };
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  shipments: Array<{
    id: string;
    status: ShipmentStatus;
    carrier: string | null;
    trackingNumber: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

export type ShipmentStatus = "PENDING" | "ASSIGNED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";

export type ShipmentResponse = {
  id: string;
  order: {
    id: string;
    orderNumber: string;
    customerName: string;
    status: OrderStatus;
    totalAmount: number;
  };
  carrier: string | null;
  trackingNumber: string | null;
  status: ShipmentStatus;
  trackingEvents: Array<{
    id: string;
    status: string;
    location: string | null;
    note: string | null;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

export type NotificationResponse = {
  id: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export type AuditLogResponse = {
  id: string;
  organizationId: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type DashboardAnalyticsResponse = {
  kpis: {
    totalOrders: number;
    inventoryValue: number;
    openShipments: number;
    lowStockItems: number;
    onTimeDeliveryRate: number;
  };
  ordersByStatus: Record<OrderStatus, number>;
  shipmentsByStatus: Record<ShipmentStatus, number>;
  movementsByType: Record<StockMovementType, { count: number; quantity: number }>;
};

export type CategoryResponse = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
    details?: Array<{
      path: string;
      message: string;
    }>;
  };
};

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: Array<{
    path: string;
    message: string;
  }>;

  constructor(
    status: number,
    message: string,
    code?: string,
    details?: Array<{ path: string; message: string }>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as ApiErrorBody | T;

  if (!response.ok) {
    const errorBody = body as ApiErrorBody;

    throw new ApiError(
      response.status,
      errorBody.error?.message ?? "Request failed",
      errorBody.error?.code,
      errorBody.error?.details,
    );
  }

  return body as T;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { accessToken?: string } = {},
) {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  if (options.accessToken) {
    headers.set("authorization", `Bearer ${options.accessToken}`);
  }

  return parseResponse<T>(
    await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: "include",
    }),
  );
}
