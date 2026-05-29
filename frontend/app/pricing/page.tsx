import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  PricingCards,
  PricingComparison,
  SectionHeading,
} from "@/components/public/marketing-sections";
import { PublicShell } from "@/components/public/public-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function PricingPage() {
  return (
    <PublicShell>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <SectionHeading
            eyebrow="Pricing"
            title="Plans for teams moving from spreadsheet work to ERP discipline."
            description="Pick a starting point for the static prototype. Real billing, upgrade prompts, and locked feature handling come later."
          />
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm font-semibold text-foreground">
              Implementation-first pricing
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Best Step is planned around product, warehouse, order, shipment,
              and analytics workflows. Start with the tier that matches the
              operational complexity you want to show.
            </p>
            <Link
              href="/register"
              className={cn(buttonVariants({ size: "lg" }), "mt-5 gap-2")}
            >
              Create workspace
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className="mt-10">
          <PricingCards />
        </div>
        <div className="mt-10">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            Compare planned capabilities
          </h2>
          <PricingComparison />
        </div>
      </section>
    </PublicShell>
  );
}
