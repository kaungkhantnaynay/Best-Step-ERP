import { OrderStatus, ShipmentStatus, StockMovementType } from "@prisma/client";
import { prisma } from "../prisma/client.js";

export async function getDashboardAnalytics(organizationId: string) {
  const [
    totalOrders,
    openShipments,
    inventoryRows,
    lowStockRows,
    orderStatusGroups,
    shipmentStatusGroups,
    recentMovements,
  ] = await Promise.all([
    prisma.order.count({ where: { organizationId } }),
    prisma.shipment.count({
      where: {
        organizationId,
        status: { in: [ShipmentStatus.PENDING, ShipmentStatus.ASSIGNED, ShipmentStatus.IN_TRANSIT] },
      },
    }),
    prisma.inventory.findMany({
      where: { product: { organizationId }, bin: { warehouse: { organizationId } } },
      include: { product: { select: { price: true, reorderLevel: true, inventory: { select: { quantity: true } } } } },
    }),
    prisma.inventory.findMany({
      where: { product: { organizationId }, bin: { warehouse: { organizationId } } },
      include: { product: { select: { id: true, reorderLevel: true, inventory: { select: { quantity: true } } } } },
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: { organizationId },
      _count: { status: true },
    }),
    prisma.shipment.groupBy({
      by: ["status"],
      where: { organizationId },
      _count: { status: true },
    }),
    prisma.stockMovement.groupBy({
      by: ["type"],
      where: { organizationId },
      _sum: { quantity: true },
      _count: { type: true },
    }),
  ]);
  const inventoryValue = inventoryRows.reduce(
    (total, row) => total + row.quantity * row.product.price.toNumber(),
    0,
  );
  const lowStockProductIds = new Set(
    lowStockRows
      .filter((row) => {
        const total = row.product.inventory.reduce((sum, item) => sum + item.quantity, 0);

        return total <= row.product.reorderLevel;
      })
      .map((row) => row.product.id),
  );
  const deliveredShipments =
    shipmentStatusGroups.find((group) => group.status === ShipmentStatus.DELIVERED)?._count.status ?? 0;
  const cancelledShipments =
    shipmentStatusGroups.find((group) => group.status === ShipmentStatus.CANCELLED)?._count.status ?? 0;
  const completedShipments = deliveredShipments + cancelledShipments;
  const onTimeDeliveryRate = completedShipments === 0 ? 0 : Math.round((deliveredShipments / completedShipments) * 1000) / 10;

  return {
    kpis: {
      totalOrders,
      inventoryValue,
      openShipments,
      lowStockItems: lowStockProductIds.size,
      onTimeDeliveryRate,
    },
    ordersByStatus: Object.fromEntries(
      Object.values(OrderStatus).map((status) => [
        status,
        orderStatusGroups.find((group) => group.status === status)?._count.status ?? 0,
      ]),
    ),
    shipmentsByStatus: Object.fromEntries(
      Object.values(ShipmentStatus).map((status) => [
        status,
        shipmentStatusGroups.find((group) => group.status === status)?._count.status ?? 0,
      ]),
    ),
    movementsByType: Object.fromEntries(
      Object.values(StockMovementType).map((type) => {
        const group = recentMovements.find((item) => item.type === type);

        return [type, { count: group?._count.type ?? 0, quantity: group?._sum.quantity ?? 0 }];
      }),
    ),
  };
}
