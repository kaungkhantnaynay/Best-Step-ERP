import type { LucideIcon } from "lucide-react";

import type { Kpi } from "@/lib/app-types";
import { cn } from "@/lib/utils";

const toneClasses = {
  positive: "text-emerald-700 bg-emerald-50",
  warning: "text-amber-700 bg-amber-50",
  neutral: "text-muted-foreground bg-muted",
};

export function KpiCard({ item, icon: Icon }: { item: Kpi; icon: LucideIcon }) {
  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {item.value}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background p-2 text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </div>
      </div>
      <div
        className={cn(
          "mt-4 inline-flex rounded-full px-2 py-1 text-xs font-medium",
          toneClasses[item.tone],
        )}
      >
        {item.change}
      </div>
    </article>
  );
}
