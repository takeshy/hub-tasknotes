import { describe, it, expect } from "vitest";
import { parseTask, serializeTask, createDefaultTask } from "./taskSerializer";

describe("taskSerializer", () => {
  it("creates a default task", () => {
    const task = createDefaultTask("test-1", "Test task");
    expect(task.id).toBe("test-1");
    expect(task.title).toBe("Test task");
    expect(task.status).toBe("todo");
    expect(task.priority).toBe("none");
    expect(task.contexts).toEqual([]);
  });

  it("round-trips a task through serialize and parse", () => {
    const original = createDefaultTask("test-1", "Buy groceries");
    original.status = "in_progress";
    original.due = "2026-04-10";
    original.scheduled = "2026-04-09T14:00";
    original.priority = "high";
    original.contexts = ["errands", "home"];
    original.tags = ["shopping", "weekly"];
    original.projects = ["renovation"];
    original.timeEstimate = 30;
    original.timeEntries = [{ start: "2026-04-05T10:00:00Z", end: "2026-04-05T10:30:00Z" }];
    original.recurrence = { rrule: "FREQ=WEEKLY;INTERVAL=1", recurrenceAnchor: "scheduled" };
    original.complete_instances = ["2026-04-02"];
    original.skipped_instances = ["2026-04-01"];
    original.blockedBy = ["task-abc"];
    original.blocking = ["task-xyz"];
    original.archived = false;
    original.completedDate = null;
    original.body = "- Milk\n- Bread";

    const markdown = serializeTask(original);
    const parsed = parseTask("test-1", markdown);

    expect(parsed.id).toBe(original.id);
    expect(parsed.title).toBe(original.title);
    expect(parsed.status).toBe(original.status);
    expect(parsed.due).toBe(original.due);
    expect(parsed.scheduled).toBe(original.scheduled);
    expect(parsed.priority).toBe(original.priority);
    expect(parsed.contexts).toEqual(original.contexts);
    expect(parsed.tags).toEqual(original.tags);
    expect(parsed.projects).toEqual(original.projects);
    expect(parsed.timeEstimate).toBe(original.timeEstimate);
    expect(parsed.timeEntries).toEqual(original.timeEntries);
    expect(parsed.recurrence).toEqual(original.recurrence);
    expect(parsed.complete_instances).toEqual(original.complete_instances);
    expect(parsed.skipped_instances).toEqual(original.skipped_instances);
    expect(parsed.blockedBy).toEqual(original.blockedBy);
    expect(parsed.blocking).toEqual(original.blocking);
    expect(parsed.archived).toBe(original.archived);
    expect(parsed.completedDate).toBe(original.completedDate);
    expect(parsed.body).toBe(original.body);
  });

  it("parses plain text as title when no frontmatter", () => {
    const task = parseTask("test-1", "Just a title");
    expect(task.title).toBe("Just a title");
    expect(task.status).toBe("todo");
  });

  it("serializes recurrence correctly", () => {
    const task = createDefaultTask("test-1", "Daily check");
    task.recurrence = { rrule: "FREQ=DAILY;INTERVAL=1", recurrenceAnchor: "completion" };
    const md = serializeTask(task);
    expect(md).toContain('rrule: "FREQ=DAILY;INTERVAL=1"');
    expect(md).toContain("recurrenceAnchor: completion");
  });
});
