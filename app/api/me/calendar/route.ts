import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { requireUserFromRequest } from "@/lib/auth";
import { getUserRegistrations } from "@/lib/data";
import { buildEventsIcs } from "@/lib/ics";

export async function GET(request: Request) {
  try {
    const user = await requireUserFromRequest(request);
    const items = await getUserRegistrations(user.email);
    const events = items
      .filter((i) => i.event.status === "published")
      .map((i) => i.event);

    const origin = new URL(request.url).origin;
    const ics = buildEventsIcs(events, {
      calendarName: "My Almanac Registrations",
      eventUrl: (e) => `${origin}/events/${e.id}`,
    });

    return new NextResponse(ics, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="my-almanac-events.ics"',
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    return apiError(error, "Failed to export calendar.");
  }
}
