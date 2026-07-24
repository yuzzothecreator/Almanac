"use client";

import { useEffect, useState } from "react";
import { isPast } from "date-fns";
import { Check, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { useNotifications } from "@/components/notifications/NotificationsProvider";
import type { AlmanacEvent } from "@/lib/types";

interface EventRegisterSectionProps {
  event: AlmanacEvent;
}

export default function EventRegisterSection({ event }: EventRegisterSectionProps) {
  const { user } = useAuth();
  const { refresh } = useNotifications();
  const [count, setCount] = useState(0);
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const dateStr = String(event.date).split("T")[0];
  const eventDateTime = new Date(`${dateStr}T${event.start_time || "00:00"}`);
  const isUpcoming = !isPast(eventDateTime) && event.status === "published";
  const isFull =
    event.max_capacity != null && event.max_capacity > 0 && count >= event.max_capacity;

  useEffect(() => {
    if (!event.id) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ eventId: event.id });
        if (user?.email) params.set("email", user.email);
        const res = await fetch(`/api/registrations?${params.toString()}`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          count: number;
          registered: boolean;
        };
        if (!cancelled) {
          setCount(data.count);
          setRegistered(data.registered);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [event.id, user?.email]);

  const handleRegister = async () => {
    if (!user?.email) {
      toast.error("Please sign in to register.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          email: user.email,
          fullName: user.full_name,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        created?: boolean;
      };

      if (!res.ok) {
        toast.error(data.message || "Registration failed.");
        return;
      }

      setRegistered(true);
      setCount((c) => (data.created === false ? c : c + 1));
      toast.success(
        data.created === false ? "You are already registered." : "Successfully registered!"
      );
      void refresh({ detect: false, silent: true });
    } catch {
      toast.error("Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!user?.email) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/registrations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          email: user.email,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        toast.error(data.message || "Could not cancel registration.");
        return;
      }

      setRegistered(false);
      setCount((c) => Math.max(0, c - 1));
      toast.success("Registration cancelled.");
    } catch {
      toast.error("Could not cancel registration.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="w-4 h-4" />
        {loading ? (
          <span>Loading registrations…</span>
        ) : (
          <span>
            {count} registered
            {event.max_capacity != null ? ` / ${event.max_capacity} capacity` : ""}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {isUpcoming && !registered && !isFull && (
          <Button
            className="w-full sm:w-auto"
            onClick={() => void handleRegister()}
            disabled={submitting || loading || !user}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Registering…
              </>
            ) : (
              "Register for event"
            )}
          </Button>
        )}

        {registered && (
          <>
            <Button
              className="w-full sm:w-auto bg-green-600 hover:bg-green-600 text-white"
              disabled
            >
              <Check className="w-4 h-4 mr-1" /> Registered
            </Button>
            {isUpcoming && (
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => void handleCancel()}
                disabled={submitting}
              >
                Cancel registration
              </Button>
            )}
          </>
        )}

        {isFull && !registered && (
          <Button className="w-full sm:w-auto" variant="outline" disabled>
            Event full
          </Button>
        )}

        {!isUpcoming && event.status === "published" && !registered && (
          <Button className="w-full sm:w-auto" variant="outline" disabled>
            Registration closed
          </Button>
        )}

        {event.status === "cancelled" && (
          <Button className="w-full sm:w-auto" variant="outline" disabled>
            Event cancelled
          </Button>
        )}
      </div>
    </div>
  );
}
