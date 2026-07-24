import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { assertRole, requireUserFromRequest } from "@/lib/auth";
import { updateUserByAdmin } from "@/lib/data";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const actor = await requireUserFromRequest(request);
    assertRole(actor, ["admin", "super_admin"]);

    const body = (await request.json()) as {
      role?: string;
      disabled?: boolean;
      is_verified?: boolean;
    };

    const updated = await updateUserByAdmin(actor, id, {
      ...(body.role !== undefined ? { role: body.role } : {}),
      ...(body.disabled !== undefined ? { disabled: body.disabled } : {}),
      ...(body.is_verified !== undefined
        ? { is_verified: body.is_verified }
        : {}),
    });

    let action = "user.update";
    let summary = `Updated user ${updated.email}`;
    if (body.disabled === true) {
      action = "user.ban";
      summary = `Banned user ${updated.email}`;
    } else if (body.disabled === false) {
      action = "user.unban";
      summary = `Unbanned user ${updated.email}`;
    } else if (body.role !== undefined) {
      action = "user.role_change";
      summary = `Changed role for ${updated.email} → ${updated.role}`;
    } else if (body.is_verified !== undefined) {
      action = "user.verify";
      summary = body.is_verified
        ? `Verified user ${updated.email}`
        : `Unverified user ${updated.email}`;
    }

    await writeAuditLog({
      actorEmail: actor.email,
      actorRole: actor.role,
      action,
      entityType: "user",
      entityId: updated.id,
      summary,
      metadata: body as Record<string, unknown>,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return apiError(error, "Failed to update user.");
  }
}
