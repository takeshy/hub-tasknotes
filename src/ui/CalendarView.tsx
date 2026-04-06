/**
 * Calendar view — month/week/day layouts showing tasks by due date.
 */

import * as React from "react";
import { Task, CalendarLayout } from "../types";
import { t } from "../i18n";
import { computeFormulas } from "../core/formulas";
import { useStore } from "../store";

interface CalendarViewProps {
  tasks: Task[];
  onSelect: (task: Task) => void;
  layout: CalendarLayout;
  onLayoutChange: (layout: CalendarLayout) => void;
  locale?: string;
}

export function CalendarView({ tasks, onSelect, layout, onLayoutChange, locale }: CalendarViewProps) {
  const i = t(locale);
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const navigate = (delta: number) => {
    const next = new Date(currentDate);
    if (layout === "month") next.setMonth(next.getMonth() + delta);
    else if (layout === "week") next.setDate(next.getDate() + 7 * delta);
    else next.setDate(next.getDate() + delta);
    setCurrentDate(next);
  };

  const goToday = () => setCurrentDate(new Date());

  const tasksByDate = React.useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.due) continue;
      const key = task.due;
      const arr = map.get(key) || [];
      arr.push(task);
      map.set(key, arr);
    }
    return map;
  }, [tasks]);

  return (
    <div className="tn-calendar">
      <div className="tn-calendar-toolbar">
        <div className="tn-calendar-nav">
          <button className="tn-btn" onClick={() => navigate(-1)}>&lt;</button>
          <button className="tn-btn" onClick={goToday}>{i.today}</button>
          <button className="tn-btn" onClick={() => navigate(1)}>&gt;</button>
        </div>
        <div className="tn-calendar-current">{formatMonthYear(currentDate, locale)}</div>
        <div className="tn-calendar-layout-switch">
          <button className={`tn-btn ${layout === "month" ? "tn-btn-active" : ""}`} onClick={() => onLayoutChange("month")}>{i.calendarMonth}</button>
          <button className={`tn-btn ${layout === "week" ? "tn-btn-active" : ""}`} onClick={() => onLayoutChange("week")}>{i.calendarWeek}</button>
          <button className={`tn-btn ${layout === "day" ? "tn-btn-active" : ""}`} onClick={() => onLayoutChange("day")}>{i.calendarDay}</button>
        </div>
      </div>

      {layout === "month" && (
        <MonthGrid currentDate={currentDate} tasksByDate={tasksByDate} onSelect={onSelect} locale={locale} />
      )}
      {layout === "week" && (
        <WeekGrid currentDate={currentDate} tasksByDate={tasksByDate} onSelect={onSelect} locale={locale} />
      )}
      {layout === "day" && (
        <DayView currentDate={currentDate} tasksByDate={tasksByDate} onSelect={onSelect} locale={locale} />
      )}
    </div>
  );
}

function MonthGrid({
  currentDate,
  tasksByDate,
  onSelect,
  locale,
}: {
  currentDate: Date;
  tasksByDate: Map<string, Task[]>;
  onSelect: (task: Task) => void;
  locale?: string;
}) {
  const { activeTaskId } = useStore();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = formatDateStr(new Date());

  const dayNames = locale?.startsWith("ja")
    ? ["日", "月", "火", "水", "木", "金", "土"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const cells: React.ReactNode[] = [];

  // Day headers
  for (const d of dayNames) {
    cells.push(<div key={`h-${d}`} className="tn-cal-header">{d}</div>);
  }

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`e-${i}`} className="tn-cal-cell tn-cal-empty" />);
  }

  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayTasks = tasksByDate.get(dateStr) || [];
    const isToday = dateStr === todayStr;

    cells.push(
      <div key={dateStr} className={`tn-cal-cell ${isToday ? "tn-cal-today" : ""}`}>
        <div className="tn-cal-day-num">{day}</div>
        {dayTasks.slice(0, 3).map((task) => (
          <div
            key={task.id}
            className={`tn-cal-task tn-priority-${task.priority} ${task.id === activeTaskId ? "tn-active" : ""}`}
            onClick={() => onSelect(task)}
          >
            {task.title}
          </div>
        ))}
        {dayTasks.length > 3 && <div className="tn-cal-more">+{dayTasks.length - 3}</div>}
      </div>,
    );
  }

  return <div className="tn-cal-month-grid">{cells}</div>;
}

function WeekGrid({
  currentDate,
  tasksByDate,
  onSelect,
  locale,
}: {
  currentDate: Date;
  tasksByDate: Map<string, Task[]>;
  onSelect: (task: Task) => void;
  locale?: string;
}) {
  const { activeTaskId } = useStore();
  const todayStr = formatDateStr(new Date());
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  const days: React.ReactNode[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    const dateStr = formatDateStr(d);
    const dayTasks = tasksByDate.get(dateStr) || [];
    const isToday = dateStr === todayStr;

    days.push(
      <div key={dateStr} className={`tn-week-day ${isToday ? "tn-cal-today" : ""}`}>
        <div className="tn-week-day-header">
          <span className="tn-week-day-name">{d.toLocaleDateString(locale || "en", { weekday: "short" })}</span>
          <span className="tn-week-day-num">{d.getDate()}</span>
        </div>
        <div className="tn-week-day-tasks">
          {dayTasks.map((task) => (
            <div key={task.id} className={`tn-cal-task tn-priority-${task.priority} ${task.id === activeTaskId ? "tn-active" : ""}`} onClick={() => onSelect(task)}>
              {task.title}
            </div>
          ))}
        </div>
      </div>,
    );
  }

  return <div className="tn-cal-week-grid">{days}</div>;
}

function DayView({
  currentDate,
  tasksByDate,
  onSelect,
  locale,
}: {
  currentDate: Date;
  tasksByDate: Map<string, Task[]>;
  onSelect: (task: Task) => void;
  locale?: string;
}) {
  const i = t(locale);
  const { activeTaskId } = useStore();
  const dateStr = formatDateStr(currentDate);
  const dayTasks = tasksByDate.get(dateStr) || [];

  return (
    <div className="tn-cal-day-view">
      <div className="tn-cal-day-title">
        {currentDate.toLocaleDateString(locale || "en", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
      </div>
      {dayTasks.length === 0 ? (
        <div className="tn-empty">{i.noTasksFiltered}</div>
      ) : (
        dayTasks.map((task) => {
          const formulas = computeFormulas(task);
          return (
            <div key={task.id} className={`tn-task-row tn-priority-${task.priority} ${task.id === activeTaskId ? "tn-active" : ""}`} onClick={() => onSelect(task)}>
              <div className="tn-task-title">{task.title}</div>
              {task.priority !== "none" && (
                <span className={`tn-priority-badge tn-priority-${task.priority}`}>
                  {i[`priority${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}` as keyof typeof i] as string}
                </span>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatMonthYear(date: Date, locale?: string): string {
  return date.toLocaleDateString(locale || "en", { year: "numeric", month: "long" });
}
