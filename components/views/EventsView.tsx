"use client";

import { useMemo, useState } from "react";
import { isAfter, startOfToday } from "date-fns";
import { BookOpen } from "lucide-react";
import EventCard from "@/components/events/EventCard";
import { Button } from "@/components/ui/button";
import type { AlmanacEvent, EventCategory } from "@/lib/types";

const categories: Array<{ value: "all" | EventCategory; label: string }> = [
  { value: "all", label: "All" },
  { value: "academic", label: "Academic" },
  { value: "sports", label: "Sports" },
  { value: "exams", label: "Exams" },
  { value: "seminars", label: "Seminars" },
  { value: "workshops", label: "Workshops" },
  { value: "club_activities", label: "Clubs" },
  { value: "holiday", label: "Holiday" },
];

interface EventsViewProps {
  events: AlmanacEvent[];
}

export default function EventsView({ events }: EventsViewProps) {
  const [category, setCategory] = useState<"all" | EventCategory>("all");
  const today = startOfToday();

  const filtered = useMemo(() => {
    return events
      .filter((e) => e.status === "published" || e.status === "cancelled")
      .filter((e) => category === "all" || e.category === category)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [events, category]);

  const upcomingCount = filtered.filter(
    (e) => e.date && isAfter(new Date(e.date), today) && e.status === "published"
  ).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Events</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          {upcomingCount} upcoming · {filtered.length} total shown
        </p>
      </div>

      <div className="-mx-1 px-1 flex gap-2 overflow-x-auto pb-1 scrollbar-thin sm:flex-wrap sm:overflow-visible">
        {categories.map((c) => (
          <Button
            key={c.value}
            size="sm"
            variant={category === c.value ? "default" : "outline"}
            onClick={() => setCategory(c.value)}
            className="rounded-full min-h-9 flex-shrink-0"
          >
            {c.label}
          </Button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((event, i) => (
            <EventCard key={event.id} event={event} index={i} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground bg-card rounded-xl border">
          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No events in this category</p>
        </div>
      )}
    </div>
  );
}
