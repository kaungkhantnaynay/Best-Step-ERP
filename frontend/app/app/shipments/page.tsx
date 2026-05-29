import { Route, Truck } from "lucide-react";

import type { DataColumn } from "@/components/app/data-table";
import { DataTable } from "@/components/app/data-table";
import { FilterBar } from "@/components/app/filter-bar";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Timeline } from "@/components/app/timeline";
import { shipmentTimeline, shipments } from "@/lib/app-data";
import type { Shipment } from "@/lib/app-types";

const shipmentColumns: DataColumn<Shipment>[] = [
  {
    header: "Shipment",
    cell: (shipment) => (
      <div>
        <p className="font-medium text-foreground">{shipment.id}</p>
        <p className="text-xs text-muted-foreground">{shipment.orderId}</p>
      </div>
    ),
  },
  { header: "Status", cell: (shipment) => <StatusBadge value={shipment.status} /> },
  { header: "Carrier", cell: (shipment) => shipment.carrier },
  { header: "Destination", cell: (shipment) => shipment.destination },
  { header: "ETA", cell: (shipment) => shipment.eta },
  {
    header: "Progress",
    cell: (shipment) => (
      <div className="min-w-32">
        <div className="h-2 rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary"
            style={{ width: `${shipment.progress}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{shipment.progress}%</p>
      </div>
    ),
  },
];

export default function ShipmentsPage() {
  const statusCards = [
    { label: "Pending", value: shipments.filter((item) => item.status === "Pending").length },
    { label: "In transit", value: shipments.filter((item) => item.status === "In transit").length },
    { label: "Delivered", value: shipments.filter((item) => item.status === "Delivered").length },
    { label: "Assigned", value: shipments.filter((item) => item.status === "Assigned").length },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Shipment tracking"
        title="Carrier status, delivery progress, and event timelines"
        description="Static shipment dashboard with status cards, tracking table, and timeline examples."
        icon={Route}
      />
      <div className="grid gap-5 p-4 sm:p-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {statusCards.map((card) => (
              <article
                key={card.label}
                className="rounded-lg border border-border bg-card p-4 shadow-sm"
              >
                <Truck className="size-4 text-primary" aria-hidden="true" />
                <p className="mt-3 text-sm text-muted-foreground">{card.label}</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {card.value}
                </p>
              </article>
            ))}
          </section>
          <FilterBar
            searchPlaceholder="Search shipment, carrier, order, or destination"
            filters={["All", "Pending", "Assigned", "In transit", "Delivered"]}
          />
          <DataTable
            columns={shipmentColumns}
            rows={shipments}
            getRowKey={(shipment) => shipment.id}
          />
        </div>
        <Timeline title="Tracking timeline" items={shipmentTimeline} />
      </div>
    </>
  );
}
