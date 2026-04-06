/** Task status */
export type TaskStatus = "todo" | "in_progress" | "done" | "cancelled";

/** Task priority */
export type TaskPriority = "none" | "low" | "medium" | "high" | "urgent";

/** View type */
export type ViewType = "list" | "kanban" | "calendar" | "agenda";

/** Calendar layout */
export type CalendarLayout = "month" | "week" | "day";

/** Sort field */
export type SortField = "title" | "due" | "scheduled" | "priority" | "status" | "createdDate" | "urgencyScore";

/** Sort direction */
export type SortDirection = "asc" | "desc";

/** Time entry for time tracking */
export interface TimeEntry {
  start: string; // ISO 8601
  end: string | null; // null if currently running
}

/** Recurrence rule (subset of RRULE) */
export interface RecurrenceRule {
  /** RRULE string (e.g. "FREQ=DAILY;INTERVAL=1") */
  rrule: string;
  /** Whether next occurrence is from scheduled/due date or from completion date */
  recurrenceAnchor: "scheduled" | "completion";
}

/** A single task — stored as YAML frontmatter in a .md file */
export interface Task {
  /** Unique identifier (filename without extension) */
  id: string;
  /** Task title */
  title: string;
  /** Current status */
  status: TaskStatus;
  /** Due date — hard deadline (YYYY-MM-DD) */
  due: string | null;
  /** Scheduled date/time — when to do (YYYY-MM-DD or YYYY-MM-DDTHH:MM) */
  scheduled: string | null;
  /** Priority level */
  priority: TaskPriority;
  /** Context tags (e.g. ["@home", "@work"]) */
  contexts: string[];
  /** Tags for categorization (e.g. ["errands", "shopping"]) */
  tags: string[];
  /** Project names */
  projects: string[];
  /** Estimated time in minutes */
  timeEstimate: number | null;
  /** Time tracking entries */
  timeEntries: TimeEntry[];
  /** Recurrence rule */
  recurrence: RecurrenceRule | null;
  /** Completed recurrence instances (ISO date strings) */
  complete_instances: string[];
  /** Skipped recurrence instances (ISO date strings) */
  skipped_instances: string[];
  /** Task IDs that block this task */
  blockedBy: string[];
  /** Task IDs that this task blocks */
  blocking: string[];
  /** Markdown body content (notes) */
  body: string;
  /** Whether task is archived */
  archived: boolean;
  /** Date when task was completed (ISO 8601) */
  completedDate: string | null;
  /** Creation date (ISO 8601) */
  createdDate: string;
  /** Last modified date (ISO 8601) */
  modifiedDate: string;
  /** Google Calendar event ID (if synced) */
  calendarEventId?: string;
  /** Google Calendar event HTML link */
  calendarHtmlLink?: string;
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
  tags?: string[];
  projects?: string[];
  dueBefore?: string;
  dueAfter?: string;
  search?: string;
  hideCompleted?: boolean;
  hideArchived?: boolean;
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
  /** Enable Google Calendar sync */
  calendarSync: boolean;
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
  calendarSync: false,
};

/** Google Calendar event (from the Calendar API) */
export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  status?: string;
  htmlLink?: string;
}

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
