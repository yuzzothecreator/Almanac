import { createClerkClient, verifyToken } from "@clerk/backend";
import { prisma } from "@/lib/db";
import type { UserRole } from "@/lib/types";

export type AppUser = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_verified: boolean;
  disabled: boolean;
  created_date: string;
  updated_date: string;
  last_login_at: string | null;
};

function toAppUser(user: {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_verified: boolean;
  disabled: boolean;
  created_date: Date;
  updated_date: Date;
  last_login_at: Date | null;
}): AppUser {
  const role = (["student", "staff", "admin"].includes(user.role)
    ? user.role
    : "student") as UserRole;

  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role,
    is_verified: user.is_verified,
    disabled: user.disabled,
    created_date: user.created_date.toISOString(),
    updated_date: user.updated_date.toISOString(),
    last_login_at: user.last_login_at?.toISOString() ?? null,
  };
}

function getClerkClient() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("CLERK_SECRET_KEY is required");
  }
  return createClerkClient({ secretKey });
}

/** Sync Clerk JWT → Prisma user (create on first login). */
export async function syncUserFromClerkToken(token: string): Promise<AppUser | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return null;

  const payload = await verifyToken(token, { secretKey });
  if (!payload?.sub) return null;

  const clerkClient = getClerkClient();
  const clerkUser = await clerkClient.users.getUser(payload.sub);
  const email = clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase();
  if (!email) return null;

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? "admin" : "student";
    const fullName = clerkUser.firstName
      ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim()
      : email.split("@")[0];

    user = await prisma.user.create({
      data: {
        email,
        full_name: fullName,
        role,
        is_verified: true,
        disabled: false,
        password_hash: "clerk-auth-user",
        last_login_at: new Date(),
      },
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date(), is_verified: true },
    });
  }

  if (user.disabled) return null;
  return toAppUser(user);
}

export async function getDbUserByEmail(email: string): Promise<AppUser | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (!user || user.disabled) return null;
  return toAppUser(user);
}

export function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export async function requireUserFromRequest(request: Request): Promise<AppUser> {
  const token = getBearerToken(request);
  if (!token) {
    const error = new Error("Authentication required.");
    (error as Error & { statusCode?: number }).statusCode = 401;
    throw error;
  }
  const user = await syncUserFromClerkToken(token);
  if (!user) {
    const error = new Error("Invalid or expired session.");
    (error as Error & { statusCode?: number }).statusCode = 401;
    throw error;
  }
  return user;
}

export function assertRole(user: AppUser, roles: UserRole[]): void {
  if (!roles.includes(user.role)) {
    const error = new Error("You do not have permission for this action.");
    (error as Error & { statusCode?: number }).statusCode = 403;
    throw error;
  }
}

export function canManageEvents(user: AppUser): boolean {
  return user.role === "staff" || user.role === "admin";
}

export function isAdmin(user: AppUser): boolean {
  return user.role === "admin";
}
