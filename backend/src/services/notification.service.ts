import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/app-error.js";
import { parsePagePagination } from "../utils/pagination.js";

type NotificationListQuery = {
  page?: number;
  limit?: number;
  unread?: boolean;
};

function toNotificationResponse(row: {
  id: string;
  title: string;
  body: string;
  readAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listNotifications(organizationId: string, query: NotificationListQuery) {
  const pagination = parsePagePagination(query);
  const where = {
    organizationId,
    ...(query.unread ? { readAt: null } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    notifications: rows.map(toNotificationResponse),
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
}

export async function markNotificationRead(organizationId: string, notificationId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, organizationId },
  });

  if (!notification) throw new AppError(404, "NOTIFICATION_NOT_FOUND", "Notification was not found");

  return toNotificationResponse(
    await prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: notification.readAt ?? new Date() },
    }),
  );
}
