"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRightLeft, Boxes, Plus, Warehouse } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { ApiError, type InventoryResponse, type ProductListResponse, type WarehouseResponse } from "@/lib/api";
import { useAuthenticatedRequest } from "@/lib/use-authenticated-request";

const inputClass = "mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20";

type BinForm = { code: string };
type TransferForm = { productId: string; fromBinId: string; toBinId: string; quantity: string; reference: string };

export default function WarehouseDetailPage() {
  const params = useParams<{ id: string }>();
  const { accessToken, authLoading, requestWithAuth } = useAuthenticatedRequest();
  const [warehouse, setWarehouse] = useState<WarehouseResponse | null>(null);
  const [allWarehouses, setAllWarehouses] = useState<WarehouseResponse[]>([]);
  const [inventory, setInventory] = useState<InventoryResponse[]>([]);
  const [products, setProducts] = useState<ProductListResponse["data"]>([]);
  const [binForm, setBinForm] = useState<BinForm>({ code: "" });
  const [transferForm, setTransferForm] = useState<TransferForm>({ productId: "", fromBinId: "", toBinId: "", quantity: "1", reference: "" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bins = useMemo(
    () => allWarehouses.flatMap((item) => item.bins.map((bin) => ({ ...bin, warehouse: item }))),
    [allWarehouses],
  );

  const loadData = useCallback(async () => {
    if (authLoading || !params.id) return;
    setLoading(true);
    setError(null);

    try {
      const [warehouseResult, warehouseListResult, inventoryResult, productResult] = await Promise.all([
        requestWithAuth<{ data: WarehouseResponse }>(`/warehouses/${params.id}`),
        requestWithAuth<{ data: WarehouseResponse[] }>("/warehouses?limit=100"),
        requestWithAuth<{ data: InventoryResponse[] }>(`/inventory?limit=100&warehouseId=${params.id}`),
        requestWithAuth<ProductListResponse>("/products?limit=100&status=ACTIVE"),
      ]);

      setWarehouse(warehouseResult.data);
      setAllWarehouses(warehouseListResult.data);
      setInventory(inventoryResult.data);
      setProducts(productResult.data);
      setTransferForm((current) => ({
        ...current,
        productId: current.productId || productResult.data[0]?.id || "",
        fromBinId: current.fromBinId || inventoryResult.data[0]?.bin.id || "",
        toBinId: current.toBinId || warehouseResult.data.bins[0]?.id || "",
      }));
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Unable to load warehouse");
    } finally {
      setLoading(false);
    }
  }, [authLoading, params.id, requestWithAuth]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadData]);

  async function createBin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!warehouse) return;
    setSaving(true);
    setError(null);

    try {
      await requestWithAuth(`/warehouses/${warehouse.id}/bins`, {
        method: "POST",
        body: JSON.stringify({ code: binForm.code }),
      });
      setBinForm({ code: "" });
      await loadData();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Unable to create bin");
    } finally {
      setSaving(false);
    }
  }

  async function transferStock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await requestWithAuth("/warehouse-transfers", {
        method: "POST",
        body: JSON.stringify({
          productId: transferForm.productId,
          fromBinId: transferForm.fromBinId,
          toBinId: transferForm.toBinId,
          quantity: Number(transferForm.quantity),
          reference: transferForm.reference || null,
        }),
      });
      await loadData();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Unable to transfer stock");
    } finally {
      setSaving(false);
    }
  }

  if (!authLoading && !accessToken) {
    return (
      <>
        <PageHeader eyebrow="Warehouse detail" title="Sign in required" description="Warehouses require an authenticated workspace session." icon={Warehouse} />
        <div className="p-4 sm:p-6"><Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link></div>
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Warehouse detail" title={warehouse?.name ?? "Loading warehouse"} description={warehouse ? `${warehouse.code} · ${warehouse.address ?? "No address"}` : "Warehouse bins, inventory, and transfer controls."} icon={Warehouse} />
      <div className="space-y-4 p-4 sm:p-6">
        <Button type="button" variant="outline" size="sm" onClick={() => history.back()}><ArrowLeft className="size-4" aria-hidden="true" />Back</Button>
        {error ? <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}
        {loading ? <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">Loading warehouse...</div> : null}
        {warehouse ? (
          <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
            <div className="space-y-4">
              <section className="grid gap-3 md:grid-cols-3">
                <Metric label="Bins" value={warehouse.binsCount.toLocaleString()} />
                <Metric label="Units" value={warehouse.totalQuantity.toLocaleString()} />
                <Metric label="Address" value={warehouse.address ?? "None"} />
              </section>
              <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2"><Boxes className="size-4 text-primary" aria-hidden="true" /><h2 className="text-sm font-semibold text-foreground">Bins</h2></div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {warehouse.bins.length === 0 ? <p className="text-sm text-muted-foreground">No bins yet.</p> : warehouse.bins.map((bin) => (
                    <article key={bin.id} className="rounded-lg border border-border bg-background p-3">
                      <p className="text-sm font-medium text-foreground">{bin.code}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{bin.totalQuantity.toLocaleString()} units</p>
                    </article>
                  ))}
                </div>
              </section>
              <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-foreground">Bin inventory</h2>
                <div className="mt-4 divide-y divide-border">
                  {inventory.length === 0 ? <p className="text-sm text-muted-foreground">No inventory rows in this warehouse yet.</p> : inventory.map((item) => (
                    <div key={item.id} className="grid gap-2 py-3 text-sm md:grid-cols-[1fr_auto_auto]">
                      <div>
                        <Link href={`/app/products/${item.product.id}`} className="font-medium text-foreground hover:text-primary hover:underline">{item.product.name}</Link>
                        <p className="text-xs text-muted-foreground">{item.product.sku} · {item.bin.code}</p>
                      </div>
                      <StatusBadge value={item.risk} />
                      <span className="text-right">{item.quantity.toLocaleString()} units</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
            <aside className="space-y-4">
              <form className="rounded-lg border border-border bg-card p-4 shadow-sm" onSubmit={createBin}>
                <h2 className="text-sm font-semibold text-foreground">Create bin</h2>
                <div className="mt-4 space-y-3">
                  <Field label="Bin code" value={binForm.code} onChange={(code) => setBinForm({ code })} required />
                  <Button type="submit" disabled={saving} className="w-full"><Plus className="size-4" aria-hidden="true" />Save bin</Button>
                </div>
              </form>
              <form className="rounded-lg border border-border bg-card p-4 shadow-sm" onSubmit={transferStock}>
                <h2 className="text-sm font-semibold text-foreground">Transfer stock</h2>
                <div className="mt-4 space-y-3">
                  <Select label="Product" value={transferForm.productId} options={products.map((product) => ({ label: `${product.name} (${product.sku})`, value: product.id }))} onChange={(productId) => setTransferForm({ ...transferForm, productId })} />
                  <Select label="From bin" value={transferForm.fromBinId} options={inventory.map((item) => ({ label: `${item.product.name} - ${item.bin.code} (${item.quantity})`, value: item.bin.id }))} onChange={(fromBinId) => setTransferForm({ ...transferForm, fromBinId })} />
                  <Select label="To bin" value={transferForm.toBinId} options={bins.map((bin) => ({ label: `${bin.warehouse.name} / ${bin.code}`, value: bin.id }))} onChange={(toBinId) => setTransferForm({ ...transferForm, toBinId })} />
                  <Field label="Quantity" type="number" value={transferForm.quantity} onChange={(quantity) => setTransferForm({ ...transferForm, quantity })} required />
                  <Field label="Reference" value={transferForm.reference} onChange={(reference) => setTransferForm({ ...transferForm, reference })} />
                  <Button type="submit" disabled={saving || !transferForm.productId || !transferForm.fromBinId || !transferForm.toBinId} className="w-full"><ArrowRightLeft className="size-4" aria-hidden="true" />Transfer</Button>
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

function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input className={inputClass} type={type} value={value} required={required} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: Array<{ label: string; value: string }>; onChange: (value: string) => void }) {
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
