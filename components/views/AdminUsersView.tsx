"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  Ban,
  Briefcase,
  CheckCircle2,
  Crown,
  FilterX,
  GraduationCap,
  Search,
  Shield,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import StatsCard from "@/components/dashboard/StatsCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/lib/AuthContext";
import type { ManagedUser } from "@/lib/data";
import { useAuthedFetch } from "@/lib/useAuthedFetch";
import type { UserRole } from "@/lib/types";

const roleColors: Record<string, string> = {
  super_admin: "bg-amber-50 text-amber-700",
  admin: "bg-red-50 text-red-600",
  staff: "bg-blue-50 text-blue-600",
  student: "bg-green-50 text-green-600",
};

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  staff: "Staff",
  student: "Student",
};

export default function AdminUsersView() {
  const { user } = useAuth();
  const authedFetch = useAuthedFetch();
  const isSuper = user?.role === "super_admin";

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [accessFilter, setAccessFilter] = useState<
    "all" | "active" | "banned" | "unverified"
  >("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authedFetch("/api/users");
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(err.message || "Failed to load users");
      }
      const data = (await res.json()) as ManagedUser[];
      setUsers(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [authedFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    const supers = users.filter((u) => u.role === "super_admin").length;
    const admins = users.filter((u) => u.role === "admin").length;
    const staff = users.filter((u) => u.role === "staff").length;
    const students = users.filter((u) => u.role === "student" || !u.role).length;
    const banned = users.filter((u) => u.disabled).length;
    return { supers, admins, staff, students, banned, total: users.length };
  }, [users]);

  const hasActiveFilters =
    search.trim() !== "" || roleFilter !== "all" || accessFilter !== "all";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (accessFilter === "active" && (u.disabled || !u.is_verified)) return false;
      if (accessFilter === "banned" && !u.disabled) return false;
      if (accessFilter === "unverified" && u.is_verified) return false;
      if (q) {
        const hay = `${u.full_name || ""} ${u.email} ${u.role}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [users, search, roleFilter, accessFilter]);

  const canEditTarget = (target: ManagedUser) => {
    if (target.id === user?.id) return false;
    if (isSuper) return true;
    return target.role === "student" || target.role === "staff";
  };

  const roleOptionsFor = (target: ManagedUser): UserRole[] => {
    if (isSuper) {
      return ["student", "staff", "admin", "super_admin"];
    }
    if (target.role === "student" || target.role === "staff") {
      return ["student", "staff"];
    }
    return [target.role as UserRole];
  };

  const updateUser = async (
    id: string,
    data: { role?: string; disabled?: boolean; is_verified?: boolean },
    successMessage = "User updated"
  ) => {
    setBusyId(id);
    try {
      const res = await authedFetch(`/api/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(err.message || "Update failed");
      }
      const updated = (await res.json()) as ManagedUser;
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      toast.success(successMessage);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-primary flex-shrink-0" />
          User Management
        </h1>
        <p className="text-sm text-muted-foreground">
          {isSuper
            ? "Super admin: roles, verification, and ban controls"
            : "Admin: assign student/staff roles. Ban requires a super admin."}
        </p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-4">
        <StatsCard
          title="Total Users"
          value={counts.total}
          icon={Users}
          color="primary"
          index={0}
        />
        <StatsCard
          title="Super Admins"
          value={counts.supers}
          icon={Crown}
          color="amber"
          index={1}
        />
        <StatsCard
          title="Admins"
          value={counts.admins}
          icon={Shield}
          color="red"
          index={2}
        />
        <StatsCard
          title="Staff"
          value={counts.staff}
          icon={Briefcase}
          color="blue"
          index={3}
        />
        <StatsCard
          title="Students"
          value={counts.students}
          icon={GraduationCap}
          color="green"
          index={4}
        />
      </div>

      <Card className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search name or email…"
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
              <span className="font-medium text-foreground">{users.length}</span>
              {counts.banned > 0 && (
                <span className="ml-2 text-destructive">
                  · {counts.banned} banned
                </span>
              )}
            </span>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 h-8"
                onClick={() => {
                  setSearch("");
                  setRoleFilter("all");
                  setAccessFilter("all");
                }}
              >
                <FilterX className="w-3.5 h-3.5" /> Clear
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
          <div className="space-y-1.5">
            <Label htmlFor="role-filter">Role</Label>
            <Select
              id="role-filter"
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(e.target.value as UserRole | "all")
              }
            >
              <option value="all">All roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="student">Student</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="access-filter">Access</Label>
            <Select
              id="access-filter"
              value={accessFilter}
              onChange={(e) =>
                setAccessFilter(
                  e.target.value as "all" | "active" | "banned" | "unverified"
                )
              }
            >
              <option value="all">All access</option>
              <option value="active">Active</option>
              <option value="banned">Banned</option>
              <option value="unverified">Unverified</option>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Last login</th>
                <th className="px-4 py-3 font-medium text-right">Manage</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const isSelf = u.id === user?.id;
                const busy = busyId === u.id;
                const editable = canEditTarget(u);
                const options = roleOptionsFor(u);

                return (
                  <tr
                    key={u.id}
                    className="border-b border-border/70 hover:bg-accent/30"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center flex-shrink-0">
                          {(u.full_name || u.email || "?")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">
                            {u.full_name || "Unknown"}
                            {isSelf && (
                              <span className="ml-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                                You
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Joined{" "}
                            {u.created_date
                              ? format(new Date(u.created_date), "MMM d, yyyy")
                              : "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground break-all max-w-[200px]">
                      {u.email}
                    </td>
                    <td className="px-4 py-3">
                      {editable ? (
                        <Select
                          value={u.role || "student"}
                          disabled={busy}
                          onChange={(e) =>
                            void updateUser(
                              u.id,
                              { role: e.target.value },
                              "Role updated"
                            )
                          }
                          className="h-8 w-[140px]"
                          aria-label={`Role for ${u.email}`}
                        >
                          {options.map((role) => (
                            <option key={role} value={role}>
                              {roleLabels[role]}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <Badge
                          className={`text-xs ${
                            roleColors[u.role] || roleColors.student
                          }`}
                        >
                          {roleLabels[u.role] || u.role}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={`text-xs ${
                          u.disabled
                            ? "bg-red-50 text-red-700"
                            : !u.is_verified
                              ? "bg-slate-100 text-slate-600"
                              : roleColors[u.role] || roleColors.student
                        }`}
                      >
                        {u.disabled
                          ? "banned"
                          : u.is_verified
                            ? "active"
                            : "unverified"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                      {u.last_login_at
                        ? format(new Date(u.last_login_at), "MMM d, yyyy HH:mm")
                        : "Never"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {isSuper && editable && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1"
                            disabled={busy}
                            onClick={() =>
                              void updateUser(
                                u.id,
                                { is_verified: !u.is_verified },
                                u.is_verified
                                  ? "Marked unverified"
                                  : "User verified"
                              )
                            }
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {u.is_verified ? "Unverify" : "Verify"}
                          </Button>
                        )}

                        {isSuper && editable && (
                          <Button
                            type="button"
                            variant={u.disabled ? "secondary" : "destructive"}
                            size="sm"
                            className="h-8 text-xs gap-1"
                            disabled={busy}
                            onClick={() => {
                              const next = !u.disabled;
                              const ok = confirm(
                                next
                                  ? `Ban ${u.full_name || u.email}? They will not be able to sign in.`
                                  : `Unban ${u.full_name || u.email}?`
                              );
                              if (!ok) return;
                              void updateUser(
                                u.id,
                                { disabled: next },
                                next ? "User banned" : "User unbanned"
                              );
                            }}
                          >
                            <Ban className="w-3.5 h-3.5" />
                            {u.disabled ? "Unban" : "Ban"}
                          </Button>
                        )}

                        {!isSuper && !editable && !isSelf && (
                          <span className="text-[11px] text-muted-foreground">
                            Super admin only
                          </span>
                        )}
                        {isSelf && (
                          <span className="text-[11px] text-muted-foreground">
                            Your account
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    {loading
                      ? "Loading…"
                      : hasActiveFilters
                        ? "No users match these filters"
                        : "No users found"}
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
