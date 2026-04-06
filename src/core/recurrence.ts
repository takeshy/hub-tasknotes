/**
 * Recurrence rule (RRULE) utilities.
 * Supports a practical subset of RFC 5545 RRULE:
 *   FREQ=DAILY|WEEKLY|MONTHLY|YEARLY
 *   INTERVAL=N
 *   BYDAY=MO,TU,...
 *   COUNT=N
 *   UNTIL=YYYYMMDD
 */

import { RecurrenceRule } from "../types";

interface RRuleParts {
  freq: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  interval: number;
  byDay: string[];
  count: number | null;
  until: string | null; // ISO date
}

/** Parse an RRULE string into parts */
export function parseRRule(rrule: string): RRuleParts {
  const parts: RRuleParts = {
    freq: "DAILY",
    interval: 1,
    byDay: [],
    count: null,
    until: null,
  };

  for (const segment of rrule.split(";")) {
    const [key, value] = segment.split("=");
    switch (key) {
      case "FREQ":
        parts.freq = value as RRuleParts["freq"];
        break;
      case "INTERVAL":
        parts.interval = parseInt(value) || 1;
        break;
      case "BYDAY":
        parts.byDay = value.split(",");
        break;
      case "COUNT":
        parts.count = parseInt(value) || null;
        break;
      case "UNTIL":
        parts.until = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
        break;
    }
  }

  return parts;
}

/** Build an RRULE string from parts */
export function buildRRule(parts: Partial<RRuleParts>): string {
  const segments: string[] = [];
  segments.push(`FREQ=${parts.freq || "DAILY"}`);
  if (parts.interval && parts.interval > 1) segments.push(`INTERVAL=${parts.interval}`);
  if (parts.byDay && parts.byDay.length > 0) segments.push(`BYDAY=${parts.byDay.join(",")}`);
  if (parts.count) segments.push(`COUNT=${parts.count}`);
  if (parts.until) segments.push(`UNTIL=${parts.until.replace(/-/g, "")}`);
  return segments.join(";");
}

/** Calculate the next occurrence date from a base date */
export function getNextOccurrence(rule: RecurrenceRule, baseDate: string): string {
  const parts = parseRRule(rule.rrule);
  const base = new Date(baseDate + "T00:00:00");

  // Check if UNTIL has passed
  if (parts.until) {
    const until = new Date(parts.until + "T23:59:59");
    if (base >= until) return "";
  }

  const next = new Date(base);

  switch (parts.freq) {
    case "DAILY":
      next.setDate(next.getDate() + parts.interval);
      break;
    case "WEEKLY":
      if (parts.byDay.length > 0) {
        // Find next matching day of week
        const dayMap: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
        const targetDays = parts.byDay.map((d) => dayMap[d]).filter((d) => d !== undefined);
        let found = false;
        for (let i = 1; i <= 7 * parts.interval; i++) {
          const candidate = new Date(base);
          candidate.setDate(candidate.getDate() + i);
          if (targetDays.includes(candidate.getDay())) {
            next.setTime(candidate.getTime());
            found = true;
            break;
          }
        }
        if (!found) next.setDate(next.getDate() + 7 * parts.interval);
      } else {
        next.setDate(next.getDate() + 7 * parts.interval);
      }
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + parts.interval);
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + parts.interval);
      break;
  }

  return formatDate(next);
}

/** Get a human-readable description of a recurrence rule */
export function describeRRule(rrule: string, locale?: string): string {
  const parts = parseRRule(rrule);
  const isJa = locale?.startsWith("ja");

  const interval = parts.interval;

  if (isJa) {
    switch (parts.freq) {
      case "DAILY":
        return interval === 1 ? "毎日" : `${interval}日ごと`;
      case "WEEKLY":
        return interval === 1 ? "毎週" : `${interval}週間ごと`;
      case "MONTHLY":
        return interval === 1 ? "毎月" : `${interval}ヶ月ごと`;
      case "YEARLY":
        return interval === 1 ? "毎年" : `${interval}年ごと`;
    }
  }

  switch (parts.freq) {
    case "DAILY":
      return interval === 1 ? "Daily" : `Every ${interval} days`;
    case "WEEKLY": {
      const base = interval === 1 ? "Weekly" : `Every ${interval} weeks`;
      if (parts.byDay.length > 0) return `${base} on ${parts.byDay.join(", ")}`;
      return base;
    }
    case "MONTHLY":
      return interval === 1 ? "Monthly" : `Every ${interval} months`;
    case "YEARLY":
      return interval === 1 ? "Yearly" : `Every ${interval} years`;
  }
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
