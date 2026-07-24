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
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { useAuthedFetch } from "@/lib/useAuthedFetch";
import { playNotificationSound } from "@/lib/notification-sound";
import type { SerializedNotification } from "@/lib/serializers";
import type { AlmanacEvent } from "@/lib/types";

type NotificationsContextValue = {
  notifications: SerializedNotification[];
  unreadCount: number;
  loading: boolean;
  refresh: (opts?: { detect?: boolean; silent?: boolean }) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  openNotification: (notification: SerializedNotification) => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

const POLL_MS = 30_000;
const EVENT_CHECK_MS = 15_000;
const START_WINDOW_MS = 2 * 60 * 1000; // alert within 2 minutes of start
const ALERTED_EVENTS_KEY = "almanac_alerted_event_starts";

function getEventStartMs(event: AlmanacEvent): number | null {
  if (!event.date) return null;
  const dateStr = String(event.date).split("T")[0];
  const time = event.start_time || "00:00";
  const ms = new Date(`${dateStr}T${time}:00`).getTime();
  return Number.isNaN(ms) ? null : ms;
}

function loadAlertedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(ALERTED_EVENTS_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveAlertedIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ALERTED_EVENTS_KEY, JSON.stringify([...ids]));
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const authedFetch = useAuthedFetch();
  const [notifications, setNotifications] = useState<SerializedNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const primedRef = useRef(false);
  const alertedStartsRef = useRef<Set<string>>(loadAlertedIds());
  const eventsCacheRef = useRef<AlmanacEvent[]>([]);

  // Browsers require a user gesture before AudioContext can play sound
  useEffect(() => {
    const warm = () => {
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        const ctx = new AudioCtx();
        void ctx.resume().finally(() => void ctx.close());
      } catch {
        // ignore
      }
    };
    window.addEventListener("pointerdown", warm, { once: true });
    window.addEventListener("keydown", warm, { once: true });
    return () => {
      window.removeEventListener("pointerdown", warm);
      window.removeEventListener("keydown", warm);
    };
  }, []);

  const showPopup = useCallback(
    (opts: {
      title: string;
      message: string;
      href: string;
      withSound?: boolean;
    }) => {
      if (opts.withSound !== false) {
        playNotificationSound();
      }

      toast(opts.title, {
        description: opts.message,
        duration: 10_000,
        action: {
          label: "View event",
          onClick: () => {
            router.push(opts.href);
          },
        },
      });
    },
    [router]
  );

  const openNotification = useCallback(
    async (notification: SerializedNotification) => {
      if (!notification.is_read) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
        );
        void authedFetch(`/api/notifications/${notification.id}`, {
          method: "PATCH",
          body: JSON.stringify({ is_read: true }),
        });
      }

      if (notification.event_id) {
        router.push(`/events/${notification.event_id}`);
      }
    },
    [router, authedFetch]
  );

  const refresh = useCallback(
    async (opts?: { detect?: boolean; silent?: boolean }) => {
      if (!user?.email) return;

      if (!opts?.silent) setLoading(true);
      try {
        const detect = opts?.detect ?? true;
        const res = await authedFetch(
          `/api/notifications?detect=${detect ? "1" : "0"}`
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
            const href = n.event_id ? `/events/${n.event_id}` : "/notifications";
            showPopup({
              title: n.title,
              message: n.message,
              href,
              withSound: true,
            });
          }
          knownIdsRef.current = currentIds;
        }
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [user?.email, showPopup, authedFetch]
  );

  const checkEventStarts = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      if (eventsCacheRef.current.length === 0) {
        const res = await fetch("/api/events");
        if (!res.ok) return;
        const data = (await res.json()) as AlmanacEvent[];
        eventsCacheRef.current = data.filter((e) => e.status === "published");
      }

      const now = Date.now();
      for (const event of eventsCacheRef.current) {
        const startMs = getEventStartMs(event);
        if (startMs == null) continue;

        const delta = now - startMs;
        // Fire when event has started, within the alert window
        if (delta < 0 || delta > START_WINDOW_MS) continue;
        if (alertedStartsRef.current.has(event.id)) continue;

        alertedStartsRef.current.add(event.id);
        saveAlertedIds(alertedStartsRef.current);

        showPopup({
          title: "Event starting now",
          message: `${event.title}${event.venue ? ` · ${event.venue}` : ""}${
            event.start_time ? ` at ${event.start_time}` : ""
          }`,
          href: `/events/${event.id}`,
          withSound: true,
        });
      }
    } catch (error) {
      console.warn("Event start check failed:", error);
    }
  }, [isAuthenticated, showPopup]);

  useEffect(() => {
    if (isLoadingAuth) return;

    if (!isAuthenticated || !user?.email) {
      setNotifications([]);
      knownIdsRef.current = new Set();
      primedRef.current = false;
      eventsCacheRef.current = [];
      return;
    }

    void refresh({ detect: true });
    void checkEventStarts();

    const notifInterval = setInterval(() => {
      void refresh({ detect: true, silent: true });
    }, POLL_MS);

    const eventInterval = setInterval(() => {
      // Refresh event cache periodically so new events are watched
      eventsCacheRef.current = [];
      void checkEventStarts();
    }, EVENT_CHECK_MS);

    const onFocus = () => {
      void refresh({ detect: true, silent: true });
      void checkEventStarts();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(notifInterval);
      clearInterval(eventInterval);
      window.removeEventListener("focus", onFocus);
    };
  }, [isAuthenticated, isLoadingAuth, user?.email, refresh, checkEventStarts]);

  const markRead = useCallback(
    async (id: string) => {
      if (!user?.email) return;

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );

      await authedFetch(`/api/notifications/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_read: true }),
      });
    },
    [user?.email, authedFetch]
  );

  const markAllRead = useCallback(async () => {
    if (!user?.email) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    await authedFetch("/api/notifications/mark-all-read", {
      method: "POST",
      body: JSON.stringify({}),
    });
  }, [user?.email, authedFetch]);

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
      openNotification,
    }),
    [notifications, unreadCount, loading, refresh, markRead, markAllRead, openNotification]
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
