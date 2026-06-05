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
  };
};

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
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
