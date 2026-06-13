import { ProductStatus, StockMovementType } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../prisma/client.js";
import {
  listInventory,
  listStockMovements,
  stockIn,
  stockOut,
} from "./inventory.service.js";

vi.mock("../prisma/client.js", () => ({
  prisma: (() => {
    const mockPrisma = {
      $transaction: vi.fn((callback) => callback(mockPrisma)),
      product: { findFirst: vi.fn() },
      warehouseBin: { findFirst: vi.fn() },
      inventory: {
        aggregate: vi.fn(),
        count: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
      },
      stockMovement: {
        count: vi.fn(),
        create: vi.fn(),
        findMany: vi.fn(),
      },
      notification: {
        create: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
    };

    return mockPrisma;
  })(),
}));

const mockedProductFindFirst = vi.mocked(prisma.product.findFirst);
const mockedWarehouseBinFindFirst = vi.mocked(prisma.warehouseBin.findFirst);
const mockedInventoryAggregate = vi.mocked(prisma.inventory.aggregate);
const mockedInventoryCount = vi.mocked(prisma.inventory.count);
const mockedInventoryFindMany = vi.mocked(prisma.inventory.findMany);
const mockedInventoryFindUnique = vi.mocked(prisma.inventory.findUnique);
const mockedInventoryUpdate = vi.mocked(prisma.inventory.update);
const mockedInventoryUpsert = vi.mocked(prisma.inventory.upsert);
const mockedStockMovementCount = vi.mocked(prisma.stockMovement.count);
const mockedStockMovementCreate = vi.mocked(prisma.stockMovement.create);
const mockedStockMovementFindMany = vi.mocked(prisma.stockMovement.findMany);
const mockedNotificationCreate = vi.mocked(prisma.notification.create);

function decimal(value: number) {
  return { toNumber: () => value };
}

function product(overrides: Record<string, unknown> = {}) {
  return {
    id: "product-1",
    organizationId: "org-1",
    categoryId: null,
    sku: "BS-SOLE-001",
    name: "Trail Runner Sole Kit",
    description: null,
    unit: "each",
    price: decimal(12),
    reorderLevel: 10,
    status: ProductStatus.ACTIVE,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    inventory: [{ quantity: 20 }],
    ...overrides,
  };
}

function warehouse() {
  return {
    id: "warehouse-1",
    organizationId: "org-1",
    name: "North Dock",
    code: "WH-NORTH",
    address: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  };
}

function bin() {
  return {
    id: "bin-1",
    warehouseId: "warehouse-1",
    code: "A-01",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    warehouse: warehouse(),
  };
}

function inventoryRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "inventory-1",
    productId: "product-1",
    binId: "bin-1",
    quantity: 20,
    updatedAt: new Date("2026-01-03T00:00:00.000Z"),
    product: product(),
    bin: bin(),
    ...overrides,
  };
}

function movement(overrides: Record<string, unknown> = {}) {
  return {
    id: "movement-1",
    organizationId: "org-1",
    productId: "product-1",
    warehouseId: "warehouse-1",
    type: StockMovementType.STOCK_IN,
    quantity: 12,
    reference: "PO-100",
    createdAt: new Date("2026-01-04T00:00:00.000Z"),
    product: product(),
    warehouse: warehouse(),
    ...overrides,
  };
}

describe("inventory service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("lists tenant-scoped inventory with valuation and low-stock risk", async () => {
    mockedInventoryFindMany.mockResolvedValue([
      inventoryRow({
        quantity: 4,
        product: product({ inventory: [{ quantity: 4 }], reorderLevel: 10 }),
      }),
    ] as never);
    mockedInventoryCount.mockResolvedValue(1);

    const result = await listInventory("org-1", { page: 1, limit: 25 });

    expect(mockedInventoryFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ product: { organizationId: "org-1" } }),
      }),
    );
    expect(result.inventory[0]).toMatchObject({
      quantity: 4,
      productTotalQuantity: 4,
      risk: "Low",
      inventoryValue: 48,
    });
  });

  it("filters low-stock inventory after deriving product totals", async () => {
    mockedInventoryFindMany.mockResolvedValue([
      inventoryRow({
        id: "low",
        product: product({ inventory: [{ quantity: 5 }], reorderLevel: 10 }),
      }),
      inventoryRow({
        id: "healthy",
        product: product({ inventory: [{ quantity: 30 }], reorderLevel: 10 }),
      }),
    ] as never);

    const result = await listInventory("org-1", { page: 1, limit: 25, lowStock: true });

    expect(result.inventory).toHaveLength(1);
    expect(result.inventory[0].id).toBe("low");
    expect(mockedInventoryCount).not.toHaveBeenCalled();
  });

  it("adds stock, records a movement, and returns the updated inventory row", async () => {
    mockedProductFindFirst.mockResolvedValue({ id: "product-1", name: "Trail Runner Sole Kit", sku: "BS-SOLE-001", reorderLevel: 10 } as never);
    mockedWarehouseBinFindFirst.mockResolvedValue(bin() as never);
    mockedInventoryAggregate
      .mockResolvedValueOnce({ _sum: { quantity: 10 } } as never)
      .mockResolvedValueOnce({ _sum: { quantity: 15 } } as never);
    mockedInventoryFindUnique.mockResolvedValue(
      inventoryRow({ quantity: 15, product: product({ inventory: [{ quantity: 15 }] }) }) as never,
    );
    mockedStockMovementCreate.mockResolvedValue(movement({ id: "movement-stock-in" }) as never);

    await expect(
      stockIn("org-1", { productId: "product-1", binId: "bin-1", quantity: 5, reference: "PO-100" }),
    ).resolves.toMatchObject({
      quantity: 15,
      productTotalQuantity: 15,
    });

    expect(mockedInventoryUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { quantity: { increment: 5 } },
        create: { productId: "product-1", binId: "bin-1", quantity: 5 },
      }),
    );
    expect(mockedStockMovementCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: StockMovementType.STOCK_IN, warehouseId: "warehouse-1" }),
      }),
    );
  });

  it("removes stock and creates a low-stock notification when crossing the reorder level", async () => {
    mockedProductFindFirst.mockResolvedValue({ id: "product-1", name: "Trail Runner Sole Kit", sku: "BS-SOLE-001", reorderLevel: 10 } as never);
    mockedWarehouseBinFindFirst.mockResolvedValue(bin() as never);
    mockedInventoryFindUnique
      .mockResolvedValueOnce({ quantity: 12 } as never)
      .mockResolvedValueOnce(
        inventoryRow({ quantity: 9, product: product({ inventory: [{ quantity: 9 }] }) }) as never,
      );
    mockedInventoryAggregate
      .mockResolvedValueOnce({ _sum: { quantity: 12 } } as never)
      .mockResolvedValueOnce({ _sum: { quantity: 9 } } as never);
    mockedStockMovementCreate.mockResolvedValue(movement({ id: "movement-stock-out" }) as never);

    await stockOut("org-1", { productId: "product-1", binId: "bin-1", quantity: 3, reference: "SO-100" });

    expect(mockedInventoryUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { quantity: { decrement: 3 } } }),
    );
    expect(mockedStockMovementCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: StockMovementType.STOCK_OUT, quantity: 3 }),
      }),
    );
    expect(mockedNotificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ organizationId: "org-1", title: "Low stock: Trail Runner Sole Kit" }),
      }),
    );
  });

  it("rejects stock-out when the selected bin has insufficient stock", async () => {
    mockedProductFindFirst.mockResolvedValue({ id: "product-1", name: "Trail Runner Sole Kit", sku: "BS-SOLE-001", reorderLevel: 10 } as never);
    mockedWarehouseBinFindFirst.mockResolvedValue(bin() as never);
    mockedInventoryFindUnique.mockResolvedValue({ quantity: 2 } as never);

    await expect(
      stockOut("org-1", { productId: "product-1", binId: "bin-1", quantity: 3, reference: null }),
    ).rejects.toMatchObject({
      code: "INSUFFICIENT_STOCK",
    });
    expect(mockedInventoryUpdate).not.toHaveBeenCalled();
  });

  it("refuses stock mutations for products outside the tenant", async () => {
    mockedProductFindFirst.mockResolvedValue(null);

    await expect(
      stockIn("org-1", { productId: "product-1", binId: "bin-1", quantity: 1, reference: null }),
    ).rejects.toMatchObject({
      code: "PRODUCT_NOT_FOUND",
    });
  });

  it("lists tenant-scoped stock movement history", async () => {
    mockedStockMovementFindMany.mockResolvedValue([movement()] as never);
    mockedStockMovementCount.mockResolvedValue(1);

    const result = await listStockMovements("org-1", { page: 1, limit: 25 });

    expect(mockedStockMovementFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: "org-1" } }),
    );
    expect(result.movements[0]).toMatchObject({
      type: StockMovementType.STOCK_IN,
      product: { sku: "BS-SOLE-001" },
      warehouse: { code: "WH-NORTH" },
    });
  });
});
