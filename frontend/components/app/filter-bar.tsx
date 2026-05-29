import type { LucideIcon } from "lucide-react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";

export function FilterBar({
  searchPlaceholder,
  filters,
  actionLabel,
  actionIcon: ActionIcon,
}: {
  searchPlaceholder: string;
  filters: string[];
  actionLabel?: string;
  actionIcon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">Search</span>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
          placeholder={searchPlaceholder}
          type="search"
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((filter) => (
          <Button key={filter} type="button" variant="outline" size="sm">
            {filter}
          </Button>
        ))}
        {actionLabel ? (
          <Button type="button" size="sm" className="gap-1.5">
            {ActionIcon ? <ActionIcon className="size-3.5" aria-hidden="true" /> : null}
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
