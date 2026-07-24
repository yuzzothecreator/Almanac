"use client";

import Sidebar from "./Sidebar";
import type { MockUser } from "@/lib/types";

interface AppLayoutProps {
  children: React.ReactNode;
  user: MockUser;
}

export default function AppLayout({ children, user }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar user={user} />
      <main className="lg:ml-[240px] min-h-screen transition-all duration-300">
        <div className="p-4 md:p-6 lg:p-8 pt-16 lg:pt-8">{children}</div>
      </main>
    </div>
  );
}
