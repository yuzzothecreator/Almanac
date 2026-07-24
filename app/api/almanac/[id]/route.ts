import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { assertRole, requireUserFromRequest } from "@/lib/auth";
import { deleteAlmanac, setActiveAlmanac } from "@/lib/data";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const user = await requireUserFromRequest(request);
    assertRole(user, ["admin", "super_admin"]);

    const ok = await deleteAlmanac(id);
    if (!ok) {
      return NextResponse.json({ message: "Almanac not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error, "Failed to delete almanac.");
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const user = await requireUserFromRequest(request);
    assertRole(user, ["admin", "super_admin"]);

    const body = (await request.json().catch(() => ({}))) as { action?: string };
    if (body.action !== "set-active") {
      return NextResponse.json({ message: "Unsupported action." }, { status: 400 });
    }

    const updated = await setActiveAlmanac(id);
    if (!updated) {
      return NextResponse.json({ message: "Almanac not found." }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return apiError(error, "Failed to update almanac.");
  }
}
