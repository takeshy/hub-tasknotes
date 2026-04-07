/**
 * Task List view — traditional list of tasks with inline actions.
 */

import * as React from "react";
import { Task, TaskFormulas } from "../types";
import { t } from "../i18n";
import { computeFormulas } from "../core/formulas";
import { hasRunningTimer, formatMinutes } from "../core/timeTracking";
import { describeRRule } from "../core/recurrence";
import { useStore } from "../store";

interface TaskListViewProps {
  tasks: Task[];
  onSelect: (task: Task) => void;
  onComplete: (taskId: string) => void;
  onSkip: (taskId: string) => void;
  onStartTimer: (taskId: string) => void;
  onStopTimer: (taskId: string) => void;
  locale?: string;
}

export function TaskListView({ tasks, onSelect, onComplete, onSkip, onStartTimer, onStopTimer, locale }: TaskListViewProps) {
  const i = t(locale);
  const { activeTaskId } = useStore();

  if (tasks.length === 0) {
    return <div className="tn-empty">{i.noTasksFiltered}</div>;
  }

  return (
    <div className="tn-task-list">
      {tasks.map((task) => {
        const formulas = computeFormulas(task);
        return (
          <TaskRow
            key={task.id}
            task={task}
            formulas={formulas}
            active={task.id === activeTaskId}
            onSelect={onSelect}
            onComplete={onComplete}
            onSkip={onSkip}
            onStartTimer={onStartTimer}
            onStopTimer={onStopTimer}
            locale={locale}
          />
        );
      })}
    </div>
  );
}

interface TaskRowProps {
  task: Task;
  formulas: TaskFormulas;
  active?: boolean;
  onSelect: (task: Task) => void;
  onComplete: (taskId: string) => void;
  onSkip: (taskId: string) => void;
  onStartTimer: (taskId: string) => void;
  onStopTimer: (taskId: string) => void;
  locale?: string;
}

function TaskRow({ task, formulas, active, onSelect, onComplete, onSkip, onStartTimer, onStopTimer, locale }: TaskRowProps) {
  const i = t(locale);
  const isDone = task.status === "done" || task.status === "cancelled";
  const running = hasRunningTimer(task);

  return (
    <div className={`tn-task-row tn-priority-${task.priority} ${isDone ? "tn-done" : ""} ${formulas.isOverdue ? "tn-overdue" : ""} ${active ? "tn-active" : ""}`}>
      <button
        className={`tn-checkbox ${isDone ? "tn-checked" : ""}`}
        onClick={() => onComplete(task.id)}
        title={isDone ? i.statusDone : i.statusTodo}
      >
        {isDone ? "\u2713" : ""}
      </button>

      <div className="tn-task-content" onClick={() => onSelect(task)}>
        <div className="tn-task-title">{task.title}</div>
        <div className="tn-task-meta">
          {task.due && (
            <span className={`tn-due ${formulas.isOverdue ? "tn-overdue-text" : ""}`}>
              {formulas.isOverdue ? i.overdue : ""} {task.due}
              {formulas.daysUntilDue !== null && !formulas.isOverdue && ` (${formulas.daysUntilDue}${i.days})`}
            </span>
          )}
          {task.scheduled && (
            <span className="tn-scheduled">
              {i.scheduled}: {task.scheduled.includes("T") ? task.scheduled.replace("T", " ") : task.scheduled}
            </span>
          )}
          {task.priority !== "none" && (
            <span className={`tn-priority-badge tn-priority-${task.priority}`}>
              {i[`priority${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}` as keyof typeof i] as string}
            </span>
          )}
          {task.contexts.map((c) => (
            <span key={c} className="tn-context-tag">#{c}</span>
          ))}
          {task.tags.map((tag) => (
            <span key={tag} className="tn-context-tag">{tag}</span>
          ))}
          {task.projects.map((p) => (
            <span key={p} className="tn-project-tag">+{p}</span>
          ))}
          {task.recurrence && (
            <span className="tn-recurrence-badge">{describeRRule(task.recurrence.rrule, locale)}</span>
          )}
          {task.archived && (
            <span className="tn-archived-badge">{i.archived}</span>
          )}
          {task.blockedBy.length > 0 && (
            <span className="tn-blocked-badge">{i.blockedBy}: {task.blockedBy.length}</span>
          )}
          {formulas.totalTrackedTime > 0 && (
            <span className="tn-time-tracked">{formatMinutes(formulas.totalTrackedTime)}</span>
          )}
        </div>
      </div>

      {task.recurrence && !isDone && (
        <button
          className="tn-skip-btn"
          onClick={() => onSkip(task.id)}
          title={i.skipInstance}
        >
          &#x23ED;
        </button>
      )}

      <button
        className={`tn-timer-btn ${running ? "tn-timer-running" : ""}`}
        onClick={() => (running ? onStopTimer(task.id) : onStartTimer(task.id))}
        title={running ? i.stopTimer : i.startTimer}
      >
        {running ? "\u25A0" : "\u25B6"}
      </button>
    </div>
  );
}
