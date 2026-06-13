"use client";

import Link from "next/link";
import { Archive, Edit2, Eye, Package, Plus, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DataColumn } from "@/components/app/data-table";
import { DataTable } from "@/components/app/data-table";
import { FirstRunCard } from "@/components/app/first-run-card";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  ApiError,
  apiRequest,
  type CategoryResponse,
  type ProductListResponse,
  type ProductMutation,
  type ProductResponse,
  type ProductStatus,
} from "@/lib/api";

const pageSize = 10;

type FormState = {
  id?: string;
  name: string;
  sku: string;
  description: string;
  categoryId: string;
  unit: string;
  price: string;
  reorderLevel: string;
  status: ProductStatus;
};

const emptyForm: FormState = {
  name: "",
  sku: "",
  description: "",
  categoryId: "",
  unit: "each",
  price: "0",
  reorderLevel: "0",
  status: "ACTIVE",
};

function toMutation(form: FormState): ProductMutation {
  return {
    name: form.name,
    sku: form.sku || undefined,
    description: form.description || null,
    categoryId: form.categoryId || null,
    unit: form.unit,
    price: Number(form.price),
    reorderLevel: Number(form.reorderLevel),
    status: form.status,
  };
}

function toForm(product: ProductResponse): FormState {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    description: product.description ?? "",
    categoryId: product.category?.id ?? "",
    unit: product.unit,
    price: String(product.price),
    reorderLevel: String(product.reorderLevel),
    status: product.status,
  };
}

export default function ProductsPage() {
  const { accessToken, loading: authLoading, refreshSession } = useAuth();
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | ProductStatus>("all");
  const [categoryId, setCategoryId] = useState("");
  const [lowStock, setLowStock] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestWithAuth = useCallback(
    async <T,>(path: string, options: RequestInit = {}) => {
      const token = accessToken ?? (await refreshSession());

      if (!token) throw new ApiError(401, "Please sign in to manage products", "AUTH_REQUIRED");

      return apiRequest<T>(path, { ...options, accessToken: token });
    },
    [accessToken, refreshSession],
  );

  const loadProducts = useCallback(async () => {
    if (authLoading) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });

      if (search) params.set("search", search);
      if (status !== "all") params.set("status", status);
      if (categoryId) params.set("categoryId", categoryId);
      if (lowStock) params.set("lowStock", "true");

      const [productResult, categoryResult] = await Promise.all([
        requestWithAuth<ProductListResponse>(`/products?${params.toString()}`),
        requestWithAuth<{ data: CategoryResponse[] }>("/categories"),
      ]);

      setProducts(productResult.data);
      setCategories(categoryResult.data);
      setTotal(productResult.pagination.total);
      setTotalPages(Math.max(productResult.pagination.totalPages, 1));
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Unable to load products");
    } finally {
      setLoading(false);
    }
  }, [authLoading, categoryId, lowStock, page, requestWithAuth, search, status]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadProducts();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadProducts]);

  const archiveProduct = useCallback(
    async (product: ProductResponse) => {
      if (!window.confirm(`Archive ${product.name}?`)) return;

      try {
        await requestWithAuth(`/products/${product.id}`, { method: "DELETE" });
        await loadProducts();
      } catch (caughtError) {
        setError(caughtError instanceof ApiError ? caughtError.message : "Unable to archive product");
      }
    },
    [loadProducts, requestWithAuth],
  );

  const productColumns = useMemo<DataColumn<ProductResponse>[]>(
    () => [
      {
        header: "Product",
        cell: (product) => (
          <div>
            <Link href={`/app/products/${product.id}`} className="font-medium text-foreground hover:text-primary hover:underline">{product.name}</Link>
            <p className="text-xs text-muted-foreground">{product.sku}</p>
          </div>
        ),
      },
      { header: "Category", cell: (product) => product.category?.name ?? "Uncategorized" },
      { header: "Status", cell: (product) => <StatusBadge value={product.stockStatus} /> },
      { header: "Locations", cell: (product) => product.locationSummary },
      { header: "Stock", cell: (product) => `${product.stockQuantity} / ${product.reorderLevel}`, className: "text-right" },
      { header: "Value", cell: (product) => `$${product.inventoryValue.toLocaleString()}`, className: "text-right" },
      {
        header: "Actions",
        cell: (product) => (
          <div className="flex justify-end gap-2">
            <Link href={`/app/products/${product.id}`} className="inline-flex size-7 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground">
              <Eye className="size-3.5" aria-hidden="true" />
              <span className="sr-only">View {product.name}</span>
            </Link>
            <Button type="button" variant="outline" size="icon-sm" onClick={() => setForm(toForm(product))}>
              <Edit2 className="size-3.5" aria-hidden="true" />
              <span className="sr-only">Edit {product.name}</span>
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="icon-sm"
              disabled={product.status === "ARCHIVED"}
              onClick={() => void archiveProduct(product)}
            >
              <Archive className="size-3.5" aria-hidden="true" />
              <span className="sr-only">Archive {product.name}</span>
            </Button>
          </div>
        ),
        className: "text-right",
      },
    ],
    [archiveProduct],
  );

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await requestWithAuth(form.id ? `/products/${form.id}` : "/products", {
        method: form.id ? "PATCH" : "POST",
        body: JSON.stringify(toMutation(form)),
      });
      setForm(emptyForm);
      await loadProducts();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Unable to save product");
    } finally {
      setSaving(false);
    }
  }

  async function saveCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!categoryName.trim()) return;

    try {
      const result = await requestWithAuth<{ data: CategoryResponse }>("/categories", {
        method: "POST",
        body: JSON.stringify({ name: categoryName }),
      });
      setCategories((current) => [...current, result.data].sort((a, b) => a.name.localeCompare(b.name)));
      setForm((current) => ({ ...current, categoryId: result.data.id }));
      setCategoryName("");
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Unable to create category");
    }
  }

  if (!authLoading && !accessToken) {
    return (
      <>
        <PageHeader eyebrow="Product catalog" title="Products, SKUs, categories, and reorder context" description="Sign in to load tenant-scoped product data." icon={Package} />
        <div className="p-4 sm:p-6">
          <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            Product data requires an authenticated workspace session.{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Product catalog" title="Products, SKUs, categories, and reorder context" description="Tenant-scoped product CRUD backed by the Best Step API." action="New product" icon={Package} />
      <div className="grid gap-5 p-4 sm:p-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 shadow-sm lg:flex-row lg:items-center">
            <input className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20" placeholder="Search by product, SKU, or category" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
            <select className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20" value={status} onChange={(event) => { setStatus(event.target.value as "all" | ProductStatus); setPage(1); }}>
              <option value="all">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <select className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20" value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setPage(1); }}>
              <option value="">All categories</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            <Button type="button" variant={lowStock ? "default" : "outline"} size="sm" onClick={() => { setLowStock((value) => !value); setPage(1); }}>Low stock</Button>
            <Button type="button" variant="outline" size="icon" onClick={() => void loadProducts()}>
              <RefreshCw className="size-4" aria-hidden="true" />
              <span className="sr-only">Refresh products</span>
            </Button>
          </div>
          {error ? <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}
          {loading || authLoading ? (
            <div className="rounded-lg border border-border bg-card px-4 py-8 text-sm text-muted-foreground">Loading products...</div>
          ) : products.length === 0 && !search && status === "all" && !categoryId && !lowStock ? (
            <FirstRunCard
              title="Create products after your first warehouse bin"
              description="Use the operational setup path so stock can land in a real location before orders reserve it."
              icon={Package}
              action={{ label: "Create product", href: "/app/products" }}
              steps={[
                { label: "Warehouse", href: "/app/warehouses" },
                { label: "Bin", href: "/app/warehouses" },
                { label: "Product", href: "/app/products", active: true },
                { label: "Stock in", href: "/app/inventory" },
                { label: "Order", href: "/app/orders" },
                { label: "Shipment", href: "/app/shipments" },
              ]}
            />
          ) : products.length === 0 ? (
            <div className="rounded-lg border border-border bg-card px-4 py-8 text-sm text-muted-foreground">No products match the current filters.</div>
          ) : (
            <DataTable columns={productColumns} rows={products} getRowKey={(product) => product.id} />
          )}
          <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center">
            <span>Page {page} of {totalPages} · {total} products</span>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => Math.max(value - 1, 1))}>Previous</Button>
              <Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button>
            </div>
          </div>
        </div>
        <aside className="space-y-4">
          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground">{form.id ? "Edit product" : "Create product"}</h2>
            <form className="mt-4 space-y-3" onSubmit={saveProduct}>
              <ProductField label="Product name" value={form.name} onChange={(name) => setForm({ ...form, name })} required />
              <ProductField label="SKU" value={form.sku} onChange={(sku) => setForm({ ...form, sku })} placeholder="Auto-generated if blank" />
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Category</span>
                <select className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20" value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>
                  <option value="">Uncategorized</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>
              <ProductField label="Unit" value={form.unit} onChange={(unit) => setForm({ ...form, unit })} required />
              <ProductField label="Price" type="number" value={form.price} onChange={(price) => setForm({ ...form, price })} required />
              <ProductField label="Reorder level" type="number" value={form.reorderLevel} onChange={(reorderLevel) => setForm({ ...form, reorderLevel })} required />
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Description</span>
                <textarea className="mt-1 min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              </label>
              <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                <Button type="submit" className="w-full sm:w-fit" disabled={saving}><Plus className="size-3.5" aria-hidden="true" />{saving ? "Saving..." : form.id ? "Update" : "Create"}</Button>
                <Button type="button" variant="outline" className="w-full sm:w-fit" onClick={() => setForm(emptyForm)}>Clear</Button>
              </div>
            </form>
          </section>
          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground">New category</h2>
            <form className="mt-4 flex gap-2" onSubmit={saveCategory}>
              <input className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20" placeholder="Packaging" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} />
              <Button type="submit" size="sm">Add</Button>
            </form>
          </section>
        </aside>
      </div>
    </>
  );
}

function ProductField({ label, value, onChange, type = "text", placeholder, required }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20" placeholder={placeholder} type={type} value={value} required={required} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
