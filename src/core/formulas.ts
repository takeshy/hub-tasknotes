/**
 * Computed / formula properties for tasks.
 * Provides dynamic values like daysUntilDue, isOverdue, urgencyScore, etc.
 */

import { Task, TaskFormulas, PRIORITY_VALUES } from "../types";

/** Calculate all formula properties for a task */
export function computeFormulas(task: Task): TaskFormulas {
  const daysUntilDue = calcDaysUntilDue(task);
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0 && task.status !== "done" && task.status !== "cancelled";
  const totalTrackedTime = calcTotalTrackedTime(task);
  const urgencyScore = calcUrgencyScore(task, daysUntilDue);
  const efficiencyRatio = calcEfficiencyRatio(task, totalTrackedTime);

  return { daysUntilDue, isOverdue, urgencyScore, totalTrackedTime, efficiencyRatio };
}

/** Days until due date (negative = overdue, null = no due date or invalid) */
function calcDaysUntilDue(task: Task): number | null {
  if (!task.due) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(task.due + "T00:00:00");
  if (Number.isNaN(due.getTime())) return null;
  const diff = due.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/** Total tracked time in minutes across all time entries */
function calcTotalTrackedTime(task: Task): number {
  let total = 0;
  for (const entry of task.timeEntries) {
    const start = new Date(entry.start).getTime();
    const end = entry.end ? new Date(entry.end).getTime() : Date.now();
    total += (end - start) / (1000 * 60);
  }
  return Math.round(total);
}

/**
 * Urgency score — higher = more urgent.
 *
 * Factors:
 * - Priority value (0-4) weighted x3
 * - Days overdue (capped at 30) weighted x2
 * - In-progress tasks get a +2 boost
 * - Tasks with no due date get a small reduction
 */
function calcUrgencyScore(task: Task, daysUntilDue: number | null): number {
  if (task.status === "done" || task.status === "cancelled") return 0;

  let score = PRIORITY_VALUES[task.priority] * 3;

  if (daysUntilDue !== null) {
    if (daysUntilDue < 0) {
      // Overdue: add urgency based on how overdue
      score += Math.min(Math.abs(daysUntilDue), 30) * 2;
    } else if (daysUntilDue <= 1) {
      score += 8;
    } else if (daysUntilDue <= 3) {
      score += 5;
    } else if (daysUntilDue <= 7) {
      score += 2;
    }
  } else {
    score -= 1;
  }

  if (task.status === "in_progress") score += 2;

  return Math.max(0, score);
}

/** Efficiency ratio: estimated time / actual time (> 1 = faster than estimated) */
function calcEfficiencyRatio(task: Task, totalTrackedTime: number): number | null {
  if (!task.timeEstimate || totalTrackedTime === 0) return null;
  return Math.round((task.timeEstimate / totalTrackedTime) * 100) / 100;
}
