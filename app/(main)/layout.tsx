import AppLayout from "@/components/layout/AppLayout";
import { getDemoUser } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getDemoUser();
  return <AppLayout user={user}>{children}</AppLayout>;
}
