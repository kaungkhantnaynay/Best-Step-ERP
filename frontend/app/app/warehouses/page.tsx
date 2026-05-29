import { ArrowRightLeft, Warehouse } from "lucide-react";

import type { DataColumn } from "@/components/app/data-table";
import { DataTable } from "@/components/app/data-table";
import { Field, FormPanel, SelectField } from "@/components/app/form-panel";
import { FilterBar } from "@/components/app/filter-bar";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { warehouseBins, warehouses } from "@/lib/app-data";
import type { WarehouseBin } from "@/lib/app-types";

const binColumns: DataColumn<WarehouseBin>[] = [
  { header: "Bin", cell: (bin) => <span className="font-medium">{bin.code}</span> },
  { header: "Zone", cell: (bin) => bin.zone },
  { header: "Product", cell: (bin) => bin.product },
  {
    header: "Quantity",
    cell: (bin) => bin.quantity.toLocaleString(),
    className: "text-right",
  },
  { header: "Status", cell: (bin) => <StatusBadge value={bin.status} /> },
];

export default function WarehousesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Warehouse management"
        title="Locations, bin utilization, and stock transfers"
        description="Operational warehouse screen with bin management and visual transfer controls ready for future transaction APIs."
        icon={Warehouse}
      />
      <div className="grid gap-5 p-4 sm:p-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {warehouses.map((warehouse) => (
              <article
                key={warehouse.id}
                className="rounded-lg border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">
                      {warehouse.name}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {warehouse.location}
                    </p>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                    {warehouse.utilization}%
                  </span>
                </div>
                <div className="mt-4 h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${warehouse.utilization}%` }}
                  />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                  <div>
                    <p className="font-medium text-foreground">
                      {warehouse.activeBins}/{warehouse.totalBins}
                    </p>
                    <p>Active bins</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {warehouse.dailyMoves}
                    </p>
                    <p>Daily moves</p>
                  </div>
                </div>
              </article>
            ))}
          </section>
          <FilterBar
            searchPlaceholder="Search bins, zones, or products"
            filters={["All zones", "Open", "Reserved", "Full"]}
            actionLabel="Transfer"
            actionIcon={ArrowRightLeft}
          />
          <DataTable
            columns={binColumns}
            rows={warehouseBins}
            getRowKey={(bin) => bin.code}
          />
        </div>
        <FormPanel
          title="Transfer stock"
          description="Visual-only transfer form. Real transfers will require a backend inventory transaction."
          action="Preview transfer"
        >
          <SelectField label="From warehouse" options={warehouses.map((item) => item.name)} />
          <SelectField label="To warehouse" options={warehouses.map((item) => item.name)} />
          <SelectField
            label="Product"
            options={["Trail Runner Sole Kit", "All Weather Upper", "Retail Box Medium"]}
          />
          <Field label="Quantity" placeholder="120" type="number" />
        </FormPanel>
      </div>
    </>
  );
}
