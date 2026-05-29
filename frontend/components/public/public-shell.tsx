import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { BrandMark } from "@/components/public/brand-mark";
import { buttonVariants } from "@/components/ui/button";
import { navLinks } from "@/lib/public-content";
import { cn } from "@/lib/utils";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />
      <main>{children}</main>
      <PublicFooter />
    </div>
  );
}

function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <BrandMark />
        <nav className="hidden items-center gap-6 md:flex" aria-label="Public navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden sm:inline-flex")}
          >
            Login
          </Link>
          <Link
            href="/register"
            className={cn(
              buttonVariants({ size: "sm" }),
              "gap-1.5",
            )}
          >
            Start free
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function PublicFooter() {
  const footerGroups = [
    {
      title: "Product",
      links: ["Inventory", "Warehouses", "Orders", "Shipments"],
    },
    {
      title: "Company",
      links: ["Pricing", "Implementation", "Security", "Support"],
    },
  ];

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div className="space-y-4">
          <BrandMark />
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">
            A practical ERP foundation for logistics teams managing stock,
            orders, warehouses, shipments, and reporting in one place.
          </p>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
            Planned around JWT auth, refresh tokens, RBAC, and tenant-scoped data.
          </div>
        </div>
        {footerGroups.map((group) => (
          <div key={group.title}>
            <h2 className="text-sm font-semibold text-foreground">{group.title}</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {group.links.map((link) => (
                <li key={link}>
                  <span>{link}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}
