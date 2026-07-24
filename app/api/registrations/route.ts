import { NextResponse } from "next/server";
import {
  cancelEventRegistration,
  getEventRegistrationCount,
  getUserEventRegistration,
  registerForEvent,
} from "@/lib/data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");
  const email = searchParams.get("email");

  if (!eventId) {
    return NextResponse.json({ message: "eventId is required" }, { status: 400 });
  }

  try {
    const [count, registration] = await Promise.all([
      getEventRegistrationCount(eventId),
      email ? getUserEventRegistration(eventId, email) : Promise.resolve(null),
    ]);

    return NextResponse.json({
      count,
      registered: Boolean(registration),
      registration,
    });
  } catch (error) {
    console.error("registrations GET failed:", error);
    return NextResponse.json({ message: "Failed to load registration." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    eventId?: string;
    email?: string;
    fullName?: string | null;
  };

  if (!body.eventId || !body.email) {
    return NextResponse.json(
      { message: "eventId and email are required." },
      { status: 400 }
    );
  }

  try {
    const result = await registerForEvent({
      eventId: body.eventId,
      userEmail: body.email.toLowerCase(),
      userName: body.fullName,
    });

    return NextResponse.json(result, { status: result.created ? 201 : 200 });
  } catch (error) {
    const err = error as Error & { statusCode?: number };
    return NextResponse.json(
      { message: err.message || "Registration failed." },
      { status: err.statusCode || 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    eventId?: string;
    email?: string;
  };

  if (!body.eventId || !body.email) {
    return NextResponse.json(
      { message: "eventId and email are required." },
      { status: 400 }
    );
  }

  try {
    const removed = await cancelEventRegistration(
      body.eventId,
      body.email.toLowerCase()
    );
    if (!removed) {
      return NextResponse.json({ message: "Registration not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("registrations DELETE failed:", error);
    return NextResponse.json({ message: "Failed to cancel registration." }, { status: 500 });
  }
}
