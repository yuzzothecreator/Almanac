"use client";

import { useState } from "react";
import { Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AlmanacEvent } from "@/lib/types";

const categories = [
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

export type EventFormValues = {
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  venue: string;
  organizer: string;
  department: string;
  category: string;
  status: string;
  priority: string;
  banner_url: string;
  max_capacity: string;
  tags: string[];
  is_featured: boolean;
};

function toForm(event?: AlmanacEvent | null): EventFormValues {
  return {
    title: event?.title || "",
    description: event?.description || "",
    date: event?.date || "",
    start_time: event?.start_time || "",
    end_time: event?.end_time || "",
    venue: event?.venue || "",
    organizer: event?.organizer || "",
    department: event?.department || "",
    category: event?.category || "academic",
    status: event?.status || "draft",
    priority: event?.priority || "medium",
    banner_url: event?.banner_url || "",
    max_capacity:
      event?.max_capacity != null ? String(event.max_capacity) : "",
    tags: event?.tags || [],
    is_featured: Boolean(event?.is_featured),
  };
}

interface EventFormProps {
  event?: AlmanacEvent | null;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

export default function EventForm({ event, onSave, onCancel }: EventFormProps) {
  const [form, setForm] = useState<EventFormValues>(() => toForm(event));
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const handleChange = <K extends keyof EventFormValues>(
    field: K,
    value: EventFormValues[K]
  ) => setForm((prev) => ({ ...prev, [field]: value }));

  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag || form.tags.includes(tag)) return;
    handleChange("tags", [...form.tags, tag]);
    setTagInput("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...form,
        max_capacity: form.max_capacity ? Number(form.max_capacity) : null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
            required
            placeholder="Event title"
          />
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Event description"
            rows={3}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="date">Date *</Label>
          <Input
            id="date"
            type="date"
            value={form.date}
            onChange={(e) => handleChange("date", e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="category">Category *</Label>
          <Select
            id="category"
            value={form.category}
            onChange={(e) => handleChange("category", e.target.value)}
            required
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="start_time">Start Time</Label>
          <Input
            id="start_time"
            type="time"
            value={form.start_time}
            onChange={(e) => handleChange("start_time", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="end_time">End Time</Label>
          <Input
            id="end_time"
            type="time"
            value={form.end_time}
            onChange={(e) => handleChange("end_time", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="venue">Venue</Label>
          <Input
            id="venue"
            value={form.venue}
            onChange={(e) => handleChange("venue", e.target.value)}
            placeholder="Location"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="organizer">Organizer</Label>
          <Input
            id="organizer"
            value={form.organizer}
            onChange={(e) => handleChange("organizer", e.target.value)}
            placeholder="Organizer name"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            value={form.department}
            onChange={(e) => handleChange("department", e.target.value)}
            placeholder="Department"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="max_capacity">Max Capacity</Label>
          <Input
            id="max_capacity"
            type="number"
            min={0}
            value={form.max_capacity}
            onChange={(e) => handleChange("max_capacity", e.target.value)}
            placeholder="Unlimited"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Select
            id="status"
            value={form.status}
            onChange={(e) => handleChange("status", e.target.value)}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
            <option value="rescheduled">Rescheduled</option>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="priority">Priority</Label>
          <Select
            id="priority"
            value={form.priority}
            onChange={(e) => handleChange("priority", e.target.value)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </Select>
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="banner_url">Banner Image URL</Label>
          <Input
            id="banner_url"
            value={form.banner_url}
            onChange={(e) => handleChange("banner_url", e.target.value)}
            placeholder="https://…"
          />
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <Label>Tags</Label>
          <div className="flex gap-2 mb-2 flex-wrap">
            {form.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-muted px-2 py-1 rounded-full flex items-center gap-1"
              >
                {tag}
                <button
                  type="button"
                  onClick={() =>
                    handleChange(
                      "tags",
                      form.tags.filter((t) => t !== tag)
                    )
                  }
                  aria-label={`Remove ${tag}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="Add tag and press Enter"
              className="flex-1"
            />
            <Button type="button" variant="outline" size="sm" onClick={addTag}>
              Add
            </Button>
          </div>
        </div>

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={form.is_featured}
            onChange={(e) => handleChange("is_featured", e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          Featured Event
        </label>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button type="submit" disabled={saving} className="gap-1.5 w-full sm:w-auto">
          <Save className="w-4 h-4" />
          {event ? "Update Event" : "Create Event"}
        </Button>
      </div>
    </form>
  );
}
