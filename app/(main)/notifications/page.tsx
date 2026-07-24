import { Bell } from "lucide-react";
import { Card } from "@/components/ui/card";

const notifications = [
  {
    id: "1",
    title: "New featured event",
    body: "Opening Convocation Ceremony was added to the calendar.",
    time: "2 hours ago",
    unread: true,
  },
  {
    id: "2",
    title: "Event reminder",
    body: "Inter-Faculty Football Finals starts in 5 days.",
    time: "Yesterday",
    unread: true,
  },
  {
    id: "3",
    title: "Almanac updated",
    body: "Academic Almanac 2026 is now available for download.",
    time: "3 days ago",
    unread: false,
  },
];

export default function NotificationsPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground mt-1">Stay updated on campus activity</p>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <Card
            key={n.id}
            className={`p-4 flex gap-3 ${n.unread ? "border-primary/30 bg-primary/5" : ""}`}
          >
            <div className="mt-0.5 p-2 rounded-xl bg-primary/10 text-primary h-fit">
              <Bell className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm">{n.title}</h3>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                  {n.time}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{n.body}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
