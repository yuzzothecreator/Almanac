import { NextResponse } from "next/server";
import { getNotifications } from "@/lib/data";

export async function GET(request: Request) {
  const email = new URL(request.url).searchParams.get("email");
  if (!email) {
    return NextResponse.json({ message: "email is required" }, { status: 400 });
  }

  const notifications = await getNotifications(email);
  return NextResponse.json(notifications);
}
