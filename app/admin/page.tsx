import ProtectedShell from "@/components/ProtectedShell";
import AppLayout from "@/components/layout/AppLayout";
import AdminPanelView from "@/components/views/AdminPanelView";

export default function AdminPage() {
  return (
    <ProtectedShell roles={["staff", "admin", "super_admin"]}>
      <AppLayout>
        <AdminPanelView />
      </AppLayout>
    </ProtectedShell>
  );
}
