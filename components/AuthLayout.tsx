import type { LucideIcon } from "lucide-react";

interface AuthLayoutProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export default function AuthLayout({
  icon: Icon,
  title,
  subtitle,
  footer,
  children,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8 overflow-x-clip">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-black ring-1 ring-border mb-4 overflow-hidden shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Almanac"
              className="w-full h-full object-contain"
            />
          </div>
          {Icon && (
            <span className="sr-only">
              <Icon aria-hidden="true" />
            </span>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground break-words">
            {title}
          </h1>
          {subtitle && (
            <p className="text-muted-foreground mt-2 break-words px-1 text-sm sm:text-base">
              {subtitle}
            </p>
          )}
        </div>
        <div className="bg-card rounded-2xl shadow-sm border border-border p-5 sm:p-8">
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6 break-words">
            {footer}
          </p>
        )}
      </div>
    </div>
  );
}
