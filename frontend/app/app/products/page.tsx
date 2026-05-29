import { Plus, Package } from "lucide-react";

import type { DataColumn } from "@/components/app/data-table";
import { DataTable } from "@/components/app/data-table";
import { Field, FormPanel, SelectField } from "@/components/app/form-panel";
import { FilterBar } from "@/components/app/filter-bar";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { products } from "@/lib/app-data";
import type { Product } from "@/lib/app-types";

const productColumns: DataColumn<Product>[] = [
  {
    header: "Product",
    cell: (product) => (
      <div>
        <p className="font-medium text-foreground">{product.name}</p>
        <p className="text-xs text-muted-foreground">{product.sku}</p>
      </div>
    ),
  },
  { header: "Category", cell: (product) => product.category },
  { header: "Status", cell: (product) => <StatusBadge value={product.status} /> },
  { header: "Warehouse", cell: (product) => product.warehouse },
  {
    header: "Stock",
    cell: (product) => `${product.stock} / ${product.reorderPoint}`,
    className: "text-right",
  },
  {
    header: "Value",
    cell: (product) => `$${product.value.toLocaleString()}`,
    className: "text-right",
  },
];

export default function ProductsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Product catalog"
        title="Products, SKUs, categories, and reorder context"
        description="Search and filter the product catalog before API-backed CRUD, SKU generation, and category management are wired."
        action="New product"
        icon={Package}
      />
      <div className="grid gap-5 p-4 sm:p-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <FilterBar
            searchPlaceholder="Search by product, SKU, or category"
            filters={["Active", "Low stock", "Draft", "Category"]}
            actionLabel="Add product"
            actionIcon={Plus}
          />
          <DataTable
            columns={productColumns}
            rows={products}
            getRowKey={(product) => product.id}
          />
          <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center">
            <span>Showing 1-5 of 5 products</span>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm">
                Previous
              </Button>
              <Button type="button" variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        </div>
        <FormPanel
          title="Product form"
          description="Visual-only form for the future create and update product workflow."
          action="Save product"
        >
          <Field label="Product name" placeholder="Trail Runner Sole Kit" />
          <Field label="SKU" placeholder="BS-SOLE-118" />
          <SelectField
            label="Category"
            options={["Footwear Parts", "Packaging", "Accessories", "Operations"]}
          />
          <SelectField
            label="Default warehouse"
            options={["North Dock", "Central Hub", "South Annex", "West Returns"]}
          />
          <Field label="Reorder point" placeholder="90" type="number" />
        </FormPanel>
      </div>
    </>
  );
}
