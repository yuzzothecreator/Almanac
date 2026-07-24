import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { requireUserFromRequest } from "@/lib/auth";
import {
  detectAndCreateNotifications,
  getNotifications,
} from "@/lib/data";

export async function GET(request: Request) {
  try {
    const user = await requireUserFromRequest(request);
    const detect = new URL(request.url).searchParams.get("detect") === "1";

    const notifications = detect
      ? await detectAndCreateNotifications(user.email)
      : await getNotifications(user.email);

    return NextResponse.json(notifications);
  } catch (error) {
    return apiError(error, "Failed to load notifications.");
  }
}
