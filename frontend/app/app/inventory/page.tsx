"use client";

import Link from "next/link";
import { AlertTriangle, Boxes, Plus, TrendingDown, type LucideIcon } from "lucide-react";
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
  type InventoryResponse,
  type ProductListResponse,
  type StockMovementResponse,
  type WarehouseResponse,
} from "@/lib/api";
import type { TimelineEvent } from "@/lib/app-types";
import { useAuthenticatedRequest } from "@/lib/use-authenticated-request";

const inputClass = "mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20";

type StockForm = {
  productId: string;
  binId: string;
  quantity: string;
  reference: string;
};

export default function InventoryPage() {
  const { accessToken, authLoading, requestWithAuth } = useAuthenticatedRequest();
  const [inventory, setInventory] = useState<InventoryResponse[]>([]);
  const [movements, setMovements] = useState<StockMovementResponse[]>([]);
  const [products, setProducts] = useState<ProductListResponse["data"]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stockForm, setStockForm] = useState<StockForm>({ productId: "", binId: "", quantity: "1", reference: "" });

  const bins = useMemo(
    () => warehouses.flatMap((warehouse) => warehouse.bins.map((bin) => ({ ...bin, warehouse }))),
    [warehouses],
  );
  const warnings = inventory.filter((item) => item.risk !== "Healthy");
  const movementTimeline = movements.slice(0, 8).map<TimelineEvent>((movement) => ({
    id: movement.id,
    title: `${movement.type.replaceAll("_", " ")} - ${movement.product.sku}`,
    description: `${movement.quantity} units at ${movement.warehouse.name}${movement.reference ? ` (${movement.reference})` : ""}`,
    time: new Date(movement.createdAt).toLocaleString(),
    status: movement.type,
  }));

  const loadData = useCallback(async () => {
    if (authLoading) return;
    setLoading(true);
    setError(null);

    try {
      const [inventoryResult, movementResult, productResult, warehouseResult] = await Promise.all([
        requestWithAuth<{ data: InventoryResponse[] }>("/inventory?limit=100"),
        requestWithAuth<{ data: StockMovementResponse[] }>("/stock-movements?limit=20"),
        requestWithAuth<ProductListResponse>("/products?limit=100&status=ACTIVE"),
        requestWithAuth<{ data: WarehouseResponse[] }>("/warehouses?limit=100"),
      ]);

      setInventory(inventoryResult.data);
      setMovements(movementResult.data);
      setProducts(productResult.data);
      setWarehouses(warehouseResult.data);
      setStockForm((current) => ({
        ...current,
        productId: current.productId || productResult.data[0]?.id || "",
        binId: current.binId || warehouseResult.data[0]?.bins[0]?.id || "",
      }));
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Unable to load inventory");
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

  async function mutateStock(event: React.FormEvent<HTMLFormElement>, direction: "stock-in" | "stock-out") {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await requestWithAuth(`/inventory/${direction}`, {
        method: "POST",
        body: JSON.stringify({
          productId: stockForm.productId,
          binId: stockForm.binId,
          quantity: Number(stockForm.quantity),
          reference: stockForm.reference || null,
        }),
      });
      await loadData();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Unable to update stock");
    } finally {
      setSaving(false);
    }
  }

  async function stockOut() {
    setSaving(true);
    setError(null);

    try {
      await requestWithAuth("/inventory/stock-out", {
        method: "POST",
        body: JSON.stringify({
          productId: stockForm.productId,
          binId: stockForm.binId,
          quantity: Number(stockForm.quantity),
          reference: stockForm.reference || null,
        }),
      });
      await loadData();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Unable to update stock");
    } finally {
      setSaving(false);
    }
  }

  const columns = useMemo<DataColumn<InventoryResponse>[]>(
    () => [
      {
        header: "Product",
        cell: (item) => (
          <div>
            <p className="font-medium text-foreground">{item.product.name}</p>
            <p className="text-xs text-muted-foreground">{item.product.sku}</p>
          </div>
        ),
      },
      { header: "Warehouse", cell: (item) => `${item.warehouse.name} / ${item.bin.code}` },
      { header: "Risk", cell: (item) => <StatusBadge value={item.risk} /> },
      { header: "Bin qty", cell: (item) => item.quantity.toLocaleString(), className: "text-right" },
      { header: "Product total", cell: (item) => `${item.productTotalQuantity} / ${item.reorderLevel}`, className: "text-right" },
      { header: "Value", cell: (item) => `$${item.inventoryValue.toLocaleString()}`, className: "text-right" },
    ],
    [],
  );

  if (!authLoading && !accessToken) {
    return (
      <>
        <PageHeader eyebrow="Inventory" title="Stock levels and movement history" description="Sign in to load tenant-scoped inventory." icon={Boxes} />
        <div className="p-4 sm:p-6">
          <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            Inventory requires an authenticated session. <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Inventory" title="Stock levels, risk, and movement history" description="Live inventory rows and stock movements from the Best Step API." action="Adjust stock" icon={Boxes} />
      <div className="grid gap-5 p-4 sm:p-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {error ? <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}
          {loading ? <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">Loading inventory...</div> : null}
          <div className="grid gap-3 md:grid-cols-3">
            <SummaryCard label="Inventory rows" value={inventory.length.toLocaleString()} />
            <SummaryCard label="Low-risk items" value={warnings.length.toLocaleString()} icon={AlertTriangle} />
            <SummaryCard label="Inventory value" value={`$${inventory.reduce((total, item) => total + item.inventoryValue, 0).toLocaleString()}`} icon={TrendingDown} />
          </div>
          {inventory.length === 0 && !loading ? (
            <FirstRunCard
              title="Stock in after products and bins exist"
              description="Inventory rows are created when stock lands in a bin. Follow the setup path, then use the stock adjustment panel."
              icon={Boxes}
              action={{ label: "Stock in", href: "/app/inventory" }}
              steps={[
                { label: "Warehouse", href: "/app/warehouses" },
                { label: "Bin", href: "/app/warehouses" },
                { label: "Product", href: "/app/products" },
                { label: "Stock in", href: "/app/inventory", active: true },
                { label: "Order", href: "/app/orders" },
                { label: "Shipment", href: "/app/shipments" },
              ]}
            />
          ) : (
            <DataTable columns={columns} rows={inventory} getRowKey={(item) => item.id} emptyMessage="No inventory rows yet. Add stock to a bin to begin." />
          )}
          <Timeline title="Recent stock movements" items={movementTimeline} />
        </div>
        <div className="space-y-4">
          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground">Low stock warnings</h2>
            <div className="mt-4 space-y-3">
              {warnings.length === 0 ? <p className="text-sm text-muted-foreground">No low-stock rows right now.</p> : warnings.map((item) => (
                <div key={item.id} className="rounded-lg border border-border bg-background p-3">
                  <p className="text-sm font-medium text-foreground">{item.product.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.productTotalQuantity} total units, reorder at {item.reorderLevel}</p>
                </div>
              ))}
            </div>
          </section>
          <form className="rounded-lg border border-border bg-card p-4 shadow-sm" onSubmit={(event) => mutateStock(event, "stock-in")}>
            <h2 className="text-sm font-semibold text-foreground">Stock adjustment</h2>
            <div className="mt-4 space-y-3">
              <SelectInput label="Product" value={stockForm.productId} options={products.map((product) => ({ label: `${product.name} (${product.sku})`, value: product.id }))} onChange={(productId) => setStockForm({ ...stockForm, productId })} />
              <SelectInput label="Bin" value={stockForm.binId} options={bins.map((bin) => ({ label: `${bin.warehouse.name} / ${bin.code}`, value: bin.id }))} onChange={(binId) => setStockForm({ ...stockForm, binId })} />
              <TextInput label="Quantity" type="number" value={stockForm.quantity} onChange={(quantity) => setStockForm({ ...stockForm, quantity })} />
              <TextInput label="Reference" value={stockForm.reference} onChange={(reference) => setStockForm({ ...stockForm, reference })} />
              <div className="grid gap-2 sm:grid-cols-2">
                <Button type="submit" disabled={saving || !stockForm.productId || !stockForm.binId}><Plus className="mr-2 size-4" aria-hidden="true" />Stock in</Button>
                <Button type="button" variant="outline" disabled={saving || !stockForm.productId || !stockForm.binId} onClick={() => void stockOut()}>Stock out</Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

function SummaryCard({ label, value, icon: Icon }: { label: string; value: string; icon?: LucideIcon }) {
  const DisplayIcon = Icon ?? Boxes;

  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
        </div>
        <DisplayIcon className="size-4 text-primary" aria-hidden="true" />
      </div>
    </article>
  );
}

function TextInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input className={inputClass} value={value} type={type} onChange={(event) => onChange(event.target.value)} />
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
