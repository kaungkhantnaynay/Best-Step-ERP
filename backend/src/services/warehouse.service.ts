import { Prisma } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/app-error.js";
import { parsePagePagination } from "../utils/pagination.js";
import type {
  WarehouseBinCreateInput,
  WarehouseCreateInput,
  WarehouseListQuery,
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

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function normalizeOptionalText(value?: string | null) {
  if (value === undefined) return undefined;
  if (value === null || value.trim() === "") return null;

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

export async function createWarehouse(organizationId: string, input: WarehouseCreateInput) {
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

    return toWarehouseBinResponse(bin);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError(409, "WAREHOUSE_BIN_CODE_ALREADY_EXISTS", "Warehouse bin code already exists");
    }

    throw error;
  }
}
