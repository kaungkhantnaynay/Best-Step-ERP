import { BarChart3 } from "lucide-react";

import {
  InventoryTrendChart,
  SalesChart,
  ShipmentPerformanceChart,
  WarehouseActivityChart,
} from "@/components/app/chart-panel";
import { KpiCard } from "@/components/app/kpi-card";
import { PageHeader } from "@/components/app/page-header";
import {
  dashboardKpis,
  inventoryTrendData,
  salesChartData,
  shipmentPerformanceData,
  warehouseActivityData,
} from "@/lib/app-data";

const icons = [BarChart3, BarChart3, BarChart3, BarChart3];

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="Sales, inventory, shipment, and warehouse performance"
        description="Static analytics panels using Recharts, ready for API-backed reporting and generated reports later."
        icon={BarChart3}
      />
      <div className="space-y-5 p-4 sm:p-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboardKpis.map((item, index) => (
            <KpiCard key={item.label} item={item} icon={icons[index]} />
          ))}
        </section>
        <section className="grid gap-5 xl:grid-cols-2">
          <SalesChart data={salesChartData} />
          <InventoryTrendChart data={inventoryTrendData} />
          <ShipmentPerformanceChart data={shipmentPerformanceData} />
          <WarehouseActivityChart data={warehouseActivityData} />
        </section>
      </div>
    </>
  );
}
