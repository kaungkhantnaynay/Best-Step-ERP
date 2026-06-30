"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, RefreshCw, Settings, ShieldCheck, UserPlus, UserRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import {
  ApiError,
  apiRequest,
  type AdminUserCreateMutation,
  type AdminUserResponse,
  type AuthUser,
} from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import { useAuthenticatedRequest } from "@/lib/use-authenticated-request";

const emptyAdminForm = {
  name: "",
  email: "",
  password: "",
};

export default function SettingsPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const { accessToken, authLoading, requestWithAuth } = useAuthenticatedRequest();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adminForm, setAdminForm] = useState(emptyAdminForm);
  const [createdAdmin, setCreatedAdmin] = useState<AdminUserResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadAccount = useCallback(async () => {
    if (authLoading) return;
    setLoading(true);
    setError(null);

    try {
      const result = await requestWithAuth<{ data: { user: AuthUser } }>("/auth/me");
      setUser(result.data.user);
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Unable to load account settings");
    } finally {
      setLoading(false);
    }
  }, [authLoading, requestWithAuth]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadAccount();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadAccount]);

  async function handleLogout() {
    setSaving(true);
    setError(null);

    try {
      await logout();
      router.push("/login");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoutAll() {
    if (!accessToken) {
      await handleLogout();
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await apiRequest<{ data: { success: boolean; revokedCount: number } }>("/auth/logout-all", {
        method: "POST",
        accessToken,
      });
      await logout();
      router.push("/login");
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Unable to log out all sessions");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateAdmin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setCreatedAdmin(null);

    const payload: AdminUserCreateMutation = {
      name: adminForm.name,
      email: adminForm.email,
      password: adminForm.password,
    };

    try {
      const result = await requestWithAuth<{ data: AdminUserResponse }>("/users/admin", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setCreatedAdmin(result.data);
      setAdminForm(emptyAdminForm);
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Unable to create admin account");
      setAdminForm((current) => ({ ...current, password: "" }));
    } finally {
      setSaving(false);
    }
  }

  const canCreateAdmin = user?.permissions.includes("users.admin.create") ?? false;

  if (!authLoading && !accessToken) {
    return (
      <>
        <PageHeader
          eyebrow="Account settings"
          title="Sign in to manage your account"
          description="Your account settings require an authenticated Best Step session."
          icon={Settings}
        />
        <div className="p-4 sm:p-6">
          <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>{" "}
            to view account settings.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Account settings"
        title="User account"
        description="Review your workspace identity, role access, and active session controls."
        icon={Settings}
      />
      <div className="space-y-5 p-4 sm:p-6">
        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        {loading ? (
          <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            Loading account settings...
          </div>
        ) : null}
        <section className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <UserRound className="size-4 text-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-foreground">Profile</h2>
            </div>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <InfoItem label="Name" value={user?.name ?? "-"} />
              <InfoItem label="Email" value={user?.email ?? "-"} />
              <InfoItem label="Organization" value={user?.organizationName ?? "-"} />
              <InfoItem label="Organization ID" value={user?.organizationId ?? "-"} />
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => void loadAccount()} disabled={loading || saving}>
                <RefreshCw className="mr-2 size-4" aria-hidden="true" />
                Refresh
              </Button>
              <Button type="button" variant="outline" onClick={handleLogout} disabled={saving}>
                <LogOut className="mr-2 size-4" aria-hidden="true" />
                Log out
              </Button>
              <Button type="button" variant="destructive" onClick={handleLogoutAll} disabled={saving}>
                Log out all sessions
              </Button>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-foreground">Access</h2>
            </div>
            <div className="mt-4 space-y-4">
              <TagGroup label="Roles" values={user?.roles ?? []} empty="No roles assigned." />
              <TagGroup label="Permissions" values={user?.permissions ?? []} empty="No permissions assigned." />
            </div>
          </div>
        </section>
        {canCreateAdmin ? (
          <section className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <UserPlus className="size-4 text-primary" aria-hidden="true" />
                <h2 className="text-sm font-semibold text-foreground">Create admin account</h2>
              </div>
              <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={handleCreateAdmin}>
                <AdminField
                  label="Name"
                  id="admin-name"
                  value={adminForm.name}
                  onChange={(value) => setAdminForm((current) => ({ ...current, name: value }))}
                  autoComplete="name"
                />
                <AdminField
                  label="Email"
                  id="admin-email"
                  type="email"
                  value={adminForm.email}
                  onChange={(value) => setAdminForm((current) => ({ ...current, email: value }))}
                  autoComplete="email"
                />
                <AdminField
                  label="Temporary password"
                  id="admin-password"
                  type="password"
                  value={adminForm.password}
                  onChange={(value) => setAdminForm((current) => ({ ...current, password: value }))}
                  autoComplete="new-password"
                  className="sm:col-span-2"
                />
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={saving}>
                    <UserPlus className="mr-2 size-4" aria-hidden="true" />
                    Create admin
                  </Button>
                </div>
              </form>
            </div>
            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-foreground">Created admin</h2>
              {createdAdmin ? (
                <dl className="mt-4 grid gap-3">
                  <InfoItem label="Name" value={createdAdmin.name} />
                  <InfoItem label="Email" value={createdAdmin.email} />
                  <InfoItem label="Roles" value={createdAdmin.roles.join(", ")} />
                  <InfoItem label="Created" value={new Date(createdAdmin.createdAt).toLocaleString()} />
                </dl>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  Newly created admin account details will appear here after submission.
                </p>
              )}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}

function AdminField({
  label,
  id,
  value,
  onChange,
  type = "text",
  autoComplete,
  className = "",
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  className?: string;
}) {
  return (
    <label className={`block text-sm ${className}`} htmlFor={id}>
      <span className="font-medium text-foreground">{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        required
        className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

function TagGroup({ label, values, empty }: { label: string; values: string[]; empty: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          values.map((value) => (
            <span
              key={value}
              className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground"
            >
              {value}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
