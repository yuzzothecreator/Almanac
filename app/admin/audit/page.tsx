import ProtectedShell from "@/components/ProtectedShell";
import AppLayout from "@/components/layout/AppLayout";
import AdminAuditView from "@/components/views/AdminAuditView";

export default function AdminAuditPage() {
  return (
    <ProtectedShell roles={["admin", "super_admin"]}>
      <AppLayout>
        <AdminAuditView />
      </AppLayout>
    </ProtectedShell>
  );
}
