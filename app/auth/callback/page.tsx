"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Completing sign in...</span>
        <div className="hidden">
          <AuthenticateWithRedirectCallback />
        </div>
        <div id="clerk-captcha" />
      </div>
    </div>
  );
}
