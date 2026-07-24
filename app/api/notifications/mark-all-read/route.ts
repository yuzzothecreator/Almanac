import { NextResponse } from "next/server";
import { markAllNotificationsRead } from "@/lib/data";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: string };
  if (!body.email) {
    return NextResponse.json({ message: "email is required" }, { status: 400 });
  }

  const count = await markAllNotificationsRead(body.email);
  return NextResponse.json({ updated: count });
}
