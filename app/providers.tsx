"use client";

import { ClerkProvider } from "@clerk/clerk-react";
import { AuthProvider } from "@/lib/AuthContext";

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/login">
      <AuthProvider>{children}</AuthProvider>
    </ClerkProvider>
  );
}
