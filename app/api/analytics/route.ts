import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { assertRole, requireUserFromRequest } from "@/lib/auth";
import { getEvents, getRegistrations } from "@/lib/data";

export async function GET(request: Request) {
  try {
    const user = await requireUserFromRequest(request);
    assertRole(user, ["admin", "super_admin"]);

    const [events, registrations] = await Promise.all([
      getEvents(),
      getRegistrations(),
    ]);
    return NextResponse.json({ events, registrations });
  } catch (error) {
    return apiError(error, "Failed to load analytics.");
  }
}
