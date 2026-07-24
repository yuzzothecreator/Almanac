"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, isAfter, startOfToday } from "date-fns";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  Clock,
  TrendingUp,
  Users,
} from "lucide-react";
import AlmanacDisplayCard from "@/components/dashboard/AlmanacDisplayCard";
import StatsCard from "@/components/dashboard/StatsCard";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import EventCard from "@/components/events/EventCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import type { AlmanacEvent } from "@/lib/types";
import type { SerializedAlmanac } from "@/lib/serializers";

interface HomeViewProps {
  events: AlmanacEvent[];
  registrationCount: number;
  almanac: SerializedAlmanac | null;
}

export default function HomeView({
  events,
  registrationCount,
  almanac,
}: HomeViewProps) {
  const router = useRouter();
  const { user } = useAuth();
  const today = startOfToday();
  const firstName =
    user?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "User";

  const publishedEvents = events.filter((e) => e.status === "published");
  const upcomingEvents = publishedEvents.filter(
    (e) => e.date && isAfter(new Date(e.date), today)
  );
  const cancelledEvents = events.filter((e) => e.status === "cancelled");
  const featuredEvents = upcomingEvents.filter((e) => e.is_featured).slice(0, 3);
  const nextEvents = upcomingEvents.slice(0, 6);
  const canManage = user?.role === "admin" || user?.role === "staff";

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <p className="text-sm text-muted-foreground mb-1">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Welcome back, <span className="text-gradient">{firstName}</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            {upcomingEvents.length} upcoming events on your campus
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/calendar">
              <Calendar className="w-4 h-4" /> Calendar
            </Link>
          </Button>
          {canManage ? (
            <Button asChild className="gap-2">
              <Link href="/admin">
                <BookOpen className="w-4 h-4" /> Manage Events
              </Link>
            </Button>
          ) : (
            <Button asChild className="gap-2">
              <Link href="/events">
                <BookOpen className="w-4 h-4" /> Browse Events
              </Link>
            </Button>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Events"
          value={events.length}
          icon={BookOpen}
          color="primary"
          index={0}
        />
        <StatsCard
          title="Upcoming"
          value={upcomingEvents.length}
          icon={Clock}
          color="blue"
          index={1}
        />
        <StatsCard
          title="Registrations"
          value={registrationCount}
          icon={Users}
          color="green"
          index={2}
        />
        <StatsCard
          title="Cancelled"
          value={cancelledEvents.length}
          icon={AlertTriangle}
          color="red"
          index={3}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <AlmanacDisplayCard almanac={almanac} />

          {featuredEvents.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" /> Featured Events
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {featuredEvents.map((event, i) => (
                  <EventCard key={event.id} event={event} index={i} />
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold">Upcoming Events</h2>
              <Link href="/events" className="text-sm text-primary hover:underline">
                View all
              </Link>
            </div>
            {nextEvents.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {nextEvents.map((event, i) => (
                  <EventCard key={event.id} event={event} index={i} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No upcoming events</p>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <CalendarGrid
            events={publishedEvents}
            compact
            onDateClick={(date) =>
              router.push(`/calendar?date=${format(date, "yyyy-MM-dd")}`)
            }
          />
        </div>
      </div>
    </div>
  );
}
