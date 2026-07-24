import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Calendar, Clock, MapPin, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getEventById } from "@/lib/data";

export const dynamic = "force-dynamic";

interface EventDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button asChild variant="ghost" size="sm" className="gap-2 -ml-2">
        <Link href="/events">
          <ArrowLeft className="w-4 h-4" /> Back to events
        </Link>
      </Button>

      <Card className="p-6 md:p-8 space-y-6">
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

        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-3">{event.title}</h1>
          {event.description && (
            <p className="text-muted-foreground text-base leading-relaxed">
              {event.description}
            </p>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4 text-primary" />
            {format(new Date(event.date), "EEEE, MMMM d, yyyy")}
          </div>
          {event.start_time && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4 text-primary" />
              {event.start_time}
              {event.end_time ? ` – ${event.end_time}` : ""}
            </div>
          )}
          {event.venue && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary" />
              {event.venue}
            </div>
          )}
          {event.organizer && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-4 h-4 text-primary" />
              {event.organizer}
            </div>
          )}
        </div>

        <div className="pt-4 border-t">
          <Button className="w-full sm:w-auto">Register for event</Button>
        </div>
      </Card>
    </div>
  );
}
