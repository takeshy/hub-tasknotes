/**
 * Serialize / deserialize tasks to/from Markdown with YAML frontmatter.
 *
 * Format:
 * ---
 * title: Buy groceries
 * status: todo
 * due: "2026-04-10"
 * priority: medium
 * contexts: [errands, home]
 * projects: [shopping]
 * timeEstimate: 30
 * timeEntries: []
 * recurrence: null
 * completeInstances: []
 * dependencies: []
 * created: "2026-04-05T10:00:00Z"
 * modified: "2026-04-05T10:00:00Z"
 * ---
 * Body / notes in Markdown
 */

import { Task, TaskStatus, TaskPriority, TimeEntry, RecurrenceRule, TaskDependency } from "../types";

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
    priority: getEnum(fields, "priority", ["none", "low", "medium", "high", "urgent"], "none") as TaskPriority,
    contexts: getArray(fields, "contexts"),
    projects: getArray(fields, "projects"),
    timeEstimate: getNumber(fields, "timeEstimate", null),
    timeEntries: getTimeEntries(fields),
    recurrence: getRecurrence(fields),
    completeInstances: getArray(fields, "completeInstances"),
    dependencies: getDependencies(fields),
    body,
    created: getString(fields, "created", new Date().toISOString()),
    modified: getString(fields, "modified", new Date().toISOString()),
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
  lines.push(`priority: ${task.priority}`);
  lines.push(`contexts: ${formatArray(task.contexts)}`);
  lines.push(`projects: ${formatArray(task.projects)}`);
  lines.push(`timeEstimate: ${task.timeEstimate ?? "null"}`);
  lines.push(`timeEntries: ${formatTimeEntries(task.timeEntries)}`);

  if (task.recurrence) {
    lines.push(`recurrence:`);
    lines.push(`  rrule: "${task.recurrence.rrule}"`);
    lines.push(`  flexible: ${task.recurrence.flexible}`);
  } else {
    lines.push(`recurrence: null`);
  }

  lines.push(`completeInstances: ${formatArray(task.completeInstances)}`);
  lines.push(`dependencies: ${formatDependencies(task.dependencies)}`);
  if (task.calendarEventId) {
    lines.push(`calendarEventId: "${task.calendarEventId}"`);
  }
  if (task.calendarHtmlLink) {
    lines.push(`calendarHtmlLink: "${task.calendarHtmlLink}"`);
  }
  lines.push(`created: "${task.created}"`);
  lines.push(`modified: "${task.modified}"`);
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
    priority: "none",
    contexts: [],
    projects: [],
    timeEstimate: null,
    timeEntries: [],
    recurrence: null,
    completeInstances: [],
    dependencies: [],
    body: "",
    created: now,
    modified: now,
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
    if (Array.isArray(parsed)) return parsed;
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
  const flexMatch = v.match(/flexible:\s*(true|false)/);
  if (rruleMatch) {
    return {
      rrule: rruleMatch[1],
      flexible: flexMatch ? flexMatch[1] === "true" : false,
    };
  }
  return null;
}

function getDependencies(fields: Record<string, string>): TaskDependency[] {
  const v = fields["dependencies"];
  if (!v || v === "null" || v === "[]") return [];
  try {
    const parsed = JSON.parse(v.replace(/'/g, '"'));
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // ignore
  }
  return [];
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

function formatDependencies(deps: TaskDependency[]): string {
  if (deps.length === 0) return "[]";
  return JSON.stringify(deps);
}
