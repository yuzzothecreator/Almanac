import { NextResponse } from "next/server";
import {
  detectAndCreateNotifications,
  getNotifications,
} from "@/lib/data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const detect = searchParams.get("detect") === "1";

  if (!email) {
    return NextResponse.json({ message: "email is required" }, { status: 400 });
  }

  try {
    const notifications = detect
      ? await detectAndCreateNotifications(email)
      : await getNotifications(email);

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("notifications GET failed:", error);
    return NextResponse.json({ message: "Failed to load notifications." }, { status: 500 });
  }
}
