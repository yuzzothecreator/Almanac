import { prisma } from "@/lib/db";
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
