/**
 * Task editor dialog — create or edit a task with all fields.
 */

import * as React from "react";
import { Task, TaskStatus, TaskPriority, STATUS_ORDER } from "../types";
import { t } from "../i18n";
import { describeRRule, buildRRule } from "../core/recurrence";

interface TaskEditorProps {
  task: Task | null;
  fileId?: string | null;
  onSave: (task: Task) => void;
  onCancel: () => void;
  onDelete?: (taskId: string) => void;
  locale?: string;
  calendarAvailable?: boolean;
  onSyncCalendar?: (taskId: string) => void;
  onUnsyncCalendar?: (taskId: string) => void;
}

export function TaskEditor({ task, fileId, onSave, onCancel, onDelete, locale, calendarAvailable, onSyncCalendar, onUnsyncCalendar }: TaskEditorProps) {
  const i = t(locale);
  const isNew = !task;
  const [form, setForm] = React.useState<Task>(
    task ?? {
      id: "",
      title: "",
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
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
    },
  );

  const [contextsInput, setContextsInput] = React.useState(form.contexts.join(", "));
  const [projectsInput, setProjectsInput] = React.useState(form.projects.join(", "));
  const [recurrencePreset, setRecurrencePreset] = React.useState("none");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const contexts = contextsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const projects = projectsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    onSave({
      ...form,
      contexts,
      projects,
      modified: new Date().toISOString(),
    });
  };

  const setField = <K extends keyof Task>(key: K, value: Task[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleRecurrenceChange = (preset: string) => {
    setRecurrencePreset(preset);
    if (preset === "none") {
      setField("recurrence", null);
    } else {
      const rruleMap: Record<string, string> = {
        daily: "FREQ=DAILY;INTERVAL=1",
        weekly: "FREQ=WEEKLY;INTERVAL=1",
        monthly: "FREQ=MONTHLY;INTERVAL=1",
        yearly: "FREQ=YEARLY;INTERVAL=1",
      };
      setField("recurrence", { rrule: rruleMap[preset] || buildRRule({ freq: "DAILY" }), flexible: false });
    }
  };

  return (
    <div className="tn-editor-overlay" onClick={onCancel}>
      <form className="tn-editor" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="tn-editor-header">
          <h3>{isNew ? i.newTask : i.editTask}</h3>
          {!isNew && fileId && (
            <button
              type="button"
              className="tn-open-note-btn"
              title={i.openNote}
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set("file", fileId);
                window.history.pushState({}, "", url.toString());
                window.dispatchEvent(new PopStateEvent("popstate"));
                onCancel();
              }}
            >
              &#x2197;
            </button>
          )}
        </div>

        <label className="tn-field">
          <span>{i.title}</span>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
            placeholder={i.newTaskPlaceholder}
            autoFocus
          />
        </label>

        <div className="tn-field-row">
          <label className="tn-field">
            <span>{i.status}</span>
            <select value={form.status} onChange={(e) => setField("status", e.target.value as TaskStatus)}>
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {i[`status${s.charAt(0).toUpperCase() + s.slice(1).replace(/_./g, (m) => m[1].toUpperCase())}` as keyof typeof i] as string}
                </option>
              ))}
            </select>
          </label>

          <label className="tn-field">
            <span>{i.priority}</span>
            <select value={form.priority} onChange={(e) => setField("priority", e.target.value as TaskPriority)}>
              {(["none", "low", "medium", "high", "urgent"] as TaskPriority[]).map((p) => (
                <option key={p} value={p}>
                  {i[`priority${p.charAt(0).toUpperCase() + p.slice(1)}` as keyof typeof i] as string}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="tn-field-row">
          <label className="tn-field">
            <span>{i.due}</span>
            <input
              type="date"
              value={form.due ?? ""}
              onChange={(e) => setField("due", e.target.value || null)}
            />
          </label>

          <label className="tn-field">
            <span>{i.timeEstimate} (min)</span>
            <input
              type="number"
              min="0"
              value={form.timeEstimate ?? ""}
              onChange={(e) => setField("timeEstimate", e.target.value ? parseInt(e.target.value) : null)}
            />
          </label>
        </div>

        <label className="tn-field">
          <span>{i.contexts} (comma-separated)</span>
          <input
            type="text"
            value={contextsInput}
            onChange={(e) => setContextsInput(e.target.value)}
            placeholder="errands, home, work"
          />
        </label>

        <label className="tn-field">
          <span>{i.projects} (comma-separated)</span>
          <input
            type="text"
            value={projectsInput}
            onChange={(e) => setProjectsInput(e.target.value)}
            placeholder="shopping, renovation"
          />
        </label>

        <label className="tn-field">
          <span>{i.recurrence}</span>
          <select value={recurrencePreset} onChange={(e) => handleRecurrenceChange(e.target.value)}>
            <option value="none">-</option>
            <option value="daily">{i.recurrenceDaily}</option>
            <option value="weekly">{i.recurrenceWeekly}</option>
            <option value="monthly">{i.recurrenceMonthly}</option>
            <option value="yearly">{i.recurrenceYearly}</option>
          </select>
          {form.recurrence && (
            <span className="tn-hint">{describeRRule(form.recurrence.rrule, locale)}</span>
          )}
        </label>

        <label className="tn-field">
          <span>{i.notes}</span>
          <textarea
            rows={4}
            value={form.body}
            onChange={(e) => setField("body", e.target.value)}
          />
        </label>

        {/* Calendar sync status */}
        {!isNew && calendarAvailable && (
          <div className="tn-calendar-sync-section">
            {form.calendarHtmlLink ? (
              <div className="tn-calendar-synced">
                <a href={form.calendarHtmlLink} target="_blank" rel="noopener noreferrer" className="tn-calendar-link">
                  {i.calendarOpenEvent} &#x2197;
                </a>
                {onUnsyncCalendar && (
                  <button type="button" className="tn-btn tn-btn-small" onClick={() => onUnsyncCalendar(form.id)}>
                    {i.calendarUnsyncTask}
                  </button>
                )}
              </div>
            ) : (
              onSyncCalendar && (
                <button type="button" className="tn-btn tn-btn-small" onClick={() => onSyncCalendar(form.id)}>
                  &#x1F4C5; {i.calendarSyncTask}
                </button>
              )
            )}
          </div>
        )}

        <div className="tn-editor-actions">
          <button type="submit" className="tn-btn-primary">
            {i.save}
          </button>
          <button type="button" className="tn-btn" onClick={onCancel}>
            {i.cancel}
          </button>
          {!isNew && onDelete && (
            <button
              type="button"
              className="tn-btn-danger"
              onClick={() => {
                if (confirm(i.deleteConfirm)) onDelete(form.id);
              }}
            >
              {i.deleteTask}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
