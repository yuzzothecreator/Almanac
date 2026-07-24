import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { listAlmanacs } from "@/lib/data";

export async function GET() {
  try {
    const almanacs = await listAlmanacs();
    return NextResponse.json(almanacs);
  } catch (error) {
    return apiError(error, "Failed to list almanacs.");
  }
}
