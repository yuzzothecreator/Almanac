import AppLayout from "@/components/layout/AppLayout";
import ProtectedShell from "@/components/ProtectedShell";

export const dynamic = "force-dynamic";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedShell>
      <AppLayout>{children}</AppLayout>
    </ProtectedShell>
  );
}
