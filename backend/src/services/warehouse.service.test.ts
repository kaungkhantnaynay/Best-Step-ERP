import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../prisma/client.js";
import {
  createWarehouse,
  createWarehouseBin,
  getWarehouse,
  listWarehouses,
  transferWarehouseStock,
} from "./warehouse.service.js";

vi.mock("../prisma/client.js", () => ({
  prisma: {
    $transaction: vi.fn(),
    warehouse: {
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    warehouseBin: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    product: {
      findFirst: vi.fn(),
    },
    inventory: {
      findUnique: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    stockMovement: {
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

const mockedTransaction = vi.mocked(prisma.$transaction);
const mockedWarehouseCount = vi.mocked(prisma.warehouse.count);
const mockedWarehouseCreate = vi.mocked(prisma.warehouse.create);
const mockedWarehouseFindFirst = vi.mocked(prisma.warehouse.findFirst);
const mockedWarehouseFindMany = vi.mocked(prisma.warehouse.findMany);
const mockedWarehouseBinCreate = vi.mocked(prisma.warehouseBin.create);
const mockedWarehouseBinFindFirst = vi.mocked(prisma.warehouseBin.findFirst);
const mockedProductFindFirst = vi.mocked(prisma.product.findFirst);
const mockedInventoryFindUnique = vi.mocked(prisma.inventory.findUnique);
const mockedInventoryUpdate = vi.mocked(prisma.inventory.update);
const mockedInventoryUpsert = vi.mocked(prisma.inventory.upsert);
const mockedStockMovementCreate = vi.mocked(prisma.stockMovement.create);

function warehouse(overrides: Record<string, unknown> = {}) {
  return {
    id: "warehouse-1",
    organizationId: "org-1",
    name: "North Dock",
    code: "WH-NORTH",
    address: "100 Harbor Road",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    bins: [
      {
        id: "bin-1",
        warehouseId: "warehouse-1",
        code: "A-01",
        createdAt: new Date("2026-01-03T00:00:00.000Z"),
        updatedAt: new Date("2026-01-04T00:00:00.000Z"),
        inventory: [{ quantity: 12 }, { quantity: 8 }],
      },
    ],
    ...overrides,
  };
}

function uniqueConstraintError() {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "test",
  });
}

function transferBin(overrides: Record<string, unknown> = {}) {
  return {
    id: "bin-1",
    warehouseId: "warehouse-1",
    code: "A-01",
    createdAt: new Date("2026-01-03T00:00:00.000Z"),
    updatedAt: new Date("2026-01-04T00:00:00.000Z"),
    warehouse: {
      id: "warehouse-1",
      name: "North Dock",
      code: "WH-NORTH",
    },
    ...overrides,
  };
}

describe("warehouse service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedTransaction.mockImplementation(async (callback) => callback(prisma as never));
  });

  it("lists tenant-scoped warehouses with derived bin totals", async () => {
    mockedWarehouseFindMany.mockResolvedValue([warehouse()] as never);
    mockedWarehouseCount.mockResolvedValue(1);

    const result = await listWarehouses("org-1", { page: 1, limit: 25 });

    expect(mockedWarehouseFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: "org-1" } }),
    );
    expect(result.warehouses[0]).toMatchObject({
      binsCount: 1,
      totalQuantity: 20,
      bins: [{ code: "A-01", totalQuantity: 20 }],
    });
  });

  it("gets warehouse details only inside the tenant", async () => {
    mockedWarehouseFindFirst.mockResolvedValue(warehouse() as never);

    await expect(getWarehouse("org-1", "warehouse-1")).resolves.toMatchObject({
      id: "warehouse-1",
      code: "WH-NORTH",
    });

    expect(mockedWarehouseFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "warehouse-1", organizationId: "org-1" } }),
    );
  });

  it("refuses warehouse details outside the tenant", async () => {
    mockedWarehouseFindFirst.mockResolvedValue(null);

    await expect(getWarehouse("org-1", "warehouse-1")).rejects.toMatchObject({
      code: "WAREHOUSE_NOT_FOUND",
    });
  });

  it("creates tenant-scoped warehouses", async () => {
    mockedWarehouseCreate.mockResolvedValue(warehouse({ address: null, bins: [] }) as never);

    await expect(
      createWarehouse("org-1", { name: "North Dock", code: "WH-NORTH", address: "" }),
    ).resolves.toMatchObject({
      code: "WH-NORTH",
      address: null,
      binsCount: 0,
    });

    expect(mockedWarehouseCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ organizationId: "org-1", address: null }),
      }),
    );
  });

  it("returns a conflict for duplicate warehouse codes", async () => {
    mockedWarehouseCreate.mockRejectedValue(uniqueConstraintError());

    await expect(
      createWarehouse("org-1", { name: "North Dock", code: "WH-NORTH" }),
    ).rejects.toMatchObject({
      code: "WAREHOUSE_CODE_ALREADY_EXISTS",
    });
  });

  it("creates bins after checking warehouse tenant ownership", async () => {
    mockedWarehouseFindFirst.mockResolvedValue(warehouse() as never);
    mockedWarehouseBinCreate.mockResolvedValue({
      id: "bin-2",
      warehouseId: "warehouse-1",
      code: "B-01",
      createdAt: new Date("2026-01-05T00:00:00.000Z"),
      updatedAt: new Date("2026-01-06T00:00:00.000Z"),
      inventory: [],
    } as never);

    await expect(createWarehouseBin("org-1", "warehouse-1", { code: "B-01" })).resolves.toMatchObject({
      id: "bin-2",
      code: "B-01",
      totalQuantity: 0,
    });

    expect(mockedWarehouseFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "warehouse-1", organizationId: "org-1" } }),
    );
  });

  it("returns a conflict for duplicate bin codes", async () => {
    mockedWarehouseFindFirst.mockResolvedValue(warehouse() as never);
    mockedWarehouseBinCreate.mockRejectedValue(uniqueConstraintError());

    await expect(createWarehouseBin("org-1", "warehouse-1", { code: "A-01" })).rejects.toMatchObject({
      code: "WAREHOUSE_BIN_CODE_ALREADY_EXISTS",
    });
  });

  it("transfers stock between tenant bins in a transaction", async () => {
    mockedProductFindFirst.mockResolvedValue({ id: "product-1", name: "Trail Runner", sku: "SKU-1" } as never);
    mockedWarehouseBinFindFirst
      .mockResolvedValueOnce(transferBin() as never)
      .mockResolvedValueOnce(transferBin({
        id: "bin-2",
        warehouseId: "warehouse-2",
        code: "B-01",
        warehouse: { id: "warehouse-2", name: "South Annex", code: "WH-SOUTH" },
      }) as never);
    mockedInventoryFindUnique.mockResolvedValue({ id: "inventory-1", quantity: 12 } as never);
    mockedInventoryUpsert.mockResolvedValue({
      id: "inventory-2",
      productId: "product-1",
      binId: "bin-2",
      quantity: 7,
      updatedAt: new Date("2026-01-05T00:00:00.000Z"),
      product: { inventory: [], price: { toNumber: () => 10 }, reorderLevel: 0 },
      bin: { warehouse: {} },
    } as never);
    mockedStockMovementCreate
      .mockResolvedValueOnce({ id: "movement-from" } as never)
      .mockResolvedValueOnce({ id: "movement-to" } as never);

    await expect(
      transferWarehouseStock("org-1", {
        productId: "product-1",
        fromBinId: "bin-1",
        toBinId: "bin-2",
        quantity: 5,
        reference: "move-1",
      }),
    ).resolves.toMatchObject({
      quantity: 5,
      reference: "move-1",
      from: { binId: "bin-1" },
      to: { binId: "bin-2", quantity: 7 },
    });

    expect(mockedInventoryUpdate).toHaveBeenCalledWith({
      where: { id: "inventory-1" },
      data: { quantity: { decrement: 5 } },
    });
    expect(mockedInventoryUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { productId_binId: { productId: "product-1", binId: "bin-2" } },
        update: { quantity: { increment: 5 } },
      }),
    );
    expect(mockedStockMovementCreate).toHaveBeenCalledTimes(2);
  });

  it("refuses transfer when source stock is insufficient", async () => {
    mockedProductFindFirst.mockResolvedValue({ id: "product-1", name: "Trail Runner", sku: "SKU-1" } as never);
    mockedWarehouseBinFindFirst
      .mockResolvedValueOnce(transferBin() as never)
      .mockResolvedValueOnce(transferBin({ id: "bin-2" }) as never);
    mockedInventoryFindUnique.mockResolvedValue({ id: "inventory-1", quantity: 2 } as never);

    await expect(
      transferWarehouseStock("org-1", {
        productId: "product-1",
        fromBinId: "bin-1",
        toBinId: "bin-2",
        quantity: 5,
        reference: null,
      }),
    ).rejects.toMatchObject({ code: "INSUFFICIENT_STOCK" });

    expect(mockedInventoryUpdate).not.toHaveBeenCalled();
    expect(mockedStockMovementCreate).not.toHaveBeenCalled();
  });

  it("refuses transfer into the same bin", async () => {
    await expect(
      transferWarehouseStock("org-1", {
        productId: "product-1",
        fromBinId: "bin-1",
        toBinId: "bin-1",
        quantity: 1,
        reference: null,
      }),
    ).rejects.toMatchObject({ code: "SAME_TRANSFER_BIN" });
  });
});
