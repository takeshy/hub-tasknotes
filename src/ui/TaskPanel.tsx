/**
 * TaskPanel — main sidebar panel that integrates all views and controls.
 */

import * as React from "react";
import { Task, ViewType, TaskStatus, CalendarLayout } from "../types";
import { t } from "../i18n";
import { useStore, setState } from "../store";
import { TaskListView } from "./TaskListView";
import { KanbanView } from "./KanbanView";
import { CalendarView } from "./CalendarView";
import { AgendaView } from "./AgendaView";
import { TaskEditor } from "./TaskEditor";
import { createTaskFromNaturalLanguage } from "../core/naturalLanguage";
import { computeFormulas } from "../core/formulas";
import { startTimer, stopTimer } from "../core/timeTracking";

interface TaskPanelProps {
  api: {
    storage: { get(key: string): Promise<unknown>; set(key: string, value: unknown): Promise<void> };
    drive: {
      createFile(name: string, content: string): Promise<{ id: string; name: string }>;
      updateFile(id: string, content: string): Promise<void>;
      readFile(id: string): Promise<string>;
      listFiles(folder?: string): Promise<Array<{ id: string; name: string }>>;
      deleteFile?(id: string): Promise<void>;
    };
    onActiveFileChanged(
      callback: (detail: { fileId: string | null; fileName: string | null; mimeType: string | null }) => void
    ): () => void;
  };
  locale?: string;
}

export function TaskPanel({ api, locale }: TaskPanelProps) {
  const i = t(locale);
  const store = useStore();
  const [quickInput, setQuickInput] = React.useState("");
  const [editorTask, setEditorTask] = React.useState<Task | null | "new">(null);
  const [calendarLayout, setCalendarLayout] = React.useState<CalendarLayout>(store.settings.calendarLayout);
  const [expanded, setExpanded] = React.useState(false);
  const serviceRef = React.useRef<import("../core/taskService").TaskService | null>(null);

  // Track which task file is open in the main editor
  React.useEffect(() => {
    return api.onActiveFileChanged(({ fileId }) => {
      if (fileId && serviceRef.current) {
        setState({ activeTaskId: serviceRef.current.getTaskIdByFileId(fileId) });
      } else {
        setState({ activeTaskId: null });
      }
    });
  }, [store.tasks]);

  // Initialize service and load tasks
  React.useEffect(() => {
    (async () => {
      const { TaskService } = await import("../core/taskService");
      const service = new TaskService(api.drive, api.storage, store.settings.taskFolder);
      serviceRef.current = service;
      setState({ loading: true });
      try {
        const tasks = await service.loadAll();
        setState({ tasks, loading: false });
      } catch (e: any) {
        setState({ error: e.message || i.errorLoad, loading: false });
      }
    })();
  }, []);

  const filteredTasks = React.useMemo(() => {
    if (!serviceRef.current) return store.tasks;
    return serviceRef.current.query(store.tasks, store.filter, store.sort);
  }, [store.tasks, store.filter, store.sort]);

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim() || !serviceRef.current) return;
    const task = createTaskFromNaturalLanguage(quickInput);
    try {
      const created = await serviceRef.current.create(task);
      setState({ tasks: [...store.tasks, created] });
      setQuickInput("");
    } catch (e: any) {
      setState({ error: e.message || i.errorSave });
    }
  };

  const handleSaveTask = async (task: Task) => {
    if (!serviceRef.current) return;
    try {
      if (editorTask === "new") {
        const id = `task-${Date.now().toString(36)}`;
        const created = await serviceRef.current.create({ ...task, id });
        setState({ tasks: [...store.tasks, created] });
      } else {
        const updated = await serviceRef.current.update(task);
        setState({ tasks: store.tasks.map((t) => (t.id === updated.id ? updated : t)) });
      }
      setEditorTask(null);
    } catch (e: any) {
      setState({ error: e.message || i.errorSave });
    }
  };

  const handleComplete = async (taskId: string) => {
    if (!serviceRef.current) return;
    const completed = await serviceRef.current.complete(taskId);
    if (completed) {
      setState({ tasks: store.tasks.map((t) => (t.id === completed.id ? completed : t)) });
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!serviceRef.current) return;
    try {
      await serviceRef.current.delete(taskId);
      setState({ tasks: store.tasks.filter((t) => t.id !== taskId) });
      setEditorTask(null);
    } catch (e: any) {
      setState({ error: e.message || i.errorDelete });
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    if (!serviceRef.current) return;
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) return;
    const updated = await serviceRef.current.update({ ...task, status: newStatus });
    setState({ tasks: store.tasks.map((t) => (t.id === updated.id ? updated : t)) });
  };

  const handleStartTimer = async (taskId: string) => {
    if (!serviceRef.current) return;
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) return;
    const updated = await serviceRef.current.update(startTimer(task));
    setState({ tasks: store.tasks.map((t) => (t.id === updated.id ? updated : t)), timerTaskId: taskId });
  };

  const handleStopTimer = async (taskId: string) => {
    if (!serviceRef.current) return;
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) return;
    const updated = await serviceRef.current.update(stopTimer(task));
    setState({ tasks: store.tasks.map((t) => (t.id === updated.id ? updated : t)), timerTaskId: null });
  };

  const setView = (view: ViewType) => setState({ currentView: view });
  const toggleCompleted = () => setState({ filter: { ...store.filter, hideCompleted: !store.filter.hideCompleted } });

  const taskCount = store.tasks.filter((t) => t.status !== "done" && t.status !== "cancelled").length;

  const panel = (
    <div className={`tn-panel ${expanded ? "tn-panel-expanded" : ""}`}>
      {/* Header */}
      <div className="tn-header">
        <h2>{i.pluginName}</h2>
        <div className="tn-header-actions">
          <span className="tn-task-count">{taskCount} {taskCount === 1 ? i.task : i.tasks}</span>
          <button
            className="tn-btn tn-expand-btn"
            onClick={() => setExpanded(!expanded)}
            title={expanded ? i.collapse : i.expand}
          >
            {expanded ? "\u2716" : "\u2922"}
          </button>
        </div>
      </div>

      {/* Quick create */}
      <form className="tn-quick-create" onSubmit={handleQuickCreate}>
        <input
          type="text"
          value={quickInput}
          onChange={(e) => setQuickInput(e.target.value)}
          placeholder={i.newTaskPlaceholder}
          className="tn-quick-input"
        />
        <button type="submit" className="tn-btn-primary">{i.createTask}</button>
      </form>

      {/* View tabs */}
      <div className="tn-view-tabs">
        {(["list", "kanban", "calendar", "agenda"] as ViewType[]).map((view) => (
          <button
            key={view}
            className={`tn-tab ${store.currentView === view ? "tn-tab-active" : ""}`}
            onClick={() => setView(view)}
          >
            {i[view === "list" ? "taskList" : view] as string}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="tn-toolbar">
        <input
          type="text"
          placeholder={i.searchPlaceholder}
          className="tn-search"
          value={store.filter.search || ""}
          onChange={(e) => setState({ filter: { ...store.filter, search: e.target.value || undefined } })}
        />
        <label className="tn-toggle">
          <input
            type="checkbox"
            checked={!store.filter.hideCompleted}
            onChange={toggleCompleted}
          />
          <span className="tn-toggle-label">{i.showCompleted}</span>
        </label>
        <button className="tn-btn-primary" onClick={() => setEditorTask("new")}>+ {i.newTask}</button>
      </div>

      {/* Error display */}
      {store.error && (
        <div className="tn-error" onClick={() => setState({ error: null })}>
          {store.error}
        </div>
      )}

      {/* Loading */}
      {store.loading && <div className="tn-loading">Loading...</div>}

      {/* Views */}
      {!store.loading && (
        <>
          {store.currentView === "list" && (
            <TaskListView
              tasks={filteredTasks}
              onSelect={(task) => setEditorTask(task)}
              onComplete={handleComplete}
              onStartTimer={handleStartTimer}
              onStopTimer={handleStopTimer}
              locale={locale}
            />
          )}
          {store.currentView === "kanban" && (
            <KanbanView
              tasks={filteredTasks}
              onSelect={(task) => setEditorTask(task)}
              onStatusChange={handleStatusChange}
              locale={locale}
            />
          )}
          {store.currentView === "calendar" && (
            <CalendarView
              tasks={filteredTasks}
              onSelect={(task) => setEditorTask(task)}
              layout={calendarLayout}
              onLayoutChange={setCalendarLayout}
              locale={locale}
            />
          )}
          {store.currentView === "agenda" && (
            <AgendaView
              tasks={filteredTasks}
              onSelect={(task) => setEditorTask(task)}
              onComplete={handleComplete}
              locale={locale}
            />
          )}
        </>
      )}

      {/* Empty state */}
      {!store.loading && store.tasks.length === 0 && (
        <div className="tn-empty">{i.noTasks}</div>
      )}

      {/* Editor modal */}
      {editorTask !== null && (
        <TaskEditor
          task={editorTask === "new" ? null : editorTask}
          fileId={editorTask !== "new" && editorTask ? serviceRef.current?.getFileId(editorTask.id) : null}
          onSave={handleSaveTask}
          onCancel={() => setEditorTask(null)}
          onDelete={handleDelete}
          locale={locale}
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
