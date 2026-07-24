import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { requireUserFromRequest } from "@/lib/auth";
import { markNotificationRead } from "@/lib/data";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const user = await requireUserFromRequest(request);
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      is_read?: boolean;
    };

    if (body.is_read !== true) {
      return NextResponse.json(
        { message: "Only is_read=true is supported." },
        { status: 400 }
      );
    }

    const updated = await markNotificationRead(id, user.email);
    if (!updated) {
      return NextResponse.json({ message: "Notification not found." }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return apiError(error, "Failed to update notification.");
  }
}
