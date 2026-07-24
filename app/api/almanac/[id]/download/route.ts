import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { getAlmanacFile } from "@/lib/data";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const file = await getAlmanacFile(id);
    if (!file) {
      return NextResponse.json({ message: "PDF not found." }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(file.file_data), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${file.file_name.replace(/"/g, "")}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    return apiError(error, "Failed to download almanac.");
  }
}
