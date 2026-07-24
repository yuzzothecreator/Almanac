import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge gate for app pages. APIs enforce auth themselves via Bearer tokens.
 * Cookie presence is not cryptographic proof — ProtectedShell + API checks remain required.
 */
const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/auth/callback",
];

function isPublicPath(pathname: string) {
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname === "/favicon.png" ||
    pathname === "/favicon.ico" ||
    pathname === "/logo.png" ||
    pathname === "/og.png" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/site.webmanifest" ||
    pathname === "/apple-icon.png" ||
    pathname === "/icon.png"
  ) {
    return true;
  }
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // APIs self-authenticate; do not block here
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const hasSession = Boolean(request.cookies.get("__session")?.value);

  if (!hasSession) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("redirect_url", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)",
  ],
};
