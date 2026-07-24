"use client";

import ProtectedShell from "@/components/ProtectedShell";
import AppLayout from "@/components/layout/AppLayout";
import MyRegistrationsView from "@/components/views/MyRegistrationsView";

export default function RegistrationsPage() {
  return (
    <ProtectedShell>
      <AppLayout>
        <MyRegistrationsView />
      </AppLayout>
    </ProtectedShell>
  );
}
