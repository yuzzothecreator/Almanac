import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { listAuditLogs } from "@/lib/audit";
import { assertRole, requireUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await requireUserFromRequest(request);
    assertRole(user, ["admin", "super_admin"]);

    const { searchParams } = new URL(request.url);
    const logs = await listAuditLogs({
      q: searchParams.get("q") || undefined,
      action: searchParams.get("action") || undefined,
      entityType: searchParams.get("entityType") || undefined,
      limit: Number(searchParams.get("limit") || 100) || 100,
    });

    return NextResponse.json(logs);
  } catch (error) {
    return apiError(error, "Failed to load audit logs.");
  }
}
