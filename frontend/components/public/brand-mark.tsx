import Link from "next/link";
import { Boxes } from "lucide-react";

import { cn } from "@/lib/utils";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2" aria-label="Best Step ERP home">
      <span
        className={cn(
          "flex items-center justify-center rounded-xl border border-border bg-card text-primary shadow-sm",
          compact ? "size-8" : "size-9",
        )}
      >
        <Boxes className="size-4" aria-hidden="true" />
      </span>
      <span className={cn("flex flex-col leading-none", compact && "hidden sm:flex")}>
        <span className="text-sm font-semibold tracking-wide text-foreground">
          Best Step
        </span>
        <span className="text-xs font-medium text-muted-foreground">
          Logistics ERP
        </span>
      </span>
    </Link>
  );
}
