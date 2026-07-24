import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { assertRole, requireUserFromRequest } from "@/lib/auth";
import { uploadAlmanac } from "@/lib/data";

export async function POST(request: Request) {
  try {
    const user = await requireUserFromRequest(request);
    assertRole(user, ["admin"]);

    const body = (await request.json()) as {
      title?: string;
      year?: string;
      description?: string;
      file_name?: string;
      file_data?: string;
      is_active?: boolean;
    };

    const created = await uploadAlmanac({
      title: body.title || "",
      year: body.year || "",
      description: body.description || null,
      file_name: body.file_name || "almanac.pdf",
      file_data: body.file_data || "",
      uploaded_by: user.email,
      is_active: body.is_active !== false,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return apiError(error, "Failed to upload almanac.");
  }
}
