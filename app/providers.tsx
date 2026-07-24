"use client";

import { ClerkProvider } from "@clerk/clerk-react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/AuthContext";
import { NotificationsProvider } from "@/components/notifications/NotificationsProvider";

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/login">
      <AuthProvider>
        <NotificationsProvider>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              className: "font-sans",
            }}
          />
        </NotificationsProvider>
      </AuthProvider>
    </ClerkProvider>
  );
}
