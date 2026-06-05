import { ProductStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../prisma/client.js";
import {
  archiveProduct,
  createCategory,
  createProduct,
  listCategories,
  listProducts,
  updateProduct,
} from "./product.service.js";

vi.mock("../prisma/client.js", () => ({
  prisma: {
    category: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
    product: {
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const mockedCategoryCreate = vi.mocked(prisma.category.create);
const mockedCategoryFindFirst = vi.mocked(prisma.category.findFirst);
const mockedCategoryFindMany = vi.mocked(prisma.category.findMany);
const mockedProductCount = vi.mocked(prisma.product.count);
const mockedProductCreate = vi.mocked(prisma.product.create);
const mockedProductFindFirst = vi.mocked(prisma.product.findFirst);
const mockedProductFindMany = vi.mocked(prisma.product.findMany);
const mockedProductFindUnique = vi.mocked(prisma.product.findUnique);
const mockedProductUpdate = vi.mocked(prisma.product.update);

function decimal(value: number) {
  return { toNumber: () => value };
}

function product(overrides: Record<string, unknown> = {}) {
  return {
    id: "product-1",
    organizationId: "org-1",
    categoryId: "category-1",
    sku: "BS-SOLE-001",
    name: "Trail Runner Sole Kit",
    description: null,
    unit: "each",
    price: decimal(12),
    reorderLevel: 10,
    status: ProductStatus.ACTIVE,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    category: { id: "category-1", name: "Footwear Parts" },
    inventory: [{ quantity: 20, bin: { warehouse: { name: "North Dock" } } }],
    ...overrides,
  };
}

describe("product service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("lists tenant-scoped products with derived stock fields", async () => {
    mockedProductFindMany.mockResolvedValue([product()] as never);
    mockedProductCount.mockResolvedValue(1);

    const result = await listProducts("org-1", { page: 1, limit: 25 });

    expect(mockedProductFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: "org-1" } }),
    );
    expect(result.products[0]).toMatchObject({
      stockQuantity: 20,
      stockStatus: "Active",
      inventoryValue: 240,
      locationSummary: "North Dock",
    });
  });

  it("creates a product with a generated SKU", async () => {
    mockedCategoryFindFirst.mockResolvedValue({ id: "category-1" } as never);
    mockedProductFindUnique.mockResolvedValue(null);
    mockedProductCreate.mockResolvedValue(product({ sku: "BS-TRAIL-RUNNER-SOLE-KIT-001" }) as never);

    const result = await createProduct("org-1", {
      categoryId: "category-1",
      name: "Trail Runner Sole Kit",
      unit: "each",
      price: 12,
      reorderLevel: 10,
    });

    expect(result.sku).toBe("BS-TRAIL-RUNNER-SOLE-KIT-001");
  });

  it("refuses updates outside the tenant", async () => {
    mockedProductFindFirst.mockResolvedValue(null);

    await expect(updateProduct("org-1", "product-1", { name: "Updated" })).rejects.toMatchObject({
      code: "PRODUCT_NOT_FOUND",
    });
  });

  it("archives products instead of deleting them", async () => {
    mockedProductFindFirst.mockResolvedValue(product() as never);
    mockedProductUpdate.mockResolvedValue(product({ status: ProductStatus.ARCHIVED }) as never);

    await archiveProduct("org-1", "product-1");

    expect(mockedProductUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "product-1" }, data: { status: ProductStatus.ARCHIVED } }),
    );
  });

  it("lists and creates tenant-scoped categories", async () => {
    mockedCategoryFindMany.mockResolvedValue([
      {
        id: "category-1",
        name: "Footwear Parts",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      },
    ] as never);
    mockedCategoryCreate.mockResolvedValue({
      id: "category-2",
      name: "Packaging",
      createdAt: new Date("2026-01-03T00:00:00.000Z"),
      updatedAt: new Date("2026-01-04T00:00:00.000Z"),
    } as never);

    await expect(listCategories("org-1")).resolves.toHaveLength(1);
    await expect(createCategory("org-1", { name: "Packaging" })).resolves.toMatchObject({
      id: "category-2",
      name: "Packaging",
    });
  });
});
