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
  onOpenNote?: (task: Task, fileId: string) => void;
  locale?: string;
  calendarAvailable?: boolean;
  onSyncCalendar?: (taskId: string) => void;
  onUnsyncCalendar?: (taskId: string) => void;
}

export function TaskEditor({ task, fileId, onSave, onCancel, onDelete, onOpenNote, locale, calendarAvailable, onSyncCalendar, onUnsyncCalendar }: TaskEditorProps) {
  const i = t(locale);
  const isNew = !task || !task.id;
  const [form, setForm] = React.useState<Task>(
    task ?? {
      id: "",
      title: "",
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
      createdDate: new Date().toISOString(),
      modifiedDate: new Date().toISOString(),
    },
  );

  const [contextsInput, setContextsInput] = React.useState(form.contexts.join(", "));
  const [tagsInput, setTagsInput] = React.useState(form.tags.join(", "));
  const [projectsInput, setProjectsInput] = React.useState(form.projects.join(", "));
  const [scheduledDate, setScheduledDate] = React.useState(form.scheduled ? form.scheduled.slice(0, 10) : "");
  const [scheduledTime, setScheduledTime] = React.useState(form.scheduled && form.scheduled.includes("T") ? form.scheduled.slice(11, 16) : "");
  const [recurrencePreset, setRecurrencePreset] = React.useState("none");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const contexts = contextsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const tags = tagsInput
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
      tags,
      projects,
      modifiedDate: new Date().toISOString(),
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
      setField("recurrence", { rrule: rruleMap[preset] || buildRRule({ freq: "DAILY" }), recurrenceAnchor: "scheduled" });
    }
  };

  return (
    <div className="tn-editor-overlay" onClick={onCancel}>
      <form className="tn-editor" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="tn-editor-header">
          <h3>{isNew ? i.newTask : i.editTask}</h3>
          {!isNew && fileId && onOpenNote && (
            <button
              type="button"
              className="tn-open-note-btn"
              title={i.openNote}
              onClick={() => {
                const contexts = contextsInput.split(",").map((s) => s.trim()).filter(Boolean);
                const tags = tagsInput.split(",").map((s) => s.trim()).filter(Boolean);
                const projects = projectsInput.split(",").map((s) => s.trim()).filter(Boolean);
                onOpenNote({ ...form, contexts, tags, projects, modifiedDate: new Date().toISOString() }, fileId!);
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

        <div className="tn-field-row">
          <label className="tn-field">
            <span>{i.scheduled}</span>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => {
                const d = e.target.value;
                setScheduledDate(d);
                if (d) {
                  setField("scheduled", scheduledTime ? `${d}T${scheduledTime}` : d);
                } else {
                  setScheduledTime("");
                  setField("scheduled", null);
                }
              }}
            />
          </label>
          <label className="tn-field">
            <span>{i.dueTime}</span>
            <input
              type="time"
              value={scheduledTime}
              disabled={!scheduledDate}
              onChange={(e) => {
                const tm = e.target.value;
                setScheduledTime(tm);
                if (scheduledDate) {
                  setField("scheduled", tm ? `${scheduledDate}T${tm}` : scheduledDate);
                }
              }}
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
          <span>{i.tags} (comma-separated)</span>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="errands, review"
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
