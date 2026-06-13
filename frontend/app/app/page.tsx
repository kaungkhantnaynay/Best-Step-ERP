"use client";

import Link from "next/link";
import { Activity, ClipboardList, PackageSearch, Route, Truck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { InventoryTrendChart, SalesChart, WarehouseActivityChart } from "@/components/app/chart-panel";
import type { DataColumn } from "@/components/app/data-table";
import { DataTable } from "@/components/app/data-table";
import { KpiCard } from "@/components/app/kpi-card";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import {
  ApiError,
  type DashboardAnalyticsResponse,
  type InventoryResponse,
  type OrderResponse,
  type ShipmentResponse,
} from "@/lib/api";
import type { ChartPoint, Kpi } from "@/lib/app-types";
import { useAuthenticatedRequest } from "@/lib/use-authenticated-request";

const orderColumns: DataColumn<OrderResponse>[] = [
  {
    header: "Order",
    cell: (order) => (
      <div>
        <p className="font-medium text-foreground">{order.orderNumber}</p>
        <p className="text-xs text-muted-foreground">{order.customerName}</p>
      </div>
    ),
  },
  { header: "Status", cell: (order) => <StatusBadge value={order.status} /> },
  { header: "Items", cell: (order) => order.items.length, className: "text-right" },
  { header: "Total", cell: (order) => `$${order.totalAmount.toLocaleString()}`, className: "text-right" },
];

export default function AppDashboardPage() {
  const { accessToken, authLoading, requestWithAuth } = useAuthenticatedRequest();
  const [analytics, setAnalytics] = useState<DashboardAnalyticsResponse | null>(null);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [inventory, setInventory] = useState<InventoryResponse[]>([]);
  const [shipments, setShipments] = useState<ShipmentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const kpiIcons = [ClipboardList, PackageSearch, Truck, Activity];

  const loadData = useCallback(async () => {
    if (authLoading) return;
    setLoading(true);
    setError(null);

    try {
      const [analyticsResult, orderResult, inventoryResult, shipmentResult] = await Promise.all([
        requestWithAuth<{ data: DashboardAnalyticsResponse }>("/analytics/dashboard"),
        requestWithAuth<{ data: OrderResponse[] }>("/orders?limit=4"),
        requestWithAuth<{ data: InventoryResponse[] }>("/inventory?limit=100"),
        requestWithAuth<{ data: ShipmentResponse[] }>("/shipments?limit=5"),
      ]);

      setAnalytics(analyticsResult.data);
      setOrders(orderResult.data);
      setInventory(inventoryResult.data);
      setShipments(shipmentResult.data);
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Unable to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [authLoading, requestWithAuth]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadData]);

  const kpis = useMemo<Kpi[]>(() => {
    const data = analytics?.kpis;

    return [
      { label: "Total orders", value: String(data?.totalOrders ?? 0), change: "Tenant lifetime", tone: "neutral" },
      { label: "Inventory value", value: `$${Math.round(data?.inventoryValue ?? 0).toLocaleString()}`, change: `${data?.lowStockItems ?? 0} low-stock items`, tone: data?.lowStockItems ? "warning" : "positive" },
      { label: "Open shipments", value: String(data?.openShipments ?? 0), change: "Pending to in transit", tone: data?.openShipments ? "warning" : "neutral" },
      { label: "Delivery rate", value: `${data?.onTimeDeliveryRate ?? 0}%`, change: "Delivered vs closed shipments", tone: "positive" },
    ];
  }, [analytics]);
  const salesData: ChartPoint[] = [
    { name: "Draft", orders: analytics?.ordersByStatus.DRAFT ?? 0, revenue: 0 },
    { name: "Confirmed", orders: analytics?.ordersByStatus.CONFIRMED ?? 0, revenue: 0 },
    { name: "Reserved", orders: analytics?.ordersByStatus.RESERVED ?? 0, revenue: 0 },
    { name: "Fulfilled", orders: analytics?.ordersByStatus.FULFILLED ?? 0, revenue: Math.round((analytics?.kpis.inventoryValue ?? 0) / 1000) },
  ];
  const inventoryData: ChartPoint[] = inventory.slice(0, 8).map((item) => ({
    name: item.product.sku,
    inventory: Math.round(item.inventoryValue / 1000),
  }));
  const warehouseData: ChartPoint[] = Object.entries(analytics?.movementsByType ?? {}).map(([name, value]) => ({
    name: name.replaceAll("_", " "),
    moves: value.count,
  }));
  const lowStockItems = inventory.filter((item) => item.risk === "Low" || item.risk === "Watch" || item.risk === "Critical");

  if (!authLoading && !accessToken) {
    return (
      <>
        <PageHeader eyebrow="Operations dashboard" title="Today across orders, inventory, and shipments" description="Sign in to load your tenant dashboard." icon={Activity} />
        <div className="p-4 sm:p-6">
          <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            Dashboard data requires an authenticated session. <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Operations dashboard" title="Today across orders, inventory, warehouses, and shipments" description="Live tenant metrics from the Best Step API." icon={Activity} />
      <div className="space-y-5 p-4 sm:p-6">
        {error ? <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}
        {loading ? <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">Loading dashboard...</div> : null}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((item, index) => <KpiCard key={item.label} item={item} icon={kpiIcons[index]} />)}
        </section>
        <section className="grid gap-5 xl:grid-cols-[1.35fr_0.95fr]">
          <SalesChart data={salesData} />
          <InventoryTrendChart data={inventoryData} />
        </section>
        <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
          <div className="space-y-5">
            <DataTable columns={orderColumns} rows={orders} getRowKey={(order) => order.id} emptyMessage="No recent orders." />
            <WarehouseActivityChart data={warehouseData} />
          </div>
          <div className="space-y-5">
            <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Route className="size-4 text-primary" aria-hidden="true" />
                <h2 className="text-sm font-semibold text-foreground">Low-stock watchlist</h2>
              </div>
              <div className="mt-4 space-y-3">
                {lowStockItems.length === 0 ? <p className="text-sm text-muted-foreground">No low-stock items.</p> : lowStockItems.map((item) => (
                  <div key={item.id} className="rounded-lg border border-border bg-background p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{item.product.name}</p>
                      <StatusBadge value={item.risk} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{item.productTotalQuantity} total / reorder at {item.reorderLevel}</p>
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-foreground">Recent shipments</h2>
              <div className="mt-4 space-y-3">
                {shipments.length === 0 ? <p className="text-sm text-muted-foreground">No shipments yet.</p> : shipments.map((shipment) => (
                  <div key={shipment.id} className="rounded-lg border border-border bg-background p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{shipment.order.orderNumber}</p>
                      <StatusBadge value={shipment.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{shipment.carrier ?? "Unassigned"} - {shipment.order.customerName}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      </div>
    </>
  );
}
