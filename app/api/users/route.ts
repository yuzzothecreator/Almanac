import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { assertRole, requireUserFromRequest } from "@/lib/auth";
import { listUsers } from "@/lib/data";

export async function GET(request: Request) {
  try {
    const user = await requireUserFromRequest(request);
    assertRole(user, ["admin", "super_admin"]);
    const users = await listUsers();
    return NextResponse.json(users);
  } catch (error) {
    return apiError(error, "Failed to load users.");
  }
}
