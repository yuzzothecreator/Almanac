"use client";

import { useMemo, useState } from "react";
import { isAfter, startOfToday } from "date-fns";
import { BookOpen } from "lucide-react";
import EventCard from "@/components/events/EventCard";
import { Button } from "@/components/ui/button";
import { mockEvents } from "@/data/mock";
import type { EventCategory } from "@/lib/types";

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

export default function EventsPage() {
  const [category, setCategory] = useState<"all" | EventCategory>("all");
  const today = startOfToday();

  const events = useMemo(() => {
    return mockEvents
      .filter((e) => e.status === "published" || e.status === "cancelled")
      .filter((e) => category === "all" || e.category === category)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [category]);

  const upcomingCount = events.filter(
    (e) => e.date && isAfter(new Date(e.date), today) && e.status === "published"
  ).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Events</h1>
        <p className="text-muted-foreground mt-1">
          {upcomingCount} upcoming · {events.length} total shown
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <Button
            key={c.value}
            size="sm"
            variant={category === c.value ? "default" : "outline"}
            onClick={() => setCategory(c.value)}
            className="rounded-full"
          >
            {c.label}
          </Button>
        ))}
      </div>

      {events.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event, i) => (
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
