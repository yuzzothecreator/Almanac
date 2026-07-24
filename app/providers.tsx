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
            position="top-center"
            richColors
            closeButton
            mobileOffset={{ top: 16 }}
            toastOptions={{
              className: "font-sans !max-w-[calc(100vw-1.5rem)] sm:!max-w-md",
            }}
          />
        </NotificationsProvider>
      </AuthProvider>
    </ClerkProvider>
  );
}
