import { describe, it, expect } from "vitest";
import { parseNaturalLanguage } from "./naturalLanguage";

describe("parseNaturalLanguage", () => {
  it("extracts contexts with @ prefix", () => {
    const result = parseNaturalLanguage("Buy groceries @errands @home");
    expect(result.contexts).toEqual(["errands", "home"]);
    expect(result.title).toBe("Buy groceries");
  });

  it("extracts tags with # prefix", () => {
    const result = parseNaturalLanguage("Buy groceries #shopping #food");
    expect(result.tags).toEqual(["shopping", "food"]);
    expect(result.title).toBe("Buy groceries");
  });

  it("extracts projects with + prefix", () => {
    const result = parseNaturalLanguage("Fix bug +backend +api");
    expect(result.projects).toEqual(["backend", "api"]);
    expect(result.title).toBe("Fix bug");
  });

  it("extracts priority with ! prefix", () => {
    const result = parseNaturalLanguage("Urgent task !urgent");
    expect(result.priority).toBe("urgent");
    expect(result.title).toBe("Urgent task");
  });

  it("extracts ISO date", () => {
    const result = parseNaturalLanguage("Review PR 2026-04-15");
    expect(result.due).toBe("2026-04-15");
    expect(result.title).toBe("Review PR");
  });

  it("extracts relative date: tomorrow", () => {
    const result = parseNaturalLanguage("Buy groceries tomorrow");
    expect(result.due).not.toBeNull();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const expected = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
    expect(result.due).toBe(expected);
  });

  it("extracts recurrence: every day", () => {
    const result = parseNaturalLanguage("Check email every day");
    expect(result.recurrence).toBe("FREQ=DAILY;INTERVAL=1");
  });

  it("extracts recurrence: 毎週", () => {
    const result = parseNaturalLanguage("掃除 毎週");
    expect(result.recurrence).toBe("FREQ=WEEKLY;INTERVAL=1");
  });

  it("extracts scheduled date with ~ prefix", () => {
    const result = parseNaturalLanguage("Meeting ~2026-04-10T14:00");
    expect(result.scheduled).toBe("2026-04-10T14:00");
    expect(result.title).toBe("Meeting");
  });

  it("extracts scheduled date-only with ~ prefix", () => {
    const result = parseNaturalLanguage("Meeting ~2026-04-10");
    expect(result.scheduled).toBe("2026-04-10");
  });

  it("does not extract @ from email addresses", () => {
    const result = parseNaturalLanguage("Email john@example.com about report");
    expect(result.contexts).toEqual([]);
    expect(result.title).toBe("Email john@example.com about report");
  });

  it("combines all features", () => {
    const result = parseNaturalLanguage("Buy groceries tomorrow @errands #food +shopping !high");
    expect(result.contexts).toEqual(["errands"]);
    expect(result.tags).toEqual(["food"]);
    expect(result.projects).toEqual(["shopping"]);
    expect(result.priority).toBe("high");
    expect(result.due).not.toBeNull();
    expect(result.title).toBe("Buy groceries");
  });
});
