"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth as useClerkAuth, useClerk, useUser } from "@clerk/clerk-react";
import type { AppUser } from "@/lib/auth";

type AuthContextValue = {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  authChecked: boolean;
  authError: { type: string; message?: string } | null;
  logout: (shouldRedirect?: boolean) => Promise<void>;
  navigateToLogin: () => void;
  checkUserAuth: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const clerkAuth = useClerkAuth();
  const { user: clerkUser, isLoaded: isClerkUserLoaded } = useUser();
  const { signOut } = useClerk();

  const [user, setUser] = useState<AppUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState<{ type: string; message?: string } | null>(
    null
  );

  useEffect(() => {
    if (!clerkAuth.isLoaded || !isClerkUserLoaded) return;

    const syncUser = async () => {
      if (clerkAuth.isSignedIn && clerkUser) {
        try {
          const token = await clerkAuth.getToken();
          const response = await fetch("/api/auth/me", {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });

          if (response.ok) {
            const dbUser = (await response.json()) as AppUser;
            setUser(dbUser);
          } else {
            setUser({
              id: clerkUser.id,
              email: clerkUser.primaryEmailAddress?.emailAddress || "",
              full_name:
                clerkUser.fullName ||
                clerkUser.firstName ||
                clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0] ||
                null,
              role: "student",
              is_verified: true,
              disabled: false,
              created_date: new Date().toISOString(),
              updated_date: new Date().toISOString(),
              last_login_at: new Date().toISOString(),
            });
          }
          setIsAuthenticated(true);
          setAuthError(null);
        } catch (error) {
          console.error("Failed to sync user with DB:", error);
          setIsAuthenticated(true);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }

      setIsLoadingAuth(false);
      setAuthChecked(true);
    };

    void syncUser();
  }, [
    clerkAuth.isLoaded,
    clerkAuth.isSignedIn,
    clerkAuth.getToken,
    isClerkUserLoaded,
    clerkUser,
  ]);

  const logout = useCallback(
    async (shouldRedirect = true) => {
      setUser(null);
      setIsAuthenticated(false);
      await signOut();
      if (shouldRedirect) {
        window.location.href = "/login";
      }
    },
    [signOut]
  );

  const navigateToLogin = useCallback(() => {
    window.location.href = "/login";
  }, []);

  const checkUserAuth = useCallback(() => {
    // Auth sync is driven by Clerk state in useEffect
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoadingAuth,
      authChecked,
      authError,
      logout,
      navigateToLogin,
      checkUserAuth,
    }),
    [
      user,
      isAuthenticated,
      isLoadingAuth,
      authChecked,
      authError,
      logout,
      navigateToLogin,
      checkUserAuth,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
