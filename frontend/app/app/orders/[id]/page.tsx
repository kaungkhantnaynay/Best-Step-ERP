"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ClipboardList, RotateCcw, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { ApiError, type OrderResponse, type OrderStatus } from "@/lib/api";
import { useAuthenticatedRequest } from "@/lib/use-authenticated-request";

const inputClass = "h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20";
const writableStatuses: OrderStatus[] = ["CONFIRMED", "RESERVED", "FULFILLED"];

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const { accessToken, authLoading, requestWithAuth } = useAuthenticatedRequest();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    if (authLoading || !params.id) return;
    setLoading(true);
    setError(null);

    try {
      const result = await requestWithAuth<{ data: OrderResponse }>(`/orders/${params.id}`);
      setOrder(result.data);
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Unable to load order");
    } finally {
      setLoading(false);
    }
  }, [authLoading, params.id, requestWithAuth]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadOrder();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadOrder]);

  async function updateStatus(status: OrderStatus) {
    if (!order) return;
    setSaving(true);
    setError(null);

    try {
      await requestWithAuth(`/orders/${order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadOrder();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Unable to update order");
    } finally {
      setSaving(false);
    }
  }

  async function cancelOrder() {
    if (!order || !window.confirm(`Cancel ${order.orderNumber}?`)) return;
    setSaving(true);
    setError(null);

    try {
      await requestWithAuth(`/orders/${order.id}/cancel`, { method: "POST" });
      await loadOrder();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Unable to cancel order");
    } finally {
      setSaving(false);
    }
  }

  if (!authLoading && !accessToken) {
    return (
      <>
        <PageHeader eyebrow="Order detail" title="Sign in required" description="Orders require an authenticated workspace session." icon={ClipboardList} />
        <div className="p-4 sm:p-6"><Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link></div>
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Order detail" title={order?.orderNumber ?? "Loading order"} description={order ? `${order.customerName} · $${order.totalAmount.toLocaleString()}` : "Items, shipments, totals, and status workflow."} icon={ClipboardList} />
      <div className="space-y-4 p-4 sm:p-6">
        <Button type="button" variant="outline" size="sm" onClick={() => history.back()}><ArrowLeft className="size-4" aria-hidden="true" />Back</Button>
        {error ? <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}
        {loading ? <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">Loading order...</div> : null}
        {order ? (
          <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              <section className="grid gap-3 md:grid-cols-4">
                <Metric label="Status" value={<StatusBadge value={order.status} />} />
                <Metric label="Items" value={order.items.length.toLocaleString()} />
                <Metric label="Shipments" value={order.shipments.length.toLocaleString()} />
                <Metric label="Total" value={`$${order.totalAmount.toLocaleString()}`} />
              </section>
              <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-foreground">Items</h2>
                <div className="mt-4 divide-y divide-border">
                  {order.items.map((item) => (
                    <div key={item.id} className="grid gap-2 py-3 text-sm md:grid-cols-[1fr_auto_auto]">
                      <div>
                        <Link href={`/app/products/${item.product.id}`} className="font-medium text-foreground hover:text-primary hover:underline">{item.product.name}</Link>
                        <p className="text-xs text-muted-foreground">{item.product.sku}</p>
                      </div>
                      <span>{item.quantity.toLocaleString()} x ${item.unitPrice.toLocaleString()}</span>
                      <span className="text-right font-medium">${item.lineTotal.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </section>
              <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-foreground">Shipments</h2>
                <div className="mt-4 divide-y divide-border">
                  {order.shipments.length === 0 ? <p className="text-sm text-muted-foreground">No shipments created yet.</p> : order.shipments.map((shipment) => (
                    <div key={shipment.id} className="grid gap-2 py-3 text-sm md:grid-cols-[1fr_auto_auto]">
                      <Link href={`/app/shipments/${shipment.id}`} className="font-medium text-foreground hover:text-primary hover:underline">{shipment.trackingNumber ?? shipment.id}</Link>
                      <span>{shipment.carrier ?? "Unassigned"}</span>
                      <StatusBadge value={shipment.status} />
                    </div>
                  ))}
                </div>
              </section>
            </div>
            <aside className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-foreground">Status workflow</h2>
              <div className="mt-4 space-y-3">
                <p className="text-sm text-muted-foreground">Current state: <span className="font-medium text-foreground">{order.status}</span></p>
                <select className={inputClass} disabled={saving || order.status === "CANCELLED" || order.status === "FULFILLED"} defaultValue="" onChange={(event) => event.target.value && void updateStatus(event.target.value as OrderStatus)}>
                  <option value="">Set status...</option>
                  {writableStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
                <Button type="button" className="w-full" disabled={saving || order.status === "CANCELLED" || order.status === "FULFILLED"} onClick={() => void updateStatus("FULFILLED")}><Save className="size-4" aria-hidden="true" />Fulfill</Button>
                <Button type="button" variant="outline" className="w-full" disabled={saving || order.status === "CANCELLED" || order.status === "FULFILLED"} onClick={() => void cancelOrder()}><RotateCcw className="size-4" aria-hidden="true" />Cancel order</Button>
              </div>
            </aside>
          </div>
        ) : null}
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-2 text-lg font-semibold text-foreground">{value}</div>
    </article>
  );
}
