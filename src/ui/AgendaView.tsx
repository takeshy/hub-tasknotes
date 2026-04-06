/**
 * Agenda view — grouped by overdue / today / upcoming / no due date.
 */

import * as React from "react";
import { Task } from "../types";
import { t } from "../i18n";
import { computeFormulas } from "../core/formulas";
import { useStore } from "../store";

interface AgendaViewProps {
  tasks: Task[];
  onSelect: (task: Task) => void;
  onComplete: (taskId: string) => void;
  locale?: string;
}

interface AgendaGroup {
  label: string;
  tasks: Task[];
  className: string;
}

export function AgendaView({ tasks, onSelect, onComplete, locale }: AgendaViewProps) {
  const i = t(locale);
  const { activeTaskId } = useStore();

  const groups = React.useMemo((): AgendaGroup[] => {
    const todayStr = formatDateStr(new Date());
    const overdue: Task[] = [];
    const today: Task[] = [];
    const upcoming: Task[] = [];
    const noDue: Task[] = [];

    for (const task of tasks) {
      if (task.status === "done" || task.status === "cancelled") continue;
      const dateValue = (task.scheduled || task.due);
      const dateKey = dateValue ? dateValue.slice(0, 10) : null;
      if (!dateKey) {
        noDue.push(task);
      } else if (dateKey < todayStr) {
        overdue.push(task);
      } else if (dateKey === todayStr) {
        today.push(task);
      } else {
        upcoming.push(task);
      }
    }

    // Sort each group by due date then priority
    const sortTasks = (a: Task, b: Task) => {
      const aDate = (a.scheduled || a.due);
      const bDate = (b.scheduled || b.due);
      if (aDate && bDate && aDate !== bDate) return aDate.localeCompare(bDate);
      return (b.priority === "urgent" ? 4 : 0) - (a.priority === "urgent" ? 4 : 0);
    };

    overdue.sort(sortTasks);
    today.sort(sortTasks);
    upcoming.sort(sortTasks);

    return [
      { label: i.agendaOverdue, tasks: overdue, className: "tn-agenda-overdue" },
      { label: i.agendaToday, tasks: today, className: "tn-agenda-today" },
      { label: i.agendaUpcoming, tasks: upcoming, className: "tn-agenda-upcoming" },
      { label: i.agendaNoDue, tasks: noDue, className: "tn-agenda-nodue" },
    ].filter((g) => g.tasks.length > 0);
  }, [tasks, locale]);

  if (groups.length === 0) {
    return <div className="tn-empty">{i.noTasksFiltered}</div>;
  }

  return (
    <div className="tn-agenda">
      {groups.map((group) => (
        <div key={group.label} className={`tn-agenda-group ${group.className}`}>
          <div className="tn-agenda-group-header">
            <span>{group.label}</span>
            <span className="tn-agenda-group-count">{group.tasks.length}</span>
          </div>
          {group.tasks.map((task) => {
            const formulas = computeFormulas(task);
            return (
              <div
                key={task.id}
                className={`tn-task-row tn-priority-${task.priority} ${task.id === activeTaskId ? "tn-active" : ""}`}
                onClick={() => onSelect(task)}
              >
                <button
                  className="tn-checkbox"
                  onClick={(e) => {
                    e.stopPropagation();
                    onComplete(task.id);
                  }}
                />
                <div className="tn-task-content">
                  <div className="tn-task-title">{task.title}</div>
                  <div className="tn-task-meta">
                    {task.due && <span className="tn-due">{task.due}</span>}
                    {task.priority !== "none" && (
                      <span className={`tn-priority-badge tn-priority-${task.priority}`}>
                        {i[`priority${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}` as keyof typeof i] as string}
                      </span>
                    )}
                    {task.contexts.map((c) => (
                      <span key={c} className="tn-context-tag">#{c}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
