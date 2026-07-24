"use client";

import Sidebar from "./Sidebar";
import { SidebarLayoutProvider, useSidebarLayout } from "./SidebarLayoutContext";

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebarLayout();

  return (
    <div className="min-h-screen bg-background overflow-x-clip">
      <Sidebar />
      <main
        className={`min-h-screen transition-all duration-300 ${
          collapsed ? "lg:ml-[72px]" : "lg:ml-[240px]"
        }`}
      >
        <div className="p-4 sm:p-5 md:p-6 lg:p-8 pt-16 lg:pt-8 max-w-[100vw]">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarLayoutProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </SidebarLayoutProvider>
  );
}
