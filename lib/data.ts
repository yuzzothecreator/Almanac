import { prisma } from "@/lib/db";
import { format } from "date-fns";
import {
  serializeEvent,
  type SerializedAlmanac,
  type SerializedNotification,
} from "@/lib/serializers";
import type { AlmanacEvent } from "@/lib/types";

export async function getEvents(): Promise<AlmanacEvent[]> {
  const events = await prisma.event.findMany({
    orderBy: { date: "asc" },
  });
  return events.map(serializeEvent);
}

export async function getEventById(id: string): Promise<AlmanacEvent | null> {
  const event = await prisma.event.findUnique({ where: { id } });
  return event ? serializeEvent(event) : null;
}

export async function getRegistrationCount(): Promise<number> {
  return prisma.registration.count();
}

export type SerializedRegistration = {
  id: string;
  event_id: string;
  user_email: string;
  user_name: string | null;
  status: string;
};

export async function getRegistrations(): Promise<SerializedRegistration[]> {
  const rows = await prisma.registration.findMany({
    orderBy: { created_date: "desc" },
  });

  return rows.map((r) => ({
    id: r.id,
    event_id: r.event_id,
    user_email: r.user_email,
    user_name: r.user_name,
    status: r.status,
  }));
}

export async function getEventRegistrationCount(eventId: string): Promise<number> {
  return prisma.registration.count({ where: { event_id: eventId } });
}

export async function getUserEventRegistration(
  eventId: string,
  userEmail: string
): Promise<SerializedRegistration | null> {
  const row = await prisma.registration.findUnique({
    where: {
      event_id_user_email: {
        event_id: eventId,
        user_email: userEmail,
      },
    },
  });

  if (!row) return null;
  return {
    id: row.id,
    event_id: row.event_id,
    user_email: row.user_email,
    user_name: row.user_name,
    status: row.status,
  };
}

export async function registerForEvent(input: {
  eventId: string;
  userEmail: string;
  userName?: string | null;
}): Promise<{ registration: SerializedRegistration; created: boolean }> {
  const event = await prisma.event.findUnique({ where: { id: input.eventId } });
  if (!event) {
    const error = new Error("Event not found.");
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }

  if (event.status !== "published") {
    const error = new Error("Only published events accept registrations.");
    (error as Error & { statusCode?: number }).statusCode = 400;
    throw error;
  }

  const existing = await prisma.registration.findUnique({
    where: {
      event_id_user_email: {
        event_id: input.eventId,
        user_email: input.userEmail,
      },
    },
  });

  if (existing) {
    return {
      registration: {
        id: existing.id,
        event_id: existing.event_id,
        user_email: existing.user_email,
        user_name: existing.user_name,
        status: existing.status,
      },
      created: false,
    };
  }

  if (event.max_capacity != null) {
    const count = await prisma.registration.count({ where: { event_id: input.eventId } });
    if (count >= event.max_capacity) {
      const error = new Error("This event is full.");
      (error as Error & { statusCode?: number }).statusCode = 409;
      throw error;
    }
  }

  const created = await prisma.registration.create({
    data: {
      event_id: input.eventId,
      user_email: input.userEmail,
      user_name: input.userName || null,
      status: "registered",
    },
  });

  await prisma.notification.create({
    data: {
      event_id: input.eventId,
      user_email: input.userEmail,
      type: "registration",
      title: "Registration confirmed",
      message: `You are registered for ${event.title}.`,
      is_read: false,
    },
  });

  return {
    registration: {
      id: created.id,
      event_id: created.event_id,
      user_email: created.user_email,
      user_name: created.user_name,
      status: created.status,
    },
    created: true,
  };
}

export async function cancelEventRegistration(
  eventId: string,
  userEmail: string
): Promise<boolean> {
  const existing = await prisma.registration.findUnique({
    where: {
      event_id_user_email: {
        event_id: eventId,
        user_email: userEmail,
      },
    },
  });
  if (!existing) return false;

  await prisma.registration.delete({ where: { id: existing.id } });
  return true;
}

export async function getActiveAlmanac(): Promise<SerializedAlmanac | null> {
  const almanac = await prisma.almanacPdf.findFirst({
    where: { is_active: true },
    orderBy: { created_date: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      year: true,
      file_name: true,
    },
  });
  return almanac;
}

export async function getBookmarkedEvents(userEmail: string): Promise<AlmanacEvent[]> {
  const bookmarks = await prisma.bookmark.findMany({
    where: { user_email: userEmail },
    include: { event: true },
    orderBy: { created_date: "desc" },
  });
  return bookmarks.map((b) => serializeEvent(b.event));
}

export async function getNotifications(
  userEmail: string
): Promise<SerializedNotification[]> {
  const rows = await prisma.notification.findMany({
    where: { user_email: userEmail },
    orderBy: { created_date: "desc" },
    take: 50,
  });

  return rows.map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    is_read: n.is_read,
    created_date: n.created_date.toISOString(),
    event_id: n.event_id,
  }));
}

export async function markNotificationRead(
  id: string,
  userEmail: string
): Promise<SerializedNotification | null> {
  const existing = await prisma.notification.findFirst({
    where: { id, user_email: userEmail },
  });
  if (!existing) return null;

  const updated = await prisma.notification.update({
    where: { id },
    data: { is_read: true },
  });

  return {
    id: updated.id,
    title: updated.title,
    message: updated.message,
    type: updated.type,
    is_read: updated.is_read,
    created_date: updated.created_date.toISOString(),
    event_id: updated.event_id,
  };
}

export async function markAllNotificationsRead(userEmail: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: { user_email: userEmail, is_read: false },
    data: { is_read: true },
  });
  return result.count;
}

/** Create reminder/cancellation notifications from upcoming event data. */
export async function detectAndCreateNotifications(
  userEmail: string
): Promise<SerializedNotification[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAhead = new Date(today);
  weekAhead.setDate(weekAhead.getDate() + 7);

  const upcoming = await prisma.event.findMany({
    where: {
      status: { in: ["published", "cancelled"] },
      date: { gte: today, lte: weekAhead },
    },
    orderBy: { date: "asc" },
    take: 20,
  });

  for (const event of upcoming) {
    const type = event.status === "cancelled" ? "cancellation" : "event_reminder";
    const existing = await prisma.notification.findFirst({
      where: {
        user_email: userEmail,
        event_id: event.id,
        type,
      },
    });

    if (existing) continue;

    const dateLabel = format(event.date, "EEE, MMM d");
    const timeLabel = event.start_time ? ` at ${event.start_time}` : "";

    if (type === "cancellation") {
      await prisma.notification.create({
        data: {
          user_email: userEmail,
          event_id: event.id,
          type,
          title: "Event cancelled",
          message: `${event.title} on ${dateLabel} has been cancelled.`,
          is_read: false,
        },
      });
    } else {
      await prisma.notification.create({
        data: {
          user_email: userEmail,
          event_id: event.id,
          type,
          title: "Upcoming event reminder",
          message: `${event.title} is coming up on ${dateLabel}${timeLabel}${
            event.venue ? ` · ${event.venue}` : ""
          }.`,
          is_read: false,
        },
      });
    }
  }

  return getNotifications(userEmail);
}
