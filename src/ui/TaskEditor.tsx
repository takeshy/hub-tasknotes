/**
 * Task editor dialog — create or edit a task with all fields.
 */

import * as React from "react";
import { Task, TaskStatus, TaskPriority, STATUS_ORDER } from "../types";
import { t, setLanguage } from "../i18n";
import { describeRRule, buildRRule } from "../core/recurrence";
import { formatDuration } from "../core/timeTracking";

interface TaskEditorProps {
  task: Task | null;
  fileId?: string | null;
  onSave: (task: Task) => void;
  onCancel: () => void;
  onDelete?: (taskId: string) => void;
  onOpenNote?: (task: Task, fileId: string) => void;
  language?: string;
  calendarAvailable?: boolean;
  onSyncCalendar?: (taskId: string) => void;
  onUnsyncCalendar?: (taskId: string) => void;
}

/** Convert UTC ISO string to local datetime-local value (YYYY-MM-DDTHH:MM) */
function toLocalDatetime(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}`;
}

function getRecurrencePreset(task: Task | null): string {
  const rrule = task?.recurrence?.rrule;
  switch (rrule) {
    case "FREQ=DAILY;INTERVAL=1":
      return "daily";
    case "FREQ=WEEKLY;INTERVAL=1":
      return "weekly";
    case "FREQ=MONTHLY;INTERVAL=1":
      return "monthly";
    case "FREQ=YEARLY;INTERVAL=1":
      return "yearly";
    default:
      return "none";
  }
}

export function TaskEditor({ task, fileId, onSave, onCancel, onDelete, onOpenNote, language, calendarAvailable, onSyncCalendar, onUnsyncCalendar }: TaskEditorProps) {
  React.useEffect(() => { if (language) setLanguage(language); }, [language]);
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
  const [blockedByInput, setBlockedByInput] = React.useState(form.blockedBy.join(", "));
  const [blockingInput, setBlockingInput] = React.useState(form.blocking.join(", "));
  const [scheduledDate, setScheduledDate] = React.useState(form.scheduled ? form.scheduled.slice(0, 10) : "");
  const [scheduledTime, setScheduledTime] = React.useState(form.scheduled && form.scheduled.includes("T") ? form.scheduled.slice(11, 16) : "");
  const [recurrencePreset, setRecurrencePreset] = React.useState(getRecurrencePreset(task));

  // Sync form state when the task prop changes (e.g. after external reload)
  React.useEffect(() => {
    if (task) {
      setForm(task);
      setContextsInput(task.contexts.join(", "));
      setTagsInput(task.tags.join(", "));
      setProjectsInput(task.projects.join(", "));
      setBlockedByInput(task.blockedBy.join(", "));
      setBlockingInput(task.blocking.join(", "));
      setScheduledDate(task.scheduled ? task.scheduled.slice(0, 10) : "");
      setScheduledTime(task.scheduled && task.scheduled.includes("T") ? task.scheduled.slice(11, 16) : "");
      setRecurrencePreset(getRecurrencePreset(task));
    }
  }, [task?.id, task?.modifiedDate]);

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
    const blockedBy = blockedByInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const blocking = blockingInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    onSave({
      ...form,
      contexts,
      tags,
      projects,
      blockedBy,
      blocking,
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
          <h3>{isNew ? t("newTask") : t("editTask")}</h3>
          {!isNew && fileId && onOpenNote && (
            <button
              type="button"
              className="tn-open-note-btn"
              title={t("openNote")}
              onClick={() => {
                const contexts = contextsInput.split(",").map((s) => s.trim()).filter(Boolean);
                const tags = tagsInput.split(",").map((s) => s.trim()).filter(Boolean);
                const projects = projectsInput.split(",").map((s) => s.trim()).filter(Boolean);
                const blockedBy = blockedByInput.split(",").map((s) => s.trim()).filter(Boolean);
                const blocking = blockingInput.split(",").map((s) => s.trim()).filter(Boolean);
                onOpenNote({ ...form, contexts, tags, projects, blockedBy, blocking, modifiedDate: new Date().toISOString() }, fileId!);
              }}
            >
              &#x2197;
            </button>
          )}
        </div>

        <label className="tn-field">
          <span>{t("title")}</span>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
            placeholder={t("newTask.placeholder")}
            autoFocus
          />
        </label>

        <div className="tn-field-row">
          <label className="tn-field">
            <span>{t("status")}</span>
            <select value={form.status} onChange={(e) => setField("status", e.target.value as TaskStatus)}>
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {t(`status.${s}`)}
                </option>
              ))}
            </select>
          </label>

          <label className="tn-field">
            <span>{t("priority")}</span>
            <select value={form.priority} onChange={(e) => setField("priority", e.target.value as TaskPriority)}>
              {(["none", "low", "medium", "high", "urgent"] as TaskPriority[]).map((p) => (
                <option key={p} value={p}>
                  {t(`priority.${p}`)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="tn-field-row">
          <label className="tn-field">
            <span>{t("due")}</span>
            <input
              type="date"
              value={form.due ?? ""}
              onChange={(e) => setField("due", e.target.value || null)}
            />
          </label>

          <label className="tn-field">
            <span>{t("timeEstimate.label")}</span>
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
            <span>{t("scheduled")}</span>
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
            <span>{t("dueTime")}</span>
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
          <span>{t("contexts")} ({t("commaSeparated")})</span>
          <input
            type="text"
            value={contextsInput}
            onChange={(e) => setContextsInput(e.target.value)}
            placeholder={t("placeholder.contexts")}
          />
        </label>

        <label className="tn-field">
          <span>{t("tags")} ({t("commaSeparated")})</span>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder={t("placeholder.tags")}
          />
        </label>

        <label className="tn-field">
          <span>{t("projects")} ({t("commaSeparated")})</span>
          <input
            type="text"
            value={projectsInput}
            onChange={(e) => setProjectsInput(e.target.value)}
            placeholder={t("placeholder.projects")}
          />
        </label>

        <label className="tn-field">
          <span>{t("recurrence")}</span>
          <select value={recurrencePreset} onChange={(e) => handleRecurrenceChange(e.target.value)}>
            <option value="none">-</option>
            <option value="daily">{t("recurrence.daily")}</option>
            <option value="weekly">{t("recurrence.weekly")}</option>
            <option value="monthly">{t("recurrence.monthly")}</option>
            <option value="yearly">{t("recurrence.yearly")}</option>
          </select>
          {form.recurrence && (
            <span className="tn-hint">{describeRRule(form.recurrence.rrule)}</span>
          )}
        </label>

        {form.recurrence && (
          <label className="tn-field">
            <span>{t("recurrenceAnchor")}</span>
            <select
              value={form.recurrence.recurrenceAnchor}
              onChange={(e) =>
                setField("recurrence", { ...form.recurrence!, recurrenceAnchor: e.target.value as "scheduled" | "completion" })
              }
            >
              <option value="scheduled">{t("recurrenceAnchor.scheduled")}</option>
              <option value="completion">{t("recurrenceAnchor.completion")}</option>
            </select>
          </label>
        )}

        <label className="tn-field">
          <span>{t("blockedBy")} ({t("commaSeparatedIds")})</span>
          <input
            type="text"
            value={blockedByInput}
            onChange={(e) => setBlockedByInput(e.target.value)}
            placeholder={t("placeholder.taskIds")}
          />
        </label>

        <label className="tn-field">
          <span>{t("blocking")} ({t("commaSeparatedIds")})</span>
          <input
            type="text"
            value={blockingInput}
            onChange={(e) => setBlockingInput(e.target.value)}
            placeholder={t("placeholder.taskIds")}
          />
        </label>

        {/* Time entries */}
        <div className="tn-field tn-time-entries">
          <span>{t("timeEntries")}</span>
          {form.timeEntries.length > 0 ? (
            <div className="tn-time-entries-list">
              {form.timeEntries.map((entry, idx) => {
                const startDate = new Date(entry.start);
                const endDate = entry.end ? new Date(entry.end) : null;
                const durationSec = endDate
                  ? Math.floor((endDate.getTime() - startDate.getTime()) / 1000)
                  : Math.floor((Date.now() - startDate.getTime()) / 1000);
                return (
                  <div key={idx} className="tn-time-entry-row">
                    <input
                      type="datetime-local"
                      value={toLocalDatetime(entry.start)}
                      onChange={(e) => {
                        if (!e.target.value) return;
                        const entries = [...form.timeEntries];
                        entries[idx] = { ...entries[idx], start: new Date(e.target.value).toISOString() };
                        setField("timeEntries", entries);
                      }}
                    />
                    <span className="tn-time-entry-sep">-</span>
                    {entry.end ? (
                      <input
                        type="datetime-local"
                        value={toLocalDatetime(entry.end)}
                        onChange={(e) => {
                          if (!e.target.value) return;
                          const entries = [...form.timeEntries];
                          entries[idx] = { ...entries[idx], end: new Date(e.target.value).toISOString() };
                          setField("timeEntries", entries);
                        }}
                      />
                    ) : (
                      <span className="tn-time-entry-running">{t("timeEntries.running")}</span>
                    )}
                    <span className="tn-time-entry-duration">{formatDuration(durationSec)}</span>
                    <button
                      type="button"
                      className="tn-btn-icon"
                      onClick={() => {
                        const entries = form.timeEntries.filter((_, i) => i !== idx);
                        setField("timeEntries", entries);
                      }}
                      title={t("delete")}
                    >
                      &times;
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="tn-time-entries-empty">{t("timeEntries.none")}</div>
          )}
          <button
            type="button"
            className="tn-btn tn-btn-small"
            onClick={() => {
              const now = new Date().toISOString();
              setField("timeEntries", [...form.timeEntries, { start: now, end: now }]);
            }}
          >
            + {t("timeEntries.add")}
          </button>
        </div>

        <label className="tn-field">
          <span>{t("notes")}</span>
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
                  {t("calendar.openEvent")} &#x2197;
                </a>
                {onUnsyncCalendar && (
                  <button type="button" className="tn-btn tn-btn-small" onClick={() => onUnsyncCalendar(form.id)}>
                    {t("calendar.unsyncTask")}
                  </button>
                )}
              </div>
            ) : (
              onSyncCalendar && (
                <button type="button" className="tn-btn tn-btn-small" onClick={() => onSyncCalendar(form.id)}>
                  &#x1F4C5; {t("calendar.syncTask")}
                </button>
              )
            )}
          </div>
        )}

        <div className="tn-editor-actions">
          <button type="submit" className="tn-btn-primary">
            {t("save")}
          </button>
          <button type="button" className="tn-btn" onClick={onCancel}>
            {t("cancel")}
          </button>
          {!isNew && (
            <button
              type="button"
              className="tn-btn"
              onClick={() => {
                const contexts = contextsInput.split(",").map((s) => s.trim()).filter(Boolean);
                const tags = tagsInput.split(",").map((s) => s.trim()).filter(Boolean);
                const projects = projectsInput.split(",").map((s) => s.trim()).filter(Boolean);
                const blockedBy = blockedByInput.split(",").map((s) => s.trim()).filter(Boolean);
                const blocking = blockingInput.split(",").map((s) => s.trim()).filter(Boolean);
                onSave({ ...form, contexts, tags, projects, blockedBy, blocking, archived: !form.archived, modifiedDate: new Date().toISOString() });
              }}
            >
              {form.archived ? t("unarchive") : t("archive")}
            </button>
          )}
          {!isNew && onDelete && (
            <button
              type="button"
              className="tn-btn-danger"
              onClick={() => {
                if (confirm(t("deleteConfirm"))) onDelete(form.id);
              }}
            >
              {t("deleteTask")}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
