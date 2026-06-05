"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  Package,
  PanelLeft,
  Route,
  Search,
  Settings,
  Warehouse,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/products", label: "Products", icon: Package },
  { href: "/app/inventory", label: "Inventory", icon: Boxes },
  { href: "/app/warehouses", label: "Warehouses", icon: Warehouse },
  { href: "/app/orders", label: "Orders", icon: ClipboardList },
  { href: "/app/shipments", label: "Shipments", icon: Route },
  { href: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/app/notifications", label: "Notifications", icon: Bell },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-border bg-card lg:block">
          <div className="sticky top-0 flex h-screen flex-col">
            <div className="flex h-16 items-center gap-3 border-b border-border px-5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
                BS
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Best Step ERP</p>
                <p className="text-xs text-muted-foreground">Operations workspace</p>
              </div>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4" aria-label="App navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === "/app"
                    ? pathname === item.href
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-border p-3">
              <div className="rounded-lg border border-border bg-background p-3">
                <p className="text-xs font-semibold text-foreground">API-backed workspace</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Auth, RBAC, and product catalog APIs are wired.
                </p>
              </div>
            </div>
          </div>
        </aside>
        <div className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-xl">
            <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
              <Button type="button" variant="outline" size="icon" className="lg:hidden">
                <PanelLeft className="size-4" aria-hidden="true" />
                <span className="sr-only">Open navigation</span>
              </Button>
              <label className="relative hidden min-w-0 max-w-md flex-1 sm:block">
                <span className="sr-only">Search workspace</span>
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
                  placeholder="Search SKU, order, shipment..."
                  type="search"
                />
              </label>
              <div className="ml-auto flex items-center gap-2">
                <Button type="button" variant="outline" size="icon">
                  <Bell className="size-4" aria-hidden="true" />
                  <span className="sr-only">Notifications</span>
                </Button>
                <Button type="button" variant="outline" size="icon">
                  <Settings className="size-4" aria-hidden="true" />
                  <span className="sr-only">Settings</span>
                </Button>
                <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-xs font-semibold text-foreground">
                  OP
                </div>
              </div>
            </div>
            <nav
              className="flex gap-2 overflow-x-auto border-t border-border px-4 py-2 lg:hidden"
              aria-label="Mobile app navigation"
            >
              {navItems.map((item) => {
                const active =
                  item.href === "/app"
                    ? pathname === item.href
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-muted-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </header>
          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
