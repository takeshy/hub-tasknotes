/** Task status */
export type TaskStatus = "todo" | "in_progress" | "done" | "cancelled";

/** Task priority */
export type TaskPriority = "none" | "low" | "medium" | "high" | "urgent";

/** View type */
export type ViewType = "list" | "kanban" | "calendar" | "agenda";

/** Calendar layout */
export type CalendarLayout = "month" | "week" | "day";

/** Sort field */
export type SortField = "title" | "due" | "priority" | "status" | "created" | "urgencyScore";

/** Sort direction */
export type SortDirection = "asc" | "desc";

/** Time entry for time tracking */
export interface TimeEntry {
  startTime: string; // ISO 8601
  endTime: string | null; // null if currently running
}

/** Recurrence rule (subset of RRULE) */
export interface RecurrenceRule {
  /** RRULE string (e.g. "FREQ=DAILY;INTERVAL=1") */
  rrule: string;
  /** Whether schedule is flexible (from completion) or fixed (from due date) */
  flexible: boolean;
}

/** Task dependency */
export interface TaskDependency {
  /** ID of the task this depends on */
  taskId: string;
  /** Type of dependency */
  type: "blocks" | "blocked_by";
}

/** A single task — stored as YAML frontmatter in a .md file */
export interface Task {
  /** Unique identifier (filename without extension) */
  id: string;
  /** Task title */
  title: string;
  /** Current status */
  status: TaskStatus;
  /** Due date (ISO 8601 date string, e.g. "2026-04-10") */
  due: string | null;
  /** Priority level */
  priority: TaskPriority;
  /** Context tags (e.g. ["home", "errands"]) */
  contexts: string[];
  /** Project names */
  projects: string[];
  /** Estimated time in minutes */
  timeEstimate: number | null;
  /** Time tracking entries */
  timeEntries: TimeEntry[];
  /** Recurrence rule */
  recurrence: RecurrenceRule | null;
  /** Completed recurrence instances (ISO date strings) */
  completeInstances: string[];
  /** Task dependencies */
  dependencies: TaskDependency[];
  /** Markdown body content (notes) */
  body: string;
  /** Creation date (ISO 8601) */
  created: string;
  /** Last modified date (ISO 8601) */
  modified: string;
}

/** Computed / formula properties for a task */
export interface TaskFormulas {
  /** Days until due date (negative = overdue) */
  daysUntilDue: number | null;
  /** Whether the task is overdue */
  isOverdue: boolean;
  /** Urgency score (higher = more urgent) */
  urgencyScore: number;
  /** Total tracked time in minutes */
  totalTrackedTime: number;
  /** Efficiency ratio (estimate / actual) */
  efficiencyRatio: number | null;
}

/** Filter criteria for task queries */
export interface TaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  contexts?: string[];
  projects?: string[];
  dueBefore?: string;
  dueAfter?: string;
  search?: string;
  hideCompleted?: boolean;
}

/** Sort configuration */
export interface TaskSort {
  field: SortField;
  direction: SortDirection;
}

/** Plugin settings */
export interface TaskNotesSettings {
  /** Folder path for task storage */
  taskFolder: string;
  /** Default status for new tasks */
  defaultStatus: TaskStatus;
  /** Default priority for new tasks */
  defaultPriority: TaskPriority;
  /** Default view type */
  defaultView: ViewType;
  /** Custom status labels */
  statusLabels: Record<TaskStatus, string>;
  /** Custom priority labels */
  priorityLabels: Record<TaskPriority, string>;
  /** Date format for display */
  dateFormat: string;
  /** Whether to show completed tasks by default */
  showCompleted: boolean;
  /** Pomodoro duration in minutes */
  pomodoroDuration: number;
  /** Pomodoro break duration in minutes */
  pomodoroBreak: number;
  /** Default calendar layout */
  calendarLayout: CalendarLayout;
}

/** Default settings */
export const DEFAULT_SETTINGS: TaskNotesSettings = {
  taskFolder: "tasks",
  defaultStatus: "todo",
  defaultPriority: "none",
  defaultView: "list",
  statusLabels: {
    todo: "To Do",
    in_progress: "In Progress",
    done: "Done",
    cancelled: "Cancelled",
  },
  priorityLabels: {
    none: "None",
    low: "Low",
    medium: "Medium",
    high: "High",
    urgent: "Urgent",
  },
  dateFormat: "YYYY-MM-DD",
  showCompleted: false,
  pomodoroDuration: 25,
  pomodoroBreak: 5,
  calendarLayout: "month",
};

/** Priority numeric values for sorting */
export const PRIORITY_VALUES: Record<TaskPriority, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
};

/** Status order for kanban columns */
export const STATUS_ORDER: TaskStatus[] = ["todo", "in_progress", "done", "cancelled"];
