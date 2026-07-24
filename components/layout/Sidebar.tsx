"use client";

import { useState } from "react";
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
  LayoutDashboard,
  Bell,
  LogOut,
  Menu,
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
  { path: "/admin", icon: Settings, label: "Admin Panel" },
  { path: "/admin/analytics", icon: BarChart3, label: "Analytics" },
  { path: "/admin/users", icon: Users, label: "Users" },
  { path: "/notifications", icon: Bell, label: "Notifications" },
];

export default function Sidebar() {
  const { collapsed, setCollapsed } = useSidebarLayout();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  const role = user?.role || "student";
  const items =
    role === "admin" ? adminNav : role === "staff" ? staffNav : studentNav;

  const handleLogout = () => {
    void logout(true);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Almanac" className="w-full h-full object-contain rounded-xl" />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="overflow-hidden"
          >
            <h1 className="text-lg font-bold text-sidebar-foreground tracking-tight">ALMANAC</h1>
            <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-widest">
              University Events
            </p>
          </motion.div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.path;
          const showBadge = item.path === "/notifications" && unreadCount > 0;
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
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
              {!collapsed && <span>{item.label}</span>}
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

      <div className="p-3 border-t border-sidebar-border space-y-2">
        {!collapsed && user && (
          <div className="px-3 py-2">
            <p className="text-xs text-sidebar-foreground/80 font-medium truncate">
              {user.full_name || user.email}
            </p>
            <p className="text-[10px] text-sidebar-foreground/40 capitalize">{user.role}</p>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-sidebar-foreground/60 hover:bg-destructive/10 hover:text-destructive transition-all w-full"
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed z-50 p-2.5 min-h-11 min-w-11 rounded-xl bg-card shadow-lg border relative top-[max(1rem,env(safe-area-inset-top))] left-[max(1rem,env(safe-area-inset-left))]"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-semibold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-[260px] bg-sidebar z-50"
            >
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-2.5 min-h-11 min-w-11 rounded-lg hover:bg-sidebar-accent flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="w-4 h-4 text-sidebar-foreground" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <aside
        className={`hidden lg:block fixed left-0 top-0 bottom-0 bg-sidebar border-r border-sidebar-border z-30 transition-all duration-300 ${
          collapsed ? "w-[72px]" : "w-[240px]"
        }`}
      >
        <SidebarContent />
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="absolute -right-3 top-20 w-8 h-8 rounded-full bg-card border shadow-sm flex items-center justify-center hover:bg-accent transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>
    </>
  );
}
