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
    original.priority = "high";
    original.contexts = ["errands", "home"];
    original.projects = ["shopping"];
    original.timeEstimate = 30;
    original.body = "- Milk\n- Bread";

    const markdown = serializeTask(original);
    const parsed = parseTask("test-1", markdown);

    expect(parsed.id).toBe(original.id);
    expect(parsed.title).toBe(original.title);
    expect(parsed.status).toBe(original.status);
    expect(parsed.due).toBe(original.due);
    expect(parsed.priority).toBe(original.priority);
    expect(parsed.contexts).toEqual(original.contexts);
    expect(parsed.projects).toEqual(original.projects);
    expect(parsed.timeEstimate).toBe(original.timeEstimate);
    expect(parsed.body).toBe(original.body);
  });

  it("parses plain text as title when no frontmatter", () => {
    const task = parseTask("test-1", "Just a title");
    expect(task.title).toBe("Just a title");
    expect(task.status).toBe("todo");
  });

  it("serializes recurrence correctly", () => {
    const task = createDefaultTask("test-1", "Daily check");
    task.recurrence = { rrule: "FREQ=DAILY;INTERVAL=1", flexible: true };
    const md = serializeTask(task);
    expect(md).toContain('rrule: "FREQ=DAILY;INTERVAL=1"');
    expect(md).toContain("flexible: true");
  });
});
