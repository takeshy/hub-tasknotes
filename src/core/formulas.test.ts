import { describe, it, expect } from "vitest";
import { computeFormulas } from "./formulas";
import { createDefaultTask } from "./taskSerializer";

describe("computeFormulas", () => {
  it("returns null daysUntilDue when no due date", () => {
    const task = createDefaultTask("t1", "No due");
    const f = computeFormulas(task);
    expect(f.daysUntilDue).toBeNull();
    expect(f.isOverdue).toBe(false);
  });

  it("detects overdue tasks", () => {
    const task = createDefaultTask("t1", "Overdue task");
    task.due = "2020-01-01";
    const f = computeFormulas(task);
    expect(f.daysUntilDue).toBeLessThan(0);
    expect(f.isOverdue).toBe(true);
  });

  it("does not mark done tasks as overdue", () => {
    const task = createDefaultTask("t1", "Done overdue");
    task.due = "2020-01-01";
    task.status = "done";
    const f = computeFormulas(task);
    expect(f.isOverdue).toBe(false);
    expect(f.urgencyScore).toBe(0);
  });

  it("calculates higher urgency for higher priority", () => {
    const low = createDefaultTask("t1", "Low");
    low.priority = "low";
    const high = createDefaultTask("t2", "High");
    high.priority = "high";
    expect(computeFormulas(high).urgencyScore).toBeGreaterThan(computeFormulas(low).urgencyScore);
  });

  it("calculates total tracked time", () => {
    const task = createDefaultTask("t1", "Tracked");
    const start = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
    const end = new Date();
    task.timeEntries = [{ startTime: start.toISOString(), endTime: end.toISOString() }];
    const f = computeFormulas(task);
    expect(f.totalTrackedTime).toBeGreaterThanOrEqual(59);
    expect(f.totalTrackedTime).toBeLessThanOrEqual(61);
  });

  it("calculates efficiency ratio", () => {
    const task = createDefaultTask("t1", "Efficient");
    task.timeEstimate = 60;
    const start = new Date(Date.now() - 30 * 60 * 1000); // 30 min ago
    const end = new Date();
    task.timeEntries = [{ startTime: start.toISOString(), endTime: end.toISOString() }];
    const f = computeFormulas(task);
    expect(f.efficiencyRatio).toBeGreaterThan(1.5);
    expect(f.efficiencyRatio).toBeLessThanOrEqual(2.1);
  });
});
