/**
 * Natural language parser for task creation.
 *
 * Parses strings like:
 *   "Buy groceries tomorrow #errands +shopping !high"
 *   "Call dentist next Monday #health"
 *   "Review PR 2026-04-15 !urgent"
 */

import { Task } from "../types";
import { createDefaultTask } from "./taskSerializer";

interface ParsedInput {
  title: string;
  due: string | null;
  contexts: string[];
  projects: string[];
  priority: "none" | "low" | "medium" | "high" | "urgent";
  recurrence: string | null;
}

/** Parse a natural language task input string */
export function parseNaturalLanguage(input: string): ParsedInput {
  let remaining = input.trim();
  const contexts: string[] = [];
  const projects: string[] = [];
  let priority: ParsedInput["priority"] = "none";
  let due: string | null = null;
  let recurrence: string | null = null;

  // Extract #contexts
  remaining = remaining.replace(/#(\w+)/g, (_, ctx) => {
    contexts.push(ctx);
    return "";
  });

  // Extract +projects
  remaining = remaining.replace(/\+(\w+)/g, (_, proj) => {
    projects.push(proj);
    return "";
  });

  // Extract !priority
  remaining = remaining.replace(/!(\w+)/g, (_, p) => {
    const lp = p.toLowerCase();
    if (["low", "medium", "high", "urgent"].includes(lp)) {
      priority = lp as ParsedInput["priority"];
    }
    return "";
  });

  // Extract recurrence keywords
  const recurrencePatterns: [RegExp, string][] = [
    [/\bevery\s+day\b/i, "FREQ=DAILY;INTERVAL=1"],
    [/\bevery\s+week\b/i, "FREQ=WEEKLY;INTERVAL=1"],
    [/\bevery\s+month\b/i, "FREQ=MONTHLY;INTERVAL=1"],
    [/\bevery\s+year\b/i, "FREQ=YEARLY;INTERVAL=1"],
    [/毎日/, "FREQ=DAILY;INTERVAL=1"],
    [/毎週/, "FREQ=WEEKLY;INTERVAL=1"],
    [/毎月/, "FREQ=MONTHLY;INTERVAL=1"],
    [/毎年/, "FREQ=YEARLY;INTERVAL=1"],
  ];
  for (const [pattern, rrule] of recurrencePatterns) {
    if (pattern.test(remaining)) {
      recurrence = rrule;
      remaining = remaining.replace(pattern, "");
      break;
    }
  }

  // Extract explicit dates (YYYY-MM-DD)
  const isoMatch = remaining.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (isoMatch) {
    due = isoMatch[1];
    remaining = remaining.replace(isoMatch[0], "");
  }

  // Extract relative dates
  if (!due) {
    due = extractRelativeDate(remaining);
    if (due) {
      remaining = removeRelativeDateText(remaining);
    }
  }

  const title = remaining.replace(/\s+/g, " ").trim();

  return { title, due, contexts, projects, priority, recurrence };
}

/** Create a Task from natural language input */
export function createTaskFromNaturalLanguage(input: string): Task {
  const parsed = parseNaturalLanguage(input);
  const id = generateTaskId(parsed.title);
  const task = createDefaultTask(id, parsed.title);

  task.due = parsed.due;
  task.contexts = parsed.contexts;
  task.projects = parsed.projects;
  task.priority = parsed.priority;

  if (parsed.recurrence) {
    task.recurrence = { rrule: parsed.recurrence, recurrenceAnchor: "scheduled" };
  }

  return task;
}

function extractRelativeDate(text: string): string | null {
  const today = new Date();
  const lower = text.toLowerCase();

  if (/\btoday\b|今日/.test(lower)) return formatDate(today);
  if (/\btomorrow\b|明日/.test(lower)) return formatDate(addDays(today, 1));
  if (/\byesterday\b|昨日/.test(lower)) return formatDate(addDays(today, -1));
  if (/\b明後日\b/.test(lower)) return formatDate(addDays(today, 2));

  // "next Monday", "next Tuesday", etc.
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const nextDayMatch = lower.match(/\bnext\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
  if (nextDayMatch) {
    const targetDay = dayNames.indexOf(nextDayMatch[1]);
    const currentDay = today.getDay();
    let daysAhead = targetDay - currentDay;
    if (daysAhead <= 0) daysAhead += 7;
    return formatDate(addDays(today, daysAhead));
  }

  // Japanese day of week: 来週月曜, 来週火曜, etc.
  const jaDays = ["日", "月", "火", "水", "木", "金", "土"];
  const jaMatch = text.match(/来週([日月火水木金土])曜/);
  if (jaMatch) {
    const targetDay = jaDays.indexOf(jaMatch[1]);
    if (targetDay >= 0) {
      const currentDay = today.getDay();
      let daysAhead = targetDay - currentDay + 7;
      if (daysAhead <= 0) daysAhead += 7;
      return formatDate(addDays(today, daysAhead));
    }
  }

  // "in N days"
  const inDaysMatch = lower.match(/\bin\s+(\d+)\s+days?\b/);
  if (inDaysMatch) return formatDate(addDays(today, parseInt(inDaysMatch[1])));

  // "N日後"
  const jaDaysMatch = text.match(/(\d+)日後/);
  if (jaDaysMatch) return formatDate(addDays(today, parseInt(jaDaysMatch[1])));

  return null;
}

function removeRelativeDateText(text: string): string {
  return text
    .replace(/\btoday\b|\btomorrow\b|\byesterday\b/gi, "")
    .replace(/\bnext\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/gi, "")
    .replace(/\bin\s+\d+\s+days?\b/gi, "")
    .replace(/今日|明日|昨日|明後日/g, "")
    .replace(/来週[日月火水木金土]曜/g, "")
    .replace(/\d+日後/g, "");
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function generateTaskId(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const ts = Date.now().toString(36);
  return `${slug}-${ts}`;
}
