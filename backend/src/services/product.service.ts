import { Prisma, ProductStatus } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { recordAuditLog } from "./audit.service.js";
import { AppError } from "../utils/app-error.js";
import { parsePagePagination } from "../utils/pagination.js";
import type {
  CategoryCreateInput,
  ProductCreateInput,
  ProductListQuery,
  ProductUpdateInput,
} from "../validators/product.validators.js";

const includeProductRelations = {
  category: true,
  inventory: {
    include: {
      bin: {
        include: {
          warehouse: true,
        },
      },
    },
  },
} satisfies Prisma.ProductInclude;

type ProductRecord = Prisma.ProductGetPayload<{ include: typeof includeProductRelations }>;

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function toProductResponse(product: ProductRecord) {
  const stockQuantity = product.inventory.reduce((total, item) => total + item.quantity, 0);
  const warehouseNames = [...new Set(product.inventory.map((item) => item.bin.warehouse.name))];
  const price = product.price.toNumber();

  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    description: product.description,
    unit: product.unit,
    price,
    reorderLevel: product.reorderLevel,
    status: product.status,
    category: product.category ? { id: product.category.id, name: product.category.name } : null,
    stockQuantity,
    stockStatus:
      product.status === ProductStatus.ARCHIVED
        ? "Archived"
        : stockQuantity <= product.reorderLevel
          ? "Low stock"
          : "Active",
    inventoryValue: stockQuantity * price,
    locationSummary:
      warehouseNames.length === 0
        ? "No stock locations"
        : warehouseNames.length === 1
          ? warehouseNames[0]
          : `${warehouseNames.length} locations`,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

function toCategoryResponse(category: { id: string; name: string; createdAt: Date; updatedAt: Date }) {
  return {
    id: category.id,
    name: category.name,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

function buildProductWhere(organizationId: string, query: ProductListQuery): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { organizationId };

  if (query.status) where.status = query.status;
  if (query.categoryId) where.categoryId = query.categoryId;
  if (query.lowStock) where.status = ProductStatus.ACTIVE;
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { sku: { contains: query.search, mode: "insensitive" } },
      { category: { name: { contains: query.search, mode: "insensitive" } } },
    ];
  }

  return where;
}

async function assertCategoryBelongsToOrganization(organizationId: string, categoryId?: string | null) {
  if (!categoryId) return;

  const category = await prisma.category.findFirst({
    where: { id: categoryId, organizationId },
    select: { id: true },
  });

  if (!category) {
    throw new AppError(404, "CATEGORY_NOT_FOUND", "Category was not found");
  }
}

function skuPrefix(name: string) {
  const normalized = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);

  return `BS-${normalized || "PRODUCT"}`;
}

async function generateSku(organizationId: string, name: string) {
  const prefix = skuPrefix(name);

  for (let attempt = 1; attempt <= 100; attempt += 1) {
    const sku = `${prefix}-${String(attempt).padStart(3, "0")}`;
    const existing = await prisma.product.findUnique({
      where: { organizationId_sku: { organizationId, sku } },
      select: { id: true },
    });

    if (!existing) return sku;
  }

  throw new AppError(409, "SKU_GENERATION_FAILED", "Could not generate a unique SKU");
}

function mutationData(input: ProductCreateInput | ProductUpdateInput) {
  return {
    name: input.name,
    sku: input.sku,
    description:
      input.description === undefined
        ? undefined
        : input.description === null || input.description.trim() === ""
          ? null
          : input.description.trim(),
    categoryId: input.categoryId,
    unit: input.unit,
    price: input.price === undefined ? undefined : new Prisma.Decimal(input.price),
    reorderLevel: input.reorderLevel,
    status: input.status,
  };
}

export async function listProducts(organizationId: string, query: ProductListQuery) {
  const pagination = parsePagePagination(query);
  const where = buildProductWhere(organizationId, query);
  const rows = await prisma.product.findMany({
    where,
    include: includeProductRelations,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: query.lowStock ? undefined : pagination.skip,
    take: query.lowStock ? undefined : pagination.limit,
  });
  const lowStockRows = query.lowStock
    ? rows.filter(
        (product) =>
          product.inventory.reduce((total, item) => total + item.quantity, 0) <= product.reorderLevel,
      )
    : rows;
  const total = query.lowStock ? lowStockRows.length : await prisma.product.count({ where });
  const pagedRows = query.lowStock
    ? lowStockRows.slice(pagination.skip, pagination.skip + pagination.limit)
    : lowStockRows;

  return {
    products: pagedRows.map(toProductResponse),
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
}

export async function getProduct(organizationId: string, id: string) {
  const product = await prisma.product.findFirst({
    where: { id, organizationId },
    include: includeProductRelations,
  });

  if (!product) throw new AppError(404, "PRODUCT_NOT_FOUND", "Product was not found");

  return toProductResponse(product);
}

export async function createProduct(organizationId: string, input: ProductCreateInput, userId?: string) {
  await assertCategoryBelongsToOrganization(organizationId, input.categoryId);

  const sku = input.sku ?? (await generateSku(organizationId, input.name));

  try {
    const product = await prisma.product.create({
      data: {
        organizationId,
        name: input.name,
        sku,
        description:
          input.description === undefined
            ? undefined
            : input.description === null || input.description.trim() === ""
              ? null
              : input.description.trim(),
        categoryId: input.categoryId,
        unit: input.unit,
        price: new Prisma.Decimal(input.price),
        reorderLevel: input.reorderLevel,
        status: input.status ?? ProductStatus.ACTIVE,
      },
      include: includeProductRelations,
    });
    await recordAuditLog({
      organizationId,
      userId,
      action: "product.create",
      entityType: "Product",
      entityId: product.id,
      metadata: { sku: product.sku, name: product.name },
    });

    return toProductResponse(product);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError(409, "PRODUCT_SKU_ALREADY_EXISTS", "Product SKU already exists");
    }

    throw error;
  }
}

export async function updateProduct(organizationId: string, id: string, input: ProductUpdateInput, userId?: string) {
  await getProduct(organizationId, id);
  await assertCategoryBelongsToOrganization(organizationId, input.categoryId);

  try {
    const product = await prisma.product.update({
      where: { id },
      data: mutationData(input),
      include: includeProductRelations,
    });
    await recordAuditLog({
      organizationId,
      userId,
      action: "product.update",
      entityType: "Product",
      entityId: product.id,
      metadata: { sku: product.sku, name: product.name },
    });

    return toProductResponse(product);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError(409, "PRODUCT_SKU_ALREADY_EXISTS", "Product SKU already exists");
    }

    throw error;
  }
}

export async function archiveProduct(organizationId: string, id: string, userId?: string) {
  await getProduct(organizationId, id);

  const product = await prisma.product.update({
    where: { id },
    data: { status: ProductStatus.ARCHIVED },
    include: includeProductRelations,
  });
  await recordAuditLog({
    organizationId,
    userId,
    action: "product.archive",
    entityType: "Product",
    entityId: product.id,
    metadata: { sku: product.sku, name: product.name },
  });

  return toProductResponse(product);
}

export async function listCategories(organizationId: string) {
  const categories = await prisma.category.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
  });

  return categories.map(toCategoryResponse);
}

export async function createCategory(organizationId: string, input: CategoryCreateInput, userId?: string) {
  try {
    const category = await prisma.category.create({
      data: { organizationId, name: input.name },
    });
    await recordAuditLog({
      organizationId,
      userId,
      action: "category.create",
      entityType: "Category",
      entityId: category.id,
      metadata: { name: category.name },
    });

    return toCategoryResponse(category);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError(409, "CATEGORY_ALREADY_EXISTS", "Category already exists");
    }

    throw error;
  }
}
