"use client";

import Link from "next/link";
import { ArrowRightLeft, Boxes, Eye, Plus, Warehouse } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DataColumn } from "@/components/app/data-table";
import { DataTable } from "@/components/app/data-table";
import { FirstRunCard } from "@/components/app/first-run-card";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import {
  ApiError,
  type InventoryResponse,
  type ProductListResponse,
  type WarehouseResponse,
} from "@/lib/api";
import { useAuthenticatedRequest } from "@/lib/use-authenticated-request";

const inputClass = "mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20";

type WarehouseForm = {
  name: string;
  code: string;
  address: string;
};

type BinForm = {
  warehouseId: string;
  code: string;
};

type TransferForm = {
  productId: string;
  fromBinId: string;
  toBinId: string;
  quantity: string;
  reference: string;
};

export default function WarehousesPage() {
  const { accessToken, authLoading, requestWithAuth } = useAuthenticatedRequest();
  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([]);
  const [inventory, setInventory] = useState<InventoryResponse[]>([]);
  const [products, setProducts] = useState<ProductListResponse["data"]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warehouseForm, setWarehouseForm] = useState<WarehouseForm>({ name: "", code: "", address: "" });
  const [binForm, setBinForm] = useState<BinForm>({ warehouseId: "", code: "" });
  const [transferForm, setTransferForm] = useState<TransferForm>({
    productId: "",
    fromBinId: "",
    toBinId: "",
    quantity: "1",
    reference: "",
  });

  const bins = useMemo(
    () => warehouses.flatMap((warehouse) => warehouse.bins.map((bin) => ({ ...bin, warehouse }))),
    [warehouses],
  );

  const loadData = useCallback(async () => {
    if (authLoading) return;
    setLoading(true);
    setError(null);

    try {
      const [warehouseResult, inventoryResult, productResult] = await Promise.all([
        requestWithAuth<{ data: WarehouseResponse[] }>("/warehouses?limit=100"),
        requestWithAuth<{ data: InventoryResponse[] }>("/inventory?limit=100"),
        requestWithAuth<ProductListResponse>("/products?limit=100&status=ACTIVE"),
      ]);

      setWarehouses(warehouseResult.data);
      setInventory(inventoryResult.data);
      setProducts(productResult.data);
      setBinForm((current) => ({ ...current, warehouseId: current.warehouseId || warehouseResult.data[0]?.id || "" }));
      setTransferForm((current) => ({
        ...current,
        productId: current.productId || productResult.data[0]?.id || "",
        fromBinId: current.fromBinId || inventoryResult.data[0]?.bin.id || warehouseResult.data[0]?.bins[0]?.id || "",
        toBinId: current.toBinId || warehouseResult.data[0]?.bins[1]?.id || "",
      }));
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Unable to load warehouses");
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

  async function createWarehouse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await requestWithAuth("/warehouses", {
        method: "POST",
        body: JSON.stringify({
          name: warehouseForm.name,
          code: warehouseForm.code,
          address: warehouseForm.address || null,
        }),
      });
      setWarehouseForm({ name: "", code: "", address: "" });
      await loadData();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Unable to create warehouse");
    } finally {
      setSaving(false);
    }
  }

  async function createBin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!binForm.warehouseId) return;
    setSaving(true);
    setError(null);

    try {
      await requestWithAuth(`/warehouses/${binForm.warehouseId}/bins`, {
        method: "POST",
        body: JSON.stringify({ code: binForm.code }),
      });
      setBinForm((current) => ({ ...current, code: "" }));
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

  const columns = useMemo<DataColumn<WarehouseResponse>[]>(
    () => [
      {
        header: "Warehouse",
        cell: (warehouse) => (
          <div>
            <Link href={`/app/warehouses/${warehouse.id}`} className="font-medium text-foreground hover:text-primary hover:underline">{warehouse.name}</Link>
            <p className="text-xs text-muted-foreground">{warehouse.code}</p>
          </div>
        ),
      },
      { header: "Address", cell: (warehouse) => warehouse.address ?? "No address" },
      { header: "Bins", cell: (warehouse) => warehouse.binsCount, className: "text-right" },
      { header: "Units", cell: (warehouse) => warehouse.totalQuantity.toLocaleString(), className: "text-right" },
      {
        header: "Actions",
        cell: (warehouse) => (
          <Link href={`/app/warehouses/${warehouse.id}`} className="inline-flex size-7 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground">
            <Eye className="size-3.5" aria-hidden="true" />
            <span className="sr-only">View {warehouse.name}</span>
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
        <PageHeader eyebrow="Warehouses" title="Warehouse and bin operations" description="Sign in to load tenant-scoped warehouse data." icon={Warehouse} />
        <div className="p-4 sm:p-6">
          <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            Warehouse data requires an authenticated session. <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Warehouses" title="Warehouses, bins, and transfer controls" description="Tenant-scoped warehouse operations backed by the Best Step API." action="Create warehouse" icon={Warehouse} />
      <div className="grid gap-5 p-4 sm:p-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {error ? <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}
          {loading ? <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">Loading warehouses...</div> : null}
          {warehouses.length === 0 && !loading ? (
            <FirstRunCard
              title="Start with a warehouse and bin"
              description="Create the first physical location, then add products, stock in, orders, and shipments from the same workspace."
              icon={Warehouse}
              action={{ label: "Create warehouse", href: "/app/warehouses" }}
              steps={[
                { label: "Warehouse", href: "/app/warehouses", active: true },
                { label: "Bin", href: "/app/warehouses" },
                { label: "Product", href: "/app/products" },
                { label: "Stock in", href: "/app/inventory" },
                { label: "Order", href: "/app/orders" },
                { label: "Shipment", href: "/app/shipments" },
              ]}
            />
          ) : (
            <DataTable columns={columns} rows={warehouses} getRowKey={(warehouse) => warehouse.id} emptyMessage="No warehouses yet." />
          )}
          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Boxes className="size-4 text-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-foreground">Bins</h2>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {bins.length === 0 ? <p className="text-sm text-muted-foreground">No bins yet.</p> : bins.map((bin) => (
                <div key={bin.id} className="rounded-lg border border-border bg-background p-3">
                  <p className="text-sm font-medium text-foreground">{bin.code}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{bin.warehouse.name}</p>
                  <p className="mt-2 text-sm text-foreground">{bin.totalQuantity.toLocaleString()} units</p>
                </div>
              ))}
            </div>
          </section>
        </div>
        <div className="space-y-4">
          <form className="rounded-lg border border-border bg-card p-4 shadow-sm" onSubmit={createWarehouse}>
            <h2 className="text-sm font-semibold text-foreground">Create warehouse</h2>
            <div className="mt-4 space-y-3">
              <TextInput label="Name" value={warehouseForm.name} onChange={(name) => setWarehouseForm({ ...warehouseForm, name })} required />
              <TextInput label="Code" value={warehouseForm.code} onChange={(code) => setWarehouseForm({ ...warehouseForm, code })} required />
              <TextInput label="Address" value={warehouseForm.address} onChange={(address) => setWarehouseForm({ ...warehouseForm, address })} />
              <Button type="submit" disabled={saving} className="w-full"><Plus className="mr-2 size-4" aria-hidden="true" />Save warehouse</Button>
            </div>
          </form>
          <form className="rounded-lg border border-border bg-card p-4 shadow-sm" onSubmit={createBin}>
            <h2 className="text-sm font-semibold text-foreground">Create bin</h2>
            <div className="mt-4 space-y-3">
              <SelectInput label="Warehouse" value={binForm.warehouseId} options={warehouses.map((warehouse) => ({ label: warehouse.name, value: warehouse.id }))} onChange={(warehouseId) => setBinForm({ ...binForm, warehouseId })} />
              <TextInput label="Bin code" value={binForm.code} onChange={(code) => setBinForm({ ...binForm, code })} required />
              <Button type="submit" disabled={saving || !binForm.warehouseId} className="w-full"><Plus className="mr-2 size-4" aria-hidden="true" />Save bin</Button>
            </div>
          </form>
          <form className="rounded-lg border border-border bg-card p-4 shadow-sm" onSubmit={transferStock}>
            <h2 className="text-sm font-semibold text-foreground">Transfer stock</h2>
            <div className="mt-4 space-y-3">
              <SelectInput label="Product" value={transferForm.productId} options={products.map((product) => ({ label: `${product.name} (${product.sku})`, value: product.id }))} onChange={(productId) => setTransferForm({ ...transferForm, productId })} />
              <SelectInput label="From bin" value={transferForm.fromBinId} options={inventory.map((item) => ({ label: `${item.product.name} - ${item.warehouse.name} / ${item.bin.code} (${item.quantity})`, value: item.bin.id }))} onChange={(fromBinId) => setTransferForm({ ...transferForm, fromBinId })} />
              <SelectInput label="To bin" value={transferForm.toBinId} options={bins.map((bin) => ({ label: `${bin.warehouse.name} / ${bin.code}`, value: bin.id }))} onChange={(toBinId) => setTransferForm({ ...transferForm, toBinId })} />
              <TextInput label="Quantity" type="number" value={transferForm.quantity} onChange={(quantity) => setTransferForm({ ...transferForm, quantity })} required />
              <TextInput label="Reference" value={transferForm.reference} onChange={(reference) => setTransferForm({ ...transferForm, reference })} />
              <Button type="submit" disabled={saving || !transferForm.productId || !transferForm.fromBinId || !transferForm.toBinId} className="w-full"><ArrowRightLeft className="mr-2 size-4" aria-hidden="true" />Transfer</Button>
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
