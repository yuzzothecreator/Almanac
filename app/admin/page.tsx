import { Card } from "@/components/ui/card";
import ProtectedShell from "@/components/ProtectedShell";
import AppLayout from "@/components/layout/AppLayout";

export default function AdminPage() {
  return (
    <ProtectedShell roles={["staff", "admin"]}>
      <AppLayout>
        <div className="max-w-3xl mx-auto space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
          <Card className="p-6 text-muted-foreground">
            Event management tools will live here — auth and role gates are ready
            (staff/admin).
          </Card>
        </div>
      </AppLayout>
    </ProtectedShell>
  );
}
