"use client";

import { useEffect, useMemo, useState } from "react";
import { format, isWithinInterval, parseISO } from "date-fns";
import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  BookOpen,
  Calendar,
  Star,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import StatsCard from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SerializedRegistration } from "@/lib/data";
import type { AlmanacEvent } from "@/lib/types";
import { useAuthedFetch } from "@/lib/useAuthedFetch";

const COLORS = [
  "#7c3aed",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
  "#64748b",
  "#dc2626",
];

const categoryLabels: Record<string, string> = {
  academic: "Academic",
  sports: "Sports",
  exams: "Exams",
  seminars: "Seminars",
  conferences: "Conferences",
  workshops: "Workshops",
  club_activities: "Clubs",
  government: "Government",
  holiday: "Holiday",
  emergency: "Emergency",
};

const SEMESTERS = [
  { label: "Semester I (Oct–Feb)", from: "2025-10-01", to: "2026-02-28" },
  { label: "Semester II (Mar–Jul)", from: "2026-03-01", to: "2026-07-31" },
  { label: "Semester III (Aug–Sep)", from: "2026-08-01", to: "2026-09-30" },
];

export default function AdminAnalyticsView() {
  const authedFetch = useAuthedFetch();
  const [events, setEvents] = useState<AlmanacEvent[]>([]);
  const [registrations, setRegistrations] = useState<SerializedRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setIsNarrow(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await authedFetch("/api/analytics");
        if (!res.ok) return;
        const data = (await res.json()) as {
          events: AlmanacEvent[];
          registrations: SerializedRegistration[];
        };
        if (!cancelled) {
          setEvents(data.events);
          setRegistrations(data.registrations);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [authedFetch]);

  const semesterEvents = useMemo(() => {
    if (selectedSemester === "all") return events;
    const sem = SEMESTERS[Number(selectedSemester)];
    return events.filter((e) => {
      if (!e.date) return false;
      const d = parseISO(e.date);
      return isWithinInterval(d, { start: parseISO(sem.from), end: parseISO(sem.to) });
    });
  }, [events, selectedSemester]);

  const regsByEvent = useMemo(() => {
    return registrations.reduce<Record<string, number>>((acc, r) => {
      acc[r.event_id] = (acc[r.event_id] || 0) + 1;
      return acc;
    }, {});
  }, [registrations]);

  const attendanceData = useMemo(() => {
    const maxLen = isNarrow ? 16 : 28;
    return semesterEvents
      .map((e) => ({
        name: e.title.length > maxLen ? `${e.title.slice(0, maxLen)}…` : e.title,
        registrations: regsByEvent[e.id] || 0,
        category: e.category,
      }))
      .filter((e) => e.registrations > 0)
      .sort((a, b) => b.registrations - a.registrations)
      .slice(0, 10);
  }, [semesterEvents, regsByEvent, isNarrow]);

  const categoryData = useMemo(() => {
    const map: Record<string, { name: string; events: number; registrations: number }> = {};
    semesterEvents.forEach((e) => {
      const cat = e.category || "other";
      if (!map[cat]) {
        map[cat] = { name: categoryLabels[cat] || cat, events: 0, registrations: 0 };
      }
      map[cat].events += 1;
      map[cat].registrations += regsByEvent[e.id] || 0;
    });
    return Object.values(map).sort((a, b) => b.registrations - a.registrations);
  }, [semesterEvents, regsByEvent]);

  const semesterTrends = useMemo(() => {
    return SEMESTERS.map((sem) => {
      const semEvts = events.filter((e) => {
        if (!e.date) return false;
        const d = parseISO(e.date);
        return isWithinInterval(d, { start: parseISO(sem.from), end: parseISO(sem.to) });
      });
      const totalRegs = semEvts.reduce((sum, e) => sum + (regsByEvent[e.id] || 0), 0);
      return {
        semester: sem.label.split(" (")[0],
        events: semEvts.length,
        registrations: totalRegs,
      };
    });
  }, [events, regsByEvent]);

  const monthlyEngagement = useMemo(() => {
    const map: Record<string, { month: string; events: number; registrations: number }> = {};
    semesterEvents.forEach((e) => {
      if (!e.date) return;
      const month = e.date.substring(0, 7);
      if (!map[month]) map[month] = { month, events: 0, registrations: 0 };
      map[month].events += 1;
      map[month].registrations += regsByEvent[e.id] || 0;
    });
    return Object.values(map)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((d) => ({
        ...d,
        month: format(parseISO(`${d.month}-01`), "MMM yy"),
      }));
  }, [semesterEvents, regsByEvent]);

  const regStatusData = useMemo(() => {
    const map = registrations.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(map).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1).replace("_", " "),
      value: count,
    }));
  }, [registrations]);

  const published = semesterEvents.filter((e) => e.status === "published").length;
  const totalAttended = registrations.filter((r) => r.status === "attended").length;
  const engagementRate =
    registrations.length > 0
      ? Math.round((totalAttended / registrations.length) * 100)
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        Loading analytics…
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" /> Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Event attendance, category popularity & semester engagement
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <span className="text-sm text-muted-foreground shrink-0">Semester:</span>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="h-9 w-full sm:w-48 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Semesters</option>
            {SEMESTERS.map((s, i) => (
              <option key={s.label} value={String(i)}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        <StatsCard
          title="Total Events"
          value={semesterEvents.length}
          icon={BookOpen}
          color="primary"
          index={0}
        />
        <StatsCard
          title="Published"
          value={published}
          icon={TrendingUp}
          color="green"
          index={1}
        />
        <StatsCard
          title="Total Registrations"
          value={registrations.length}
          icon={Users}
          color="blue"
          index={2}
        />
        <StatsCard
          title="Attendance Rate"
          value={`${engagementRate}%`}
          icon={Activity}
          color="red"
          index={3}
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> Semester Engagement Trends
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Events and registrations across all academic semesters
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-64 min-w-0 overflow-x-auto">
            <div className={isNarrow ? "min-w-[420px] h-64" : "h-64"}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={semesterTrends} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="semester"
                    tick={{ fontSize: isNarrow ? 10 : 11 }}
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 11 }} width={isNarrow ? 32 : 40} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="events"
                    name="Events"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="registrations"
                    name="Registrations"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Monthly Engagement
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Events and registrations month by month
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-56 min-w-0 overflow-x-auto">
              <div className={isNarrow ? "min-w-[360px] h-56" : "h-56"}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyEngagement} margin={{ left: 0, right: 4 }}>
                    <defs>
                      <linearGradient id="eventsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="regsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} width={isNarrow ? 28 : 40} />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="events"
                      name="Events"
                      stroke="hsl(var(--primary))"
                      fill="url(#eventsGrad)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="registrations"
                      name="Registrations"
                      stroke="#10b981"
                      fill="url(#regsGrad)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Registration Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 min-w-0 overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={regStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={isNarrow ? 36 : 45}
                    outerRadius={isNarrow ? 60 : 75}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {regStatusData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-1">
              {regStatusData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1 text-xs">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ background: COLORS[i % COLORS.length] }}
                  />
                  {d.name} ({d.value})
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" /> Most Popular Categories
            </CardTitle>
            <p className="text-xs text-muted-foreground">By number of registrations</p>
          </CardHeader>
          <CardContent>
            <div className="h-64 min-w-0 overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ left: 4, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: isNarrow ? 9 : 11 }}
                    width={isNarrow ? 64 : 80}
                  />
                  <Tooltip />
                  <Bar dataKey="registrations" name="Registrations" radius={[0, 4, 4, 0]}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" /> Events per Category
            </CardTitle>
            <p className="text-xs text-muted-foreground">Distribution of events by type</p>
          </CardHeader>
          <CardContent>
            <div className="h-64 min-w-0 overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={isNarrow ? 68 : 90}
                    dataKey="events"
                    label={
                      isNarrow
                        ? false
                        : ({ name, percent }) =>
                            (percent ?? 0) > 0.05
                              ? `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                              : ""
                    }
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [v, "Events"]} />
                  {isNarrow && <Legend wrapperStyle={{ fontSize: 11 }} />}
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" /> Top Attended Events
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Events with the highest registration counts
          </p>
        </CardHeader>
        <CardContent>
          {attendanceData.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No registration data available for the selected period.
            </div>
          ) : (
            <div className="h-72 min-w-0 overflow-x-auto">
              <div className={isNarrow ? "min-w-[320px] h-72" : "h-72"}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={attendanceData}
                    layout="vertical"
                    margin={{ left: 4, right: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: isNarrow ? 9 : 10 }}
                      width={isNarrow ? 90 : 180}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="registrations"
                      name="Registrations"
                      fill="hsl(var(--primary))"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Category Summary Table</CardTitle>
          <p className="text-xs text-muted-foreground">
            Events and engagement by category for the selected period
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-xs">
                  <th className="text-left py-2 font-medium">Category</th>
                  <th className="text-right py-2 font-medium">Events</th>
                  <th className="text-right py-2 font-medium">Registrations</th>
                  <th className="text-right py-2 font-medium">Avg / Event</th>
                  <th className="py-2 font-medium text-left pl-4">Engagement</th>
                </tr>
              </thead>
              <tbody>
                {categoryData.map((row, i) => {
                  const avg = row.events > 0 ? (row.registrations / row.events).toFixed(1) : "0";
                  const maxRegs = Math.max(...categoryData.map((r) => r.registrations), 1);
                  return (
                    <tr
                      key={row.name}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-2.5 flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: COLORS[i % COLORS.length] }}
                        />
                        {row.name}
                      </td>
                      <td className="text-right py-2.5 tabular-nums">{row.events}</td>
                      <td className="text-right py-2.5 tabular-nums">{row.registrations}</td>
                      <td className="text-right py-2.5 tabular-nums">{avg}</td>
                      <td className="py-2.5 pl-4">
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(row.registrations / maxRegs) * 100}%`,
                              background: COLORS[i % COLORS.length],
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
