"use client";

import Link from "next/link";
import { ClipboardList, Eye, Plus, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DataColumn } from "@/components/app/data-table";
import { DataTable } from "@/components/app/data-table";
import { FirstRunCard } from "@/components/app/first-run-card";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import {
  ApiError,
  type OrderResponse,
  type OrderStatus,
  type ProductListResponse,
} from "@/lib/api";
import { useAuthenticatedRequest } from "@/lib/use-authenticated-request";

const inputClass = "mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20";
const writableStatuses: OrderStatus[] = ["CONFIRMED", "RESERVED", "FULFILLED"];

type OrderForm = {
  orderNumber: string;
  customerName: string;
  productId: string;
  quantity: string;
};

export default function OrdersPage() {
  const { accessToken, authLoading, requestWithAuth } = useAuthenticatedRequest();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [products, setProducts] = useState<ProductListResponse["data"]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<OrderForm>({ orderNumber: "", customerName: "", productId: "", quantity: "1" });
  const selectedOrder = orders.find((order) => order.id === selectedOrderId) ?? orders[0];

  const loadData = useCallback(async () => {
    if (authLoading) return;
    setLoading(true);
    setError(null);

    try {
      const [orderResult, productResult] = await Promise.all([
        requestWithAuth<{ data: OrderResponse[] }>("/orders?limit=100"),
        requestWithAuth<ProductListResponse>("/products?limit=100&status=ACTIVE"),
      ]);

      setOrders(orderResult.data);
      setProducts(productResult.data);
      setSelectedOrderId((current) => current || orderResult.data[0]?.id || "");
      setForm((current) => ({ ...current, productId: current.productId || productResult.data[0]?.id || "" }));
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Unable to load orders");
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

  async function createOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await requestWithAuth("/orders", {
        method: "POST",
        body: JSON.stringify({
          orderNumber: form.orderNumber,
          customerName: form.customerName,
          items: [{ productId: form.productId, quantity: Number(form.quantity) }],
        }),
      });
      setForm({ orderNumber: "", customerName: "", productId: products[0]?.id || "", quantity: "1" });
      await loadData();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Unable to create order");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(order: OrderResponse, status: OrderStatus) {
    setSaving(true);
    setError(null);

    try {
      await requestWithAuth(`/orders/${order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadData();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Unable to update order");
    } finally {
      setSaving(false);
    }
  }

  async function cancelOrder(order: OrderResponse) {
    setSaving(true);
    setError(null);

    try {
      await requestWithAuth(`/orders/${order.id}/cancel`, { method: "POST" });
      await loadData();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Unable to cancel order");
    } finally {
      setSaving(false);
    }
  }

  const columns = useMemo<DataColumn<OrderResponse>[]>(
    () => [
      {
        header: "Order",
        cell: (order) => (
          <button type="button" className="text-left" onClick={() => setSelectedOrderId(order.id)}>
            <Link href={`/app/orders/${order.id}`} className="font-medium text-foreground hover:text-primary hover:underline">{order.orderNumber}</Link>
            <p className="text-xs text-muted-foreground">{order.customerName}</p>
          </button>
        ),
      },
      { header: "Status", cell: (order) => <StatusBadge value={order.status} /> },
      { header: "Items", cell: (order) => order.items.length, className: "text-right" },
      { header: "Shipments", cell: (order) => order.shipments.length, className: "text-right" },
      { header: "Total", cell: (order) => `$${order.totalAmount.toLocaleString()}`, className: "text-right" },
      { header: "Created", cell: (order) => new Date(order.createdAt).toLocaleDateString() },
      {
        header: "Actions",
        cell: (order) => (
          <Link href={`/app/orders/${order.id}`} className="inline-flex size-7 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground">
            <Eye className="size-3.5" aria-hidden="true" />
            <span className="sr-only">View {order.orderNumber}</span>
          </Link>
        ),
        className: "text-right",
      },
    ],
    [],
  );

  if (!authLoading && !accessToken) {
    return (
      <>
        <PageHeader eyebrow="Orders" title="Sales orders and reservations" description="Sign in to load tenant-scoped orders." icon={ClipboardList} />
        <div className="p-4 sm:p-6">
          <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            Orders require an authenticated session. <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Order management" title="Sales orders, reservations, and fulfillment" description="Create orders and let backend services reserve inventory transactionally." action="Create order" icon={ClipboardList} />
      <div className="grid gap-5 p-4 sm:p-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {error ? <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}
          {loading ? <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">Loading orders...</div> : null}
          {orders.length === 0 && !loading ? (
            <FirstRunCard
              title="Create an order after stock is available"
              description="Orders reserve inventory transactionally, so start from warehouse setup and stock in before creating the first sales order."
              icon={ClipboardList}
              action={{ label: "Create order", href: "/app/orders" }}
              steps={[
                { label: "Warehouse", href: "/app/warehouses" },
                { label: "Bin", href: "/app/warehouses" },
                { label: "Product", href: "/app/products" },
                { label: "Stock in", href: "/app/inventory" },
                { label: "Order", href: "/app/orders", active: true },
                { label: "Shipment", href: "/app/shipments" },
              ]}
            />
          ) : (
            <DataTable columns={columns} rows={orders} getRowKey={(order) => order.id} emptyMessage="No orders yet." />
          )}
        </div>
        <div className="space-y-4">
          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-foreground">Order detail</h2>
              {selectedOrder ? <StatusBadge value={selectedOrder.status} /> : null}
            </div>
            {selectedOrder ? (
              <>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Order</dt>
                    <dd className="mt-1 font-medium text-foreground">{selectedOrder.orderNumber}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Total</dt>
                    <dd className="mt-1 font-medium text-foreground">${selectedOrder.totalAmount.toLocaleString()}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-muted-foreground">Customer</dt>
                    <dd className="mt-1 font-medium text-foreground">{selectedOrder.customerName}</dd>
                  </div>
                </dl>
                <div className="mt-4 space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="rounded-lg border border-border bg-background p-3 text-sm">
                      <p className="font-medium text-foreground">{item.product.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.quantity} x ${item.unitPrice.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <select className={inputClass} disabled={saving || selectedOrder.status === "CANCELLED" || selectedOrder.status === "FULFILLED"} onChange={(event) => event.target.value && void updateStatus(selectedOrder, event.target.value as OrderStatus)} defaultValue="">
                    <option value="">Set status...</option>
                    {writableStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                  <Button type="button" variant="outline" disabled={saving || selectedOrder.status === "CANCELLED" || selectedOrder.status === "FULFILLED"} onClick={() => void cancelOrder(selectedOrder)}>
                    <RotateCcw className="mr-2 size-4" aria-hidden="true" />Cancel
                  </Button>
                </div>
              </>
            ) : <p className="mt-4 text-sm text-muted-foreground">Select an order to view details.</p>}
          </section>
          <form className="rounded-lg border border-border bg-card p-4 shadow-sm" onSubmit={createOrder}>
            <h2 className="text-sm font-semibold text-foreground">Create order</h2>
            <div className="mt-4 space-y-3">
              <TextInput label="Order number" value={form.orderNumber} onChange={(orderNumber) => setForm({ ...form, orderNumber })} required />
              <TextInput label="Customer" value={form.customerName} onChange={(customerName) => setForm({ ...form, customerName })} required />
              <SelectInput label="Product" value={form.productId} options={products.map((product) => ({ label: `${product.name} (${product.sku})`, value: product.id }))} onChange={(productId) => setForm({ ...form, productId })} />
              <TextInput label="Quantity" type="number" value={form.quantity} onChange={(quantity) => setForm({ ...form, quantity })} required />
              <Button type="submit" disabled={saving || !form.productId} className="w-full"><Plus className="mr-2 size-4" aria-hidden="true" />Create and reserve</Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

function TextInput({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input className={inputClass} value={value} type={type} required={required} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SelectInput({ label, value, options, onChange }: { label: string; value: string; options: Array<{ label: string; value: string }>; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <select className={inputClass} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select...</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}
