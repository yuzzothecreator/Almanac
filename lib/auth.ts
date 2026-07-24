import { createClerkClient, verifyToken } from "@clerk/backend";
import { prisma } from "@/lib/db";
import { isValidRole, type UserRole } from "@/lib/types";

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

function getSuperAdminEmails(): Set<string> {
  return new Set(
    (process.env.SUPER_ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

function normalizeRole(role: string): UserRole {
  return isValidRole(role) ? role : "student";
}

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
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: normalizeRole(user.role),
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

  const superEmails = getSuperAdminEmails();
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const userCount = await prisma.user.count();
    const role: UserRole =
      userCount === 0 || superEmails.has(email) ? "super_admin" : "student";
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
    const patch: { last_login_at: Date; is_verified: boolean; role?: string } = {
      last_login_at: new Date(),
      is_verified: true,
    };
    // Bootstrap listed emails to super_admin without demoting existing super_admins
    if (superEmails.has(email) && user.role !== "super_admin") {
      patch.role = "super_admin";
    }
    user = await prisma.user.update({
      where: { id: user.id },
      data: patch,
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

export function isSuperAdmin(user: Pick<AppUser, "role">): boolean {
  return user.role === "super_admin";
}

/** Platform admin level (admin or super_admin). */
export function isAdmin(user: Pick<AppUser, "role">): boolean {
  return user.role === "admin" || user.role === "super_admin";
}

export function canManageEvents(user: Pick<AppUser, "role">): boolean {
  return user.role === "staff" || isAdmin(user);
}

export function canManageUsers(user: Pick<AppUser, "role">): boolean {
  return isAdmin(user);
}

export function canBanUsers(user: Pick<AppUser, "role">): boolean {
  return isSuperAdmin(user);
}
