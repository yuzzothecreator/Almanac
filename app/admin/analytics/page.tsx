import ProtectedShell from "@/components/ProtectedShell";
import AppLayout from "@/components/layout/AppLayout";
import AdminAnalyticsView from "@/components/views/AdminAnalyticsView";

export default function AdminAnalyticsPage() {
  return (
    <ProtectedShell roles={["admin"]}>
      <AppLayout>
        <AdminAnalyticsView />
      </AppLayout>
    </ProtectedShell>
  );
}
