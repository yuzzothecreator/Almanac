"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Copy,
  Eye,
  EyeOff,
  FilterX,
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
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/lib/AuthContext";
import { useAuthedFetch } from "@/lib/useAuthedFetch";
import type {
  AlmanacEvent,
  EventCategory,
  EventPriority,
  EventStatus,
} from "@/lib/types";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-600",
  completed: "bg-slate-100 text-slate-500",
  rescheduled: "bg-amber-50 text-amber-700",
};

const categories: Array<{ value: EventCategory | "all"; label: string }> = [
  { value: "all", label: "All categories" },
  { value: "academic", label: "Academic" },
  { value: "sports", label: "Sports" },
  { value: "exams", label: "Exams" },
  { value: "seminars", label: "Seminars" },
  { value: "conferences", label: "Conferences" },
  { value: "workshops", label: "Workshops" },
  { value: "club_activities", label: "Club Activities" },
  { value: "government", label: "Government" },
  { value: "holiday", label: "Holiday" },
  { value: "emergency", label: "Emergency" },
];

const statuses: Array<{ value: EventStatus | "all"; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
  { value: "rescheduled", label: "Rescheduled" },
];

const priorities: Array<{ value: EventPriority | "all"; label: string }> = [
  { value: "all", label: "All priorities" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const priorityRank: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
};

type SortKey = "title" | "date" | "category" | "status" | "priority";
type SortDir = "asc" | "desc";

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />;
  return dir === "asc" ? (
    <ArrowUp className="w-3.5 h-3.5 text-primary" />
  ) : (
    <ArrowDown className="w-3.5 h-3.5 text-primary" />
  );
}

export default function AdminPanelView() {
  const { user } = useAuth();
  const authedFetch = useAuthedFetch();
  const [events, setEvents] = useState<AlmanacEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EventStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | "all">(
    "all"
  );
  const [priorityFilter, setPriorityFilter] = useState<EventPriority | "all">(
    "all"
  );
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AlmanacEvent | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const canUploadAlmanac =
    user?.role === "admin" || user?.role === "super_admin";

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

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    categoryFilter !== "all" ||
    priorityFilter !== "all" ||
    dateFrom !== "" ||
    dateTo !== "" ||
    featuredOnly;

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setPriorityFilter("all");
    setDateFrom("");
    setDateTo("");
    setFeaturedOnly(false);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(
        key === "title" || key === "category" || key === "status"
          ? "asc"
          : "desc"
      );
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    const rows = events.filter((e) => {
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
      if (
        priorityFilter !== "all" &&
        (e.priority || "medium") !== priorityFilter
      ) {
        return false;
      }
      if (featuredOnly && !e.is_featured) return false;
      if (dateFrom && (!e.date || e.date < dateFrom)) return false;
      if (dateTo && (!e.date || e.date > dateTo)) return false;
      if (q) {
        const hay = [
          e.title,
          e.category,
          e.venue,
          e.organizer,
          e.department,
          e.status,
          e.priority,
          ...(e.tags || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "title":
          cmp = (a.title || "").localeCompare(b.title || "");
          break;
        case "date":
          cmp = (a.date || "").localeCompare(b.date || "");
          break;
        case "category":
          cmp = (a.category || "").localeCompare(b.category || "");
          break;
        case "status":
          cmp = (a.status || "").localeCompare(b.status || "");
          break;
        case "priority":
          cmp =
            (priorityRank[a.priority || "medium"] || 0) -
            (priorityRank[b.priority || "medium"] || 0);
          break;
      }
      return cmp * dir;
    });

    return rows;
  }, [
    events,
    search,
    statusFilter,
    categoryFilter,
    priorityFilter,
    dateFrom,
    dateTo,
    featuredOnly,
    sortKey,
    sortDir,
  ]);

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
      toast.success(
        newStatus === "published" ? "Event published" : "Event unpublished"
      );
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

  const SortHeader = ({
    label,
    column,
    className = "",
  }: {
    label: string;
    column: SortKey;
    className?: string;
  }) => (
    <th className={`px-4 py-3 font-medium ${className}`}>
      <button
        type="button"
        onClick={() => toggleSort(column)}
        className="inline-flex items-center gap-1.5 hover:text-foreground text-left"
      >
        {label}
        <SortIcon active={sortKey === column} dir={sortDir} />
      </button>
    </th>
  );

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

      <AdminAlmanacUpload canUpload={canUploadAlmanac} />

      <Card className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search title, venue, organizer, tags…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
            <span>
              Showing{" "}
              <span className="font-medium text-foreground">
                {filtered.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">
                {events.length}
              </span>
            </span>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 h-8"
                onClick={clearFilters}
              >
                <FilterX className="w-3.5 h-3.5" /> Clear
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="filter-status">Status</Label>
            <Select
              id="filter-status"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as EventStatus | "all")
              }
            >
              {statuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="filter-category">Category</Label>
            <Select
              id="filter-category"
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value as EventCategory | "all")
              }
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="filter-priority">Priority</Label>
            <Select
              id="filter-priority"
              value={priorityFilter}
              onChange={(e) =>
                setPriorityFilter(e.target.value as EventPriority | "all")
              }
            >
              {priorities.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="filter-from">From date</Label>
            <Input
              id="filter-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="filter-to">To date</Label>
            <Input
              id="filter-to"
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Options</Label>
            <label className="flex items-center gap-2 h-9 px-3 rounded-md border border-input text-sm cursor-pointer hover:bg-accent/40">
              <input
                type="checkbox"
                checked={featuredOnly}
                onChange={(e) => setFeaturedOnly(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              Featured only
            </label>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                <SortHeader label="Event" column="title" />
                <SortHeader label="Date" column="date" />
                <SortHeader label="Category" column="category" />
                <SortHeader label="Status" column="status" />
                <SortHeader label="Priority" column="priority" />
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
                      {event.is_featured && (
                        <Badge variant="secondary" className="ml-2 text-[10px]">
                          Featured
                        </Badge>
                      )}
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
                    {loading
                      ? "Loading…"
                      : hasActiveFilters
                        ? "No events match these filters"
                        : "No events found"}
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
