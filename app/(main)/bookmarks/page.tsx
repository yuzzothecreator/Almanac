import { Bookmark } from "lucide-react";
import EventCard from "@/components/events/EventCard";
import { mockEvents } from "@/data/mock";

export default function BookmarksPage() {
  const bookmarked = mockEvents.filter((e) => e.is_featured && e.status === "published");

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bookmarks</h1>
        <p className="text-muted-foreground mt-1">Events you saved for later</p>
      </div>

      {bookmarked.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookmarked.map((event, i) => (
            <EventCard key={event.id} event={event} index={i} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground bg-card rounded-xl border">
          <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No bookmarks yet</p>
        </div>
      )}
    </div>
  );
}
