# TaskNotes - Task Management Plugin for GemiHub

A [GemiHub](https://github.com/takeshy/gemihub) plugin for task management where each task is a separate Markdown note with YAML frontmatter. Your data is portable — tasks are just Markdown files that you can read, transform, or migrate with any tool.

[Japanese / 日本語](README_ja.md)

## Features

- **4 Views** — Task List, Kanban board, Calendar (month/week/day), and Agenda
- **AI Task Creation** — Describe tasks in natural language; Gemini/Gemma parses them into structured fields and opens the editor pre-filled
- **Time Tracking** — Start/stop timer per task
- **Recurring Tasks** — RRULE-based recurrence (daily, weekly, monthly, yearly) with scheduled-date or completion-date anchoring; skip individual instances
- **Computed Properties** — Urgency score, days until due, overdue detection, efficiency ratio
- **Contexts, Tags & Projects** — Tag tasks with `@context`, `#tag`, and `+project` for filtering
- **Dependencies** — Edit `blockedBy` / `blocking` relationships between tasks
- **Archive** — Archive completed tasks; toggle visibility with the "Show archived" filter
- **Scheduled Date** — Separate "when to do" (`scheduled`) from hard deadline (`due`)
- **Google Calendar Sync** — Sync tasks to Google Calendar, view calendar events alongside tasks (premium plan)
- **i18n** — English and Japanese UI

## Installation

### Via GemiHub Settings

1. Open GemiHub Settings > Plugins tab
2. Enter `takeshy/hub-tasknotes` and click Install
3. Enable the plugin

### Building from Source

```bash
git clone https://github.com/takeshy/hub-tasknotes
cd hub-tasknotes
npm install
npm run build
```

This produces `main.js`, `styles.css`, and `manifest.json` for a GitHub Release.

## Usage

1. After installation, the **TaskNotes** panel appears in the right sidebar.
2. Click **Create with AI** to describe a task in natural language — Gemini/Gemma parses it into structured fields and opens the editor pre-filled. Or click **New Task** to open a blank editor.
3. Switch between views using the view selector: **List**, **Kanban**, **Calendar**, or **Agenda**.
4. Click a task to edit its details — status, priority, due date, scheduled date, contexts, tags, projects, dependencies, recurrence anchor, notes, etc.
5. Use the timer button to start/stop time tracking.
6. For recurring tasks, use the skip button (⏭) to skip an instance and advance to the next occurrence.
7. Use the **Archive** button in the task editor to archive completed tasks. Toggle **Show archived** in the toolbar to show/hide them.
8. Filter tasks by status, priority, context, tag, or project using the toolbar dropdowns. Use the search box for free-text search. Sort by title, due date, priority, or urgency score.

### Google Calendar Sync

Requires a **premium plan** with Google Calendar scope.

1. Open **Settings** and enable **Google Calendar Sync**.
2. Tasks with a due date can be synced to Google Calendar individually from the task editor, or all at once with the calendar button in the toolbar.
3. In the **Calendar** view, Google Calendar events are displayed in green alongside your tasks.
4. Synced tasks show a link to open the event directly in Google Calendar.

### Task File Format

Each task is a `.md` file with YAML frontmatter stored in the configured task folder:

```yaml
---
title: Buy groceries
status: todo
due: "2026-04-10"
scheduled: "2026-04-09T10:00"
priority: medium
contexts: [errands, home]
tags: [shopping]
projects: [renovation]
timeEstimate: 30
timeEntries: []
recurrence:
  rrule: "FREQ=WEEKLY;INTERVAL=1"
  recurrenceAnchor: scheduled
complete_instances: []
skipped_instances: []
blockedBy: []
blocking: []
archived: false
completedDate: null
createdDate: "2026-04-05T10:00:00Z"
modifiedDate: "2026-04-05T10:00:00Z"
---

- Milk
- Bread
- Eggs
```

> **Data model** follows [callumalpass/tasknotes](https://github.com/callumalpass/tasknotes) conventions. `due` is the hard deadline (date only), `scheduled` is the planned execution date/time, `contexts` are GTD-style context tags, and `recurrenceAnchor` controls whether the next occurrence is calculated from the scheduled/due date or from the completion date.

### Natural Language Syntax (internal library)

The `naturalLanguage.ts` module is used internally for programmatic task parsing. The primary UI path is AI task creation via Gemini/Gemma.

| Token | Meaning | Example |
|-------|---------|---------|
| `@word` | Context | `@errands` |
| `#word` | Tag | `#shopping` |
| `+word` | Project | `+renovation` |
| `!level` | Priority (low/medium/high/urgent) | `!high` |
| `~YYYY-MM-DD` | Scheduled date | `~2026-04-09` |
| `~YYYY-MM-DDTHH:MM` | Scheduled date+time | `~2026-04-09T10:00` |
| `YYYY-MM-DD` | Due date | `2026-04-15` |
| `tomorrow`, `today`, `next Monday` | Relative due date | `tomorrow` |
| `every day/week/month/year` | Recurrence | `every week` |

Japanese is also supported: `明日`, `来週月曜`, `毎週`, etc.

## Settings

| Setting | Description |
|---------|-------------|
| Task Folder | Folder path where task files are stored |
| Default Status | Status assigned to new tasks |
| Default Priority | Priority assigned to new tasks |
| Default View | View shown when opening the plugin |
| Show Completed | Whether to display completed/cancelled tasks |
| Default Calendar Layout | Month, week, or day |
| Google Calendar Sync | Sync tasks to Google Calendar (premium) |

## Plugin API Usage

This plugin uses the following GemiHub Plugin APIs:

- `api.registerView()` — registers the sidebar panel
- `api.registerSettingsTab()` — registers the settings panel
- `api.gemini.chat()` — AI task creation via Gemini/Gemma LLM
- `api.drive.listFiles/readFile/createFile/updateFile/deleteFile()` — CRUD operations for task Markdown files
- `api.storage.get/set()` — persists plugin settings
- `api.calendar.listEvents/createEvent/updateEvent/deleteEvent()` — Google Calendar sync (premium)
- `api.onActiveFileChanged()` — tracks which task file is open in the main editor

## Development

```bash
npm install
npm run dev      # Watch mode
npm run build    # Production build
npm test         # Run tests
```

## License

MIT
