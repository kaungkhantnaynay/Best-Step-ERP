import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Step = {
  label: string;
  href: string;
  active?: boolean;
};

export function FirstRunCard({
  title,
  description,
  steps,
  action,
  icon: Icon,
}: {
  title: string;
  description: string;
  steps: Step[];
  action: { label: string; href: string };
  icon: LucideIcon;
}) {
  return (
    <section className="rounded-lg border border-dashed border-primary/40 bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Icon className="size-4 text-primary" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {steps.map((step, index) => (
              <Link
                key={`${step.label}-${step.href}-${index}`}
                href={step.href}
                className={[
                  "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium",
                  step.active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                <span>{index + 1}</span>
                {step.label}
              </Link>
            ))}
          </div>
        </div>
        <Link href={action.href} className={cn(buttonVariants({ size: "sm" }), "shrink-0")}>
          {action.label}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
