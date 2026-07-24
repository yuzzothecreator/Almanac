import ProtectedShell from "@/components/ProtectedShell";
import AppLayout from "@/components/layout/AppLayout";
import AdminUsersView from "@/components/views/AdminUsersView";

export default function AdminUsersPage() {
  return (
    <ProtectedShell roles={["admin", "super_admin"]}>
      <AppLayout>
        <AdminUsersView />
      </AppLayout>
    </ProtectedShell>
  );
}
