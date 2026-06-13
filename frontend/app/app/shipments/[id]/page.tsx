"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, MapPin, PackageCheck, Route, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Timeline } from "@/components/app/timeline";
import { Button } from "@/components/ui/button";
import { ApiError, type ShipmentResponse, type ShipmentStatus } from "@/lib/api";
import type { TimelineEvent } from "@/lib/app-types";
import { useAuthenticatedRequest } from "@/lib/use-authenticated-request";

const inputClass = "mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20";
const statuses: ShipmentStatus[] = ["ASSIGNED", "IN_TRANSIT", "DELIVERED", "CANCELLED"];

export default function ShipmentDetailPage() {
  const params = useParams<{ id: string }>();
  const { accessToken, authLoading, requestWithAuth } = useAuthenticatedRequest();
  const [shipment, setShipment] = useState<ShipmentResponse | null>(null);
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [eventStatus, setEventStatus] = useState("IN_TRANSIT");
  const [eventLocation, setEventLocation] = useState("");
  const [eventNote, setEventNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadShipment = useCallback(async () => {
    if (authLoading || !params.id) return;
    setLoading(true);
    setError(null);

    try {
      const result = await requestWithAuth<{ data: ShipmentResponse }>(`/shipments/${params.id}`);
      setShipment(result.data);
      setCarrier(result.data.carrier ?? "");
      setTrackingNumber(result.data.trackingNumber ?? "");
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Unable to load shipment");
    } finally {
      setLoading(false);
    }
  }, [authLoading, params.id, requestWithAuth]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadShipment();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadShipment]);

  async function assignShipment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!shipment) return;
    setSaving(true);
    setError(null);

    try {
      await requestWithAuth(`/shipments/${shipment.id}/assign`, {
        method: "PATCH",
        body: JSON.stringify({ carrier: carrier || null, trackingNumber: trackingNumber || null }),
      });
      await loadShipment();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Unable to assign shipment");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(status: ShipmentStatus) {
    if (!shipment) return;
    setSaving(true);
    setError(null);

    try {
      await requestWithAuth(`/shipments/${shipment.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, note: eventNote || null }),
      });
      setEventNote("");
      await loadShipment();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Unable to update shipment");
    } finally {
      setSaving(false);
    }
  }

  async function addTrackingEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!shipment) return;
    setSaving(true);
    setError(null);

    try {
      await requestWithAuth(`/shipments/${shipment.id}/tracking-events`, {
        method: "POST",
        body: JSON.stringify({
          status: eventStatus,
          location: eventLocation || null,
          note: eventNote || null,
        }),
      });
      setEventLocation("");
      setEventNote("");
      await loadShipment();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Unable to add tracking event");
    } finally {
      setSaving(false);
    }
  }

  const timeline = shipment?.trackingEvents.map<TimelineEvent>((event) => ({
    id: event.id,
    title: event.status,
    description: [event.location, event.note].filter(Boolean).join(" - ") || "Tracking event recorded.",
    time: new Date(event.createdAt).toLocaleString(),
    status: event.status,
  })) ?? [];

  if (!authLoading && !accessToken) {
    return (
      <>
        <PageHeader eyebrow="Shipment detail" title="Sign in required" description="Shipments require an authenticated workspace session." icon={Route} />
        <div className="p-4 sm:p-6"><Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link></div>
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Shipment detail" title={shipment?.order.orderNumber ?? "Loading shipment"} description={shipment ? `${shipment.order.customerName} · ${shipment.trackingNumber ?? "No tracking number"}` : "Carrier assignment, status, and tracking timeline."} icon={Route} />
      <div className="space-y-4 p-4 sm:p-6">
        <Button type="button" variant="outline" size="sm" onClick={() => history.back()}><ArrowLeft className="size-4" aria-hidden="true" />Back</Button>
        {error ? <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}
        {loading ? <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">Loading shipment...</div> : null}
        {shipment ? (
          <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
            <div className="space-y-4">
              <section className="grid gap-3 md:grid-cols-4">
                <Metric label="Status" value={<StatusBadge value={shipment.status} />} />
                <Metric label="Carrier" value={shipment.carrier ?? "Unassigned"} />
                <Metric label="Tracking" value={shipment.trackingNumber ?? "None"} />
                <Metric label="Order total" value={`$${shipment.order.totalAmount.toLocaleString()}`} />
              </section>
              <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-foreground">Order summary</h2>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div><dt className="text-xs text-muted-foreground">Order</dt><dd className="mt-1"><Link href={`/app/orders/${shipment.order.id}`} className="font-medium text-primary hover:underline">{shipment.order.orderNumber}</Link></dd></div>
                  <div><dt className="text-xs text-muted-foreground">Order status</dt><dd className="mt-1"><StatusBadge value={shipment.order.status} /></dd></div>
                  <div><dt className="text-xs text-muted-foreground">Customer</dt><dd className="mt-1 font-medium text-foreground">{shipment.order.customerName}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Total</dt><dd className="mt-1 font-medium text-foreground">${shipment.order.totalAmount.toLocaleString()}</dd></div>
                </dl>
              </section>
              <Timeline title="Tracking timeline" items={timeline} />
            </div>
            <aside className="space-y-4">
              <form className="rounded-lg border border-border bg-card p-4 shadow-sm" onSubmit={assignShipment}>
                <h2 className="text-sm font-semibold text-foreground">Carrier assignment</h2>
                <div className="mt-4 space-y-3">
                  <Field label="Carrier" value={carrier} onChange={setCarrier} />
                  <Field label="Tracking number" value={trackingNumber} onChange={setTrackingNumber} />
                  <Button type="submit" disabled={saving} className="w-full"><PackageCheck className="size-4" aria-hidden="true" />Save assignment</Button>
                </div>
              </form>
              <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-foreground">Status update</h2>
                <div className="mt-4 space-y-3">
                  <Field label="Status note" value={eventNote} onChange={setEventNote} />
                  <select className={inputClass} defaultValue="" disabled={saving || shipment.status === "DELIVERED" || shipment.status === "CANCELLED"} onChange={(event) => event.target.value && void updateStatus(event.target.value as ShipmentStatus)}>
                    <option value="">Set status...</option>
                    {statuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
                  </select>
                </div>
              </section>
              <form className="rounded-lg border border-border bg-card p-4 shadow-sm" onSubmit={addTrackingEvent}>
                <h2 className="text-sm font-semibold text-foreground">Add tracking event</h2>
                <div className="mt-4 space-y-3">
                  <Field label="Status" value={eventStatus} onChange={setEventStatus} required />
                  <Field label="Location" value={eventLocation} onChange={setEventLocation} icon={MapPin} />
                  <Field label="Note" value={eventNote} onChange={setEventNote} />
                  <Button type="submit" disabled={saving} className="w-full"><Save className="size-4" aria-hidden="true" />Add event</Button>
                </div>
              </form>
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
      <div className="mt-2 truncate text-lg font-semibold text-foreground">{value}</div>
    </article>
  );
}

function Field({ label, value, onChange, required = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; icon?: React.ComponentType }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input className={inputClass} value={value} required={required} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
