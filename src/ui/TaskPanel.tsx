/**
 * TaskPanel — main sidebar panel that integrates all views and controls.
 */

import * as React from "react";
import { Task, ViewType, TaskStatus, TaskPriority, CalendarLayout, STATUS_ORDER } from "../types";
import { t, setLanguage, getLanguage } from "../i18n";
import { useStore, setState, getState, initSettings } from "../store";
import { TaskListView } from "./TaskListView";
import { KanbanView } from "./KanbanView";
import { CalendarView } from "./CalendarView";
import { AgendaView } from "./AgendaView";
import { TaskEditor } from "./TaskEditor";
import { computeFormulas } from "../core/formulas";
import { startTimer, stopTimer } from "../core/timeTracking";
import { syncTaskToCalendar, unsyncTaskFromCalendar, fetchCalendarEvents, checkCalendarAvailable, CalendarAPI } from "../core/calendarSync";

const PREMIUM_MODEL = "gemini-3.1-flash-lite-preview";
const FREE_MODEL = "gemma-4-31b-it";

const AI_SYSTEM_PROMPT = `You are a task parser. Extract task information from the user's input and return a JSON object.
Fields:
- title (string, required)
- status (string: "todo"|"in_progress"|"done"|"cancelled", default "todo")
- due (string YYYY-MM-DD or null)
- scheduled (string YYYY-MM-DD or YYYY-MM-DDTHH:MM for date+time, or null)
- priority (string: "none"|"low"|"medium"|"high"|"urgent", default "none")
- contexts (string array, e.g. ["errands","home"])
- tags (string array, e.g. ["review","urgent"])
- projects (string array, e.g. ["shopping"])
- timeEstimate (number in minutes or null)
- body (string, additional notes extracted from the input, default "")

Today's date is {{TODAY}}.
Write the title and body in {{LANGUAGE}}, matching the user's UI language even if the input uses different words.
Return ONLY valid JSON. No markdown fences, no explanation.`;

const LANGUAGE_NAMES: Record<string, string> = {
  ja: "Japanese (日本語)",
  en: "English",
};

interface GeminiAPI {
  chat(
    messages: Array<{ role: string; content: string }>,
    options?: { model?: string; systemPrompt?: string }
  ): Promise<string>;
}

interface TaskPanelProps {
  api: {
    gemini: GeminiAPI;
    storage: { get(key: string): Promise<unknown>; set(key: string, value: unknown): Promise<void> };
    drive: {
      createFile(name: string, content: string): Promise<{ id: string; name: string }>;
      updateFile(id: string, content: string): Promise<void>;
      readFile(id: string): Promise<string>;
      listFiles(folder?: string): Promise<Array<{ id: string; name: string }>>;
      deleteFile?(id: string): Promise<void>;
    };
    calendar?: CalendarAPI;
    onActiveFileChanged(
      callback: (detail: { fileId: string | null; fileName: string | null; mimeType: string | null }) => void
    ): () => void;
  };
  language?: string;
}

export function TaskPanel({ api, language }: TaskPanelProps) {
  React.useEffect(() => { if (language) setLanguage(language); }, [language]);
  const store = useStore();
  const [editorTask, setEditorTask] = React.useState<Task | null | "new">(null);
  const [calendarLayout, setCalendarLayout] = React.useState<CalendarLayout>(store.settings.calendarLayout);
  const [expanded, setExpanded] = React.useState(false);
  const [aiModalOpen, setAiModalOpen] = React.useState(false);
  const [aiInput, setAiInput] = React.useState("");
  const [aiLoading, setAiLoading] = React.useState(false);
  const serviceRef = React.useRef<import("../core/taskService").TaskService | null>(null);
  const aiModelRef = React.useRef<string | null>(null);

  // Track which task file is open in the main editor and sync changes
  React.useEffect(() => {
    return api.onActiveFileChanged(async ({ fileId }) => {
      if (fileId && serviceRef.current) {
        const taskId = serviceRef.current.getTaskIdByFileId(fileId);
        setState({ activeTaskId: taskId });
        // Re-read the file to pick up edits made in the main editor
        const reloaded = await serviceRef.current.reload(fileId);
        if (reloaded) {
          setState({ tasks: getState().tasks.map((t) => (t.id === reloaded.id ? reloaded : t)) });
        }
      } else {
        setState({ activeTaskId: null });
      }
    });
  }, []);

  // Initialize service and load tasks; check calendar availability
  React.useEffect(() => {
    (async () => {
      // Settings bootstrap should not block task loading if storage is temporarily unavailable.
      try {
        await initSettings(api.storage);
      } catch {
        // Fall back to in-memory defaults already present in the store.
      }
      const settings = getState().settings;

      const { TaskService } = await import("../core/taskService");
      const service = new TaskService(api.drive, api.storage, settings.taskFolder);
      serviceRef.current = service;
      setState({ loading: true });
      try {
        const tasks = await service.loadAll();
        setState({ tasks, loading: false });
      } catch (e: any) {
        setState({ error: e.message || t("error.load"), loading: false });
      }

      // Probe calendar API availability and load cached events
      if (api.calendar) {
        const available = await checkCalendarAvailable(api.calendar);
        setState({ calendarAvailable: available });
        if (available) {
          const cached = await api.storage.get("cachedCalendarEvents") as import("../types").CalendarEvent[] | null;
          if (cached && Array.isArray(cached)) {
            setState({ calendarEvents: cached });
          }
        }
      }
    })();
  }, []);

  const filteredTasks = React.useMemo(() => {
    if (!serviceRef.current) return store.tasks;
    return serviceRef.current.query(store.tasks, store.filter, store.sort);
  }, [store.tasks, store.filter, store.sort]);

  // Collect unique values for filter dropdowns (from all tasks, not filtered)
  const uniqueContexts = React.useMemo(() => [...new Set(store.tasks.flatMap((t) => t.contexts))].sort(), [store.tasks]);
  const uniqueTags = React.useMemo(() => [...new Set(store.tasks.flatMap((t) => t.tags))].sort(), [store.tasks]);
  const uniqueProjects = React.useMemo(() => [...new Set(store.tasks.flatMap((t) => t.projects))].sort(), [store.tasks]);

  const callAI = async (input: string): Promise<string> => {
    const today = new Date().toISOString().slice(0, 10);
    const langName = LANGUAGE_NAMES[getLanguage()] ?? LANGUAGE_NAMES.en;
    const systemPrompt = AI_SYSTEM_PROMPT.replace("{{TODAY}}", today).replace("{{LANGUAGE}}", langName);
    const messages = [{ role: "user", content: input }];

    // Try cached model first
    if (aiModelRef.current) {
      return api.gemini.chat(messages, { model: aiModelRef.current, systemPrompt });
    }
    // Try premium model, fall back to free
    try {
      const result = await api.gemini.chat(messages, { model: PREMIUM_MODEL, systemPrompt });
      aiModelRef.current = PREMIUM_MODEL;
      return result;
    } catch {
      const result = await api.gemini.chat(messages, { model: FREE_MODEL, systemPrompt });
      aiModelRef.current = FREE_MODEL;
      return result;
    }
  };

  const handleAICreate = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    try {
      const raw = await callAI(aiInput);
      // Strip markdown fences if present
      const jsonStr = raw.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "").trim();
      const parsed = JSON.parse(jsonStr);
      const now = new Date().toISOString();
      const task: Task = {
        id: "",
        title: parsed.title || aiInput,
        status: parsed.status || "todo",
        due: parsed.due || null,
        scheduled: parsed.scheduled || null,
        priority: parsed.priority || "none",
        contexts: Array.isArray(parsed.contexts) ? parsed.contexts : [],
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        projects: Array.isArray(parsed.projects) ? parsed.projects : [],
        timeEstimate: typeof parsed.timeEstimate === "number" ? parsed.timeEstimate : null,
        timeEntries: [],
        recurrence: null,
        complete_instances: [],
        skipped_instances: [],
        blockedBy: [],
        blocking: [],
        body: parsed.body || "",
        archived: false,
        completedDate: null,
        createdDate: now,
        modifiedDate: now,
      };
      setAiModalOpen(false);
      setAiInput("");
      setEditorTask(task);
    } catch (e: any) {
      setState({ error: e.message || t("error.aiParse") });
    } finally {
      setAiLoading(false);
    }
  };

  const handleOpenNote = async (task: Task, fileId: string) => {
    if (!serviceRef.current) return;
    try {
      const updated = await serviceRef.current.update(task);
      setState({ tasks: getState().tasks.map((t) => (t.id === updated.id ? updated : t)) });
    } catch {
      // save failed, still open the note
    }
    setEditorTask(null);
    const url = new URL(window.location.href);
    url.searchParams.set("file", fileId);
    window.history.pushState({}, "", url.toString());
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const handleSaveTask = async (task: Task) => {
    if (!serviceRef.current) return;
    const isNew = editorTask === "new" || (typeof editorTask === "object" && editorTask !== null && !editorTask.id);
    try {
      let saved: Task;
      if (isNew) {
        const id = `task-${Date.now().toString(36)}`;
        saved = await serviceRef.current.create({ ...task, id });
        setState({ tasks: [...getState().tasks, saved] });
      } else {
        saved = await serviceRef.current.update(task);
        setState({ tasks: getState().tasks.map((t) => (t.id === saved.id ? saved : t)) });
      }
      // Auto-sync to Google Calendar if the task has a date
      if ((saved.due || saved.scheduled) && api.calendar && getState().calendarAvailable) {
        try {
          const synced = await syncTaskToCalendar(api.calendar, saved);
          const updated = await serviceRef.current.update(synced);
          setState({ tasks: getState().tasks.map((t) => (t.id === updated.id ? updated : t)) });
        } catch {
          // calendar sync failure is non-fatal
        }
      }
      setEditorTask(null);
    } catch (e: any) {
      setState({ error: e.message || t("error.save") });
    }
  };

  const handleComplete = async (taskId: string) => {
    if (!serviceRef.current) return;
    const completed = await serviceRef.current.complete(taskId);
    if (completed) {
      setState({ tasks: getState().tasks.map((t) => (t.id === completed.id ? completed : t)) });
    }
  };

  const handleSkip = async (taskId: string) => {
    if (!serviceRef.current) return;
    const skipped = await serviceRef.current.skip(taskId);
    if (skipped) {
      setState({ tasks: getState().tasks.map((t) => (t.id === skipped.id ? skipped : t)) });
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!serviceRef.current) return;
    try {
      await serviceRef.current.delete(taskId);
      setState({ tasks: getState().tasks.filter((t) => t.id !== taskId) });
      setEditorTask(null);
    } catch (e: any) {
      setState({ error: e.message || t("error.delete") });
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    if (!serviceRef.current) return;
    const task = getState().tasks.find((t) => t.id === taskId);
    if (!task) return;
    const updated = await serviceRef.current.update({ ...task, status: newStatus });
    setState({ tasks: getState().tasks.map((t) => (t.id === updated.id ? updated : t)) });
  };

  const handleStartTimer = async (taskId: string) => {
    if (!serviceRef.current) return;
    const task = getState().tasks.find((t) => t.id === taskId);
    if (!task) return;
    const updated = await serviceRef.current.update(startTimer(task));
    setState({ tasks: getState().tasks.map((t) => (t.id === updated.id ? updated : t)), timerTaskId: taskId });
  };

  const handleStopTimer = async (taskId: string) => {
    if (!serviceRef.current) return;
    const task = getState().tasks.find((t) => t.id === taskId);
    if (!task) return;
    const updated = await serviceRef.current.update(stopTimer(task));
    setState({ tasks: getState().tasks.map((t) => (t.id === updated.id ? updated : t)), timerTaskId: null });
  };

  // --- Calendar sync handlers ---
  const handleSyncTask = async (taskId: string) => {
    if (!serviceRef.current || !api.calendar) return;
    const task = getState().tasks.find((t) => t.id === taskId);
    if (!task) return;
    try {
      const synced = await syncTaskToCalendar(api.calendar, task);
      const updated = await serviceRef.current.update(synced);
      setState({ tasks: getState().tasks.map((t) => (t.id === updated.id ? updated : t)) });
      setEditorTask(updated);
    } catch (e: any) {
      setState({ error: e.message || t("error.calendarSync") });
    }
  };

  const handleUnsyncTask = async (taskId: string) => {
    if (!serviceRef.current || !api.calendar) return;
    const task = getState().tasks.find((t) => t.id === taskId);
    if (!task) return;
    try {
      const unsynced = await unsyncTaskFromCalendar(api.calendar, task);
      const updated = await serviceRef.current.update(unsynced);
      setState({ tasks: getState().tasks.map((t) => (t.id === updated.id ? updated : t)) });
      setEditorTask(updated);
    } catch (e: any) {
      setState({ error: e.message || t("error.calendarSync") });
    }
  };

  const handleSyncAllTasks = async () => {
    if (!serviceRef.current || !api.calendar) return;
    const tasksWithDue = getState().tasks.filter(
      (t) => (t.due || t.scheduled) && t.status !== "cancelled"
    );
    // Collect all updates first, then apply them in a single setState to avoid race conditions
    const updatedTasks = new Map<string, Task>();
    for (const task of tasksWithDue) {
      try {
        const synced = await syncTaskToCalendar(api.calendar!, task);
        const updated = await serviceRef.current.update(synced);
        updatedTasks.set(updated.id, updated);
      } catch {
        // continue syncing remaining tasks
      }
    }
    if (updatedTasks.size > 0) {
      setState({
        tasks: getState().tasks.map((t) => updatedTasks.get(t.id) ?? t),
      });
    }
  };

  const [lastFetched, setLastFetched] = React.useState<string | null>(null);

  // Load cached lastFetched timestamp
  React.useEffect(() => {
    api.storage.get("calendarLastFetched").then((v) => {
      if (typeof v === "string") setLastFetched(v);
    });
  }, []);

  // Fetch Google Calendar events for a date range and cache
  const handleFetchCalendarEvents = async (startDate: Date, endDate: Date) => {
    if (!api.calendar || !getState().calendarAvailable) return;
    try {
      const events = await fetchCalendarEvents(
        api.calendar,
        startDate.toISOString(),
        endDate.toISOString()
      );
      // Merge with existing events (keep events outside this range)
      const startStr = startDate.toISOString().slice(0, 10);
      const endStr = endDate.toISOString().slice(0, 10);
      const existing = getState().calendarEvents.filter((ev) => {
        const d = ev.start.slice(0, 10);
        return d < startStr || d > endStr;
      });
      const merged = [...existing, ...events];
      setState({ calendarEvents: merged });
      await api.storage.set("cachedCalendarEvents", merged);
      const now = new Date().toLocaleString();
      setLastFetched(now);
      await api.storage.set("calendarLastFetched", now);
    } catch (e: any) {
      setState({ error: e.message || t("error.calendarSync") });
    }
  };

  const handleSelect = async (task: Task) => {
    if (!serviceRef.current) { setEditorTask(task); return; }
    const reloaded = await serviceRef.current.reloadById(task.id);
    if (reloaded) {
      setState({ tasks: getState().tasks.map((t) => (t.id === reloaded.id ? reloaded : t)) });
      setEditorTask(reloaded);
    } else {
      setEditorTask(task);
    }
  };

  const setView = (view: ViewType) => setState({ currentView: view });
  const toggleCompleted = () => setState({ filter: { ...store.filter, hideCompleted: !store.filter.hideCompleted } });
  const toggleArchived = () => setState({ filter: { ...store.filter, hideArchived: !store.filter.hideArchived } });

  const taskCount = store.tasks.filter((t) => t.status !== "done" && t.status !== "cancelled").length;

  const panel = (
    <div className={`tn-panel ${expanded ? "tn-panel-expanded" : ""}`}>
      {/* Header */}
      <div className="tn-header">
        <h2>{t("plugin.name")}</h2>
        <div className="tn-header-actions">
          <span className="tn-task-count">{taskCount} {taskCount === 1 ? t("task") : t("tasks")}</span>
          <button
            className="tn-btn tn-expand-btn"
            onClick={() => setExpanded(!expanded)}
            title={expanded ? t("collapse") : t("expand")}
          >
            {expanded ? "\u2716" : "\u2922"}
          </button>
        </div>
      </div>

      {/* Create buttons */}
      <div className="tn-create-buttons">
        <button className="tn-btn-primary tn-ai-btn" onClick={() => setAiModalOpen(true)}>
          &#x2728; {t("ai.create")}
        </button>
        <button className="tn-btn" onClick={() => setEditorTask("new")}>
          &#x270F; {t("newTask")}
        </button>
      </div>

      {/* AI input modal */}
      {aiModalOpen && (
        <div className="tn-editor-overlay" onClick={() => { if (!aiLoading) { setAiModalOpen(false); setAiInput(""); } }}>
          <div className="tn-ai-modal" onClick={(e) => e.stopPropagation()}>
            <h3>&#x2728; {t("ai.create")}</h3>
            <textarea
              className="tn-ai-textarea"
              rows={4}
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder={t("ai.placeholder")}
              disabled={aiLoading}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAICreate();
              }}
            />
            <div className="tn-ai-modal-actions">
              <button
                className="tn-btn-primary"
                onClick={handleAICreate}
                disabled={aiLoading || !aiInput.trim()}
              >
                {aiLoading ? t("ai.parsing") : t("ai.create")}
              </button>
              <button className="tn-btn" onClick={() => { setAiModalOpen(false); setAiInput(""); }} disabled={aiLoading}>
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View tabs */}
      <div className="tn-view-tabs">
        {(["list", "kanban", "calendar", "agenda"] as ViewType[]).map((view) => (
          <button
            key={view}
            className={`tn-tab ${store.currentView === view ? "tn-tab-active" : ""}`}
            onClick={() => setView(view)}
          >
            {t(`view.${view}`)}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="tn-toolbar">
        <input
          type="text"
          placeholder={t("search.placeholder")}
          className="tn-search"
          value={store.filter.search || ""}
          onChange={(e) => setState({ filter: { ...store.filter, search: e.target.value || undefined } })}
        />

        <div className="tn-filters">
          <select
            className="tn-filter-select"
            value={store.filter.status?.[0] || ""}
            onChange={(e) => setState({ filter: { ...store.filter, status: e.target.value ? [e.target.value as TaskStatus] : undefined } })}
          >
            <option value="">{t("filter.status")}: {t("filter.all")}</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {t(`status.${s}`)}
              </option>
            ))}
          </select>

          <select
            className="tn-filter-select"
            value={store.filter.priority?.[0] || ""}
            onChange={(e) => setState({ filter: { ...store.filter, priority: e.target.value ? [e.target.value as TaskPriority] : undefined } })}
          >
            <option value="">{t("filter.priority")}: {t("filter.all")}</option>
            {(["none", "low", "medium", "high", "urgent"] as TaskPriority[]).map((p) => (
              <option key={p} value={p}>
                {t(`priority.${p}`)}
              </option>
            ))}
          </select>

          {uniqueContexts.length > 0 && (
            <select
              className="tn-filter-select"
              value={store.filter.contexts?.[0] || ""}
              onChange={(e) => setState({ filter: { ...store.filter, contexts: e.target.value ? [e.target.value] : undefined } })}
            >
              <option value="">{t("filter.context")}: {t("filter.all")}</option>
              {uniqueContexts.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

          {uniqueTags.length > 0 && (
            <select
              className="tn-filter-select"
              value={store.filter.tags?.[0] || ""}
              onChange={(e) => setState({ filter: { ...store.filter, tags: e.target.value ? [e.target.value] : undefined } })}
            >
              <option value="">{t("filter.tag")}: {t("filter.all")}</option>
              {uniqueTags.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          )}

          {uniqueProjects.length > 0 && (
            <select
              className="tn-filter-select"
              value={store.filter.projects?.[0] || ""}
              onChange={(e) => setState({ filter: { ...store.filter, projects: e.target.value ? [e.target.value] : undefined } })}
            >
              <option value="">{t("filter.project")}: {t("filter.all")}</option>
              {uniqueProjects.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          )}
        </div>

        <label className="tn-toggle">
          <input
            type="checkbox"
            checked={!store.filter.hideCompleted}
            onChange={toggleCompleted}
          />
          <span className="tn-toggle-label">{t("showCompleted")}</span>
        </label>
        <label className="tn-toggle">
          <input
            type="checkbox"
            checked={!store.filter.hideArchived}
            onChange={toggleArchived}
          />
          <span className="tn-toggle-label">{t("showArchived")}</span>
        </label>
        {store.calendarAvailable && (
          <button className="tn-btn tn-cal-sync-btn" onClick={handleSyncAllTasks} title={t("calendar.syncAll")}>
            &#x1F4C5;
          </button>
        )}
      </div>

      {/* Error display */}
      {store.error && (
        <div className="tn-error" onClick={() => setState({ error: null })}>
          {store.error}
        </div>
      )}

      {/* Loading */}
      {store.loading && <div className="tn-loading">{t("loading")}</div>}

      {/* Views */}
      {!store.loading && (
        <>
          {store.currentView === "list" && (
            <TaskListView
              tasks={filteredTasks}
              onSelect={handleSelect}
              onComplete={handleComplete}
              onSkip={handleSkip}
              onStartTimer={handleStartTimer}
              onStopTimer={handleStopTimer}
            />
          )}
          {store.currentView === "kanban" && (
            <KanbanView
              tasks={filteredTasks}
              onSelect={handleSelect}
              onStatusChange={handleStatusChange}
            />
          )}
          {store.currentView === "calendar" && (
            <CalendarView
              tasks={filteredTasks}
              onSelect={handleSelect}
              layout={calendarLayout}
              onLayoutChange={setCalendarLayout}
              language={language}
              calendarEvents={store.calendarAvailable ? store.calendarEvents : []}
              onFetchEvents={store.calendarAvailable ? handleFetchCalendarEvents : undefined}
              lastFetched={lastFetched}
            />
          )}
          {store.currentView === "agenda" && (
            <AgendaView
              tasks={filteredTasks}
              onSelect={handleSelect}
              onComplete={handleComplete}
              onSkip={handleSkip}
            />
          )}
        </>
      )}

      {/* Empty state */}
      {!store.loading && store.tasks.length === 0 && (
        <div className="tn-empty">{t("noTasks")}</div>
      )}

      {/* Editor modal */}
      {editorTask !== null && (
        <TaskEditor
          key={editorTask === "new" ? "new" : editorTask.id ? `${editorTask.id}-${editorTask.calendarEventId || ""}` : `ai-${editorTask.title}`}
          task={editorTask === "new" ? null : editorTask.id ? editorTask : editorTask}
          fileId={editorTask !== "new" && editorTask.id ? serviceRef.current?.getFileId(editorTask.id) : null}
          onSave={handleSaveTask}
          onCancel={() => setEditorTask(null)}
          onDelete={handleDelete}
          onOpenNote={handleOpenNote}
          language={language}
          calendarAvailable={store.calendarAvailable}
          onSyncCalendar={handleSyncTask}
          onUnsyncCalendar={handleUnsyncTask}
        />
      )}
    </div>
  );

  if (expanded) {
    const ReactDOM = require("react-dom");
    return ReactDOM.createPortal(
      <div className="tn-expanded-overlay" onClick={(e: React.MouseEvent) => {
        if ((e.target as HTMLElement).classList.contains("tn-expanded-overlay")) setExpanded(false);
      }}>
        {panel}
      </div>,
      document.body,
    );
  }

  return panel;
}
