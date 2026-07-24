import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
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

    return NextResponse.json(updated);
  } catch (error) {
    return apiError(error, "Failed to update user.");
  }
}
