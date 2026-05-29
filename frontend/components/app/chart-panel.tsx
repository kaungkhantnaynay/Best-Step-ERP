"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ChartPoint } from "@/lib/app-types";

function ChartFrame({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMounted(true));

    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="h-64">
        {mounted ? (
          children
        ) : (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 text-sm text-muted-foreground">
            Loading chart
          </div>
        )}
      </div>
    </section>
  );
}

const tooltipStyle = {
  border: "1px solid var(--border)",
  borderRadius: "8px",
  boxShadow: "0 12px 30px -24px rgb(15 23 42 / 60%)",
};

export function SalesChart({ data }: { data: ChartPoint[] }) {
  return (
    <ChartFrame
      title="Revenue and orders"
      description="Monthly order volume and revenue trend."
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: -12, right: 8, top: 8 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="var(--chart-1)"
            fill="var(--chart-1)"
            fillOpacity={0.14}
            name="Revenue ($k)"
          />
          <Area
            type="monotone"
            dataKey="orders"
            stroke="var(--chart-2)"
            fill="var(--chart-2)"
            fillOpacity={0.12}
            name="Orders"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function InventoryTrendChart({ data }: { data: ChartPoint[] }) {
  return (
    <ChartFrame
      title="Inventory value"
      description="Projected value across active warehouses."
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: -12, right: 8, top: 8 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line
            type="monotone"
            dataKey="inventory"
            stroke="var(--chart-3)"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="Inventory ($k)"
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function ShipmentPerformanceChart({ data }: { data: ChartPoint[] }) {
  return (
    <ChartFrame
      title="Shipment performance"
      description="Daily shipped volume against delayed shipments."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -12, right: 8, top: 8 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="shipped" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
          <Bar dataKey="delayed" fill="var(--destructive)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function WarehouseActivityChart({ data }: { data: ChartPoint[] }) {
  return (
    <ChartFrame title="Warehouse activity" description="Daily moves by location.">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -12, right: 8, top: 8 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="moves" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
