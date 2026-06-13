"use client";

import Link from "next/link";
import { Filter, RefreshCw, ScrollText } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DataColumn } from "@/components/app/data-table";
import { DataTable } from "@/components/app/data-table";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { ApiError, type AuditLogResponse, type Pagination } from "@/lib/api";
import { useAuthenticatedRequest } from "@/lib/use-authenticated-request";

const inputClass = "h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20";

export default function AuditLogsPage() {
  const { accessToken, authLoading, requestWithAuth } = useAuthenticatedRequest();
  const [logs, setLogs] = useState<AuditLogResponse[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [entityType, setEntityType] = useState("");
  const [entityId, setEntityId] = useState("");
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    if (authLoading) return;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ page: String(page), limit: "25" });
      if (entityType) params.set("entityType", entityType);
      if (entityId) params.set("entityId", entityId);
      if (action) params.set("action", action);
      const result = await requestWithAuth<{ data: AuditLogResponse[]; pagination: Pagination }>(`/audit-logs?${params.toString()}`);

      setLogs(result.data);
      setPagination(result.pagination);
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Unable to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [action, authLoading, entityId, entityType, page, requestWithAuth]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadLogs();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadLogs]);

  const columns = useMemo<DataColumn<AuditLogResponse>[]>(
    () => [
      { header: "Time", cell: (log) => new Date(log.createdAt).toLocaleString() },
      { header: "Action", cell: (log) => <span className="font-medium text-foreground">{log.action}</span> },
      { header: "Entity", cell: (log) => `${log.entityType} / ${log.entityId}` },
      { header: "User", cell: (log) => log.userId ?? "System" },
      { header: "Metadata", cell: (log) => <code className="text-xs text-muted-foreground">{log.metadata ? JSON.stringify(log.metadata) : "{}"}</code> },
    ],
    [],
  );

  if (!authLoading && !accessToken) {
    return (
      <>
        <PageHeader eyebrow="Audit logs" title="Sign in required" description="Audit logs require an authenticated workspace session." icon={ScrollText} />
        <div className="p-4 sm:p-6"><Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link></div>
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Audit logs" title="Tenant mutation and security history" description="Owner-only view of meaningful operational mutations and auth events." icon={ScrollText} />
      <div className="space-y-4 p-4 sm:p-6">
        <div className="grid gap-3 rounded-lg border border-border bg-card p-3 shadow-sm lg:grid-cols-[1fr_1fr_1fr_auto_auto]">
          <input className={inputClass} placeholder="Entity type" value={entityType} onChange={(event) => { setEntityType(event.target.value); setPage(1); }} />
          <input className={inputClass} placeholder="Entity ID" value={entityId} onChange={(event) => { setEntityId(event.target.value); setPage(1); }} />
          <input className={inputClass} placeholder="Action" value={action} onChange={(event) => { setAction(event.target.value); setPage(1); }} />
          <Button type="button" variant="outline" onClick={() => void loadLogs()}><Filter className="size-4" aria-hidden="true" />Apply</Button>
          <Button type="button" variant="outline" size="icon" onClick={() => void loadLogs()}><RefreshCw className="size-4" aria-hidden="true" /><span className="sr-only">Refresh audit logs</span></Button>
        </div>
        {error ? <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}
        {loading ? <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">Loading audit logs...</div> : null}
        <DataTable columns={columns} rows={logs} getRowKey={(log) => log.id} emptyMessage="No audit logs match the current filters." />
        <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center">
          <span>Page {pagination.page} of {Math.max(pagination.totalPages, 1)} · {pagination.total} entries</span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => Math.max(value - 1, 1))}>Previous</Button>
            <Button type="button" variant="outline" size="sm" disabled={page >= Math.max(pagination.totalPages, 1)} onClick={() => setPage((value) => value + 1)}>Next</Button>
          </div>
        </div>
      </div>
    </>
  );
}
