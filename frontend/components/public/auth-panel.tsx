import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardList, PackageCheck, Route } from "lucide-react";

import { BrandMark } from "@/components/public/brand-mark";
import { Button } from "@/components/ui/button";

type AuthPanelProps = {
  mode: "login" | "register";
};

export function AuthPanel({ mode }: AuthPanelProps) {
  const isRegister = mode === "register";

  return (
    <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
      <div className="flex items-center justify-center">
        <div className="motion-reveal w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-8">
            <BrandMark compact />
          </div>
          <p className="text-sm font-medium text-primary">
            {isRegister ? "Create workspace" : "Welcome back"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {isRegister ? "Start your Best Step workspace" : "Sign in to Best Step"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {isRegister
              ? "Create the first organization profile. This is UI-only until the auth APIs are ready."
              : "Use the planned account flow. Authentication will be connected in a later backend phase."}
          </p>
          <form className="mt-8 space-y-5">
            {isRegister ? (
              <>
                <Field label="Full name" id="name" placeholder="Aye Chan" />
                <Field
                  label="Organization"
                  id="organization"
                  placeholder="Best Step Distribution"
                />
              </>
            ) : null}
            <Field label="Work email" id="email" type="email" placeholder="you@company.com" />
            <Field
              label="Password"
              id="password"
              type="password"
              placeholder="Enter your password"
            />
            {isRegister ? (
              <label className="flex gap-3 text-sm leading-6 text-muted-foreground">
                <input
                  type="checkbox"
                  className="mt-1 size-4 rounded border-border accent-primary"
                />
                <span>I agree to receive setup emails and accept the workspace terms.</span>
              </label>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <label className="flex items-center gap-2 text-muted-foreground">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-border accent-primary"
                  />
                  Remember me
                </label>
                <span className="font-medium text-primary">Forgot password?</span>
              </div>
            )}
            <Button type="button" size="lg" className="w-full gap-2">
              {isRegister ? "Create workspace" : "Sign in"}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isRegister ? "Already have an account?" : "New to Best Step?"}{" "}
            <Link
              href={isRegister ? "/login" : "/register"}
              className="font-semibold text-primary hover:underline"
            >
              {isRegister ? "Login" : "Create a workspace"}
            </Link>
          </p>
        </div>
      </div>
      <aside className="motion-reveal motion-delay-1 flex items-center">
        <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-primary">Product context</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            The account opens into an operations workspace.
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Best Step is designed around a clear sequence: know the stock, reserve
            the order, move the shipment, and keep the history visible.
          </p>
          <div className="mt-6 space-y-3">
            {[
              ["Inventory context", "Low stock, bin position, and movement history.", PackageCheck],
              ["Order workflow", "Reservation status, customer order, and fulfillment state.", ClipboardList],
              ["Shipment progress", "Assignment, carrier status, and tracking timeline.", Route],
            ].map(([title, description, Icon]) => (
              <div key={title as string} className="flex gap-3 rounded-xl border border-border bg-background p-3">
                <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-foreground">{title as string}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {description as string}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-2 rounded-full bg-muted px-3 py-2 text-xs text-muted-foreground">
            <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
            UI-only today. Backend auth and RBAC come later.
          </div>
        </div>
      </aside>
    </section>
  );
}

function Field({
  label,
  id,
  type = "text",
  placeholder,
}: {
  label: string;
  id: string;
  type?: string;
  placeholder: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
      />
    </div>
  );
}
