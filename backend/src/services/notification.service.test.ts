import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../prisma/client.js";
import { listNotifications, markNotificationRead } from "./notification.service.js";

vi.mock("../prisma/client.js", () => ({
  prisma: {
    notification: {
      count: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const mockedNotificationCount = vi.mocked(prisma.notification.count);
const mockedNotificationFindFirst = vi.mocked(prisma.notification.findFirst);
const mockedNotificationFindMany = vi.mocked(prisma.notification.findMany);
const mockedNotificationUpdate = vi.mocked(prisma.notification.update);

function notification(overrides: Record<string, unknown> = {}) {
  return {
    id: "notification-1",
    organizationId: "org-1",
    title: "Low stock",
    body: "Trail Runner Sole Kit is below reorder level.",
    readAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("notification service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("lists tenant-scoped notifications with unread filtering", async () => {
    mockedNotificationFindMany.mockResolvedValue([notification()] as never);
    mockedNotificationCount.mockResolvedValue(1);

    const result = await listNotifications("org-1", { page: 1, limit: 25, unread: true });

    expect(mockedNotificationFindMany).toHaveBeenCalledWith({
      where: {
        organizationId: "org-1",
        readAt: null,
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: 0,
      take: 25,
    });
    expect(mockedNotificationCount).toHaveBeenCalledWith({
      where: {
        organizationId: "org-1",
        readAt: null,
      },
    });
    expect(result.notifications[0]).toMatchObject({
      id: "notification-1",
      readAt: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("marks only tenant-owned notifications as read", async () => {
    const readAt = new Date("2026-01-02T00:00:00.000Z");

    mockedNotificationFindFirst.mockResolvedValue(notification() as never);
    mockedNotificationUpdate.mockResolvedValue(notification({ readAt }) as never);

    await expect(markNotificationRead("org-1", "notification-1")).resolves.toMatchObject({
      id: "notification-1",
      readAt: "2026-01-02T00:00:00.000Z",
    });

    expect(mockedNotificationFindFirst).toHaveBeenCalledWith({
      where: {
        id: "notification-1",
        organizationId: "org-1",
      },
    });
    expect(mockedNotificationUpdate).toHaveBeenCalledWith({
      where: {
        id: "notification-1",
      },
      data: {
        readAt: expect.any(Date),
      },
    });
  });

  it("refuses to mark notifications outside the tenant", async () => {
    mockedNotificationFindFirst.mockResolvedValue(null);

    await expect(markNotificationRead("org-1", "notification-2")).rejects.toMatchObject({
      statusCode: 404,
      code: "NOTIFICATION_NOT_FOUND",
    });

    expect(mockedNotificationUpdate).not.toHaveBeenCalled();
  });
});
