const translations: Record<string, Record<string, string>> = {
  en: {
    // General
    "plugin.name": "TaskNotes",
    "settings.title": "TaskNotes Settings",

    // Views
    "view.list": "Task List",
    "view.kanban": "Kanban",
    "view.calendar": "Calendar",
    "view.agenda": "Agenda",

    // Task fields
    "title": "Title",
    "status": "Status",
    "due": "Due",
    "priority": "Priority",
    "contexts": "Contexts",
    "projects": "Projects",
    "timeEstimate": "Time Estimate",
    "recurrence": "Recurrence",
    "notes": "Notes",
    "createdDate": "Created",
    "modifiedDate": "Modified",
    "scheduled": "Scheduled",
    "tags": "Tags",
    "archived": "Archived",
    "completedDate": "Completed Date",
    "skippedInstances": "Skipped",
    "blockedBy": "Blocked By",
    "blocking": "Blocking",
    "dueTime": "Time",
    "recurrenceAnchor": "Recurrence Anchor",
    "recurrenceAnchor.scheduled": "From scheduled/due date",
    "recurrenceAnchor.completion": "From completion date",
    "archive": "Archive",
    "unarchive": "Unarchive",
    "showArchived": "Show archived",
    "skipInstance": "Skip",
    "commaSeparatedIds": "comma-separated IDs",

    // Statuses
    "status.todo": "To Do",
    "status.in_progress": "In Progress",
    "status.done": "Done",
    "status.cancelled": "Cancelled",

    // Priorities
    "priority.none": "None",
    "priority.low": "Low",
    "priority.medium": "Medium",
    "priority.high": "High",
    "priority.urgent": "Urgent",

    // Actions
    "createTask": "Create Task",
    "editTask": "Edit Task",
    "deleteTask": "Delete Task",
    "deleteConfirm": "Are you sure you want to delete this task?",
    "save": "Save",
    "cancel": "Cancel",
    "close": "Close",
    "delete": "Delete",
    "openNote": "Open Note",

    // Task creation
    "newTask": "New Task",
    "newTask.placeholder": "Buy groceries tomorrow #errands +shopping",

    // Formulas
    "daysUntilDue": "Days until due",
    "overdue": "Overdue",
    "urgencyScore": "Urgency",
    "totalTrackedTime": "Total tracked time",
    "efficiencyRatio": "Efficiency",

    // Time tracking
    "startTimer": "Start Timer",
    "stopTimer": "Stop Timer",
    "timeTracked": "Time Tracked",

    // Time entries
    "timeEntries": "Time Entries",
    "timeEntries.start": "Start",
    "timeEntries.end": "End",
    "timeEntries.duration": "Duration",
    "timeEntries.running": "Running",
    "timeEntries.add": "Add Entry",
    "timeEntries.none": "No time entries",

    // Recurrence
    "recurrence.daily": "Daily",
    "recurrence.weekly": "Weekly",
    "recurrence.monthly": "Monthly",
    "recurrence.yearly": "Yearly",
    "recurrence.custom": "Custom",
    "recurrence.every.daily": "Every {0} days",
    "recurrence.every.weekly": "Every {0} weeks",
    "recurrence.every.monthly": "Every {0} months",
    "recurrence.every.yearly": "Every {0} years",

    // Filters
    "filter.status": "Status",
    "filter.priority": "Priority",
    "filter.context": "Context",
    "filter.project": "Project",
    "filter.tag": "Tag",
    "filter.all": "All",
    "search": "Search",
    "search.placeholder": "Search tasks...",
    "showCompleted": "Show completed",

    // Sort
    "sortBy": "Sort by",
    "sort.asc": "Ascending",
    "sort.desc": "Descending",

    // Calendar
    "calendar.month": "Month",
    "calendar.week": "Week",
    "calendar.day": "Day",
    "today": "Today",

    // Agenda
    "agenda.overdue": "Overdue",
    "agenda.today": "Today",
    "agenda.upcoming": "Upcoming",
    "agenda.noDue": "No Due Date",

    // Settings
    "settings.taskFolder": "Task Folder",
    "settings.taskFolderHint": "Path name for task storage",
    "settings.defaultStatus": "Default Status",
    "settings.defaultPriority": "Default Priority",
    "settings.defaultView": "Default View",
    "settings.dateFormat": "Date Format",
    "settings.calendarLayout": "Default Calendar Layout",
    "settings.resetDefaults": "Reset to Defaults",

    // Google Calendar
    "calendar.sync": "Google Calendar Sync",
    "calendar.syncEnabled": "Calendar sync enabled",
    "calendar.syncDisabled": "Calendar sync disabled",
    "calendar.syncTask": "Sync to Calendar",
    "calendar.unsyncTask": "Remove from Calendar",
    "calendar.syncing": "Syncing...",
    "calendar.synced": "Synced",
    "calendar.event": "Calendar Event",
    "calendar.openEvent": "Open in Google Calendar",
    "calendar.syncAll": "Sync All Tasks",
    "calendar.fetchEvents": "Fetch Calendar",
    "calendar.fetching": "Fetching...",
    "calendar.unavailable": "Calendar unavailable (requires premium plan)",

    // AI
    "ai.create": "Create with AI",
    "ai.parsing": "Analyzing...",
    "ai.placeholder": "Describe your task in natural language...\ne.g. Buy groceries by Friday, high priority, for the shopping project",

    // Errors
    "error.save": "Failed to save task",
    "error.load": "Failed to load tasks",
    "error.delete": "Failed to delete task",
    "error.calendarSync": "Failed to sync with Google Calendar",
    "error.aiParse": "AI could not parse the input",

    // Empty states
    "noTasks": "No tasks yet. Create your first task!",
    "noTasks.filtered": "No tasks match the current filters.",

    // Export
    "export.drive": "Export to Drive",
    "export.success": "Exported successfully",

    // Misc
    "expand": "Expand",
    "collapse": "Collapse",
    "loading": "Loading...",
    "minutes": "min",
    "hours": "h",
    "days": "d",
    "task": "task",
    "tasks": "tasks",
    "timeEstimate.label": "Time Estimate (min)",
    "commaSeparated": "comma-separated",
    "placeholder.contexts": "errands, home, work",
    "placeholder.tags": "errands, review",
    "placeholder.projects": "shopping, renovation",
    "placeholder.taskIds": "task-abc123, task-def456",
  },
  ja: {
    // General
    "plugin.name": "TaskNotes",
    "settings.title": "TaskNotes 設定",

    // Views
    "view.list": "タスク一覧",
    "view.kanban": "カンバン",
    "view.calendar": "カレンダー",
    "view.agenda": "アジェンダ",

    // Task fields
    "title": "タイトル",
    "status": "ステータス",
    "due": "期日",
    "priority": "優先度",
    "contexts": "コンテキスト",
    "projects": "プロジェクト",
    "timeEstimate": "見積もり時間",
    "recurrence": "繰り返し",
    "notes": "メモ",
    "createdDate": "作成日",
    "modifiedDate": "更新日",
    "scheduled": "予定日時",
    "tags": "タグ",
    "archived": "アーカイブ",
    "completedDate": "完了日",
    "skippedInstances": "スキップ",
    "blockedBy": "ブロック元",
    "blocking": "ブロック先",
    "dueTime": "時刻",
    "recurrenceAnchor": "繰り返し基準",
    "recurrenceAnchor.scheduled": "予定日/期日基準",
    "recurrenceAnchor.completion": "完了日基準",
    "archive": "アーカイブ",
    "unarchive": "アーカイブ解除",
    "showArchived": "アーカイブ済みを表示",
    "skipInstance": "スキップ",
    "commaSeparatedIds": "カンマ区切りのID",

    // Statuses
    "status.todo": "未着手",
    "status.in_progress": "進行中",
    "status.done": "完了",
    "status.cancelled": "キャンセル",

    // Priorities
    "priority.none": "なし",
    "priority.low": "低",
    "priority.medium": "中",
    "priority.high": "高",
    "priority.urgent": "緊急",

    // Actions
    "createTask": "タスクを作成",
    "editTask": "タスクを編集",
    "deleteTask": "タスクを削除",
    "deleteConfirm": "このタスクを削除してもよろしいですか？",
    "save": "保存",
    "cancel": "キャンセル",
    "close": "閉じる",
    "delete": "削除",
    "openNote": "ノートを開く",

    // Task creation
    "newTask": "新しいタスク",
    "newTask.placeholder": "明日買い物 #用事 +ショッピング",

    // Formulas
    "daysUntilDue": "期日まで",
    "overdue": "期限超過",
    "urgencyScore": "緊急度",
    "totalTrackedTime": "合計作業時間",
    "efficiencyRatio": "効率",

    // Time tracking
    "startTimer": "タイマー開始",
    "stopTimer": "タイマー停止",
    "timeTracked": "作業時間",

    // Time entries
    "timeEntries": "作業記録",
    "timeEntries.start": "開始",
    "timeEntries.end": "終了",
    "timeEntries.duration": "時間",
    "timeEntries.running": "計測中",
    "timeEntries.add": "記録を追加",
    "timeEntries.none": "作業記録なし",

    // Recurrence
    "recurrence.daily": "毎日",
    "recurrence.weekly": "毎週",
    "recurrence.monthly": "毎月",
    "recurrence.yearly": "毎年",
    "recurrence.custom": "カスタム",
    "recurrence.every.daily": "{0}日ごと",
    "recurrence.every.weekly": "{0}週間ごと",
    "recurrence.every.monthly": "{0}ヶ月ごと",
    "recurrence.every.yearly": "{0}年ごと",

    // Filters
    "filter.status": "ステータス",
    "filter.priority": "優先度",
    "filter.context": "コンテキスト",
    "filter.project": "プロジェクト",
    "filter.tag": "タグ",
    "filter.all": "すべて",
    "search": "検索",
    "search.placeholder": "タスクを検索...",
    "showCompleted": "完了を表示",

    // Sort
    "sortBy": "並び替え",
    "sort.asc": "昇順",
    "sort.desc": "降順",

    // Calendar
    "calendar.month": "月",
    "calendar.week": "週",
    "calendar.day": "日",
    "today": "今日",

    // Agenda
    "agenda.overdue": "期限超過",
    "agenda.today": "今日",
    "agenda.upcoming": "今後",
    "agenda.noDue": "期日なし",

    // Settings
    "settings.taskFolder": "タスクフォルダ",
    "settings.taskFolderHint": "タスク保存先のパス名",
    "settings.defaultStatus": "デフォルトステータス",
    "settings.defaultPriority": "デフォルト優先度",
    "settings.defaultView": "デフォルトビュー",
    "settings.dateFormat": "日付形式",
    "settings.calendarLayout": "デフォルトカレンダー表示",
    "settings.resetDefaults": "デフォルトに戻す",

    // Google Calendar
    "calendar.sync": "Google Calendar 同期",
    "calendar.syncEnabled": "カレンダー同期が有効です",
    "calendar.syncDisabled": "カレンダー同期が無効です",
    "calendar.syncTask": "カレンダーに同期",
    "calendar.unsyncTask": "カレンダーから削除",
    "calendar.syncing": "同期中...",
    "calendar.synced": "同期済み",
    "calendar.event": "カレンダー予定",
    "calendar.openEvent": "Google Calendar で開く",
    "calendar.syncAll": "全タスクを同期",
    "calendar.fetchEvents": "予定を取得",
    "calendar.fetching": "取得中...",
    "calendar.unavailable": "カレンダーは利用できません（プレミアムプランが必要）",

    // AI
    "ai.create": "AIで作成",
    "ai.parsing": "解析中...",
    "ai.placeholder": "タスクの内容を自然な文章で入力してください...\n例: 金曜日までに買い物、優先度高、ショッピングプロジェクト",

    // Errors
    "error.save": "タスクの保存に失敗しました",
    "error.load": "タスクの読み込みに失敗しました",
    "error.delete": "タスクの削除に失敗しました",
    "error.calendarSync": "Google Calendar との同期に失敗しました",
    "error.aiParse": "AIが入力を解析できませんでした",

    // Empty states
    "noTasks": "タスクがありません。最初のタスクを作成しましょう！",
    "noTasks.filtered": "条件に一致するタスクがありません。",

    // Export
    "export.drive": "Drive にエクスポート",
    "export.success": "エクスポート成功",

    // Misc
    "expand": "拡大",
    "collapse": "縮小",
    "loading": "読み込み中...",
    "minutes": "分",
    "hours": "時間",
    "days": "日",
    "task": "件",
    "tasks": "件",
    "timeEstimate.label": "見積もり時間（分）",
    "commaSeparated": "カンマ区切り",
    "placeholder.contexts": "用事, 自宅, 仕事",
    "placeholder.tags": "用事, レビュー",
    "placeholder.projects": "買い物, リフォーム",
    "placeholder.taskIds": "task-abc123, task-def456",
  },
};

let currentLang = "en";

export function setLanguage(lang: string): void {
  currentLang = lang.startsWith("ja") ? "ja" : "en";
}

export function getLanguage(): string {
  return currentLang;
}

export function t(key: string): string {
  return translations[currentLang]?.[key] ?? translations["en"]?.[key] ?? key;
}
