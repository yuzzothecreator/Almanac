import { format } from "date-fns";
import type { AlmanacEvent, EventCategory, EventPriority, EventStatus } from "@/lib/types";

type EventRecord = {
  id: string;
  title: string;
  description: string | null;
  date: Date;
  start_time: string | null;
  end_time: string | null;
  venue: string | null;
  organizer: string | null;
  department: string | null;
  category: string;
  status: string;
  priority: string;
  banner_url: string | null;
  is_featured: boolean;
  max_capacity?: number | null;
};

export function serializeEvent(event: EventRecord): AlmanacEvent {
  return {
    id: event.id,
    title: event.title,
    description: event.description ?? undefined,
    date: format(event.date, "yyyy-MM-dd"),
    start_time: event.start_time ?? undefined,
    end_time: event.end_time ?? undefined,
    venue: event.venue ?? undefined,
    organizer: event.organizer ?? undefined,
    department: event.department ?? undefined,
    category: event.category as EventCategory,
    status: event.status as EventStatus,
    priority: event.priority as EventPriority,
    banner_url: event.banner_url ?? undefined,
    is_featured: event.is_featured,
    max_capacity: event.max_capacity ?? null,
  };
}

export type SerializedAlmanac = {
  id: string;
  title: string;
  description: string | null;
  year: string;
  file_name: string;
};

export type SerializedNotification = {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_date: string;
  event_id: string | null;
};
