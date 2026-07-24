"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import type { SerializedNotification } from "@/lib/serializers";

type NotificationsContextValue = {
  notifications: SerializedNotification[];
  unreadCount: number;
  loading: boolean;
  refresh: (opts?: { detect?: boolean; silent?: boolean }) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

const POLL_MS = 30_000;

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const [notifications, setNotifications] = useState<SerializedNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const primedRef = useRef(false);

  const refresh = useCallback(
    async (opts?: { detect?: boolean; silent?: boolean }) => {
      if (!user?.email) return;

      if (!opts?.silent) setLoading(true);
      try {
        const detect = opts?.detect ?? true;
        const res = await fetch(
          `/api/notifications?email=${encodeURIComponent(user.email)}&detect=${
            detect ? "1" : "0"
          }`
        );
        if (!res.ok) return;

        const data = (await res.json()) as SerializedNotification[];
        setNotifications(data);

        const currentIds = new Set(data.map((n) => n.id));

        if (!primedRef.current) {
          knownIdsRef.current = currentIds;
          primedRef.current = true;
        } else {
          const newcomers = data.filter(
            (n) => !n.is_read && !knownIdsRef.current.has(n.id)
          );
          for (const n of newcomers.slice(0, 3)) {
            toast(n.title, {
              description: n.message,
              action: {
                label: "View",
                onClick: () => {
                  window.location.href = "/notifications";
                },
              },
            });
          }
          knownIdsRef.current = currentIds;
        }
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [user?.email]
  );

  useEffect(() => {
    if (isLoadingAuth) return;

    if (!isAuthenticated || !user?.email) {
      setNotifications([]);
      knownIdsRef.current = new Set();
      primedRef.current = false;
      return;
    }

    void refresh({ detect: true });

    const interval = setInterval(() => {
      void refresh({ detect: true, silent: true });
    }, POLL_MS);

    const onFocus = () => {
      void refresh({ detect: true, silent: true });
    };
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [isAuthenticated, isLoadingAuth, user?.email, refresh]);

  const markRead = useCallback(
    async (id: string) => {
      if (!user?.email) return;

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );

      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, is_read: true }),
      });
    },
    [user?.email]
  );

  const markAllRead = useCallback(async () => {
    if (!user?.email) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    await fetch("/api/notifications/mark-all-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email }),
    });
  }, [user?.email]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      refresh,
      markRead,
      markAllRead,
    }),
    [notifications, unreadCount, loading, refresh, markRead, markAllRead]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return context;
}
