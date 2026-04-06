/**
 * Settings panel for TaskNotes plugin configuration.
 */

import * as React from "react";
import { TaskNotesSettings, TaskStatus, TaskPriority, ViewType, CalendarLayout, DEFAULT_SETTINGS, STATUS_ORDER } from "../types";
import { t } from "../i18n";

interface SettingsPanelProps {
  api: {
    storage: {
      get(key: string): Promise<unknown>;
      set(key: string, value: unknown): Promise<void>;
    };
  };
  locale?: string;
}

export function SettingsPanel({ api, locale }: SettingsPanelProps) {
  const i = t(locale);
  const [settings, setSettings] = React.useState<TaskNotesSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const stored = (await api.storage.get("settings")) as TaskNotesSettings | null;
      if (stored) setSettings({ ...DEFAULT_SETTINGS, ...stored });
    })();
  }, []);

  const handleSave = async () => {
    await api.storage.set("settings", settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const update = <K extends keyof TaskNotesSettings>(key: K, value: TaskNotesSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="tn-settings">
      <h3>{i.settingsTitle}</h3>

      <label className="tn-field">
        <span>{i.taskFolder}</span>
        <input
          type="text"
          value={settings.taskFolder}
          onChange={(e) => update("taskFolder", e.target.value)}
        />
        <span className="tn-hint">{i.taskFolderHint}</span>
      </label>

      <label className="tn-field">
        <span>{i.defaultView}</span>
        <select value={settings.defaultView} onChange={(e) => update("defaultView", e.target.value as ViewType)}>
          <option value="list">{i.taskList}</option>
          <option value="kanban">{i.kanban}</option>
          <option value="calendar">{i.calendar}</option>
          <option value="agenda">{i.agenda}</option>
        </select>
      </label>

      <label className="tn-field">
        <span>{i.defaultStatus}</span>
        <select value={settings.defaultStatus} onChange={(e) => update("defaultStatus", e.target.value as TaskStatus)}>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {i[`status${s.charAt(0).toUpperCase() + s.slice(1).replace(/_./g, (m) => m[1].toUpperCase())}` as keyof typeof i] as string}
            </option>
          ))}
        </select>
      </label>

      <label className="tn-field">
        <span>{i.defaultPriority}</span>
        <select value={settings.defaultPriority} onChange={(e) => update("defaultPriority", e.target.value as TaskPriority)}>
          {(["none", "low", "medium", "high", "urgent"] as TaskPriority[]).map((p) => (
            <option key={p} value={p}>
              {i[`priority${p.charAt(0).toUpperCase() + p.slice(1)}` as keyof typeof i] as string}
            </option>
          ))}
        </select>
      </label>

      <label className="tn-field">
        <span>{i.calendarLayout}</span>
        <select value={settings.calendarLayout} onChange={(e) => update("calendarLayout", e.target.value as CalendarLayout)}>
          <option value="month">{i.calendarMonth}</option>
          <option value="week">{i.calendarWeek}</option>
          <option value="day">{i.calendarDay}</option>
        </select>
      </label>

      <label className="tn-field">
        <span>{i.pomodoroDuration}</span>
        <input
          type="number"
          min="1"
          max="120"
          value={settings.pomodoroDuration}
          onChange={(e) => update("pomodoroDuration", parseInt(e.target.value) || 25)}
        />
      </label>

      <label className="tn-field">
        <span>{i.pomodoroBreakDuration}</span>
        <input
          type="number"
          min="1"
          max="60"
          value={settings.pomodoroBreak}
          onChange={(e) => update("pomodoroBreak", parseInt(e.target.value) || 5)}
        />
      </label>

      <label className="tn-field">
        <span>{i.showCompleted}</span>
        <input
          type="checkbox"
          checked={settings.showCompleted}
          onChange={(e) => update("showCompleted", e.target.checked)}
        />
      </label>

      <div className="tn-settings-actions">
        <button className="tn-btn-primary" onClick={handleSave}>
          {i.save}
          {saved && " \u2713"}
        </button>
        <button className="tn-btn" onClick={handleReset}>
          {i.resetDefaults}
        </button>
      </div>
    </div>
  );
}
