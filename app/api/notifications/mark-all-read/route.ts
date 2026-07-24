import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { requireUserFromRequest } from "@/lib/auth";
import { markAllNotificationsRead } from "@/lib/data";

export async function POST(request: Request) {
  try {
    const user = await requireUserFromRequest(request);
    const count = await markAllNotificationsRead(user.email);
    return NextResponse.json({ updated: count });
  } catch (error) {
    return apiError(error, "Failed to mark notifications read.");
  }
}
