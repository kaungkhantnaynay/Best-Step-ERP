import { Boxes, PlusCircle } from "lucide-react";

import type { DataColumn } from "@/components/app/data-table";
import { DataTable } from "@/components/app/data-table";
import { Field, FormPanel, SelectField } from "@/components/app/form-panel";
import { FilterBar } from "@/components/app/filter-bar";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Timeline } from "@/components/app/timeline";
import { inventoryItems, stockMovements } from "@/lib/app-data";
import type { InventoryItem } from "@/lib/app-types";

const inventoryColumns: DataColumn<InventoryItem>[] = [
  {
    header: "Item",
    cell: (item) => (
      <div>
        <p className="font-medium text-foreground">{item.product}</p>
        <p className="text-xs text-muted-foreground">{item.sku}</p>
      </div>
    ),
  },
  { header: "Warehouse", cell: (item) => item.warehouse },
  { header: "Bin", cell: (item) => item.bin },
  {
    header: "Available",
    cell: (item) => item.available.toLocaleString(),
    className: "text-right",
  },
  {
    header: "Reserved",
    cell: (item) => item.reserved.toLocaleString(),
    className: "text-right",
  },
  { header: "Risk", cell: (item) => <StatusBadge value={item.risk} /> },
];

export default function InventoryPage() {
  const warnings = inventoryItems.filter((item) => item.risk !== "Healthy");

  return (
    <>
      <PageHeader
        eyebrow="Inventory control"
        title="Availability, reservations, bins, and movement history"
        description="Static inventory screen for low-stock visibility, stock movement history, and future adjustment transactions."
        icon={Boxes}
      />
      <div className="grid gap-5 p-4 sm:p-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <section className="grid gap-3 md:grid-cols-2">
            {warnings.map((item) => (
              <article
                key={item.id}
                className="rounded-lg border border-amber-200 bg-amber-50 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-amber-900">{item.product}</p>
                  <StatusBadge value={item.risk} />
                </div>
                <p className="mt-2 text-sm text-amber-800">
                  {item.available} available in {item.warehouse}; reorder point is{" "}
                  {item.reorderPoint}.
                </p>
              </article>
            ))}
          </section>

          <FilterBar
            searchPlaceholder="Search inventory by SKU, bin, or warehouse"
            filters={["All warehouses", "Low risk", "Reserved", "Recent moves"]}
            actionLabel="Adjust stock"
            actionIcon={PlusCircle}
          />

          <DataTable
            columns={inventoryColumns}
            rows={inventoryItems}
            getRowKey={(item) => item.id}
          />
        </div>
        <div className="space-y-5">
          <FormPanel
            title="Stock adjustment"
            description="Visual-only adjustment form. Real stock updates will use backend transactions."
            action="Preview adjustment"
          >
            <SelectField
              label="Product"
              options={inventoryItems.map((item) => item.product)}
            />
            <SelectField
              label="Movement type"
              options={["Add stock", "Remove stock", "Transfer", "Cycle count"]}
            />
            <Field label="Quantity" placeholder="24" type="number" />
            <Field label="Reason" placeholder="Cycle count correction" />
          </FormPanel>
          
          <Timeline title="Stock movement history" items={stockMovements} />
        </div>
      </div>
    </>
  );
}
