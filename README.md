# TaskNotes - Task Management Plugin for GemiHub

A [GemiHub](https://github.com/takeshy/gemihub) plugin for task management where each task is a separate Markdown note with YAML frontmatter. Your data is portable — tasks are just Markdown files that you can read, transform, or migrate with any tool.

[Japanese / 日本語](README_ja.md)

## Features

- **4 Views** — Task List, Kanban board, Calendar (month/week/day), and Agenda
- **Natural Language Input** — Create tasks like `Buy groceries tomorrow #errands +shopping !high`
- **Time Tracking** — Start/stop timer per task, Pomodoro timer with configurable work/break durations
- **Recurring Tasks** — RRULE-based recurrence (daily, weekly, monthly, yearly) with flexible or fixed scheduling
- **Computed Properties** — Urgency score, days until due, overdue detection, efficiency ratio
- **Contexts & Projects** — Tag tasks with `#context` and `+project` for filtering
- **Dependencies** — Define blocking relationships between tasks
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
2. Enter a task using natural language (e.g. `Buy groceries tomorrow #errands +shopping !high`).
3. Switch between views using the view selector: **List**, **Kanban**, **Calendar**, or **Agenda**.
4. Click a task to edit its details — status, priority, due date, contexts, projects, notes, etc.
5. Use the timer button to start/stop time tracking, or start a Pomodoro session.
6. Filter tasks by status, priority, context, or project. Sort by title, due date, priority, or urgency score.

### Task File Format

Each task is a `.md` file with YAML frontmatter stored in the configured task folder:

```yaml
---
title: Buy groceries
status: todo
due: "2026-04-10"
priority: medium
contexts: [errands, home]
projects: [shopping]
timeEstimate: 30
timeEntries: []
recurrence: null
completeInstances: []
dependencies: []
created: "2026-04-05T10:00:00Z"
modified: "2026-04-05T10:00:00Z"
---

- Milk
- Bread
- Eggs
```

### Natural Language Syntax

| Token | Meaning | Example |
|-------|---------|---------|
| `#word` | Context | `#errands` |
| `+word` | Project | `+shopping` |
| `!level` | Priority (low/medium/high/urgent) | `!high` |
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
| Pomodoro Duration | Work session length in minutes |
| Pomodoro Break | Break length in minutes |
| Default Calendar Layout | Month, week, or day |

## Plugin API Usage

This plugin uses the following GemiHub Plugin APIs:

- `api.registerView()` — registers the sidebar panel and main view
- `api.registerSettingsTab()` — registers the settings panel
- `api.registerCommand()` — registers commands (create task, open views)
- `api.drive.listFiles/readFile/createFile/updateFile/deleteFile()` — CRUD operations for task Markdown files
- `api.storage.get/set()` — persists plugin settings

## Development

```bash
npm install
npm run dev      # Watch mode
npm run build    # Production build
npm test         # Run tests
```

## License

MIT
