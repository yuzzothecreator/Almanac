"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Bookmark,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  Bell,
  LogOut,
  Menu,
  ScrollText,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useNotifications } from "@/components/notifications/NotificationsProvider";
import { useSidebarLayout } from "@/components/layout/SidebarLayoutContext";

const studentNav = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/calendar", icon: Calendar, label: "Calendar" },
  { path: "/events", icon: BookOpen, label: "Events" },
  { path: "/registrations", icon: ClipboardList, label: "My Registrations" },
  { path: "/bookmarks", icon: Bookmark, label: "Bookmarks" },
  { path: "/notifications", icon: Bell, label: "Notifications" },
];

const staffNav = [
  ...studentNav,
  { path: "/admin", icon: Settings, label: "Admin Panel" },
];

const adminNav = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/calendar", icon: Calendar, label: "Calendar" },
  { path: "/events", icon: BookOpen, label: "Events" },
  { path: "/registrations", icon: ClipboardList, label: "My Registrations" },
  { path: "/admin", icon: Settings, label: "Admin Panel" },
  { path: "/admin/analytics", icon: BarChart3, label: "Analytics" },
  { path: "/admin/users", icon: Users, label: "Users" },
  { path: "/admin/audit", icon: ScrollText, label: "Audit Log" },
  { path: "/notifications", icon: Bell, label: "Notifications" },
];

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden bg-white/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Almanac"
          className="w-full h-full object-contain rounded-xl"
        />
      </div>
      {!compact && (
        <div className="overflow-hidden min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-sidebar-foreground tracking-tight leading-tight truncate">
            ALMANAC
          </h1>
          <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-widest truncate">
            University Events
          </p>
        </div>
      )}
    </div>
  );
}

function NavLinks({
  items,
  pathname,
  unreadCount,
  collapsed,
  onNavigate,
}: {
  items: typeof studentNav;
  pathname: string;
  unreadCount: number;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
      {items.map((item) => {
        const isActive = pathname === item.path;
        const showBadge = item.path === "/notifications" && unreadCount > 0;
        return (
          <Link
            key={item.path}
            href={item.path}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2.5 min-h-11 rounded-xl text-sm font-medium transition-all duration-200 group
              ${
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/20"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
          >
            <span className="relative flex-shrink-0">
              <item.icon
                className={`w-5 h-5 ${
                  isActive ? "" : "group-hover:scale-110 transition-transform"
                }`}
              />
              {showBadge && collapsed && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
              )}
            </span>
            {!collapsed && <span className="truncate">{item.label}</span>}
            {showBadge && !collapsed && (
              <span className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
            {isActive && !collapsed && !showBadge && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export default function Sidebar() {
  const { collapsed, setCollapsed } = useSidebarLayout();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  const role = user?.role || "student";
  const items =
    role === "admin" || role === "super_admin"
      ? adminNav
      : role === "staff"
        ? staffNav
        : studentNav;

  // Lock body scroll while mobile drawer is open
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    void logout(true);
  };

  return (
    <>
      {/* Mobile top bar — logo + menu, not a floating orphan button */}
      <header
        className="lg:hidden fixed top-0 inset-x-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
        }}
      >
        <div className="h-14 px-3 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl flex-shrink-0 overflow-hidden bg-card border border-border/60">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Almanac"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-tight text-foreground leading-none">
                ALMANAC
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5 truncate">
                University Events
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="relative inline-flex items-center justify-center h-10 w-10 rounded-xl border border-border bg-card text-foreground hover:bg-accent transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-semibold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Mobile drawer — always expanded labels; desktop collapse does not affect it */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-[min(288px,86vw)] bg-sidebar z-[60] flex flex-col shadow-2xl"
              style={{ paddingTop: "env(safe-area-inset-top)" }}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
            >
              <div className="h-14 px-3 flex items-center justify-between gap-2 border-b border-sidebar-border flex-shrink-0">
                <BrandMark />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center justify-center h-10 w-10 rounded-xl hover:bg-sidebar-accent text-sidebar-foreground flex-shrink-0"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <NavLinks
                items={items}
                pathname={pathname}
                unreadCount={unreadCount}
                collapsed={false}
                onNavigate={() => setMobileOpen(false)}
              />

              <div className="p-3 border-t border-sidebar-border space-y-2 flex-shrink-0">
                {user && (
                  <div className="px-3 py-2 min-w-0">
                    <p className="text-xs text-sidebar-foreground/80 font-medium truncate">
                      {user.full_name || user.email}
                    </p>
                    <p className="text-[10px] text-sidebar-foreground/40 capitalize">
                      {user.role}
                    </p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2.5 min-h-11 rounded-xl text-sm text-sidebar-foreground/60 hover:bg-destructive/10 hover:text-destructive transition-all w-full"
                >
                  <LogOut className="w-5 h-5 flex-shrink-0" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 bg-sidebar border-r border-sidebar-border z-30 transition-all duration-300 ${
          collapsed ? "w-[72px]" : "w-[240px]"
        }`}
      >
        <div
          className={`p-4 flex items-center ${
            collapsed ? "justify-center" : "gap-3"
          }`}
        >
          <BrandMark compact={collapsed} />
        </div>

        <NavLinks
          items={items}
          pathname={pathname}
          unreadCount={unreadCount}
          collapsed={collapsed}
        />

        <div className="p-3 border-t border-sidebar-border space-y-2">
          {!collapsed && user && (
            <div className="px-3 py-2 min-w-0">
              <p className="text-xs text-sidebar-foreground/80 font-medium truncate">
                {user.full_name || user.email}
              </p>
              <p className="text-[10px] text-sidebar-foreground/40 capitalize">
                {user.role}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-2.5 min-h-11 rounded-xl text-sm text-sidebar-foreground/60 hover:bg-destructive/10 hover:text-destructive transition-all w-full ${
              collapsed ? "justify-center" : ""
            }`}
            title="Sign Out"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="absolute -right-3 top-20 w-8 h-8 rounded-full bg-card border shadow-sm flex items-center justify-center hover:bg-accent transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </button>
      </aside>
    </>
  );
}
