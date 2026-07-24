"use client";

import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import EventCard from "@/components/events/EventCard";
import { useAuth } from "@/lib/AuthContext";
import { useAuthedFetch } from "@/lib/useAuthedFetch";
import type { AlmanacEvent } from "@/lib/types";

export default function BookmarksPage() {
  const { user, isLoadingAuth } = useAuth();
  const authedFetch = useAuthedFetch();
  const [bookmarked, setBookmarked] = useState<AlmanacEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) {
      if (!isLoadingAuth) setLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await authedFetch("/api/bookmarks");
        if (res.ok) {
          const data = (await res.json()) as AlmanacEvent[];
          if (!cancelled) setBookmarked(data);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [user?.email, isLoadingAuth, authedFetch]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Bookmarks</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">Events you saved for later</p>
      </div>

      {loading || isLoadingAuth ? (
        <div className="text-sm text-muted-foreground">Loading bookmarks…</div>
      ) : bookmarked.length > 0 ? (
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
