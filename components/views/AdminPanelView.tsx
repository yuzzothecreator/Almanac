"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  Copy,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import AdminAlmanacUpload from "@/components/admin/AdminAlmanacUpload";
import EventForm from "@/components/admin/EventForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/AuthContext";
import { useAuthedFetch } from "@/lib/useAuthedFetch";
import type { AlmanacEvent } from "@/lib/types";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-600",
  completed: "bg-slate-100 text-slate-500",
  rescheduled: "bg-amber-50 text-amber-700",
};

export default function AdminPanelView() {
  const { user } = useAuth();
  const authedFetch = useAuthedFetch();
  const [events, setEvents] = useState<AlmanacEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AlmanacEvent | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const canUploadAlmanac = user?.role === "admin";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/events");
      if (!res.ok) return;
      const data = (await res.json()) as AlmanacEvent[];
      setEvents(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return events;
    return events.filter(
      (e) =>
        (e.title || "").toLowerCase().includes(q) ||
        (e.category || "").toLowerCase().includes(q) ||
        (e.venue || "").toLowerCase().includes(q)
    );
  }, [events, search]);

  const openCreate = () => {
    setEditingEvent(null);
    setShowForm(true);
  };

  const openEdit = (event: AlmanacEvent) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleSave = async (data: Record<string, unknown>) => {
    const res = editingEvent
      ? await authedFetch(`/api/events/${editingEvent.id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        })
      : await authedFetch("/api/events", {
          method: "POST",
          body: JSON.stringify(data),
        });

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string };
      toast.error(err.message || "Failed to save event");
      throw new Error(err.message || "Failed to save");
    }

    toast.success(editingEvent ? "Event updated" : "Event created");
    setShowForm(false);
    setEditingEvent(null);
    await load();
  };

  const togglePublish = async (event: AlmanacEvent) => {
    setBusyId(event.id);
    try {
      const newStatus = event.status === "published" ? "draft" : "published";
      const res = await authedFetch(`/api/events/${event.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(err.message || "Failed to update status");
      }
      toast.success(newStatus === "published" ? "Event published" : "Event unpublished");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setBusyId(null);
    }
  };

  const duplicateEvent = async (event: AlmanacEvent) => {
    setBusyId(event.id);
    try {
      const res = await authedFetch("/api/events", {
        method: "POST",
        body: JSON.stringify({
          title: `${event.title} (Copy)`,
          description: event.description,
          date: event.date,
          start_time: event.start_time,
          end_time: event.end_time,
          venue: event.venue,
          organizer: event.organizer,
          department: event.department,
          category: event.category,
          status: "draft",
          priority: event.priority || "medium",
          banner_url: event.banner_url,
          max_capacity: event.max_capacity,
          tags: event.tags || [],
          is_featured: false,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(err.message || "Failed to duplicate");
      }
      toast.success("Event duplicated");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to duplicate");
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setBusyId(deleteId);
    try {
      const res = await authedFetch(`/api/events/${deleteId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(err.message || "Failed to delete");
      }
      toast.success("Event deleted");
      setDeleteId(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-primary flex-shrink-0" />
            Admin Panel
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage events and university calendar
          </p>
        </div>
        <Button onClick={openCreate} className="gap-1.5 w-full sm:w-auto">
          <Plus className="w-4 h-4" /> Create Event
        </Button>
      </motion.div>

      <div className="relative max-w-sm w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search events…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <AdminAlmanacUpload canUpload={canUploadAlmanac} />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((event) => (
                <tr
                  key={event.id}
                  className="border-b border-border/70 hover:bg-accent/30"
                >
                  <td className="px-4 py-3 align-top">
                    <p className="font-medium text-sm break-words max-w-[240px]">
                      {event.title}
                    </p>
                    {event.venue && (
                      <p className="text-xs text-muted-foreground truncate max-w-[240px]">
                        {event.venue}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {event.date
                      ? format(new Date(event.date), "MMM d, yyyy")
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs capitalize">
                      {event.category?.replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={`text-xs ${
                        statusColors[event.status] || statusColors.draft
                      }`}
                    >
                      {event.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs capitalize">
                    {event.priority || "medium"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={busyId === event.id}
                        onClick={() => void togglePublish(event)}
                        title={
                          event.status === "published" ? "Unpublish" : "Publish"
                        }
                      >
                        {event.status === "published" ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(event)}
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={busyId === event.id}
                        onClick={() => void duplicateEvent(event)}
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-destructive"
                        onClick={() => setDeleteId(event.id)}
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    {loading ? "Loading…" : "No events found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingEvent(null);
        }}
        title={editingEvent ? "Edit Event" : "Create Event"}
      >
        <EventForm
          key={editingEvent?.id || "new"}
          event={editingEvent}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingEvent(null);
          }}
        />
      </Dialog>

      <Dialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        title="Delete Event"
        className="sm:max-w-md"
      >
        <p className="text-sm text-muted-foreground mb-6">
          This action cannot be undone. This will permanently delete the event.
        </p>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setDeleteId(null)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => void confirmDelete()}
            disabled={busyId === deleteId}
            className="w-full sm:w-auto"
          >
            Delete
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
