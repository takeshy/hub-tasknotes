/**
 * Kanban board view — columns per status with drag indicators.
 */

import * as React from "react";
import { Task, TaskStatus, STATUS_ORDER } from "../types";
import { t } from "../i18n";
import { computeFormulas } from "../core/formulas";
import { useStore } from "../store";

interface KanbanViewProps {
  tasks: Task[];
  onSelect: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  locale?: string;
}

export function KanbanView({ tasks, onSelect, onStatusChange, locale }: KanbanViewProps) {
  const i = t(locale);
  const { activeTaskId } = useStore();

  const columns: Record<TaskStatus, Task[]> = {
    todo: [],
    in_progress: [],
    done: [],
    cancelled: [],
  };

  for (const task of tasks) {
    columns[task.status].push(task);
  }

  const statusLabels: Record<TaskStatus, string> = {
    todo: i.statusTodo,
    in_progress: i.statusInProgress,
    done: i.statusDone,
    cancelled: i.statusCancelled,
  };

  const [dragTaskId, setDragTaskId] = React.useState<string | null>(null);

  const handleDragStart = (taskId: string) => {
    setDragTaskId(taskId);
  };

  const handleDrop = (status: TaskStatus) => {
    if (dragTaskId) {
      onStatusChange(dragTaskId, status);
      setDragTaskId(null);
    }
  };

  return (
    <div className="tn-kanban">
      {STATUS_ORDER.map((status) => (
        <div
          key={status}
          className={`tn-kanban-column tn-kanban-${status}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(status)}
        >
          <div className="tn-kanban-header">
            <span className="tn-kanban-title">{statusLabels[status]}</span>
            <span className="tn-kanban-count">{columns[status].length}</span>
          </div>
          <div className="tn-kanban-cards">
            {columns[status].map((task) => {
              const formulas = computeFormulas(task);
              return (
                <div
                  key={task.id}
                  className={`tn-kanban-card tn-priority-${task.priority} ${formulas.isOverdue ? "tn-overdue" : ""} ${task.id === activeTaskId ? "tn-active" : ""}`}
                  draggable
                  onDragStart={() => handleDragStart(task.id)}
                  onClick={() => onSelect(task)}
                >
                  <div className="tn-kanban-card-title">{task.title}</div>
                  <div className="tn-kanban-card-meta">
                    {task.due && <span className={formulas.isOverdue ? "tn-overdue-text" : ""}>{task.due}</span>}
                    {task.priority !== "none" && (
                      <span className={`tn-priority-badge tn-priority-${task.priority}`}>
                        {i[`priority${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}` as keyof typeof i] as string}
                      </span>
                    )}
                  </div>
                  {task.contexts.length > 0 && (
                    <div className="tn-kanban-card-tags">
                      {task.contexts.map((c) => (
                        <span key={c} className="tn-context-tag">#{c}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
