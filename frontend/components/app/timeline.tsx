import { CircleCheck } from "lucide-react";

import { StatusBadge } from "@/components/app/status-badge";
import type { TimelineEvent } from "@/lib/app-types";

export function Timeline({
  title,
  items,
}: {
  title: string;
  items: TimelineEvent[];
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <div className="mt-4 space-y-4">
        {items.map((item) => (
          <div key={item.id} className="grid grid-cols-[24px_1fr] gap-3">
            <div className="flex flex-col items-center">
              <CircleCheck className="size-4 text-primary" aria-hidden="true" />
              <span className="mt-1 h-full w-px bg-border" />
            </div>
            <div className="min-w-0 pb-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <span className="text-xs text-muted-foreground">{item.time}</span>
              </div>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
              {item.status ? <StatusBadge value={item.status} className="mt-2" /> : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
