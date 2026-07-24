import { Card } from "@/components/ui/card";
import ProtectedShell from "@/components/ProtectedShell";
import AppLayout from "@/components/layout/AppLayout";

export default function AdminAnalyticsPage() {
  return (
    <ProtectedShell roles={["admin"]}>
      <AppLayout>
        <div className="max-w-3xl mx-auto space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <Card className="p-6 text-muted-foreground">
            Admin analytics dashboard placeholder.
          </Card>
        </div>
      </AppLayout>
    </ProtectedShell>
  );
}
