import PublicOnlyShell from "@/components/PublicOnlyShell";

export default function AuthGroupLayout({ children }: { children: React.ReactNode }) {
  return <PublicOnlyShell>{children}</PublicOnlyShell>;
}
