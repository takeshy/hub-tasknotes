export interface Translations {
  pluginName: string;
  settingsTitle: string;
  // Views
  taskList: string;
  kanban: string;
  calendar: string;
  agenda: string;
  // Task fields
  title: string;
  status: string;
  due: string;
  priority: string;
  contexts: string;
  projects: string;
  timeEstimate: string;
  recurrence: string;
  dependencies: string;
  notes: string;
  created: string;
  modified: string;
  // Statuses
  statusTodo: string;
  statusInProgress: string;
  statusDone: string;
  statusCancelled: string;
  // Priorities
  priorityNone: string;
  priorityLow: string;
  priorityMedium: string;
  priorityHigh: string;
  priorityUrgent: string;
  // Actions
  createTask: string;
  editTask: string;
  deleteTask: string;
  deleteConfirm: string;
  save: string;
  cancel: string;
  close: string;
  openNote: string;
  // Task creation
  newTask: string;
  newTaskPlaceholder: string;
  // Formulas
  daysUntilDue: string;
  overdue: string;
  urgencyScore: string;
  totalTrackedTime: string;
  efficiencyRatio: string;
  // Time tracking
  startTimer: string;
  stopTimer: string;
  pomodoro: string;
  pomodoroStart: string;
  pomodoroBreak: string;
  pomodoroComplete: string;
  timeTracked: string;
  // Recurrence
  recurrenceDaily: string;
  recurrenceWeekly: string;
  recurrenceMonthly: string;
  recurrenceYearly: string;
  recurrenceCustom: string;
  recurrenceFlexible: string;
  recurrenceFixed: string;
  // Filters
  filterByStatus: string;
  filterByPriority: string;
  filterByContext: string;
  filterByProject: string;
  search: string;
  searchPlaceholder: string;
  showCompleted: string;
  // Sort
  sortBy: string;
  sortAsc: string;
  sortDesc: string;
  // Calendar
  calendarMonth: string;
  calendarWeek: string;
  calendarDay: string;
  today: string;
  // Agenda
  agendaOverdue: string;
  agendaToday: string;
  agendaUpcoming: string;
  agendaNoDue: string;
  // Settings
  taskFolder: string;
  taskFolderHint: string;
  defaultStatus: string;
  defaultPriority: string;
  defaultView: string;
  dateFormat: string;
  pomodoroDuration: string;
  pomodoroBreakDuration: string;
  calendarLayout: string;
  resetDefaults: string;
  // Google Calendar
  calendarSync: string;
  calendarSyncEnabled: string;
  calendarSyncDisabled: string;
  calendarSyncTask: string;
  calendarUnsyncTask: string;
  calendarSyncing: string;
  calendarSynced: string;
  calendarEvent: string;
  calendarOpenEvent: string;
  calendarSyncAll: string;
  calendarUnavailable: string;
  // Errors
  errorSave: string;
  errorLoad: string;
  errorDelete: string;
  errorCalendarSync: string;
  // Empty states
  noTasks: string;
  noTasksFiltered: string;
  // Export
  exportDrive: string;
  exportSuccess: string;
  // Misc
  expand: string;
  collapse: string;
  minutes: string;
  hours: string;
  days: string;
  task: string;
  tasks: string;
}

const en: Translations = {
  pluginName: "TaskNotes",
  settingsTitle: "TaskNotes Settings",
  // Views
  taskList: "Task List",
  kanban: "Kanban",
  calendar: "Calendar",
  agenda: "Agenda",
  // Task fields
  title: "Title",
  status: "Status",
  due: "Due",
  priority: "Priority",
  contexts: "Contexts",
  projects: "Projects",
  timeEstimate: "Time Estimate",
  recurrence: "Recurrence",
  dependencies: "Dependencies",
  notes: "Notes",
  created: "Created",
  modified: "Modified",
  // Statuses
  statusTodo: "To Do",
  statusInProgress: "In Progress",
  statusDone: "Done",
  statusCancelled: "Cancelled",
  // Priorities
  priorityNone: "None",
  priorityLow: "Low",
  priorityMedium: "Medium",
  priorityHigh: "High",
  priorityUrgent: "Urgent",
  // Actions
  createTask: "Create Task",
  editTask: "Edit Task",
  deleteTask: "Delete Task",
  deleteConfirm: "Are you sure you want to delete this task?",
  save: "Save",
  cancel: "Cancel",
  close: "Close",
  openNote: "Open Note",
  // Task creation
  newTask: "New Task",
  newTaskPlaceholder: "Buy groceries tomorrow #errands +shopping",
  // Formulas
  daysUntilDue: "Days until due",
  overdue: "Overdue",
  urgencyScore: "Urgency",
  totalTrackedTime: "Total tracked time",
  efficiencyRatio: "Efficiency",
  // Time tracking
  startTimer: "Start Timer",
  stopTimer: "Stop Timer",
  pomodoro: "Pomodoro",
  pomodoroStart: "Start Pomodoro",
  pomodoroBreak: "Break Time!",
  pomodoroComplete: "Pomodoro Complete!",
  timeTracked: "Time Tracked",
  // Recurrence
  recurrenceDaily: "Daily",
  recurrenceWeekly: "Weekly",
  recurrenceMonthly: "Monthly",
  recurrenceYearly: "Yearly",
  recurrenceCustom: "Custom",
  recurrenceFlexible: "Flexible (from completion)",
  recurrenceFixed: "Fixed (from due date)",
  // Filters
  filterByStatus: "Filter by status",
  filterByPriority: "Filter by priority",
  filterByContext: "Filter by context",
  filterByProject: "Filter by project",
  search: "Search",
  searchPlaceholder: "Search tasks...",
  showCompleted: "Show completed",
  // Sort
  sortBy: "Sort by",
  sortAsc: "Ascending",
  sortDesc: "Descending",
  // Calendar
  calendarMonth: "Month",
  calendarWeek: "Week",
  calendarDay: "Day",
  today: "Today",
  // Agenda
  agendaOverdue: "Overdue",
  agendaToday: "Today",
  agendaUpcoming: "Upcoming",
  agendaNoDue: "No Due Date",
  // Settings
  taskFolder: "Task Folder",
  taskFolderHint: "Path name for task storage",
  defaultStatus: "Default Status",
  defaultPriority: "Default Priority",
  defaultView: "Default View",
  dateFormat: "Date Format",
  pomodoroDuration: "Pomodoro Duration (min)",
  pomodoroBreakDuration: "Pomodoro Break (min)",
  calendarLayout: "Default Calendar Layout",
  resetDefaults: "Reset to Defaults",
  // Google Calendar
  calendarSync: "Google Calendar Sync",
  calendarSyncEnabled: "Calendar sync enabled",
  calendarSyncDisabled: "Calendar sync disabled",
  calendarSyncTask: "Sync to Calendar",
  calendarUnsyncTask: "Remove from Calendar",
  calendarSyncing: "Syncing...",
  calendarSynced: "Synced",
  calendarEvent: "Calendar Event",
  calendarOpenEvent: "Open in Google Calendar",
  calendarSyncAll: "Sync All Tasks",
  calendarUnavailable: "Calendar unavailable (requires premium plan)",
  // Errors
  errorSave: "Failed to save task",
  errorLoad: "Failed to load tasks",
  errorDelete: "Failed to delete task",
  errorCalendarSync: "Failed to sync with Google Calendar",
  // Empty states
  noTasks: "No tasks yet. Create your first task!",
  noTasksFiltered: "No tasks match the current filters.",
  // Export
  exportDrive: "Export to Drive",
  exportSuccess: "Exported successfully",
  // Misc
  expand: "Expand",
  collapse: "Collapse",
  minutes: "min",
  hours: "h",
  days: "d",
  task: "task",
  tasks: "tasks",
};

const ja: Translations = {
  pluginName: "TaskNotes",
  settingsTitle: "TaskNotes 設定",
  // Views
  taskList: "タスク一覧",
  kanban: "カンバン",
  calendar: "カレンダー",
  agenda: "アジェンダ",
  // Task fields
  title: "タイトル",
  status: "ステータス",
  due: "期日",
  priority: "優先度",
  contexts: "コンテキスト",
  projects: "プロジェクト",
  timeEstimate: "見積もり時間",
  recurrence: "繰り返し",
  dependencies: "依存関係",
  notes: "メモ",
  created: "作成日",
  modified: "更新日",
  // Statuses
  statusTodo: "未着手",
  statusInProgress: "進行中",
  statusDone: "完了",
  statusCancelled: "キャンセル",
  // Priorities
  priorityNone: "なし",
  priorityLow: "低",
  priorityMedium: "中",
  priorityHigh: "高",
  priorityUrgent: "緊急",
  // Actions
  createTask: "タスクを作成",
  editTask: "タスクを編集",
  deleteTask: "タスクを削除",
  deleteConfirm: "このタスクを削除してもよろしいですか？",
  save: "保存",
  cancel: "キャンセル",
  close: "閉じる",
  openNote: "ノートを開く",
  // Task creation
  newTask: "新しいタスク",
  newTaskPlaceholder: "明日買い物 #用事 +ショッピング",
  // Formulas
  daysUntilDue: "期日まで",
  overdue: "期限超過",
  urgencyScore: "緊急度",
  totalTrackedTime: "合計作業時間",
  efficiencyRatio: "効率",
  // Time tracking
  startTimer: "タイマー開始",
  stopTimer: "タイマー停止",
  pomodoro: "ポモドーロ",
  pomodoroStart: "ポモドーロ開始",
  pomodoroBreak: "休憩時間！",
  pomodoroComplete: "ポモドーロ完了！",
  timeTracked: "作業時間",
  // Recurrence
  recurrenceDaily: "毎日",
  recurrenceWeekly: "毎週",
  recurrenceMonthly: "毎月",
  recurrenceYearly: "毎年",
  recurrenceCustom: "カスタム",
  recurrenceFlexible: "柔軟（完了日基準）",
  recurrenceFixed: "固定（期日基準）",
  // Filters
  filterByStatus: "ステータスで絞り込み",
  filterByPriority: "優先度で絞り込み",
  filterByContext: "コンテキストで絞り込み",
  filterByProject: "プロジェクトで絞り込み",
  search: "検索",
  searchPlaceholder: "タスクを検索...",
  showCompleted: "完了を表示",
  // Sort
  sortBy: "並び替え",
  sortAsc: "昇順",
  sortDesc: "降順",
  // Calendar
  calendarMonth: "月",
  calendarWeek: "週",
  calendarDay: "日",
  today: "今日",
  // Agenda
  agendaOverdue: "期限超過",
  agendaToday: "今日",
  agendaUpcoming: "今後",
  agendaNoDue: "期日なし",
  // Settings
  taskFolder: "タスクフォルダ",
  taskFolderHint: "タスク保存先のパス名",
  defaultStatus: "デフォルトステータス",
  defaultPriority: "デフォルト優先度",
  defaultView: "デフォルトビュー",
  dateFormat: "日付形式",
  pomodoroDuration: "ポモドーロ時間（分）",
  pomodoroBreakDuration: "ポモドーロ休憩（分）",
  calendarLayout: "デフォルトカレンダー表示",
  resetDefaults: "デフォルトに戻す",
  // Google Calendar
  calendarSync: "Google Calendar 同期",
  calendarSyncEnabled: "カレンダー同期が有効です",
  calendarSyncDisabled: "カレンダー同期が無効です",
  calendarSyncTask: "カレンダーに同期",
  calendarUnsyncTask: "カレンダーから削除",
  calendarSyncing: "同期中...",
  calendarSynced: "同期済み",
  calendarEvent: "カレンダー予定",
  calendarOpenEvent: "Google Calendar で開く",
  calendarSyncAll: "全タスクを同期",
  calendarUnavailable: "カレンダーは利用できません（プレミアムプランが必要）",
  // Errors
  errorSave: "タスクの保存に失敗しました",
  errorLoad: "タスクの読み込みに失敗しました",
  errorDelete: "タスクの削除に失敗しました",
  errorCalendarSync: "Google Calendar との同期に失敗しました",
  // Empty states
  noTasks: "タスクがありません。最初のタスクを作成しましょう！",
  noTasksFiltered: "条件に一致するタスクがありません。",
  // Export
  exportDrive: "Drive にエクスポート",
  exportSuccess: "エクスポート成功",
  // Misc
  expand: "拡大",
  collapse: "縮小",
  minutes: "分",
  hours: "時間",
  days: "日",
  task: "件",
  tasks: "件",
};

const translations: Record<string, Translations> = { en, ja };

export function t(locale?: string): Translations {
  if (locale && locale.startsWith("ja")) return ja;
  return translations[locale ?? "en"] ?? en;
}
