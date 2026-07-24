"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <span className="text-sm text-muted-foreground">Loading ALMANAC...</span>
    </div>
  </div>
);

interface ProtectedShellProps {
  children: React.ReactNode;
  roles?: Array<"student" | "staff" | "admin" | "super_admin">;
}

export default function ProtectedShell({ children, roles }: ProtectedShellProps) {
  const {
    user,
    isAuthenticated,
    isLoadingAuth,
    authChecked,
    navigateToLogin,
  } = useAuth();

  useEffect(() => {
    if (authChecked && !isLoadingAuth && !isAuthenticated) {
      navigateToLogin();
    }
  }, [authChecked, isLoadingAuth, isAuthenticated, navigateToLogin]);

  if (isLoadingAuth || !authChecked) {
    return <DefaultFallback />;
  }

  if (!isAuthenticated) {
    return <DefaultFallback />;
  }

  if (roles?.length && !roles.includes(user?.role || "student")) {
    return <DefaultFallback />;
  }

  return children;
}
