"use client";

import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Bell,
  Calendar,
  Check,
  CheckCheck,
  ChevronRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNotifications } from "@/components/notifications/NotificationsProvider";

const typeConfig: Record<
  string,
  { icon: typeof Bell; color: string }
> = {
  event_reminder: { icon: Calendar, color: "text-blue-500" },
  schedule_change: { icon: AlertCircle, color: "text-amber-500" },
  cancellation: { icon: AlertCircle, color: "text-red-500" },
  registration: { icon: Check, color: "text-green-500" },
  announcement: { icon: Info, color: "text-primary" },
  reminder: { icon: Calendar, color: "text-blue-500" },
  event: { icon: Calendar, color: "text-blue-500" },
  system: { icon: Bell, color: "text-muted-foreground" },
};

export default function NotificationsView() {
  const { notifications, unreadCount, loading, markAllRead, openNotification } =
    useNotifications();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-3"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {loading
              ? "Checking for updates…"
              : unreadCount > 0
                ? `${unreadCount} unread`
                : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => void markAllRead()}
            className="gap-1.5"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </Button>
        )}
      </motion.div>

      {notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((notif, i) => {
            const config = typeConfig[notif.type] || typeConfig.system;
            const Icon = config.icon;
            const hasEvent = Boolean(notif.event_id);

            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card
                  role="button"
                  tabIndex={0}
                  className={`p-4 flex items-start gap-3 transition-colors cursor-pointer hover:bg-accent/50 ${
                    !notif.is_read ? "bg-primary/5 border-primary/20" : ""
                  }`}
                  onClick={() => void openNotification(notif)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      void openNotification(notif);
                    }
                  }}
                >
                  <div className={`p-2 rounded-lg bg-muted ${config.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-sm font-medium truncate">{notif.title}</h4>
                      {!notif.is_read && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notif.message}
                    </p>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(notif.created_date), "MMM d, h:mm a")}
                      </p>
                      {hasEvent && (
                        <span className="text-[10px] text-primary font-medium inline-flex items-center gap-0.5">
                          View event <ChevronRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <Bell className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">
            {loading ? "Looking for notifications…" : "No notifications yet"}
          </p>
          <p className="text-sm mt-1">
            Upcoming event reminders and start alerts will appear here
          </p>
        </div>
      )}
    </div>
  );
}
