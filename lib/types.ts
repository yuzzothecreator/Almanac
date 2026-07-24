export type UserRole = "student" | "staff" | "admin";

export type EventCategory =
  | "academic"
  | "sports"
  | "exams"
  | "seminars"
  | "conferences"
  | "workshops"
  | "club_activities"
  | "government"
  | "holiday"
  | "emergency";

export type EventStatus =
  | "draft"
  | "published"
  | "cancelled"
  | "completed"
  | "rescheduled";

export type EventPriority = "low" | "medium" | "high" | "urgent";

export interface AlmanacEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  start_time?: string;
  end_time?: string;
  venue?: string;
  organizer?: string;
  category: EventCategory;
  status: EventStatus;
  priority?: EventPriority;
  department?: string;
  is_featured?: boolean;
  banner_url?: string;
}

export interface MockUser {
  full_name: string;
  role: UserRole;
  email: string;
}
