import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  CalendarPlus,
  Clock,
  MapPin,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import EventRegisterSection from "@/components/events/EventRegisterSection";
import { getEventById } from "@/lib/data";

export const dynamic = "force-dynamic";

interface EventDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: EventDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) {
    return { title: "Event not found" };
  }

  const description =
    event.description?.slice(0, 160) ||
    `${event.title} on ${format(new Date(event.date), "MMMM d, yyyy")}${
      event.venue ? ` at ${event.venue}` : ""
    }.`;

  return {
    title: event.title,
    description,
    openGraph: {
      title: event.title,
      description,
      type: "article",
      images: event.banner_url
        ? [{ url: event.banner_url }]
        : [{ url: "/og.png" }],
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description,
      images: event.banner_url ? [event.banner_url] : ["/og.png"],
    },
    alternates: {
      canonical: `/events/${event.id}`,
    },
  };
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm" className="gap-2 -ml-2">
          <Link href="/events">
            <ArrowLeft className="w-4 h-4" /> Back to events
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <a href={`/api/events/${event.id}/ics`}>
            <CalendarPlus className="w-4 h-4" /> Add to calendar
          </a>
        </Button>
      </div>

      <Card className="p-4 sm:p-6 md:p-8 space-y-6">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="capitalize">
            {event.category.replace("_", " ")}
          </Badge>
          <Badge className="capitalize">{event.status}</Badge>
          {event.priority && event.priority !== "medium" && (
            <Badge variant="secondary" className="capitalize">
              {event.priority}
            </Badge>
          )}
        </div>

        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3 break-words">
            {event.title}
          </h1>
          {event.description && (
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed break-words">
              {event.description}
            </p>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground min-w-0">
            <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="break-words">
              {format(new Date(event.date), "EEEE, MMMM d, yyyy")}
            </span>
          </div>
          {event.start_time && (
            <div className="flex items-center gap-2 text-muted-foreground min-w-0">
              <Clock className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="break-words">
                {event.start_time}
                {event.end_time ? ` – ${event.end_time}` : ""}
              </span>
            </div>
          )}
          {event.venue && (
            <div className="flex items-center gap-2 text-muted-foreground min-w-0">
              <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="break-words">{event.venue}</span>
            </div>
          )}
          {event.organizer && (
            <div className="flex items-center gap-2 text-muted-foreground min-w-0">
              <User className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="break-words">{event.organizer}</span>
            </div>
          )}
        </div>

        <EventRegisterSection event={event} />
      </Card>
    </div>
  );
}
