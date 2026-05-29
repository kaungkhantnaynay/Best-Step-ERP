import Link from "next/link";
import {
  ArrowRight,
  Check,
  ClipboardList,
  FileClock,
  PackageCheck,
  Route,
  Search,
  ShieldCheck,
  Warehouse,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  comparisonRows,
  modules,
  plans,
  testimonials,
} from "@/lib/public-content";
import { cn } from "@/lib/utils";

const productPillars = [
  {
    title: "Centralize operations",
    description:
      "Bring products, stock, warehouses, orders, and shipments into one workspace.",
    icon: PackageCheck,
  },
  {
    title: "See what changed",
    description:
      "Follow stock movements, order updates, shipment events, and operational history.",
    icon: FileClock,
  },
  {
    title: "Move order to shipment",
    description:
      "Keep fulfillment steps visible from reservation through delivery progress.",
    icon: Route,
  },
  {
    title: "Trust operational context",
    description:
      "Plan around tenant-scoped data, clear permissions, and audit-ready workflows.",
    icon: ShieldCheck,
  },
];

export function HeroSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 pt-14 text-center sm:px-6 lg:px-8 lg:pb-20 lg:pt-20">
      <div className="motion-reveal mx-auto max-w-4xl">
        <p className="text-sm font-medium text-primary">
          Logistics ERP for focused teams
        </p>
        <h1 className="mt-4 text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
          Understand your operations.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
          Best Step turns inventory, warehouse, order, and shipment activity
          into a clear operating view for logistics teams.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className={cn(buttonVariants({ size: "lg" }), "gap-2")}
          >
            Try Best Step
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link
            href="/pricing"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            View plans
          </Link>
        </div>
      </div>
      <ProductPreview />
    </section>
  );
}

function ProductPreview() {
  return (
    <div className="motion-reveal motion-delay-1 mx-auto mt-12 max-w-5xl rounded-2xl border border-border bg-card p-3 shadow-sm">
      <div className="overflow-hidden rounded-xl border border-border bg-background text-left">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-destructive" />
            <span className="size-3 rounded-full bg-chart-3" />
            <span className="size-3 rounded-full bg-chart-2" />
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground sm:flex">
            <Search className="size-3.5" aria-hidden="true" />
            Search SKU, order, or shipment
          </div>
        </div>
        <div className="grid gap-0 lg:grid-cols-[220px_1fr]">
          <aside className="border-b border-border bg-card p-4 lg:border-b-0 lg:border-r">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Workspace
            </p>
            <div className="mt-4 space-y-2">
              {["Dashboard", "Inventory", "Orders", "Shipments"].map((item, index) => (
                <div
                  key={item}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm",
                    index === 0
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {item}
                </div>
              ))}
            </div>
          </aside>
          <div className="p-4 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Orders", "86", "+12 today"],
                ["Inventory value", "$284k", "4 warehouses"],
                ["Shipments", "22", "In transit"],
              ].map(([label, value, note]) => (
                <div key={label} className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{note}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground">
                    Recent movement
                  </h2>
                  <span className="text-xs text-muted-foreground">Today</span>
                </div>
                <div className="space-y-3">
                  {[
                    ["SKU-BS-118 reserved", "Order #1042"],
                    ["Transfer completed", "North Dock to Bin A-4"],
                    ["Shipment assigned", "Tracking #MM-4930"],
                  ].map(([title, note]) => (
                    <div key={title} className="flex items-center gap-3">
                      <span className="size-2 rounded-full bg-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{title}</p>
                        <p className="text-xs text-muted-foreground">{note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <h2 className="text-sm font-semibold text-foreground">At a glance</h2>
                <div className="mt-4 space-y-3">
                  {["12 low-stock items", "94% on-time shipments", "4 active warehouses"].map(
                    (item) => (
                      <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="size-4 text-primary" aria-hidden="true" />
                        <span>{item}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ModulesSection() {
  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Core workspace"
          title="Everything your operations team needs to check first."
          description="Simple public pages. Product-led previews. The app itself stays clean, dense, and practical."
          centered
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {modules.map((module, index) => {
            const Icon = [PackageCheck, Warehouse, ClipboardList, Route][index];

            return (
              <article key={module.title} className="craft-card rounded-xl border border-border bg-background p-5">
                <Icon className="size-5 text-primary" aria-hidden="true" />
                <h3 className="mt-4 text-base font-semibold text-foreground">{module.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {module.description}
                </p>
                <p className="mt-4 text-sm font-medium text-primary">{module.stat}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function FeaturesSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="How it helps"
        title="From scattered updates to one operating picture."
        description="Best Step is planned around the daily flow of stock, orders, warehouse activity, and shipment progress."
        centered
      />
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {productPillars.map((feature) => {
          const Icon = feature.icon;

          return (
            <article key={feature.title} className="rounded-xl border border-border bg-card p-5">
              <Icon className="size-5 text-primary" aria-hidden="true" />
              <h3 className="mt-4 text-base font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {feature.description}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function SocialProofSection() {
  return (
    <section className="bg-card">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="What teams notice"
          title="A calmer way to read operational work."
          description="Placeholder proof points for the portfolio phase, ready to replace with real customers or screenshots."
          centered
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {testimonials.map((item) => (
            <figure key={item.name} className="rounded-xl border border-border bg-background p-6">
              <blockquote className="text-base leading-7 text-foreground">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-4 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{item.name}</span>
                {" / "}
                {item.company}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PricingCards({ compact = false }: { compact?: boolean }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {plans.map((plan) => (
        <article
          key={plan.name}
          className={cn(
            "rounded-xl border bg-card p-6",
            plan.featured ? "border-primary shadow-sm" : "border-border",
          )}
        >
          {plan.featured ? (
            <span className="mb-4 inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-medium text-primary">
              Recommended
            </span>
          ) : null}
          <h2 className="text-lg font-semibold text-foreground">{plan.name}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{plan.description}</p>
          <div className="mt-5 flex items-end gap-1">
            <span className="text-3xl font-semibold text-foreground">{plan.price}</span>
            {plan.price !== "Custom" ? (
              <span className="pb-1 text-sm text-muted-foreground">/mo</span>
            ) : null}
          </div>
          <Link
            href={plan.name === "Scale" ? "/login" : "/register"}
            className={cn(
              buttonVariants({
                variant: plan.featured ? "default" : "outline",
                size: "lg",
              }),
              "mt-5 w-full",
            )}
          >
            {plan.cta}
          </Link>
          <ul className={cn("space-y-3", compact ? "mt-5" : "mt-6")}>
            {plan.features.map((feature) => (
              <li key={feature} className="flex gap-2 text-sm text-muted-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

export function PricingComparison() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="grid grid-cols-4 border-b border-border bg-muted px-4 py-3 text-sm font-semibold text-foreground">
        <span>Capability</span>
        <span>Starter</span>
        <span>Operations</span>
        <span>Scale</span>
      </div>
      {comparisonRows.map((row) => (
        <div
          key={row[0]}
          className="grid grid-cols-4 gap-3 border-b border-border px-4 py-3 text-sm last:border-b-0"
        >
          {row.map((cell, index) => (
            <span
              key={`${row[0]}-${cell}`}
              className={index === 0 ? "font-medium text-foreground" : "text-muted-foreground"}
            >
              {cell}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export function FinalCta() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-border bg-card p-8 text-center sm:p-10">
        <p className="text-sm font-medium text-primary">Ready to organize the flow?</p>
        <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-foreground">
          Create the public entry point now, then build the ERP workspace next.
        </h2>
        <div className="mt-7 flex justify-center">
          <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
            Try Best Step
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  centered = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  centered?: boolean;
}) {
  return (
    <div className={cn("max-w-3xl", centered && "mx-auto text-center")}>
      <p className="text-sm font-medium text-primary">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      <p className="mt-3 text-base leading-7 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
