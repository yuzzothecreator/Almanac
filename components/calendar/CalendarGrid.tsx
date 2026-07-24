"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AlmanacEvent, EventCategory } from "@/lib/types";

const categoryDots: Record<EventCategory, string> = {
  academic: "bg-blue-500",
  sports: "bg-green-500",
  exams: "bg-red-500",
  seminars: "bg-purple-500",
  conferences: "bg-indigo-500",
  workshops: "bg-amber-500",
  club_activities: "bg-pink-500",
  government: "bg-slate-500",
  holiday: "bg-teal-500",
  emergency: "bg-red-600",
};

const weekDaysFull = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const weekDaysShort = ["M", "T", "W", "T", "F", "S", "S"];

interface CalendarGridProps {
  events?: AlmanacEvent[];
  onDateClick?: (date: Date) => void;
  selectedDate?: Date;
  compact?: boolean;
}

export default function CalendarGrid({
  events = [],
  onDateClick,
  selectedDate,
  compact = false,
}: CalendarGridProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, AlmanacEvent[]> = {};
    events.forEach((e) => {
      if (!e.date) return;
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [events]);

  return (
    <Card className={compact ? "p-3 sm:p-4" : "p-3 sm:p-4 md:p-6"}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-bold truncate">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {
              events.filter(
                (e) => e.date && isSameMonth(new Date(e.date), currentMonth)
              ).length
            }{" "}
            events this month
          </p>
        </div>
        <div className="flex gap-1 self-start sm:self-auto">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 min-h-9 min-w-9"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 min-h-9 text-xs px-3"
            onClick={() => setCurrentMonth(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 min-h-9 min-w-9"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5 sm:gap-px">
        {weekDaysFull.map((d, idx) => (
          <div
            key={`${d}-${idx}`}
            className="text-center text-[10px] sm:text-xs font-medium text-muted-foreground py-1.5 sm:py-2"
          >
            <span className="sm:hidden">{weekDaysShort[idx]}</span>
            <span className="hidden sm:inline">{d}</span>
          </div>
        ))}
        <AnimatePresence mode="wait">
          {days.map((day, i) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayEvents = eventsByDate[dateKey] || [];
            const inMonth = isSameMonth(day, currentMonth);
            const today = isToday(day);
            const selected = selectedDate && isSameDay(day, selectedDate);

            return (
              <motion.button
                key={dateKey}
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.005 }}
                onClick={() => onDateClick?.(day)}
                className={`relative p-1 sm:p-1.5 min-w-0 ${
                  compact
                    ? "min-h-[44px] sm:min-h-[48px]"
                    : "min-h-[44px] sm:min-h-[60px] md:min-h-[80px]"
                } text-left rounded-lg transition-all border border-transparent hover:border-primary/20 hover:bg-accent/50
                  ${!inMonth ? "opacity-30" : ""}
                  ${today ? "bg-primary/5 ring-1 ring-primary/30" : ""}
                  ${selected ? "bg-primary/10 ring-2 ring-primary" : ""}
                `}
              >
                <span
                  className={`text-[11px] sm:text-xs font-medium ${
                    today ? "text-primary font-bold" : ""
                  }`}
                >
                  {format(day, "d")}
                </span>
                {dayEvents.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, compact ? 1 : 2).map((ev) => (
                      <div key={ev.id} className="flex items-center gap-1 min-w-0">
                        <div
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            categoryDots[ev.category] || "bg-primary"
                          }`}
                        />
                        {!compact && (
                          <span className="hidden md:inline text-[9px] truncate text-foreground/80 leading-tight">
                            {ev.title}
                          </span>
                        )}
                      </div>
                    ))}
                    {dayEvents.length > (compact ? 1 : 2) && (
                      <span className="hidden md:inline text-[9px] text-muted-foreground">
                        +{dayEvents.length - (compact ? 1 : 2)} more
                      </span>
                    )}
                  </div>
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </Card>
  );
}
