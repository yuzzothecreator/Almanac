"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, differenceInSeconds, isPast } from "date-fns";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Clock, MapPin, Timer, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AlmanacEvent, EventCategory } from "@/lib/types";

const categoryConfig: Record<EventCategory, { color: string; label: string }> = {
  academic: { color: "bg-blue-500/10 text-blue-600 border-blue-200", label: "Academic" },
  sports: { color: "bg-green-500/10 text-green-600 border-green-200", label: "Sports" },
  exams: { color: "bg-red-500/10 text-red-600 border-red-200", label: "Exams" },
  seminars: { color: "bg-purple-500/10 text-purple-600 border-purple-200", label: "Seminars" },
  conferences: {
    color: "bg-indigo-500/10 text-indigo-600 border-indigo-200",
    label: "Conferences",
  },
  workshops: { color: "bg-amber-500/10 text-amber-600 border-amber-200", label: "Workshops" },
  club_activities: {
    color: "bg-pink-500/10 text-pink-600 border-pink-200",
    label: "Club Activities",
  },
  government: { color: "bg-slate-500/10 text-slate-600 border-slate-200", label: "Government" },
  holiday: { color: "bg-teal-500/10 text-teal-600 border-teal-200", label: "Holiday" },
  emergency: {
    color: "bg-destructive/10 text-destructive border-destructive/20",
    label: "Emergency",
  },
};

const priorityConfig = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-blue-50 text-blue-600",
  high: "bg-amber-50 text-amber-600",
  urgent: "bg-red-50 text-red-600",
};

const statusConfig = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-green-50 text-green-600",
  cancelled: "bg-red-50 text-red-600",
  completed: "bg-slate-50 text-slate-500",
  rescheduled: "bg-amber-50 text-amber-600",
};

function Countdown({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = differenceInSeconds(targetDate, new Date());
      if (diff <= 0) {
        setTimeLeft("Started");
        return;
      }
      const d = Math.floor(diff / 86400);
      const h = Math.floor((diff % 86400) / 3600);
      const m = Math.floor((diff % 3600) / 60);
      if (d > 0) setTimeLeft(`${d}d ${h}h`);
      else if (h > 0) setTimeLeft(`${h}h ${m}m`);
      else setTimeLeft(`${m}m`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <span className="flex items-center gap-1 text-xs text-primary font-medium">
      <Timer className="w-3 h-3" /> {timeLeft}
    </span>
  );
}

interface EventCardProps {
  event: AlmanacEvent;
  index?: number;
}

export default function EventCard({ event, index = 0 }: EventCardProps) {
  const cat = categoryConfig[event.category] || categoryConfig.academic;
  const dateStr = String(event.date).split("T")[0];
  const eventDateTime = new Date(`${dateStr}T${event.start_time || "00:00"}`);
  const isUpcoming = !isPast(eventDateTime);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Card className="group overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 border-border/50">
        {event.banner_url && (
          <div className="h-40 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.banner_url}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex flex-wrap gap-1.5 min-w-0">
              <Badge variant="outline" className={`text-[10px] ${cat.color}`}>
                {cat.label}
              </Badge>
              {event.priority && event.priority !== "medium" && (
                <Badge className={`text-[10px] ${priorityConfig[event.priority]}`}>
                  {event.priority}
                </Badge>
              )}
            </div>
            <Badge className={`text-[10px] flex-shrink-0 ${statusConfig[event.status]}`}>
              {event.status}
            </Badge>
          </div>

          <h3 className="text-base font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors break-words">
            {event.title}
          </h3>

          {event.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2 break-words">
              {event.description}
            </p>
          )}

          <div className="space-y-1.5 mb-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{format(new Date(event.date), "EEE, MMM d, yyyy")}</span>
            </div>
            {event.start_time && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">
                  {event.start_time}
                  {event.end_time ? ` - ${event.end_time}` : ""}
                </span>
              </div>
            )}
            {event.venue && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{event.venue}</span>
              </div>
            )}
            {event.organizer && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                <User className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{event.organizer}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/50">
            {isUpcoming && event.status === "published" ? (
              <Countdown targetDate={eventDateTime} />
            ) : (
              <span className="text-xs text-muted-foreground">
                {event.status === "cancelled"
                  ? "Cancelled"
                  : isPast(eventDateTime)
                    ? "Past event"
                    : ""}
              </span>
            )}
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-xs gap-1 hover:text-primary min-h-9 flex-shrink-0"
            >
              <Link href={`/events/${event.id}`}>
                Details <ArrowRight className="w-3 h-3" />
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
