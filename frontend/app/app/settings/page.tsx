"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, RefreshCw, Settings, ShieldCheck, UserRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { ApiError, apiRequest, type AuthUser } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import { useAuthenticatedRequest } from "@/lib/use-authenticated-request";

export default function SettingsPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const { accessToken, authLoading, requestWithAuth } = useAuthenticatedRequest();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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
      </div>
    </>
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
