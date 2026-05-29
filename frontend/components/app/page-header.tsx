import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border bg-card px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
          {Icon ? <Icon className="size-4" aria-hidden="true" /> : null}
          <span>{eyebrow}</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {action ? (
        <Button type="button" className="w-full sm:w-fit">
          {action}
        </Button>
      ) : null}
    </div>
  );
}
