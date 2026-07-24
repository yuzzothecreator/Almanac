"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { FilterX, ScrollText, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { SerializedAuditLog } from "@/lib/audit";
import { useAuthedFetch } from "@/lib/useAuthedFetch";

const actionOptions = [
  { value: "all", label: "All actions" },
  { value: "event.create", label: "Event create" },
  { value: "event.update", label: "Event update" },
  { value: "event.publish", label: "Event publish" },
  { value: "event.unpublish", label: "Event unpublish" },
  { value: "event.delete", label: "Event delete" },
  { value: "user.ban", label: "User ban" },
  { value: "user.unban", label: "User unban" },
  { value: "user.role_change", label: "Role change" },
  { value: "user.verify", label: "Verify" },
  { value: "almanac.upload", label: "Almanac upload" },
  { value: "almanac.delete", label: "Almanac delete" },
  { value: "almanac.set_active", label: "Almanac set active" },
];

export default function AdminAuditView() {
  const authedFetch = useAuthedFetch();
  const [logs, setLogs] = useState<SerializedAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("all");
  const [entityType, setEntityType] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (action !== "all") params.set("action", action);
      if (entityType !== "all") params.set("entityType", entityType);
      params.set("limit", "150");

      const res = await authedFetch(`/api/audit?${params.toString()}`);
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(err.message || "Failed to load audit log");
      }
      setLogs((await res.json()) as SerializedAuditLog[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [authedFetch, search, action, entityType]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 250);
    return () => clearTimeout(t);
  }, [load]);

  const hasFilters =
    search.trim() !== "" || action !== "all" || entityType !== "all";

  const entityBadge = useMemo(
    () =>
      ({
        event: "bg-blue-50 text-blue-700",
        user: "bg-amber-50 text-amber-700",
        almanac: "bg-purple-50 text-purple-700",
      }) as Record<string, string>,
    []
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <ScrollText className="w-6 h-6 text-primary flex-shrink-0" />
          Audit Log
        </h1>
        <p className="text-sm text-muted-foreground">
          Track who changed events, users, and almanac files
        </p>
      </motion.div>

      <Card className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search summary, email, id…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {hasFilters && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8"
              onClick={() => {
                setSearch("");
                setAction("all");
                setEntityType("all");
              }}
            >
              <FilterX className="w-3.5 h-3.5" /> Clear
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
          <div className="space-y-1.5">
            <Label htmlFor="audit-action">Action</Label>
            <Select
              id="audit-action"
              value={action}
              onChange={(e) => setAction(e.target.value)}
            >
              {actionOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="audit-entity">Entity</Label>
            <Select
              id="audit-entity"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
            >
              <option value="all">All entities</option>
              <option value="event">Event</option>
              <option value="user">User</option>
              <option value="almanac">Almanac</option>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Entity</th>
                <th className="px-4 py-3 font-medium">Summary</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-border/70 hover:bg-accent/30 align-top"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                    {format(new Date(log.created_date), "MMM d, yyyy HH:mm")}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm break-all">{log.actor_email}</p>
                    {log.actor_role && (
                      <p className="text-[11px] text-muted-foreground capitalize">
                        {log.actor_role.replace("_", " ")}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-[11px] bg-muted px-1.5 py-0.5 rounded">
                      {log.action}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={`text-xs ${
                        entityBadge[log.entity_type] || "bg-muted"
                      }`}
                    >
                      {log.entity_type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm break-words max-w-md">
                    {log.summary}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    {loading
                      ? "Loading…"
                      : hasFilters
                        ? "No matching audit entries"
                        : "No audit activity yet — changes will appear here"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
