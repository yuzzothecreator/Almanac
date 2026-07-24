import { NextResponse } from "next/server";

export function apiError(error: unknown, fallback = "Request failed.") {
  const status =
    typeof error === "object" &&
    error &&
    "statusCode" in error &&
    typeof (error as { statusCode?: number }).statusCode === "number"
      ? (error as { statusCode: number }).statusCode
      : 500;
  const message =
    error instanceof Error && error.message ? error.message : fallback;
  if (status >= 500) console.error(message, error);
  return NextResponse.json({ message }, { status });
}
