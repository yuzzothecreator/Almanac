"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { format, isSameDay, parseISO } from "date-fns";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import EventCard from "@/components/events/EventCard";
import type { AlmanacEvent } from "@/lib/types";

interface CalendarViewProps {
  events: AlmanacEvent[];
}

function CalendarContent({ events }: CalendarViewProps) {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");
  const initial = dateParam ? parseISO(dateParam) : new Date();
  const [selectedDate, setSelectedDate] = useState(initial);

  const published = events.filter((e) => e.status === "published");
  const dayEvents = useMemo(
    () => published.filter((e) => e.date && isSameDay(new Date(e.date), selectedDate)),
    [published, selectedDate]
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Campus events for {format(selectedDate, "MMMM d, yyyy")}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          <CalendarGrid
            events={published}
            selectedDate={selectedDate}
            onDateClick={setSelectedDate}
          />
        </div>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{format(selectedDate, "EEE, MMM d")}</h2>
          {dayEvents.length > 0 ? (
            dayEvents.map((event, i) => (
              <EventCard key={event.id} event={event} index={i} />
            ))
          ) : (
            <div className="text-sm text-muted-foreground bg-card border rounded-xl p-6 text-center">
              No events on this day
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CalendarView({ events }: CalendarViewProps) {
  return (
    <Suspense fallback={<div className="text-muted-foreground">Loading calendar…</div>}>
      <CalendarContent events={events} />
    </Suspense>
  );
}
