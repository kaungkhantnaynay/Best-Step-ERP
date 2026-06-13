"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Archive, ArrowLeft, Package, RefreshCw, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import {
  ApiError,
  type CategoryResponse,
  type InventoryResponse,
  type ProductMutation,
  type ProductResponse,
  type StockMovementResponse,
} from "@/lib/api";
import { useAuthenticatedRequest } from "@/lib/use-authenticated-request";

const inputClass = "mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20";

type ProductForm = {
  name: string;
  sku: string;
  description: string;
  categoryId: string;
  unit: string;
  price: string;
  reorderLevel: string;
};

function toForm(product: ProductResponse): ProductForm {
  return {
    name: product.name,
    sku: product.sku,
    description: product.description ?? "",
    categoryId: product.category?.id ?? "",
    unit: product.unit,
    price: String(product.price),
    reorderLevel: String(product.reorderLevel),
  };
}

function toMutation(form: ProductForm): ProductMutation {
  return {
    name: form.name,
    sku: form.sku,
    description: form.description || null,
    categoryId: form.categoryId || null,
    unit: form.unit,
    price: Number(form.price),
    reorderLevel: Number(form.reorderLevel),
  };
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const { accessToken, authLoading, requestWithAuth } = useAuthenticatedRequest();
  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [inventory, setInventory] = useState<InventoryResponse[]>([]);
  const [movements, setMovements] = useState<StockMovementResponse[]>([]);
  const [form, setForm] = useState<ProductForm | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (authLoading || !params.id) return;
    setLoading(true);
    setError(null);

    try {
      const [productResult, categoryResult, inventoryResult, movementResult] = await Promise.all([
        requestWithAuth<{ data: ProductResponse }>(`/products/${params.id}`),
        requestWithAuth<{ data: CategoryResponse[] }>("/categories"),
        requestWithAuth<{ data: InventoryResponse[] }>(`/inventory?limit=100&productId=${params.id}`),
        requestWithAuth<{ data: StockMovementResponse[] }>(`/stock-movements?limit=25&productId=${params.id}`),
      ]);

      setProduct(productResult.data);
      setForm(toForm(productResult.data));
      setCategories(categoryResult.data);
      setInventory(inventoryResult.data);
      setMovements(movementResult.data);
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Unable to load product");
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

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form || !product) return;
    setSaving(true);
    setError(null);

    try {
      await requestWithAuth(`/products/${product.id}`, {
        method: "PATCH",
        body: JSON.stringify(toMutation(form)),
      });
      await loadData();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Unable to update product");
    } finally {
      setSaving(false);
    }
  }

  async function archiveProduct() {
    if (!product || !window.confirm(`Archive ${product.name}?`)) return;
    setSaving(true);
    setError(null);

    try {
      await requestWithAuth(`/products/${product.id}`, { method: "DELETE" });
      await loadData();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Unable to archive product");
    } finally {
      setSaving(false);
    }
  }

  if (!authLoading && !accessToken) {
    return (
      <>
        <PageHeader eyebrow="Product detail" title="Sign in required" description="Product data requires an authenticated workspace session." icon={Package} />
        <div className="p-4 sm:p-6"><Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link></div>
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Product detail" title={product?.name ?? "Loading product"} description={product ? `${product.sku} · ${product.category?.name ?? "Uncategorized"}` : "Product metadata, stock, locations, and controls."} icon={Package} />
      <div className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => history.back()}><ArrowLeft className="size-4" aria-hidden="true" />Back</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => void loadData()}><RefreshCw className="size-4" aria-hidden="true" />Refresh</Button>
        </div>
        {error ? <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}
        {loading ? <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">Loading product...</div> : null}
        {product && form ? (
          <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
            <div className="space-y-4">
              <section className="grid gap-3 md:grid-cols-4">
                <Metric label="Status" value={<StatusBadge value={product.stockStatus} />} />
                <Metric label="Stock" value={`${product.stockQuantity} ${product.unit}`} />
                <Metric label="Reorder" value={product.reorderLevel.toLocaleString()} />
                <Metric label="Inventory value" value={`$${product.inventoryValue.toLocaleString()}`} />
              </section>
              <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-foreground">Locations</h2>
                <div className="mt-4 divide-y divide-border">
                  {inventory.length === 0 ? <p className="text-sm text-muted-foreground">No stock locations yet.</p> : inventory.map((item) => (
                    <div key={item.id} className="grid gap-2 py-3 text-sm md:grid-cols-[1fr_auto_auto]">
                      <span className="font-medium text-foreground">{item.warehouse.name} / {item.bin.code}</span>
                      <StatusBadge value={item.risk} />
                      <span className="text-right text-muted-foreground">{item.quantity.toLocaleString()} units</span>
                    </div>
                  ))}
                </div>
              </section>
              <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-foreground">Recent movements</h2>
                <div className="mt-4 divide-y divide-border">
                  {movements.length === 0 ? <p className="text-sm text-muted-foreground">No stock movement history yet.</p> : movements.map((movement) => (
                    <div key={movement.id} className="grid gap-2 py-3 text-sm md:grid-cols-[1fr_auto_auto]">
                      <span className="font-medium text-foreground">{movement.type.replaceAll("_", " ")}</span>
                      <span className="text-muted-foreground">{movement.warehouse.name}</span>
                      <span className="text-right">{movement.quantity.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
            <aside className="space-y-4">
              <form className="rounded-lg border border-border bg-card p-4 shadow-sm" onSubmit={saveProduct}>
                <h2 className="text-sm font-semibold text-foreground">Edit product</h2>
                <div className="mt-4 space-y-3">
                  <Field label="Name" value={form.name} onChange={(name) => setForm({ ...form, name })} required />
                  <Field label="SKU" value={form.sku} onChange={(sku) => setForm({ ...form, sku })} required />
                  <label className="block">
                    <span className="text-xs font-medium text-muted-foreground">Category</span>
                    <select className={inputClass} value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>
                      <option value="">Uncategorized</option>
                      {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                    </select>
                  </label>
                  <Field label="Unit" value={form.unit} onChange={(unit) => setForm({ ...form, unit })} required />
                  <Field label="Price" type="number" value={form.price} onChange={(price) => setForm({ ...form, price })} required />
                  <Field label="Reorder level" type="number" value={form.reorderLevel} onChange={(reorderLevel) => setForm({ ...form, reorderLevel })} required />
                  <label className="block">
                    <span className="text-xs font-medium text-muted-foreground">Description</span>
                    <textarea className="mt-1 min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button type="submit" disabled={saving}><Save className="size-4" aria-hidden="true" />Save</Button>
                    <Button type="button" variant="destructive" disabled={saving || product.status === "ARCHIVED"} onClick={() => void archiveProduct()}><Archive className="size-4" aria-hidden="true" />Archive</Button>
                  </div>
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
      <div className="mt-2 text-lg font-semibold text-foreground">{value}</div>
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
