import { ClipboardList, Plus } from "lucide-react";

import type { DataColumn } from "@/components/app/data-table";
import { DataTable } from "@/components/app/data-table";
import { Field, FormPanel, SelectField } from "@/components/app/form-panel";
import { FilterBar } from "@/components/app/filter-bar";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { orders, products, warehouses } from "@/lib/app-data";
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
  { header: "Items", cell: (order) => order.items, className: "text-right" },
  { header: "Warehouse", cell: (order) => order.warehouse },
  { header: "Owner", cell: (order) => order.owner },
  { header: "Due", cell: (order) => order.dueDate },
  {
    header: "Total",
    cell: (order) => `$${order.total.toLocaleString()}`,
    className: "text-right",
  },
];

export default function OrdersPage() {
  const selectedOrder = orders[0];

  return (
    <>
      <PageHeader
        eyebrow="Order management"
        title="Sales orders, reservations, fulfillment status, and totals"
        description="Static order workspace for status filtering, order details, and the future create order flow."
        action="Create order"
        icon={ClipboardList}
      />
      <div className="grid gap-5 p-4 sm:p-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <FilterBar
            searchPlaceholder="Search by order, customer, owner, or warehouse"
            filters={["All", "Draft", "Reserved", "Packed", "Shipped"]}
            actionLabel="New order"
            actionIcon={Plus}
          />
          <DataTable
            columns={orderColumns}
            rows={orders}
            getRowKey={(order) => order.id}
          />
        </div>
        <div className="space-y-5">
          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-foreground">
                Order detail
              </h2>
              <StatusBadge value={selectedOrder.status} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Order</dt>
                <dd className="mt-1 font-medium text-foreground">{selectedOrder.id}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Due date</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {selectedOrder.dueDate}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-muted-foreground">Customer</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {selectedOrder.customer}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Warehouse</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {selectedOrder.warehouse}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Total</dt>
                <dd className="mt-1 font-medium text-foreground">
                  ${selectedOrder.total.toLocaleString()}
                </dd>
              </div>
            </dl>
          </section>
          <FormPanel
            title="Create order"
            description="Visual-only order entry. Reservation and fulfillment logic stays backend-owned."
            action="Preview order"
          >
            <Field label="Customer" placeholder="Summit Retail Co." />
            <SelectField
              label="Warehouse"
              options={warehouses.map((warehouse) => warehouse.name)}
            />
            <SelectField
              label="Product"
              options={products.map((product) => product.name)}
            />
            <Field label="Quantity" placeholder="12" type="number" />
          </FormPanel>
        </div>
      </div>
    </>
  );
}
