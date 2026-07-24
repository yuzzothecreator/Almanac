import { NextResponse } from "next/server";
import { getEvents } from "@/lib/data";

export async function GET() {
  try {
    const events = await getEvents();
    return NextResponse.json(events);
  } catch (error) {
    console.error("events GET failed:", error);
    return NextResponse.json({ message: "Failed to load events." }, { status: 500 });
  }
}
