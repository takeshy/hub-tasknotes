/**
 * Serialize / deserialize tasks to/from Markdown with YAML frontmatter.
 *
 * Format aligned with callumalpass/tasknotes:
 * ---
 * title: Buy groceries
 * status: todo
 * due: "2026-04-10"
 * scheduled: "2026-04-10T14:00"
 * priority: medium
 * contexts: [@errands, @home]
 * tags: [shopping]
 * projects: [renovation]
 * timeEstimate: 30
 * timeEntries: []
 * recurrence: null
 * complete_instances: []
 * skipped_instances: []
 * blockedBy: []
 * blocking: []
 * archived: false
 * completedDate: null
 * createdDate: "2026-04-05T10:00:00Z"
 * modifiedDate: "2026-04-05T10:00:00Z"
 * ---
 * Body / notes in Markdown
 */

import { Task, TaskStatus, TaskPriority, TimeEntry, RecurrenceRule } from "../types";

/** Parse YAML frontmatter from a Markdown string */
export function parseTask(id: string, markdown: string): Task {
  const fmMatch = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!fmMatch) {
    return createDefaultTask(id, markdown.trim() || id);
  }

  const yamlStr = fmMatch[1];
  const body = fmMatch[2].trim();
  const fields = parseYaml(yamlStr);

  return {
    id,
    title: getString(fields, "title", id),
    status: getEnum(fields, "status", ["todo", "in_progress", "done", "cancelled"], "todo") as TaskStatus,
    due: getString(fields, "due", "") || null,
    scheduled: getString(fields, "scheduled", "") || null,
    priority: getEnum(fields, "priority", ["none", "low", "medium", "high", "urgent"], "none") as TaskPriority,
    contexts: getArray(fields, "contexts"),
    tags: getArray(fields, "tags"),
    projects: getArray(fields, "projects"),
    timeEstimate: getNumber(fields, "timeEstimate", null),
    timeEntries: getTimeEntries(fields),
    recurrence: getRecurrence(fields),
    complete_instances: getArray(fields, "complete_instances"),
    skipped_instances: getArray(fields, "skipped_instances"),
    blockedBy: getArray(fields, "blockedBy"),
    blocking: getArray(fields, "blocking"),
    body,
    archived: getString(fields, "archived", "false") === "true",
    completedDate: getString(fields, "completedDate", "") || null,
    createdDate: getString(fields, "createdDate", "") || getString(fields, "created", "") || new Date().toISOString(),
    modifiedDate: getString(fields, "modifiedDate", "") || getString(fields, "modified", "") || new Date().toISOString(),
    calendarEventId: getString(fields, "calendarEventId", "") || undefined,
    calendarHtmlLink: getString(fields, "calendarHtmlLink", "") || undefined,
  };
}

/** Serialize a task to Markdown with YAML frontmatter */
export function serializeTask(task: Task): string {
  const lines: string[] = ["---"];

  lines.push(`title: ${quoteIfNeeded(task.title)}`);
  lines.push(`status: ${task.status}`);
  lines.push(`due: ${task.due ? `"${task.due}"` : "null"}`);
  lines.push(`scheduled: ${task.scheduled ? `"${task.scheduled}"` : "null"}`);
  lines.push(`priority: ${task.priority}`);
  lines.push(`contexts: ${formatArray(task.contexts)}`);
  lines.push(`tags: ${formatArray(task.tags)}`);
  lines.push(`projects: ${formatArray(task.projects)}`);
  lines.push(`timeEstimate: ${task.timeEstimate ?? "null"}`);
  lines.push(`timeEntries: ${formatTimeEntries(task.timeEntries)}`);

  if (task.recurrence) {
    lines.push(`recurrence:`);
    lines.push(`  rrule: "${task.recurrence.rrule}"`);
    lines.push(`  recurrenceAnchor: ${task.recurrence.recurrenceAnchor}`);
  } else {
    lines.push(`recurrence: null`);
  }

  lines.push(`complete_instances: ${formatArray(task.complete_instances)}`);
  lines.push(`skipped_instances: ${formatArray(task.skipped_instances)}`);
  lines.push(`blockedBy: ${formatArray(task.blockedBy)}`);
  lines.push(`blocking: ${formatArray(task.blocking)}`);
  lines.push(`archived: ${task.archived}`);
  lines.push(`completedDate: ${task.completedDate ? `"${task.completedDate}"` : "null"}`);
  if (task.calendarEventId) {
    lines.push(`calendarEventId: "${task.calendarEventId}"`);
  }
  if (task.calendarHtmlLink) {
    lines.push(`calendarHtmlLink: "${task.calendarHtmlLink}"`);
  }
  lines.push(`createdDate: "${task.createdDate}"`);
  lines.push(`modifiedDate: "${task.modifiedDate}"`);
  lines.push("---");

  if (task.body) {
    lines.push("");
    lines.push(task.body);
  }

  return lines.join("\n") + "\n";
}

/** Create a default new task */
export function createDefaultTask(id: string, title: string): Task {
  const now = new Date().toISOString();
  return {
    id,
    title,
    status: "todo",
    due: null,
    scheduled: null,
    priority: "none",
    contexts: [],
    tags: [],
    projects: [],
    timeEstimate: null,
    timeEntries: [],
    recurrence: null,
    complete_instances: [],
    skipped_instances: [],
    blockedBy: [],
    blocking: [],
    body: "",
    archived: false,
    completedDate: null,
    createdDate: now,
    modifiedDate: now,
  };
}

// --- Simple YAML parser (handles flat key-value + arrays) ---

function parseYaml(yaml: string): Record<string, string> {
  const result: Record<string, string> = {};
  let currentKey = "";
  let currentIndentedValue = "";

  for (const line of yaml.split("\n")) {
    const indented = line.match(/^  (\w+):\s*(.*)$/);
    if (indented && currentKey) {
      // Sub-key of current key (e.g. recurrence.rrule)
      currentIndentedValue += (currentIndentedValue ? "\n" : "") + line;
      continue;
    }

    // Flush indented block
    if (currentKey && currentIndentedValue) {
      result[currentKey] = currentIndentedValue;
      currentIndentedValue = "";
    }

    const match = line.match(/^(\w+):\s*(.*)$/);
    if (match) {
      currentKey = match[1];
      const val = match[2].trim();
      if (val === "" || val === "|") {
        // Possibly a block with indented sub-keys
        result[currentKey] = "";
      } else {
        result[currentKey] = val;
        currentKey = "";
      }
    }
  }
  if (currentKey && currentIndentedValue) {
    result[currentKey] = currentIndentedValue;
  }

  return result;
}

function getString(fields: Record<string, string>, key: string, defaultValue: string): string {
  const v = fields[key];
  if (v === undefined || v === "null") return defaultValue;
  return v.replace(/^["']|["']$/g, "");
}

function getNumber(fields: Record<string, string>, key: string, defaultValue: number | null): number | null {
  const v = fields[key];
  if (v === undefined || v === "null") return defaultValue;
  const n = parseFloat(v);
  return isNaN(n) ? defaultValue : n;
}

function getEnum(fields: Record<string, string>, key: string, valid: string[], defaultValue: string): string {
  const v = getString(fields, key, defaultValue);
  return valid.includes(v) ? v : defaultValue;
}

function getArray(fields: Record<string, string>, key: string): string[] {
  const v = fields[key];
  if (!v || v === "null" || v === "[]") return [];
  // Parse [item1, item2] format
  const match = v.match(/^\[(.*)\]$/);
  if (match) {
    return match[1].split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
  }
  return [];
}

function getTimeEntries(fields: Record<string, string>): TimeEntry[] {
  const v = fields["timeEntries"];
  if (!v || v === "null" || v === "[]") return [];
  try {
    // Try JSON parse for complex arrays
    const parsed = JSON.parse(v.replace(/'/g, '"'));
    if (Array.isArray(parsed)) {
      // Normalize legacy field names (startTime/endTime → start/end)
      return parsed.map((e: any) => ({
        start: e.start || e.startTime,
        end: e.end ?? e.endTime ?? null,
      }));
    }
  } catch {
    // ignore
  }
  return [];
}

function getRecurrence(fields: Record<string, string>): RecurrenceRule | null {
  const v = fields["recurrence"];
  if (!v || v === "null") return null;
  // Parse indented sub-keys
  const rruleMatch = v.match(/rrule:\s*"?([^"]*)"?/);
  const anchorMatch = v.match(/recurrenceAnchor:\s*(\w+)/);
  // Legacy support: flexible → recurrenceAnchor
  const flexMatch = v.match(/flexible:\s*(true|false)/);
  if (rruleMatch) {
    let anchor: "scheduled" | "completion" = "scheduled";
    if (anchorMatch) {
      anchor = anchorMatch[1] === "completion" ? "completion" : "scheduled";
    } else if (flexMatch) {
      anchor = flexMatch[1] === "true" ? "completion" : "scheduled";
    }
    return { rrule: rruleMatch[1], recurrenceAnchor: anchor };
  }
  return null;
}

function quoteIfNeeded(s: string): string {
  if (s.includes(":") || s.includes("#") || s.includes('"') || s.includes("'") || s.startsWith("[")) {
    return `"${s.replace(/"/g, '\\"')}"`;
  }
  return s;
}

function formatArray(arr: string[]): string {
  if (arr.length === 0) return "[]";
  return `[${arr.join(", ")}]`;
}

function formatTimeEntries(entries: TimeEntry[]): string {
  if (entries.length === 0) return "[]";
  return JSON.stringify(entries);
}
