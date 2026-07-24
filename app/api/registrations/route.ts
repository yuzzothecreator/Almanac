import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import {
  requireUserFromRequest,
  getBearerToken,
  syncUserFromClerkToken,
  type AppUser,
} from "@/lib/auth";
import {
  cancelEventRegistration,
  getEventRegistrationCount,
  getUserEventRegistration,
  registerForEvent,
} from "@/lib/data";

async function optionalUserFromRequest(request: Request): Promise<AppUser | null> {
  const token = getBearerToken(request);
  if (!token) return null;
  try {
    return await syncUserFromClerkToken(token);
  } catch {
    return null;
  }
}

/** Public count; personal registered status only for the authenticated user. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json({ message: "eventId is required" }, { status: 400 });
  }

  try {
    const user = await optionalUserFromRequest(request);
    const [count, registration] = await Promise.all([
      getEventRegistrationCount(eventId),
      user
        ? getUserEventRegistration(eventId, user.email)
        : Promise.resolve(null),
    ]);

    return NextResponse.json({
      count,
      registered: Boolean(registration),
      registration: registration
        ? {
            id: registration.id,
            event_id: registration.event_id,
            status: registration.status,
          }
        : null,
    });
  } catch (error) {
    return apiError(error, "Failed to load registration.");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUserFromRequest(request);
    const body = (await request.json().catch(() => ({}))) as {
      eventId?: string;
    };

    if (!body.eventId) {
      return NextResponse.json({ message: "eventId is required." }, { status: 400 });
    }

    const result = await registerForEvent({
      eventId: body.eventId,
      userEmail: user.email,
      userName: user.full_name,
    });

    return NextResponse.json(result, { status: result.created ? 201 : 200 });
  } catch (error) {
    return apiError(error, "Registration failed.");
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUserFromRequest(request);
    const body = (await request.json().catch(() => ({}))) as {
      eventId?: string;
    };

    if (!body.eventId) {
      return NextResponse.json({ message: "eventId is required." }, { status: 400 });
    }

    const removed = await cancelEventRegistration(body.eventId, user.email);
    if (!removed) {
      return NextResponse.json({ message: "Registration not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error, "Failed to cancel registration.");
  }
}
