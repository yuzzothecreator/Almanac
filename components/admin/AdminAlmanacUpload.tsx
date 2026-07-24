"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import {
  CalendarRange,
  CheckCircle2,
  FileText,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthedFetch } from "@/lib/useAuthedFetch";
import type { SerializedAlmanac } from "@/lib/serializers";

interface AdminAlmanacUploadProps {
  canUpload: boolean;
}

export default function AdminAlmanacUpload({ canUpload }: AdminAlmanacUploadProps) {
  const authedFetch = useAuthedFetch();
  const [almanacs, setAlmanacs] = useState<SerializedAlmanac[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/almanac");
      if (!res.ok) return;
      const data = (await res.json()) as SerializedAlmanac[];
      setAlmanacs(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim() || !year.trim()) {
      toast.error("Please fill all required fields");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be less than 10MB");
      return;
    }

    setUploading(true);
    try {
      const file_data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });

      const res = await authedFetch("/api/almanac/upload", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          year: year.trim(),
          file_name: file.name,
          file_data,
          is_active: true,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message || "Upload failed");
      }

      toast.success("Almanac uploaded successfully");
      setOpen(false);
      setTitle("");
      setYear("");
      setFile(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload");
    } finally {
      setUploading(false);
    }
  };

  const setActive = async (id: string) => {
    try {
      const res = await authedFetch(`/api/almanac/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "set-active" }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message || "Failed to set active");
      }
      toast.success("Active almanac updated");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this PDF? This cannot be undone.")) return;
    try {
      const res = await authedFetch(`/api/almanac/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message || "Failed to delete");
      }
      toast.success("Almanac deleted");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  return (
    <>
      <Card className="border-primary/20 shadow-sm overflow-hidden">
        <CardHeader className="bg-primary/5 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <CalendarRange className="w-5 h-5 text-primary flex-shrink-0" />
                University Almanac
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Upload the academic year PDF for students to view and download.
              </p>
            </div>
            {canUpload && (
              <Button
                className="shrink-0 gap-2 w-full sm:w-auto"
                onClick={() => setOpen(true)}
              >
                <Upload className="w-4 h-4" /> Upload PDF
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Upload History
          </h3>

          {loading ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Loading almanacs…
            </div>
          ) : almanacs.length === 0 ? (
            <div className="py-8 text-center bg-accent/20 rounded-lg border border-dashed">
              <FileText className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No almanacs uploaded yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {almanacs.map((almanac) => (
                <div
                  key={almanac.id}
                  className={`flex flex-col sm:flex-row justify-between sm:items-center gap-3 p-3 rounded-lg border ${
                    almanac.is_active
                      ? "border-primary/50 bg-primary/5"
                      : "bg-card"
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-md flex-shrink-0 ${
                        almanac.is_active
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-medium text-sm flex flex-wrap items-center gap-2">
                        <span className="break-words">{almanac.title}</span>
                        {almanac.is_active && (
                          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {almanac.year}
                        {almanac.file_size != null
                          ? ` · ${(almanac.file_size / 1024 / 1024).toFixed(2)} MB`
                          : ""}
                        {almanac.created_date
                          ? ` · Uploaded ${format(new Date(almanac.created_date), "MMM d, yyyy")}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-stretch sm:self-auto flex-wrap">
                    <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                      <a
                        href={`/api/almanac/${almanac.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View
                      </a>
                    </Button>

                    {canUpload && !almanac.is_active && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => void setActive(almanac.id)}
                      >
                        Set Active
                      </Button>
                    )}

                    {canUpload && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => void remove(almanac.id)}
                        aria-label="Delete almanac"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Upload New Almanac"
        className="sm:max-w-md"
      >
        <form onSubmit={(e) => void handleUpload(e)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="almanac-title">Title</Label>
            <Input
              id="almanac-title"
              placeholder="e.g. Academic Calendar 2025-2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="almanac-year">Academic Year</Label>
            <Input
              id="almanac-year"
              placeholder="e.g. 2025-2026"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="almanac-file">PDF File (Max 10MB)</Label>
            <Input
              id="almanac-file"
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={uploading}>
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading…
              </>
            ) : (
              "Upload & Set Active"
            )}
          </Button>
        </form>
      </Dialog>
    </>
  );
}
