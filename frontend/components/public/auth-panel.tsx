"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, ClipboardList, PackageCheck, Route } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { BrandMark } from "@/components/public/brand-mark";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";

type AuthPanelProps = { mode: "login" | "register" };

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function AuthPanel({ mode }: AuthPanelProps) {
  const isRegister = mode === "register";
  const router = useRouter();
  const { login, register } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<Array<{ path: string; message: string }>>([]);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setErrorDetails([]);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      if (isRegister) {
        const organizationName = String(formData.get("organizationName") ?? "");

        await register({
          organizationName,
          organizationSlug: String(formData.get("organizationSlug") ?? "") || slugify(organizationName),
          name: String(formData.get("name") ?? ""),
          email,
          password,
        });
      } else {
        await login({ email, password });
      }

      router.push("/app/products");
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setError(caughtError.message);
        setErrorDetails(caughtError.details ?? []);
      } else {
        setError("Authentication failed");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
      <div className="flex items-center justify-center">
        <div className="motion-reveal w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-8">
            <BrandMark compact />
          </div>
          <p className="text-sm font-medium text-primary">{isRegister ? "Create workspace" : "Welcome back"}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {isRegister ? "Start your Best Step workspace" : "Sign in to Best Step"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {isRegister
              ? "Create the first organization owner account and open the operations workspace."
              : "Sign in to manage products, inventory, orders, and shipments."}
          </p>
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {isRegister ? (
              <>
                <Field label="Full name" id="name" name="name" placeholder="Aye Chan" minLength={2} required />
                <Field
                  label="Organization"
                  id="organizationName"
                  name="organizationName"
                  placeholder="Best Step Distribution"
                  minLength={2}
                  required
                />
                <Field
                  label="Workspace slug"
                  id="organizationSlug"
                  name="organizationSlug"
                  placeholder="best-step-distribution"
                  minLength={3}
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  title="Use lowercase letters, numbers, and hyphens."
                />
              </>
            ) : null}
            <Field label="Work email" id="email" name="email" type="email" placeholder="you@company.com" required />
            <Field
              label="Password"
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              minLength={8}
              pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,128}"
              title="Use 8 or more characters with lowercase, uppercase, and a number."
              required
            />
            {isRegister ? (
              <label className="flex gap-3 text-sm leading-6 text-muted-foreground">
                <input type="checkbox" required className="mt-1 size-4 rounded border-border accent-primary" />
                <span>I agree to receive setup emails and accept the workspace terms.</span>
              </label>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <label className="flex items-center gap-2 text-muted-foreground">
                  <input type="checkbox" className="size-4 rounded border-border accent-primary" />
                  Remember me
                </label>
                <span className="font-medium text-primary">Forgot password?</span>
              </div>
            )}
            {error ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            {errorDetails.length > 0 ? (
              <ul className="space-y-1 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errorDetails.map((detail) => (
                  <li key={`${detail.path}-${detail.message}`}>
                    {detail.path ? `${detail.path}: ` : ""}
                    {detail.message}
                  </li>
                ))}
              </ul>
            ) : null}
            <Button type="submit" size="lg" className="w-full gap-2" disabled={pending}>
              {pending ? "Working..." : isRegister ? "Create workspace" : "Sign in"}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isRegister ? "Already have an account?" : "New to Best Step?"}{" "}
            <Link href={isRegister ? "/login" : "/register"} className="font-semibold text-primary hover:underline">
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
            Best Step is designed around a clear sequence: know the stock, reserve the order, move the shipment, and keep the history visible.
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
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{description as string}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-2 rounded-full bg-muted px-3 py-2 text-xs text-muted-foreground">
            <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
            JWT auth, refresh cookies, and RBAC are active.
          </div>
        </div>
      </aside>
    </section>
  );
}

function Field({
  label,
  id,
  name,
  type = "text",
  placeholder,
  minLength,
  pattern,
  title,
  required,
}: {
  label: string;
  id: string;
  name: string;
  type?: string;
  placeholder: string;
  minLength?: number;
  pattern?: string;
  title?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        minLength={minLength}
        pattern={pattern}
        title={title}
        required={required}
        className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
      />
    </div>
  );
}
