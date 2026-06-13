"use client";

import Link from "next/link";
import { Eye, Plus, Route } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DataColumn } from "@/components/app/data-table";
import { DataTable } from "@/components/app/data-table";
import { FirstRunCard } from "@/components/app/first-run-card";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Timeline } from "@/components/app/timeline";
import { Button } from "@/components/ui/button";
import {
  ApiError,
  type OrderResponse,
  type ShipmentResponse,
  type ShipmentStatus,
} from "@/lib/api";
import type { TimelineEvent } from "@/lib/app-types";
import { useAuthenticatedRequest } from "@/lib/use-authenticated-request";

const inputClass = "mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20";
const shipmentStatuses: ShipmentStatus[] = ["ASSIGNED", "IN_TRANSIT", "DELIVERED", "CANCELLED"];

type ShipmentForm = {
  orderId: string;
  carrier: string;
  trackingNumber: string;
};

export default function ShipmentsPage() {
  const { accessToken, authLoading, requestWithAuth } = useAuthenticatedRequest();
  const [shipments, setShipments] = useState<ShipmentResponse[]>([]);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [selectedShipmentId, setSelectedShipmentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ShipmentForm>({ orderId: "", carrier: "", trackingNumber: "" });
  const [statusNote, setStatusNote] = useState("");
  const selectedShipment = shipments.find((shipment) => shipment.id === selectedShipmentId) ?? shipments[0];
  const openOrders = orders.filter((order) => order.status !== "CANCELLED");

  const loadData = useCallback(async () => {
    if (authLoading) return;
    setLoading(true);
    setError(null);

    try {
      const [shipmentResult, orderResult] = await Promise.all([
        requestWithAuth<{ data: ShipmentResponse[] }>("/shipments?limit=100"),
        requestWithAuth<{ data: OrderResponse[] }>("/orders?limit=100"),
      ]);

      setShipments(shipmentResult.data);
      setOrders(orderResult.data);
      setSelectedShipmentId((current) => current || shipmentResult.data[0]?.id || "");
      setForm((current) => ({ ...current, orderId: current.orderId || orderResult.data[0]?.id || "" }));
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Unable to load shipments");
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

  async function createShipment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await requestWithAuth("/shipments", {
        method: "POST",
        body: JSON.stringify({
          orderId: form.orderId,
          carrier: form.carrier || null,
          trackingNumber: form.trackingNumber || null,
        }),
      });
      setForm({ orderId: openOrders[0]?.id || "", carrier: "", trackingNumber: "" });
      await loadData();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Unable to create shipment");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(shipment: ShipmentResponse, status: ShipmentStatus) {
    setSaving(true);
    setError(null);

    try {
      await requestWithAuth(`/shipments/${shipment.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          note: statusNote || null,
        }),
      });
      setStatusNote("");
      await loadData();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Unable to update shipment");
    } finally {
      setSaving(false);
    }
  }

  const columns = useMemo<DataColumn<ShipmentResponse>[]>(
    () => [
      {
        header: "Shipment",
        cell: (shipment) => (
          <button type="button" className="text-left" onClick={() => setSelectedShipmentId(shipment.id)}>
            <Link href={`/app/shipments/${shipment.id}`} className="font-medium text-foreground hover:text-primary hover:underline">{shipment.order.orderNumber}</Link>
            <p className="text-xs text-muted-foreground">{shipment.trackingNumber ?? "No tracking number"}</p>
          </button>
        ),
      },
      { header: "Status", cell: (shipment) => <StatusBadge value={shipment.status} /> },
      { header: "Carrier", cell: (shipment) => shipment.carrier ?? "Unassigned" },
      { header: "Customer", cell: (shipment) => shipment.order.customerName },
      { header: "Updated", cell: (shipment) => new Date(shipment.updatedAt).toLocaleDateString() },
      {
        header: "Actions",
        cell: (shipment) => (
          <Link href={`/app/shipments/${shipment.id}`} className="inline-flex size-7 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground">
            <Eye className="size-3.5" aria-hidden="true" />
            <span className="sr-only">View shipment</span>
          </Link>
        ),
        className: "text-right",
      },
    ],
    [],
  );

  const timeline = selectedShipment?.trackingEvents.map<TimelineEvent>((event) => ({
    id: event.id,
    title: event.status,
    description: [event.location, event.note].filter(Boolean).join(" - ") || "Shipment status updated.",
    time: new Date(event.createdAt).toLocaleString(),
    status: event.status,
  })) ?? [];

  if (!authLoading && !accessToken) {
    return (
      <>
        <PageHeader eyebrow="Shipments" title="Shipment assignment and tracking" description="Sign in to load tenant-scoped shipments." icon={Route} />
        <div className="p-4 sm:p-6">
          <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            Shipments require an authenticated session. <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Shipments" title="Shipment assignment, status, and timeline" description="Live shipment workflow backed by tenant-scoped API data." action="Create shipment" icon={Route} />
      <div className="grid gap-5 p-4 sm:p-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {error ? <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}
          {loading ? <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">Loading shipments...</div> : null}
          <div className="grid gap-3 md:grid-cols-4">
            {(["PENDING", "ASSIGNED", "IN_TRANSIT", "DELIVERED"] as ShipmentStatus[]).map((status) => (
              <article key={status} className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">{status.replaceAll("_", " ")}</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{shipments.filter((shipment) => shipment.status === status).length}</p>
              </article>
            ))}
          </div>
          {shipments.length === 0 && !loading ? (
            <FirstRunCard
              title="Create a shipment from an active order"
              description="Shipments become useful after an order exists, then carrier assignment and tracking events keep the team aligned."
              icon={Route}
              action={{ label: "Create shipment", href: "/app/shipments" }}
              steps={[
                { label: "Warehouse", href: "/app/warehouses" },
                { label: "Bin", href: "/app/warehouses" },
                { label: "Product", href: "/app/products" },
                { label: "Stock in", href: "/app/inventory" },
                { label: "Order", href: "/app/orders" },
                { label: "Shipment", href: "/app/shipments", active: true },
              ]}
            />
          ) : (
            <DataTable columns={columns} rows={shipments} getRowKey={(shipment) => shipment.id} emptyMessage="No shipments yet." />
          )}
        </div>
        <div className="space-y-4">
          <form className="rounded-lg border border-border bg-card p-4 shadow-sm" onSubmit={createShipment}>
            <h2 className="text-sm font-semibold text-foreground">Create shipment</h2>
            <div className="mt-4 space-y-3">
              <SelectInput label="Order" value={form.orderId} options={openOrders.map((order) => ({ label: `${order.orderNumber} - ${order.customerName}`, value: order.id }))} onChange={(orderId) => setForm({ ...form, orderId })} />
              <TextInput label="Carrier" value={form.carrier} onChange={(carrier) => setForm({ ...form, carrier })} />
              <TextInput label="Tracking number" value={form.trackingNumber} onChange={(trackingNumber) => setForm({ ...form, trackingNumber })} />
              <Button type="submit" disabled={saving || !form.orderId} className="w-full"><Plus className="mr-2 size-4" aria-hidden="true" />Save shipment</Button>
            </div>
          </form>
          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground">Status update</h2>
            {selectedShipment ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-muted-foreground">{selectedShipment.order.orderNumber} - {selectedShipment.order.customerName}</p>
                <TextInput label="Note" value={statusNote} onChange={setStatusNote} />
                <select className={inputClass} disabled={saving || selectedShipment.status === "DELIVERED" || selectedShipment.status === "CANCELLED"} onChange={(event) => event.target.value && void updateStatus(selectedShipment, event.target.value as ShipmentStatus)} defaultValue="">
                  <option value="">Set status...</option>
                  {shipmentStatuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
                </select>
              </div>
            ) : <p className="mt-4 text-sm text-muted-foreground">Select a shipment to update status.</p>}
          </section>
          <Timeline title="Tracking timeline" items={timeline} />
        </div>
      </div>
    </>
  );
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input className={inputClass} value={value} onChange={(event) => onChange(event.target.value)} />
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
