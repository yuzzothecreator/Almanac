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
      file_size: true,
      is_active: true,
      created_date: true,
      uploaded_by: true,
    },
  });
  if (!almanac) return null;
  return {
    ...almanac,
    created_date: almanac.created_date.toISOString(),
  };
}

export type EventInput = {
  title: string;
  description?: string | null;
  date: string;
  start_time?: string | null;
  end_time?: string | null;
  venue?: string | null;
  organizer?: string | null;
  department?: string | null;
  category?: string;
  status?: string;
  priority?: string;
  banner_url?: string | null;
  max_capacity?: number | null;
  tags?: string[];
  is_featured?: boolean;
  created_by?: string | null;
};

function parseEventDate(date: string): Date {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) {
    const error = new Error("Invalid event date.");
    (error as Error & { statusCode?: number }).statusCode = 400;
    throw error;
  }
  return d;
}

export async function createEvent(input: EventInput): Promise<AlmanacEvent> {
  if (!input.title?.trim() || !input.date) {
    const error = new Error("Title and date are required.");
    (error as Error & { statusCode?: number }).statusCode = 400;
    throw error;
  }

  const created = await prisma.event.create({
    data: {
      title: input.title.trim(),
      description: input.description || null,
      date: parseEventDate(input.date),
      start_time: input.start_time || null,
      end_time: input.end_time || null,
      venue: input.venue || null,
      organizer: input.organizer || null,
      department: input.department || null,
      category: input.category || "academic",
      status: input.status || "draft",
      priority: input.priority || "medium",
      banner_url: input.banner_url || null,
      max_capacity: input.max_capacity ?? null,
      tags: input.tags || [],
      is_featured: Boolean(input.is_featured),
      created_by: input.created_by || null,
    },
  });

  return serializeEvent(created);
}

export async function updateEvent(
  id: string,
  input: Partial<EventInput>
): Promise<AlmanacEvent | null> {
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) return null;

  const updated = await prisma.event.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.description !== undefined
        ? { description: input.description || null }
        : {}),
      ...(input.date !== undefined ? { date: parseEventDate(input.date) } : {}),
      ...(input.start_time !== undefined
        ? { start_time: input.start_time || null }
        : {}),
      ...(input.end_time !== undefined ? { end_time: input.end_time || null } : {}),
      ...(input.venue !== undefined ? { venue: input.venue || null } : {}),
      ...(input.organizer !== undefined
        ? { organizer: input.organizer || null }
        : {}),
      ...(input.department !== undefined
        ? { department: input.department || null }
        : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.banner_url !== undefined
        ? { banner_url: input.banner_url || null }
        : {}),
      ...(input.max_capacity !== undefined
        ? { max_capacity: input.max_capacity }
        : {}),
      ...(input.tags !== undefined ? { tags: input.tags } : {}),
      ...(input.is_featured !== undefined
        ? { is_featured: Boolean(input.is_featured) }
        : {}),
    },
  });

  return serializeEvent(updated);
}

export async function deleteEvent(id: string): Promise<boolean> {
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) return false;
  await prisma.event.delete({ where: { id } });
  return true;
}

export async function listAlmanacs(): Promise<SerializedAlmanac[]> {
  const rows = await prisma.almanacPdf.findMany({
    orderBy: { created_date: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      year: true,
      file_name: true,
      file_size: true,
      is_active: true,
      created_date: true,
      uploaded_by: true,
    },
  });

  return rows.map((r) => ({
    ...r,
    created_date: r.created_date.toISOString(),
  }));
}

export async function uploadAlmanac(input: {
  title: string;
  year: string;
  description?: string | null;
  file_name: string;
  file_data: string;
  uploaded_by: string;
  is_active?: boolean;
}): Promise<SerializedAlmanac> {
  if (!input.title?.trim() || !input.year?.trim() || !input.file_data) {
    const error = new Error("Title, year, and file are required.");
    (error as Error & { statusCode?: number }).statusCode = 400;
    throw error;
  }

  const base64 = input.file_data.includes(",")
    ? input.file_data.split(",")[1]
    : input.file_data;
  const buffer = Buffer.from(base64, "base64");

  if (buffer.length > 10 * 1024 * 1024) {
    const error = new Error("File must be less than 10MB.");
    (error as Error & { statusCode?: number }).statusCode = 400;
    throw error;
  }

  const makeActive = input.is_active !== false;
  if (makeActive) {
    await prisma.almanacPdf.updateMany({ data: { is_active: false } });
  }

  const created = await prisma.almanacPdf.create({
    data: {
      title: input.title.trim(),
      description: input.description || null,
      year: input.year.trim(),
      file_name: input.file_name || "almanac.pdf",
      file_size: buffer.length,
      file_data: buffer,
      uploaded_by: input.uploaded_by,
      is_active: makeActive,
    },
  });

  return {
    id: created.id,
    title: created.title,
    description: created.description,
    year: created.year,
    file_name: created.file_name,
    file_size: created.file_size,
    is_active: created.is_active,
    created_date: created.created_date.toISOString(),
    uploaded_by: created.uploaded_by,
  };
}

export async function setActiveAlmanac(id: string): Promise<SerializedAlmanac | null> {
  const existing = await prisma.almanacPdf.findUnique({ where: { id } });
  if (!existing) return null;

  await prisma.almanacPdf.updateMany({ data: { is_active: false } });
  const updated = await prisma.almanacPdf.update({
    where: { id },
    data: { is_active: true },
  });

  return {
    id: updated.id,
    title: updated.title,
    description: updated.description,
    year: updated.year,
    file_name: updated.file_name,
    file_size: updated.file_size,
    is_active: updated.is_active,
    created_date: updated.created_date.toISOString(),
    uploaded_by: updated.uploaded_by,
  };
}

export async function deleteAlmanac(id: string): Promise<boolean> {
  const existing = await prisma.almanacPdf.findUnique({ where: { id } });
  if (!existing) return false;
  await prisma.almanacPdf.delete({ where: { id } });
  return true;
}

export async function getAlmanacFile(
  id: string
): Promise<{ file_data: Buffer; file_name: string } | null> {
  const pdf = await prisma.almanacPdf.findUnique({
    where: { id },
    select: { file_data: true, file_name: true },
  });
  if (!pdf) return null;
  return { file_data: Buffer.from(pdf.file_data), file_name: pdf.file_name };
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

export type ManagedUser = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_verified: boolean;
  disabled: boolean;
  created_date: string;
  last_login_at: string | null;
};

export async function listUsers(): Promise<ManagedUser[]> {
  const rows = await prisma.user.findMany({
    orderBy: { created_date: "desc" },
    select: {
      id: true,
      email: true,
      full_name: true,
      role: true,
      is_verified: true,
      disabled: true,
      created_date: true,
      last_login_at: true,
    },
  });

  return rows.map((u) => ({
    id: u.id,
    email: u.email,
    full_name: u.full_name,
    role: u.role,
    is_verified: u.is_verified,
    disabled: u.disabled,
    created_date: u.created_date.toISOString(),
    last_login_at: u.last_login_at?.toISOString() ?? null,
  }));
}

export async function updateUserByAdmin(
  actor: { id: string; role: string },
  targetId: string,
  data: { role?: string; disabled?: boolean; is_verified?: boolean }
): Promise<ManagedUser> {
  const actorIsSuper = actor.role === "super_admin";
  const actorIsAdmin = actor.role === "admin" || actorIsSuper;

  if (!actorIsAdmin) {
    const error = new Error("Admin access required.");
    (error as Error & { statusCode?: number }).statusCode = 403;
    throw error;
  }

  const allowedRoles = new Set(["student", "staff", "admin", "super_admin"]);
  if (data.role !== undefined && !allowedRoles.has(data.role)) {
    const error = new Error("Invalid role.");
    (error as Error & { statusCode?: number }).statusCode = 400;
    throw error;
  }

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) {
    const error = new Error("User not found.");
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }

  const targetIsElevated =
    target.role === "admin" || target.role === "super_admin";

  // Regular admins: limited to student/staff role edits only
  if (!actorIsSuper) {
    if (data.disabled !== undefined) {
      const error = new Error("Only a super admin can ban or unban users.");
      (error as Error & { statusCode?: number }).statusCode = 403;
      throw error;
    }
    if (data.is_verified !== undefined) {
      const error = new Error("Only a super admin can change verification.");
      (error as Error & { statusCode?: number }).statusCode = 403;
      throw error;
    }
    if (targetIsElevated) {
      const error = new Error(
        "Only a super admin can manage admin or super admin accounts."
      );
      (error as Error & { statusCode?: number }).statusCode = 403;
      throw error;
    }
    if (data.role !== undefined && !["student", "staff"].includes(data.role)) {
      const error = new Error(
        "Regular admins can only assign student or staff roles."
      );
      (error as Error & { statusCode?: number }).statusCode = 403;
      throw error;
    }
  }

  const nextRole = data.role ?? target.role;
  const nextDisabled =
    data.disabled !== undefined ? data.disabled : target.disabled;

  if (target.id === actor.id) {
    if (nextDisabled === true || (data.role && data.role !== actor.role)) {
      const error = new Error("You cannot ban or change your own role.");
      (error as Error & { statusCode?: number }).statusCode = 403;
      throw error;
    }
  }

  if (
    target.role === "super_admin" &&
    (nextDisabled === true || nextRole !== "super_admin")
  ) {
    const superCount = await prisma.user.count({
      where: { role: "super_admin", disabled: false },
    });
    if (superCount <= 1) {
      const error = new Error("At least one active super admin is required.");
      (error as Error & { statusCode?: number }).statusCode = 403;
      throw error;
    }
  }

  const wouldLoseElevatedAccess =
    targetIsElevated &&
    (nextDisabled === true || !["admin", "super_admin"].includes(nextRole));

  if (wouldLoseElevatedAccess) {
    const elevatedCount = await prisma.user.count({
      where: {
        role: { in: ["admin", "super_admin"] },
        disabled: false,
      },
    });
    if (elevatedCount <= 1) {
      const error = new Error(
        "At least one active admin or super admin is required."
      );
      (error as Error & { statusCode?: number }).statusCode = 403;
      throw error;
    }
  }

  const updated = await prisma.user.update({
    where: { id: targetId },
    data: {
      ...(data.role !== undefined ? { role: data.role } : {}),
      ...(data.disabled !== undefined ? { disabled: data.disabled } : {}),
      ...(data.is_verified !== undefined
        ? { is_verified: data.is_verified }
        : {}),
    },
  });

  return {
    id: updated.id,
    email: updated.email,
    full_name: updated.full_name,
    role: updated.role,
    is_verified: updated.is_verified,
    disabled: updated.disabled,
    created_date: updated.created_date.toISOString(),
    last_login_at: updated.last_login_at?.toISOString() ?? null,
  };
}
