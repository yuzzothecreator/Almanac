import { NextResponse } from "next/server";
import { markNotificationRead } from "@/lib/data";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    is_read?: boolean;
  };

  if (!body.email) {
    return NextResponse.json({ message: "email is required" }, { status: 400 });
  }

  if (body.is_read !== true) {
    return NextResponse.json({ message: "Only is_read=true is supported." }, { status: 400 });
  }

  const updated = await markNotificationRead(id, body.email);
  if (!updated) {
    return NextResponse.json({ message: "Notification not found." }, { status: 404 });
  }

  return NextResponse.json(updated);
}
