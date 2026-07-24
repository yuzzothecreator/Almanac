import { NextResponse } from "next/server";
import { getEvents, getRegistrations } from "@/lib/data";

export async function GET() {
  try {
    const [events, registrations] = await Promise.all([
      getEvents(),
      getRegistrations(),
    ]);
    return NextResponse.json({ events, registrations });
  } catch (error) {
    console.error("analytics api failed:", error);
    return NextResponse.json({ message: "Failed to load analytics." }, { status: 500 });
  }
}
