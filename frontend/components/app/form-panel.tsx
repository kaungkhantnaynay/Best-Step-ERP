import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

export function FormPanel({
  title,
  description,
  children,
  action = "Save draft",
}: {
  title: string;
  description: string;
  children: ReactNode;
  action?: string;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      <form className="mt-4 space-y-3">
        {children}
        <div className="flex flex-col gap-2 pt-1 sm:flex-row">
          <Button type="button" className="w-full sm:w-fit">
            {action}
          </Button>
          <Button type="button" variant="outline" className="w-full sm:w-fit">
            Clear
          </Button>
        </div>
      </form>
    </section>
  );
}

export function Field({
  label,
  placeholder,
  type = "text",
}: {
  label: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
        placeholder={placeholder}
        type={type}
      />
    </label>
  );
}

export function SelectField({
  label,
  options,
}: {
  label: string;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <select className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20">
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
