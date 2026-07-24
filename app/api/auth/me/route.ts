import { NextResponse } from "next/server";
import { syncUserFromClerkToken } from "@/lib/auth";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";

  if (!token) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  try {
    const user = await syncUserFromClerkToken(token);
    if (!user) {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    }
    return NextResponse.json(user);
  } catch (error) {
    console.error("auth/me failed:", error);
    return NextResponse.json({ message: "Authentication failed." }, { status: 401 });
  }
}
