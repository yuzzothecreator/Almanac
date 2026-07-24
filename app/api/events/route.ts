import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import {
  assertRole,
  canManageEvents,
  requireUserFromRequest,
} from "@/lib/auth";
import { createEvent, getEvents } from "@/lib/data";

export async function GET() {
  try {
    const events = await getEvents();
    return NextResponse.json(events);
  } catch (error) {
    return apiError(error, "Failed to load events.");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUserFromRequest(request);
    assertRole(user, ["staff", "admin", "super_admin"]);
    if (!canManageEvents(user)) {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const event = await createEvent({
      title: String(body.title || ""),
      description: (body.description as string) || null,
      date: String(body.date || ""),
      start_time: (body.start_time as string) || null,
      end_time: (body.end_time as string) || null,
      venue: (body.venue as string) || null,
      organizer: (body.organizer as string) || null,
      department: (body.department as string) || null,
      category: (body.category as string) || "academic",
      status: (body.status as string) || "draft",
      priority: (body.priority as string) || "medium",
      banner_url: (body.banner_url as string) || null,
      max_capacity:
        body.max_capacity === "" || body.max_capacity == null
          ? null
          : Number(body.max_capacity),
      tags: Array.isArray(body.tags) ? (body.tags as string[]) : [],
      is_featured: Boolean(body.is_featured),
      created_by: user.email,
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    return apiError(error, "Failed to create event.");
  }
}
