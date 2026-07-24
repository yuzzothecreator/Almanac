"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bell } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/AuthContext";
import type { SerializedNotification } from "@/lib/serializers";

export default function NotificationsPage() {
  const { user, isLoadingAuth } = useAuth();
  const [notifications, setNotifications] = useState<SerializedNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) {
      if (!isLoadingAuth) setLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/notifications?email=${encodeURIComponent(user.email)}`
        );
        if (res.ok) {
          const data = (await res.json()) as SerializedNotification[];
          if (!cancelled) setNotifications(data);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [user?.email, isLoadingAuth]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground mt-1">Stay updated on campus activity</p>
      </div>

      {loading || isLoadingAuth ? (
        <div className="text-sm text-muted-foreground">Loading notifications…</div>
      ) : notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`p-4 flex gap-3 ${n.is_read ? "" : "border-primary/30 bg-primary/5"}`}
            >
              <div className="mt-0.5 p-2 rounded-xl bg-primary/10 text-primary h-fit">
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm">{n.title}</h3>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(n.created_date), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground bg-card rounded-xl border">
          <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No notifications yet</p>
        </div>
      )}
    </div>
  );
}
