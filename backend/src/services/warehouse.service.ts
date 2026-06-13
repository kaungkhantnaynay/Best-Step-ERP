import { Prisma, ProductStatus, StockMovementType } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { recordAuditLog } from "./audit.service.js";
import { AppError } from "../utils/app-error.js";
import { parsePagePagination } from "../utils/pagination.js";
import type {
  WarehouseBinCreateInput,
  WarehouseCreateInput,
  WarehouseListQuery,
  WarehouseTransferInput,
} from "../validators/warehouse.validators.js";

const includeWarehouseRelations = {
  bins: {
    include: {
      inventory: true,
    },
    orderBy: { code: "asc" },
  },
} satisfies Prisma.WarehouseInclude;

type WarehouseRecord = Prisma.WarehouseGetPayload<{ include: typeof includeWarehouseRelations }>;
type WarehouseBinRecord = WarehouseRecord["bins"][number];
type WarehouseTransaction = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function normalizeOptionalText(value?: string | null) {
  if (value === undefined) return undefined;
  if (value === null || value.trim() === "") return null;

  return value.trim();
}

function normalizeReference(value?: string | null) {
  if (value === undefined || value === null || value.trim() === "") return null;

  return value.trim();
}

function binQuantity(bin: WarehouseBinRecord) {
  return bin.inventory.reduce((total, item) => total + item.quantity, 0);
}

function toWarehouseBinResponse(bin: WarehouseBinRecord) {
  return {
    id: bin.id,
    code: bin.code,
    totalQuantity: binQuantity(bin),
    createdAt: bin.createdAt.toISOString(),
    updatedAt: bin.updatedAt.toISOString(),
  };
}

function toWarehouseResponse(warehouse: WarehouseRecord) {
  const bins = warehouse.bins.map(toWarehouseBinResponse);
  const totalQuantity = bins.reduce((total, bin) => total + bin.totalQuantity, 0);

  return {
    id: warehouse.id,
    name: warehouse.name,
    code: warehouse.code,
    address: warehouse.address,
    binsCount: bins.length,
    totalQuantity,
    bins,
    createdAt: warehouse.createdAt.toISOString(),
    updatedAt: warehouse.updatedAt.toISOString(),
  };
}

function buildWarehouseWhere(organizationId: string, query: WarehouseListQuery): Prisma.WarehouseWhereInput {
  const where: Prisma.WarehouseWhereInput = { organizationId };

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { code: { contains: query.search, mode: "insensitive" } },
      { address: { contains: query.search, mode: "insensitive" } },
    ];
  }

  return where;
}

async function getWarehouseRecord(organizationId: string, id: string) {
  const warehouse = await prisma.warehouse.findFirst({
    where: { id, organizationId },
    include: includeWarehouseRelations,
  });

  if (!warehouse) throw new AppError(404, "WAREHOUSE_NOT_FOUND", "Warehouse was not found");

  return warehouse;
}

export async function listWarehouses(organizationId: string, query: WarehouseListQuery) {
  const pagination = parsePagePagination(query);
  const where = buildWarehouseWhere(organizationId, query);
  const [rows, total] = await Promise.all([
    prisma.warehouse.findMany({
      where,
      include: includeWarehouseRelations,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.warehouse.count({ where }),
  ]);

  return {
    warehouses: rows.map(toWarehouseResponse),
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
}

export async function getWarehouse(organizationId: string, id: string) {
  return toWarehouseResponse(await getWarehouseRecord(organizationId, id));
}

export async function createWarehouse(organizationId: string, input: WarehouseCreateInput, userId?: string) {
  try {
    const warehouse = await prisma.warehouse.create({
      data: {
        organizationId,
        name: input.name,
        code: input.code,
        address: normalizeOptionalText(input.address),
      },
      include: includeWarehouseRelations,
    });
    await recordAuditLog({
      organizationId,
      userId,
      action: "warehouse.create",
      entityType: "Warehouse",
      entityId: warehouse.id,
      metadata: { code: warehouse.code, name: warehouse.name },
    });

    return toWarehouseResponse(warehouse);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError(409, "WAREHOUSE_CODE_ALREADY_EXISTS", "Warehouse code already exists");
    }

    throw error;
  }
}

export async function createWarehouseBin(
  organizationId: string,
  warehouseId: string,
  input: WarehouseBinCreateInput,
  userId?: string,
) {
  await getWarehouseRecord(organizationId, warehouseId);

  try {
    const bin = await prisma.warehouseBin.create({
      data: {
        warehouseId,
        code: input.code,
      },
      include: {
        inventory: true,
      },
    });
    await recordAuditLog({
      organizationId,
      userId,
      action: "warehouse_bin.create",
      entityType: "WarehouseBin",
      entityId: bin.id,
      metadata: { warehouseId, code: bin.code },
    });

    return toWarehouseBinResponse(bin);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError(409, "WAREHOUSE_BIN_CODE_ALREADY_EXISTS", "Warehouse bin code already exists");
    }

    throw error;
  }
}

async function getTenantTransferBin(tx: WarehouseTransaction, organizationId: string, binId: string) {
  const bin = await tx.warehouseBin.findFirst({
    where: { id: binId, warehouse: { organizationId } },
    include: { warehouse: true },
  });

  if (!bin) throw new AppError(404, "WAREHOUSE_BIN_NOT_FOUND", "Warehouse bin was not found");

  return bin;
}

async function getTenantTransferProduct(
  tx: WarehouseTransaction,
  organizationId: string,
  productId: string,
) {
  const product = await tx.product.findFirst({
    where: { id: productId, organizationId, status: ProductStatus.ACTIVE },
    select: { id: true, name: true, sku: true },
  });

  if (!product) throw new AppError(404, "PRODUCT_NOT_FOUND", "Active product was not found");

  return product;
}

export async function transferWarehouseStock(organizationId: string, input: WarehouseTransferInput, userId?: string) {
  if (input.fromBinId === input.toBinId) {
    throw new AppError(400, "SAME_TRANSFER_BIN", "Transfer source and destination bins must be different");
  }

  return prisma.$transaction(async (tx) => {
    const [product, fromBin, toBin] = await Promise.all([
      getTenantTransferProduct(tx, organizationId, input.productId),
      getTenantTransferBin(tx, organizationId, input.fromBinId),
      getTenantTransferBin(tx, organizationId, input.toBinId),
    ]);
    const sourceInventory = await tx.inventory.findUnique({
      where: { productId_binId: { productId: input.productId, binId: input.fromBinId } },
      select: { id: true, quantity: true },
    });

    if (!sourceInventory || sourceInventory.quantity < input.quantity) {
      throw new AppError(409, "INSUFFICIENT_STOCK", "Insufficient stock in the source bin");
    }

    await tx.inventory.update({
      where: { id: sourceInventory.id },
      data: { quantity: { decrement: input.quantity } },
    });
    const destinationInventory = await tx.inventory.upsert({
      where: { productId_binId: { productId: input.productId, binId: input.toBinId } },
      update: { quantity: { increment: input.quantity } },
      create: { productId: input.productId, binId: input.toBinId, quantity: input.quantity },
      include: {
        product: { include: { inventory: { select: { quantity: true } } } },
        bin: { include: { warehouse: true } },
      },
    });
    const reference =
      normalizeReference(input.reference) ??
      `Transfer ${product.sku}: ${fromBin.code} to ${toBin.code}`;

    const sourceMovement = await tx.stockMovement.create({
      data: {
        organizationId,
        productId: input.productId,
        warehouseId: fromBin.warehouse.id,
        type: StockMovementType.TRANSFER,
        quantity: -input.quantity,
        reference,
      },
    });
    const destinationMovement = await tx.stockMovement.create({
      data: {
        organizationId,
        productId: input.productId,
        warehouseId: toBin.warehouse.id,
        type: StockMovementType.TRANSFER,
        quantity: input.quantity,
        reference,
      },
    });
    await recordAuditLog(
      {
        organizationId,
        userId,
        action: "warehouse_transfer.create",
        entityType: "StockMovement",
        entityId: sourceMovement.id,
        metadata: {
          productId: input.productId,
          fromBinId: input.fromBinId,
          toBinId: input.toBinId,
          quantity: input.quantity,
          reference,
          sourceMovementId: sourceMovement.id,
          destinationMovementId: destinationMovement.id,
        },
      },
      tx,
    );

    return {
      product,
      from: {
        binId: fromBin.id,
        binCode: fromBin.code,
        warehouseId: fromBin.warehouse.id,
        warehouseName: fromBin.warehouse.name,
      },
      to: {
        binId: toBin.id,
        binCode: toBin.code,
        warehouseId: toBin.warehouse.id,
        warehouseName: toBin.warehouse.name,
        quantity: destinationInventory.quantity,
      },
      quantity: input.quantity,
      reference,
    };
  });
}
