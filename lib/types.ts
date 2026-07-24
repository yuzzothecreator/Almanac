export type UserRole = "student" | "staff" | "admin" | "super_admin";

export const ALL_ROLES: UserRole[] = [
  "student",
  "staff",
  "admin",
  "super_admin",
];

export function isValidRole(role: string): role is UserRole {
  return ALL_ROLES.includes(role as UserRole);
}

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
  max_capacity?: number | null;
  tags?: string[];
}
