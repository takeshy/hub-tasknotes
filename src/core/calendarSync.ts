/**
 * Calendar sync — bridges Task objects with Google Calendar events via the Plugin Calendar API.
 */

import { Task, CalendarEvent } from "../types";

export interface CalendarAPI {
  listEvents(options?: {
    timeMin?: string;
    timeMax?: string;
    query?: string;
    maxResults?: number;
    calendarId?: string;
  }): Promise<CalendarEvent[]>;
  createEvent(event: {
    summary: string;
    start: string;
    end: string;
    description?: string;
    calendarId?: string;
  }): Promise<{ eventId: string; htmlLink: string }>;
  updateEvent(
    eventId: string,
    event: {
      summary?: string;
      start?: string;
      end?: string;
      description?: string;
      calendarId?: string;
    }
  ): Promise<{ eventId: string; htmlLink: string }>;
  deleteEvent(eventId: string, calendarId?: string): Promise<void>;
}

/** Format a Date as "YYYY-MM-DDTHH:MM:SS±HH:MM" in local time */
export function toLocalISO(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const mo = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const mi = pad(d.getMinutes());
  const s = pad(d.getSeconds());
  const offset = -d.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const absOffset = Math.abs(offset);
  const oh = pad(Math.floor(absOffset / 60));
  const om = pad(absOffset % 60);
  return `${y}-${mo}-${day}T${h}:${mi}:${s}${sign}${oh}:${om}`;
}

/** Build a calendar event body from a task */
function taskToEventBody(task: Task): {
  summary: string;
  start: string;
  end: string;
  description?: string;
} {
  const descParts: string[] = [];
  if (task.contexts.length) descParts.push(task.contexts.map((c) => `#${c}`).join(" "));
  if (task.projects.length) descParts.push(task.projects.map((p) => `+${p}`).join(" "));
  if (task.tags.length) descParts.push(task.tags.map((t) => `[${t}]`).join(" "));

  const description = [
    descParts.length ? descParts.join("  ") : "",
    task.body ? `\n${task.body}` : "",
  ]
    .filter(Boolean)
    .join("\n")
    .trim() || undefined;

  const prefix: string[] = [];
  if (task.status === "done") prefix.push("\u2713");
  if (task.priority !== "none") prefix.push(task.priority.toUpperCase());
  const summary = prefix.length ? `[${prefix.join(" ")}] ${task.title}` : task.title;

  // Determine start/end from scheduled or due date
  if (task.scheduled && task.scheduled.includes("T")) {
    // Timed event: scheduled has datetime (e.g. "2026-04-06T14:00")
    const startDate = new Date(task.scheduled);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // default 1 hour
    return {
      summary,
      start: toLocalISO(startDate),
      end: toLocalISO(endDate),
      description,
    };
  }

  // All-day event: use scheduled date if available, otherwise due date
  const dateStr = task.scheduled || task.due || new Date().toISOString().slice(0, 10);

  return {
    summary,
    start: dateStr,
    end: dateStr,
    description,
  };
}

/** Sync a single task to Google Calendar. Returns updated task with calendarEventId/Link. */
export async function syncTaskToCalendar(
  calendar: CalendarAPI,
  task: Task
): Promise<Task> {
  const body = taskToEventBody(task);

  if (task.calendarEventId) {
    // Update existing event
    const result = await calendar.updateEvent(task.calendarEventId, body);
    return { ...task, calendarEventId: result.eventId, calendarHtmlLink: result.htmlLink };
  } else {
    // Create new event
    const result = await calendar.createEvent(body);
    return { ...task, calendarEventId: result.eventId, calendarHtmlLink: result.htmlLink };
  }
}

/** Remove a task's calendar event */
export async function unsyncTaskFromCalendar(
  calendar: CalendarAPI,
  task: Task
): Promise<Task> {
  if (task.calendarEventId) {
    await calendar.deleteEvent(task.calendarEventId);
  }
  return { ...task, calendarEventId: undefined, calendarHtmlLink: undefined };
}

/** Fetch calendar events for a given date range */
export async function fetchCalendarEvents(
  calendar: CalendarAPI,
  timeMin: string,
  timeMax: string
): Promise<CalendarEvent[]> {
  return calendar.listEvents({ timeMin, timeMax, maxResults: 250 });
}

/** Check if the calendar API is available by making a lightweight call */
export async function checkCalendarAvailable(calendar: CalendarAPI): Promise<boolean> {
  try {
    const now = new Date();
    await calendar.listEvents({
      timeMin: now.toISOString(),
      timeMax: now.toISOString(),
      maxResults: 1,
    });
    return true;
  } catch {
    return false;
  }
}
