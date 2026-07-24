import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import {
  assertRole,
  canManageEvents,
  requireUserFromRequest,
} from "@/lib/auth";
import { deleteEvent, updateEvent } from "@/lib/data";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const user = await requireUserFromRequest(request);
    assertRole(user, ["staff", "admin"]);
    if (!canManageEvents(user)) {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const updated = await updateEvent(id, {
      ...(body.title !== undefined ? { title: String(body.title) } : {}),
      ...(body.description !== undefined
        ? { description: (body.description as string) || null }
        : {}),
      ...(body.date !== undefined ? { date: String(body.date) } : {}),
      ...(body.start_time !== undefined
        ? { start_time: (body.start_time as string) || null }
        : {}),
      ...(body.end_time !== undefined
        ? { end_time: (body.end_time as string) || null }
        : {}),
      ...(body.venue !== undefined ? { venue: (body.venue as string) || null } : {}),
      ...(body.organizer !== undefined
        ? { organizer: (body.organizer as string) || null }
        : {}),
      ...(body.department !== undefined
        ? { department: (body.department as string) || null }
        : {}),
      ...(body.category !== undefined ? { category: String(body.category) } : {}),
      ...(body.status !== undefined ? { status: String(body.status) } : {}),
      ...(body.priority !== undefined ? { priority: String(body.priority) } : {}),
      ...(body.banner_url !== undefined
        ? { banner_url: (body.banner_url as string) || null }
        : {}),
      ...(body.max_capacity !== undefined
        ? {
            max_capacity:
              body.max_capacity === "" || body.max_capacity == null
                ? null
                : Number(body.max_capacity),
          }
        : {}),
      ...(body.tags !== undefined
        ? { tags: Array.isArray(body.tags) ? (body.tags as string[]) : [] }
        : {}),
      ...(body.is_featured !== undefined
        ? { is_featured: Boolean(body.is_featured) }
        : {}),
    });

    if (!updated) {
      return NextResponse.json({ message: "Event not found." }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return apiError(error, "Failed to update event.");
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const user = await requireUserFromRequest(request);
    assertRole(user, ["staff", "admin"]);
    if (!canManageEvents(user)) {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    const ok = await deleteEvent(id);
    if (!ok) {
      return NextResponse.json({ message: "Event not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error, "Failed to delete event.");
  }
}
