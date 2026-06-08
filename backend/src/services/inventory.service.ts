import { Prisma, ProductStatus, StockMovementType } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/app-error.js";
import { parsePagePagination } from "../utils/pagination.js";
import type {
  InventoryListQuery,
  StockMovementListQuery,
  StockMutationInput,
} from "../validators/inventory.validators.js";

const includeInventoryRelations = {
  product: {
    include: {
      inventory: {
        select: {
          quantity: true,
        },
      },
    },
  },
  bin: {
    include: {
      warehouse: true,
    },
  },
} satisfies Prisma.InventoryInclude;

const includeMovementRelations = {
  product: true,
  warehouse: true,
} satisfies Prisma.StockMovementInclude;

type InventoryRecord = Prisma.InventoryGetPayload<{ include: typeof includeInventoryRelations }>;
type StockMovementRecord = Prisma.StockMovementGetPayload<{ include: typeof includeMovementRelations }>;
type InventoryTransaction = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

function normalizeReference(reference?: string | null) {
  if (reference === undefined || reference === null || reference.trim() === "") return null;

  return reference.trim();
}

function productTotalStock(product: InventoryRecord["product"]) {
  return product.inventory.reduce((total, row) => total + row.quantity, 0);
}

function inventoryRisk(totalStock: number, reorderLevel: number) {
  if (totalStock === 0) return "Critical";
  if (totalStock <= reorderLevel) return "Low";
  if (reorderLevel > 0 && totalStock <= reorderLevel * 2) return "Watch";

  return "Healthy";
}

function toInventoryResponse(row: InventoryRecord) {
  const totalStock = productTotalStock(row.product);
  const price = row.product.price.toNumber();

  return {
    id: row.id,
    product: {
      id: row.product.id,
      sku: row.product.sku,
      name: row.product.name,
      unit: row.product.unit,
    },
    warehouse: {
      id: row.bin.warehouse.id,
      code: row.bin.warehouse.code,
      name: row.bin.warehouse.name,
    },
    bin: {
      id: row.bin.id,
      code: row.bin.code,
    },
    quantity: row.quantity,
    productTotalQuantity: totalStock,
    reorderLevel: row.product.reorderLevel,
    risk: inventoryRisk(totalStock, row.product.reorderLevel),
    inventoryValue: row.quantity * price,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toStockMovementResponse(row: StockMovementRecord) {
  return {
    id: row.id,
    type: row.type,
    quantity: row.quantity,
    reference: row.reference,
    product: {
      id: row.product.id,
      sku: row.product.sku,
      name: row.product.name,
    },
    warehouse: {
      id: row.warehouse.id,
      code: row.warehouse.code,
      name: row.warehouse.name,
    },
    createdAt: row.createdAt.toISOString(),
  };
}

function buildInventoryWhere(organizationId: string, query: InventoryListQuery): Prisma.InventoryWhereInput {
  const where: Prisma.InventoryWhereInput = {
    product: { organizationId },
    bin: { warehouse: { organizationId } },
  };

  if (query.productId) where.productId = query.productId;
  if (query.binId) where.binId = query.binId;
  if (query.warehouseId) where.bin = { warehouse: { id: query.warehouseId, organizationId } };
  if (query.search) {
    where.OR = [
      { product: { name: { contains: query.search, mode: "insensitive" } } },
      { product: { sku: { contains: query.search, mode: "insensitive" } } },
      { bin: { code: { contains: query.search, mode: "insensitive" } } },
      { bin: { warehouse: { name: { contains: query.search, mode: "insensitive" } } } },
      { bin: { warehouse: { code: { contains: query.search, mode: "insensitive" } } } },
    ];
  }

  return where;
}

function buildMovementWhere(
  organizationId: string,
  query: StockMovementListQuery,
): Prisma.StockMovementWhereInput {
  const where: Prisma.StockMovementWhereInput = { organizationId };

  if (query.productId) where.productId = query.productId;
  if (query.warehouseId) where.warehouseId = query.warehouseId;
  if (query.type) where.type = query.type;

  return where;
}

async function getActiveProduct(tx: InventoryTransaction, organizationId: string, productId: string) {
  const product = await tx.product.findFirst({
    where: { id: productId, organizationId, status: ProductStatus.ACTIVE },
    select: {
      id: true,
      name: true,
      sku: true,
      reorderLevel: true,
    },
  });

  if (!product) throw new AppError(404, "PRODUCT_NOT_FOUND", "Active product was not found");

  return product;
}

async function getTenantBin(tx: InventoryTransaction, organizationId: string, binId: string) {
  const bin = await tx.warehouseBin.findFirst({
    where: { id: binId, warehouse: { organizationId } },
    include: {
      warehouse: true,
    },
  });

  if (!bin) throw new AppError(404, "WAREHOUSE_BIN_NOT_FOUND", "Warehouse bin was not found");

  return bin;
}

async function getProductTotalQuantity(tx: InventoryTransaction, productId: string) {
  const result = await tx.inventory.aggregate({
    where: { productId },
    _sum: { quantity: true },
  });

  return result._sum.quantity ?? 0;
}

async function maybeCreateLowStockNotification(
  tx: InventoryTransaction,
  input: {
    organizationId: string;
    productName: string;
    productSku: string;
    beforeTotal: number;
    afterTotal: number;
    reorderLevel: number;
  },
) {
  if (input.beforeTotal <= input.reorderLevel || input.afterTotal > input.reorderLevel) return;

  await tx.notification.create({
    data: {
      organizationId: input.organizationId,
      title: `Low stock: ${input.productName}`,
      body: `${input.productSku} is at ${input.afterTotal} units, at or below the reorder level of ${input.reorderLevel}.`,
    },
  });
}

async function getInventoryRow(tx: InventoryTransaction, productId: string, binId: string) {
  const row = await tx.inventory.findUnique({
    where: { productId_binId: { productId, binId } },
    include: includeInventoryRelations,
  });

  if (!row) throw new AppError(404, "INVENTORY_NOT_FOUND", "Inventory row was not found");

  return row;
}

export async function listInventory(organizationId: string, query: InventoryListQuery) {
  const pagination = parsePagePagination(query);
  const where = buildInventoryWhere(organizationId, query);
  const rows = await prisma.inventory.findMany({
    where,
    include: includeInventoryRelations,
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    skip: query.lowStock ? undefined : pagination.skip,
    take: query.lowStock ? undefined : pagination.limit,
  });
  const filteredRows = query.lowStock
    ? rows.filter((row) => productTotalStock(row.product) <= row.product.reorderLevel)
    : rows;
  const total = query.lowStock ? filteredRows.length : await prisma.inventory.count({ where });
  const pagedRows = query.lowStock
    ? filteredRows.slice(pagination.skip, pagination.skip + pagination.limit)
    : filteredRows;

  return {
    inventory: pagedRows.map(toInventoryResponse),
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
}

export async function stockIn(organizationId: string, input: StockMutationInput) {
  return prisma.$transaction(async (tx) => {
    const product = await getActiveProduct(tx, organizationId, input.productId);
    const bin = await getTenantBin(tx, organizationId, input.binId);
    const beforeTotal = await getProductTotalQuantity(tx, input.productId);

    await tx.inventory.upsert({
      where: { productId_binId: { productId: input.productId, binId: input.binId } },
      update: { quantity: { increment: input.quantity } },
      create: { productId: input.productId, binId: input.binId, quantity: input.quantity },
    });
    await tx.stockMovement.create({
      data: {
        organizationId,
        productId: input.productId,
        warehouseId: bin.warehouse.id,
        type: StockMovementType.STOCK_IN,
        quantity: input.quantity,
        reference: normalizeReference(input.reference),
      },
    });

    const afterTotal = await getProductTotalQuantity(tx, input.productId);
    await maybeCreateLowStockNotification(tx, {
      organizationId,
      productName: product.name,
      productSku: product.sku,
      beforeTotal,
      afterTotal,
      reorderLevel: product.reorderLevel,
    });

    return toInventoryResponse(await getInventoryRow(tx, input.productId, input.binId));
  });
}

export async function stockOut(organizationId: string, input: StockMutationInput) {
  return prisma.$transaction(async (tx) => {
    const product = await getActiveProduct(tx, organizationId, input.productId);
    const bin = await getTenantBin(tx, organizationId, input.binId);
    const currentInventory = await tx.inventory.findUnique({
      where: { productId_binId: { productId: input.productId, binId: input.binId } },
      select: { quantity: true },
    });

    if (!currentInventory || currentInventory.quantity < input.quantity) {
      throw new AppError(409, "INSUFFICIENT_STOCK", "Insufficient stock in the selected bin");
    }

    const beforeTotal = await getProductTotalQuantity(tx, input.productId);
    await tx.inventory.update({
      where: { productId_binId: { productId: input.productId, binId: input.binId } },
      data: { quantity: { decrement: input.quantity } },
    });
    await tx.stockMovement.create({
      data: {
        organizationId,
        productId: input.productId,
        warehouseId: bin.warehouse.id,
        type: StockMovementType.STOCK_OUT,
        quantity: input.quantity,
        reference: normalizeReference(input.reference),
      },
    });

    const afterTotal = await getProductTotalQuantity(tx, input.productId);
    await maybeCreateLowStockNotification(tx, {
      organizationId,
      productName: product.name,
      productSku: product.sku,
      beforeTotal,
      afterTotal,
      reorderLevel: product.reorderLevel,
    });

    return toInventoryResponse(await getInventoryRow(tx, input.productId, input.binId));
  });
}

export async function listStockMovements(organizationId: string, query: StockMovementListQuery) {
  const pagination = parsePagePagination(query);
  const where = buildMovementWhere(organizationId, query);
  const [rows, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: includeMovementRelations,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return {
    movements: rows.map(toStockMovementResponse),
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
}
