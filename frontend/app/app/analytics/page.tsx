"use client";

import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  InventoryTrendChart,
  SalesChart,
  ShipmentPerformanceChart,
  WarehouseActivityChart,
} from "@/components/app/chart-panel";
import { KpiCard } from "@/components/app/kpi-card";
import { PageHeader } from "@/components/app/page-header";
import { ApiError, type DashboardAnalyticsResponse, type InventoryResponse } from "@/lib/api";
import type { ChartPoint, Kpi } from "@/lib/app-types";
import { useAuthenticatedRequest } from "@/lib/use-authenticated-request";

const icons = [BarChart3, BarChart3, BarChart3, BarChart3];

export default function AnalyticsPage() {
  const { accessToken, authLoading, requestWithAuth } = useAuthenticatedRequest();
  const [analytics, setAnalytics] = useState<DashboardAnalyticsResponse | null>(null);
  const [inventory, setInventory] = useState<InventoryResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (authLoading) return;
    setLoading(true);
    setError(null);

    try {
      const [analyticsResult, inventoryResult] = await Promise.all([
        requestWithAuth<{ data: DashboardAnalyticsResponse }>("/analytics/dashboard"),
        requestWithAuth<{ data: InventoryResponse[] }>("/inventory?limit=100"),
      ]);

      setAnalytics(analyticsResult.data);
      setInventory(inventoryResult.data);
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Unable to load analytics");
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
      { label: "Total orders", value: String(data?.totalOrders ?? 0), change: "All statuses", tone: "neutral" },
      { label: "Inventory value", value: `$${Math.round(data?.inventoryValue ?? 0).toLocaleString()}`, change: `${data?.lowStockItems ?? 0} low-stock items`, tone: data?.lowStockItems ? "warning" : "positive" },
      { label: "Open shipments", value: String(data?.openShipments ?? 0), change: "Pending, assigned, in transit", tone: data?.openShipments ? "warning" : "neutral" },
      { label: "Delivery rate", value: `${data?.onTimeDeliveryRate ?? 0}%`, change: "Delivered vs closed", tone: "positive" },
    ];
  }, [analytics]);
  const salesData: ChartPoint[] = Object.entries(analytics?.ordersByStatus ?? {}).map(([name, count]) => ({
    name: name.replaceAll("_", " "),
    orders: count,
    revenue: name === "FULFILLED" ? Math.round((analytics?.kpis.inventoryValue ?? 0) / 1000) : 0,
  }));
  const inventoryData: ChartPoint[] = inventory.slice(0, 10).map((item) => ({
    name: item.product.sku,
    inventory: Math.round(item.inventoryValue / 1000),
  }));
  const shipmentData: ChartPoint[] = Object.entries(analytics?.shipmentsByStatus ?? {}).map(([name, count]) => ({
    name: name.replaceAll("_", " "),
    shipped: name === "DELIVERED" ? count : 0,
    delayed: name === "CANCELLED" ? count : 0,
  }));
  const movementData: ChartPoint[] = Object.entries(analytics?.movementsByType ?? {}).map(([name, value]) => ({
    name: name.replaceAll("_", " "),
    moves: value.count,
  }));

  if (!authLoading && !accessToken) {
    return (
      <>
        <PageHeader eyebrow="Analytics" title="Sales, inventory, shipment, and warehouse performance" description="Sign in to load tenant-scoped analytics." icon={BarChart3} />
        <div className="p-4 sm:p-6">
          <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            Analytics require an authenticated session. <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Analytics" title="Sales, inventory, shipment, and warehouse performance" description="Live API-backed analytics panels using Recharts." icon={BarChart3} />
      <div className="space-y-5 p-4 sm:p-6">
        {error ? <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}
        {loading ? <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">Loading analytics...</div> : null}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((item, index) => <KpiCard key={item.label} item={item} icon={icons[index]} />)}
        </section>
        <section className="grid gap-5 xl:grid-cols-2">
          <SalesChart data={salesData} />
          <InventoryTrendChart data={inventoryData} />
          <ShipmentPerformanceChart data={shipmentData} />
          <WarehouseActivityChart data={movementData} />
        </section>
      </div>
    </>
  );
}
