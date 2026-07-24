import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { getEventById } from "@/lib/data";
import { buildEventIcs } from "@/lib/ics";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const event = await getEventById(id);
    if (!event) {
      return NextResponse.json({ message: "Event not found." }, { status: 404 });
    }

    const origin = new URL(request.url).origin;
    const ics = buildEventIcs(event, { url: `${origin}/events/${event.id}` });
    const safeName = event.title
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 40);

    return new NextResponse(ics, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${safeName || "event"}.ics"`,
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    return apiError(error, "Failed to export event calendar.");
  }
}
