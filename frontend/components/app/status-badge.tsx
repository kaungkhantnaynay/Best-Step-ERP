import { cn } from "@/lib/utils";

const toneClasses: Record<string, string> = {
  Active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Healthy: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Reserved: "border-sky-200 bg-sky-50 text-sky-700",
  Assigned: "border-sky-200 bg-sky-50 text-sky-700",
  "In transit": "border-sky-200 bg-sky-50 text-sky-700",
  Packed: "border-indigo-200 bg-indigo-50 text-indigo-700",
  Draft: "border-slate-200 bg-slate-50 text-slate-700",
  Pending: "border-slate-200 bg-slate-50 text-slate-700",
  Watch: "border-amber-200 bg-amber-50 text-amber-700",
  "Low stock": "border-amber-200 bg-amber-50 text-amber-700",
  Low: "border-amber-200 bg-amber-50 text-amber-700",
  Delayed: "border-red-200 bg-red-50 text-red-700",
  Critical: "border-red-200 bg-red-50 text-red-700",
  Archived: "border-slate-200 bg-slate-50 text-slate-500",
  Cancelled: "border-red-200 bg-red-50 text-red-700",
  High: "border-red-200 bg-red-50 text-red-700",
  Medium: "border-amber-200 bg-amber-50 text-amber-700",
  Open: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Full: "border-indigo-200 bg-indigo-50 text-indigo-700",
};

export function StatusBadge({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full border px-2 text-xs font-medium",
        toneClasses[value] ?? "border-border bg-muted text-muted-foreground",
        className,
      )}
    >
      {value}
    </span>
  );
}
