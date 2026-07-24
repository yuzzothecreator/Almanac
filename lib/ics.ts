import type { AlmanacEvent } from "@/lib/types";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Format a Date as UTC ICS timestamp: YYYYMMDDTHHMMSSZ */
export function toIcsUtc(date: Date): string {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function foldLine(line: string): string {
  const max = 75;
  if (line.length <= max) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, max));
  rest = rest.slice(max);
  while (rest.length > 0) {
    parts.push(` ${rest.slice(0, max - 1)}`);
    rest = rest.slice(max - 1);
  }
  return parts.join("\r\n");
}

function parseEventStart(event: AlmanacEvent): Date {
  const dateStr = String(event.date).split("T")[0];
  const time = event.start_time || "09:00";
  const [hh, mm] = time.split(":").map((x) => Number(x) || 0);
  const d = new Date(`${dateStr}T00:00:00`);
  d.setHours(hh, mm, 0, 0);
  return d;
}

function parseEventEnd(event: AlmanacEvent, start: Date): Date {
  if (event.end_time) {
    const dateStr = String(event.date).split("T")[0];
    const [hh, mm] = event.end_time.split(":").map((x) => Number(x) || 0);
    const d = new Date(`${dateStr}T00:00:00`);
    d.setHours(hh, mm, 0, 0);
    if (d > start) return d;
  }
  const end = new Date(start);
  end.setHours(end.getHours() + 1);
  return end;
}

export function buildEventIcs(
  event: AlmanacEvent,
  opts?: { url?: string }
): string {
  const start = parseEventStart(event);
  const end = parseEventEnd(event, start);
  const stamp = toIcsUtc(new Date());
  const uid = `${event.id}@almanac`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Almanac//University Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${toIcsUtc(start)}`,
    `DTEND:${toIcsUtc(end)}`,
    foldLine(`SUMMARY:${escapeIcs(event.title)}`),
  ];

  if (event.description) {
    lines.push(foldLine(`DESCRIPTION:${escapeIcs(event.description)}`));
  }
  if (event.venue) {
    lines.push(foldLine(`LOCATION:${escapeIcs(event.venue)}`));
  }
  if (opts?.url) {
    lines.push(foldLine(`URL:${escapeIcs(opts.url)}`));
  }
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

export function buildEventsIcs(
  events: AlmanacEvent[],
  opts?: { calendarName?: string; eventUrl?: (e: AlmanacEvent) => string }
): string {
  const stamp = toIcsUtc(new Date());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Almanac//University Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    foldLine(
      `X-WR-CALNAME:${escapeIcs(opts?.calendarName || "My Almanac Events")}`
    ),
  ];

  for (const event of events) {
    const start = parseEventStart(event);
    const end = parseEventEnd(event, start);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.id}@almanac`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${toIcsUtc(start)}`,
      `DTEND:${toIcsUtc(end)}`,
      foldLine(`SUMMARY:${escapeIcs(event.title)}`)
    );
    if (event.description) {
      lines.push(foldLine(`DESCRIPTION:${escapeIcs(event.description)}`));
    }
    if (event.venue) {
      lines.push(foldLine(`LOCATION:${escapeIcs(event.venue)}`));
    }
    const url = opts?.eventUrl?.(event);
    if (url) lines.push(foldLine(`URL:${escapeIcs(url)}`));
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
