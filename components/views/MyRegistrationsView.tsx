"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  CalendarDays,
  CalendarPlus,
  ClipboardList,
  MapPin,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/AuthContext";
import type { UserRegistrationItem } from "@/lib/data";
import { useAuthedFetch } from "@/lib/useAuthedFetch";

export default function MyRegistrationsView() {
  const { user, isLoadingAuth } = useAuth();
  const authedFetch = useAuthedFetch();
  const [items, setItems] = useState<UserRegistrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await authedFetch("/api/me/registrations");
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(err.message || "Failed to load");
      }
      setItems((await res.json()) as UserRegistrationItem[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [authedFetch, user?.email]);

  useEffect(() => {
    if (!isLoadingAuth) void load();
  }, [isLoadingAuth, load]);

  const cancel = async (eventId: string) => {
    if (!user?.email) return;
    if (!confirm("Cancel this registration?")) return;
    setBusyId(eventId);
    try {
      const res = await authedFetch("/api/registrations", {
        method: "DELETE",
        body: JSON.stringify({ eventId }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(err.message || "Cancel failed");
      }
      toast.success("Registration cancelled");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cancel failed");
    } finally {
      setBusyId(null);
    }
  };

  const exportCalendar = async () => {
    try {
      const res = await authedFetch("/api/me/calendar");
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(err.message || "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "my-almanac-events.ics";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Calendar exported");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary flex-shrink-0" />
            My Registrations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Events you signed up for
          </p>
        </div>
        {items.length > 0 && (
          <Button
            type="button"
            variant="outline"
            className="gap-2 w-full sm:w-auto"
            onClick={() => void exportCalendar()}
          >
            <CalendarPlus className="w-4 h-4" /> Export all (.ics)
          </Button>
        )}
      </motion.div>

      {loading || isLoadingAuth ? (
        <p className="text-sm text-muted-foreground">Loading registrations…</p>
      ) : items.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground border-dashed">
          <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No registrations yet</p>
          <Button asChild variant="link" className="mt-2">
            <Link href="/events">Browse events</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.registration_id} className="p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/events/${item.event.id}`}
                      className="font-semibold text-foreground hover:text-primary break-words"
                    >
                      {item.event.title}
                    </Link>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {item.status}
                    </Badge>
                    <Badge className="text-[10px] capitalize">
                      {item.event.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {format(new Date(item.event.date), "EEE, MMM d, yyyy")}
                      {item.event.start_time ? ` · ${item.event.start_time}` : ""}
                    </span>
                    {item.event.venue && (
                      <span className="inline-flex items-center gap-1 min-w-0">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{item.event.venue}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Registered{" "}
                    {format(new Date(item.registered_at), "MMM d, yyyy")}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button asChild variant="outline" size="sm" className="gap-1.5">
                    <a href={`/api/events/${item.event.id}/ics`}>
                      <CalendarPlus className="w-3.5 h-3.5" /> Add to calendar
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-destructive hover:text-destructive"
                    disabled={busyId === item.event.id}
                    onClick={() => void cancel(item.event.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Cancel
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
