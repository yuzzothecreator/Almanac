import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { requireUserFromRequest } from "@/lib/auth";
import { getUserRegistrations } from "@/lib/data";

export async function GET(request: Request) {
  try {
    const user = await requireUserFromRequest(request);
    const items = await getUserRegistrations(user.email);
    return NextResponse.json(items);
  } catch (error) {
    return apiError(error, "Failed to load registrations.");
  }
}
