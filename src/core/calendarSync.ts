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

/** Build a calendar event body from a task */
function taskToEventBody(task: Task): {
  summary: string;
  start: string;
  end: string;
  description?: string;
} {
  const due = task.due || new Date().toISOString().slice(0, 10);
  const tags: string[] = [];
  if (task.contexts.length) tags.push(task.contexts.map((c) => `#${c}`).join(" "));
  if (task.projects.length) tags.push(task.projects.map((p) => `+${p}`).join(" "));

  const description = [
    tags.length ? tags.join("  ") : "",
    task.body ? `\n${task.body}` : "",
  ]
    .filter(Boolean)
    .join("\n")
    .trim() || undefined;

  const prefix: string[] = [];
  if (task.status === "done") prefix.push("\u2713");
  if (task.priority !== "none") prefix.push(task.priority.toUpperCase());
  const summary = prefix.length ? `[${prefix.join(" ")}] ${task.title}` : task.title;

  return {
    summary,
    start: due,
    end: due,
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
