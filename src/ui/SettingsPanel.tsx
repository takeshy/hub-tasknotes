/**
 * Settings panel for TaskNotes plugin configuration.
 */

import * as React from "react";
import { TaskNotesSettings, TaskStatus, TaskPriority, ViewType, CalendarLayout, DEFAULT_SETTINGS, STATUS_ORDER } from "../types";
import { t, setLanguage } from "../i18n";


interface SettingsPanelProps {
  api: {
    storage: {
      get(key: string): Promise<unknown>;
      set(key: string, value: unknown): Promise<void>;
    };
  };
  language?: string;
}

export function SettingsPanel({ api, language }: SettingsPanelProps) {
  React.useEffect(() => { if (language) setLanguage(language); }, [language]);
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
      <h3>{t("settings.title")}</h3>

      <label className="tn-field">
        <span>{t("settings.taskFolder")}</span>
        <input
          type="text"
          value={settings.taskFolder}
          onChange={(e) => update("taskFolder", e.target.value)}
        />
        <span className="tn-hint">{t("settings.taskFolderHint")}</span>
      </label>

      <label className="tn-field">
        <span>{t("settings.defaultView")}</span>
        <select value={settings.defaultView} onChange={(e) => update("defaultView", e.target.value as ViewType)}>
          <option value="list">{t("view.list")}</option>
          <option value="kanban">{t("view.kanban")}</option>
          <option value="calendar">{t("view.calendar")}</option>
          <option value="agenda">{t("view.agenda")}</option>
        </select>
      </label>

      <label className="tn-field">
        <span>{t("settings.defaultStatus")}</span>
        <select value={settings.defaultStatus} onChange={(e) => update("defaultStatus", e.target.value as TaskStatus)}>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {t(`status.${s}`)}
            </option>
          ))}
        </select>
      </label>

      <label className="tn-field">
        <span>{t("settings.defaultPriority")}</span>
        <select value={settings.defaultPriority} onChange={(e) => update("defaultPriority", e.target.value as TaskPriority)}>
          {(["none", "low", "medium", "high", "urgent"] as TaskPriority[]).map((p) => (
            <option key={p} value={p}>
              {t(`priority.${p}`)}
            </option>
          ))}
        </select>
      </label>

      <label className="tn-field">
        <span>{t("settings.calendarLayout")}</span>
        <select value={settings.calendarLayout} onChange={(e) => update("calendarLayout", e.target.value as CalendarLayout)}>
          <option value="month">{t("calendar.month")}</option>
          <option value="week">{t("calendar.week")}</option>
          <option value="day">{t("calendar.day")}</option>
        </select>
      </label>

      <label className="tn-field">
        <span>{t("showCompleted")}</span>
        <input
          type="checkbox"
          checked={settings.showCompleted}
          onChange={(e) => update("showCompleted", e.target.checked)}
        />
      </label>

      <div className="tn-settings-actions">
        <button className="tn-btn-primary" onClick={handleSave}>
          {t("save")}
          {saved && " \u2713"}
        </button>
        <button className="tn-btn" onClick={handleReset}>
          {t("settings.resetDefaults")}
        </button>
      </div>
    </div>
  );
}
