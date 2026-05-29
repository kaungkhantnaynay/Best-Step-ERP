import {
  Activity,
  ClipboardList,
  PackageSearch,
  Route,
  Truck,
} from "lucide-react";

import {
  InventoryTrendChart,
  SalesChart,
  WarehouseActivityChart,
} from "@/components/app/chart-panel";
import type { DataColumn } from "@/components/app/data-table";
import { DataTable } from "@/components/app/data-table";
import { KpiCard } from "@/components/app/kpi-card";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Timeline } from "@/components/app/timeline";
import {
  dashboardKpis,
  inventoryItems,
  inventoryTrendData,
  orders,
  salesChartData,
  shipmentTimeline,
  warehouseActivityData,
} from "@/lib/app-data";
import type { Order } from "@/lib/app-types";

const orderColumns: DataColumn<Order>[] = [
  {
    header: "Order",
    cell: (order) => (
      <div>
        <p className="font-medium text-foreground">{order.id}</p>
        <p className="text-xs text-muted-foreground">{order.customer}</p>
      </div>
    ),
  },
  { header: "Status", cell: (order) => <StatusBadge value={order.status} /> },
  { header: "Warehouse", cell: (order) => order.warehouse },
  {
    header: "Total",
    cell: (order) => `$${order.total.toLocaleString()}`,
    className: "text-right",
  },
];

export default function AppDashboardPage() {
  const kpiIcons = [ClipboardList, PackageSearch, Truck, Activity];
  const lowStockItems = inventoryItems.filter(
    (item) => item.risk === "Low" || item.risk === "Watch",
  );

  return (
    <>
      <PageHeader
        eyebrow="Operations dashboard"
        title="Today across orders, inventory, warehouses, and shipments"
        description="A dense static command center for the logged-in ERP app. Mock data mirrors the planned API concepts for later wiring."
        icon={Activity}
      />
      <div className="space-y-5 p-4 sm:p-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboardKpis.map((item, index) => (
            <KpiCard key={item.label} item={item} icon={kpiIcons[index]} />
          ))}
        </section>
        <section className="grid gap-5 xl:grid-cols-[1.35fr_0.95fr]">
          <SalesChart data={salesChartData} />
          <InventoryTrendChart data={inventoryTrendData} />
        </section>
        <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
          <div className="space-y-5">
            <DataTable
              columns={orderColumns}
              rows={orders.slice(0, 4)}
              getRowKey={(order) => order.id}
            />
            <WarehouseActivityChart data={warehouseActivityData} />
          </div>
          <div className="space-y-5">
            <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Route className="size-4 text-primary" aria-hidden="true" />
                <h2 className="text-sm font-semibold text-foreground">
                  Low-stock watchlist
                </h2>
              </div>
              <div className="mt-4 space-y-3">
                {lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-border bg-background p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {item.product}
                      </p>
                      <StatusBadge value={item.risk} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.available} available / reorder at {item.reorderPoint}
                    </p>
                  </div>
                ))}
              </div>
            </section>
            <Timeline title="Shipment timeline" items={shipmentTimeline} />
          </div>
        </section>
      </div>
    </>
  );
}
