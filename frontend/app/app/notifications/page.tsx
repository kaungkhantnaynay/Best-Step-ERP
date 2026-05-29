import { Bell } from "lucide-react";

import { FilterBar } from "@/components/app/filter-bar";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { notifications } from "@/lib/app-data";

export default function NotificationsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Notifications"
        title="Operational alerts for stock, orders, shipments, and system work"
        description="Static notification center covering the planned low-stock, shipment update, and order alert flows."
        icon={Bell}
      />
      <div className="space-y-4 p-4 sm:p-6">
        <FilterBar
          searchPlaceholder="Search alerts by type, priority, or description"
          filters={["All", "Low stock", "Shipment", "Order", "System"]}
        />
        <section className="grid gap-3">
          {notifications.map((notification) => (
            <article
              key={notification.id}
              className="rounded-lg border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge value={notification.type} />
                    <StatusBadge value={notification.priority} />
                    <span className="text-xs text-muted-foreground">
                      {notification.time}
                    </span>
                  </div>
                  <h2 className="mt-3 text-sm font-semibold text-foreground">
                    {notification.title}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {notification.description}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  Mark read
                </button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </>
  );
}
