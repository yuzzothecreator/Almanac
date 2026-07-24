"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { useAuth } from "@/lib/AuthContext";

export default function PublicOnlyShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoadingAuth, authChecked } = useAuth();
  const { isSignedIn: isClerkSignedIn, isLoaded: isClerkLoaded } = useClerkAuth();

  useEffect(() => {
    if (
      !isLoadingAuth &&
      authChecked &&
      isClerkLoaded &&
      (isAuthenticated || isClerkSignedIn)
    ) {
      router.replace("/");
    }
  }, [
    isLoadingAuth,
    authChecked,
    isClerkLoaded,
    isAuthenticated,
    isClerkSignedIn,
    router,
  ]);

  if (isLoadingAuth || !authChecked || !isClerkLoaded) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated || isClerkSignedIn) {
    return null;
  }

  return children;
}
