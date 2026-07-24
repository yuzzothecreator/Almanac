import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { requireUserFromRequest } from "@/lib/auth";
import { getBookmarkedEvents } from "@/lib/data";

export async function GET(request: Request) {
  try {
    const user = await requireUserFromRequest(request);
    const events = await getBookmarkedEvents(user.email);
    return NextResponse.json(events);
  } catch (error) {
    return apiError(error, "Failed to load bookmarks.");
  }
}
