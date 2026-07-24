import { Card } from "@/components/ui/card";
import ProtectedShell from "@/components/ProtectedShell";
import AppLayout from "@/components/layout/AppLayout";

export default function AdminUsersPage() {
  return (
    <ProtectedShell roles={["admin"]}>
      <AppLayout>
        <div className="max-w-3xl mx-auto space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <Card className="p-6 text-muted-foreground">
            User role management placeholder.
          </Card>
        </div>
      </AppLayout>
    </ProtectedShell>
  );
}
