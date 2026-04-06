/**
 * TaskNotes - Task Management Plugin for GemiHub
 *
 * Each task is a Markdown file with YAML frontmatter, stored via the Drive API.
 * Local-first: all operations go through IndexedDB, synced to Drive via push/pull.
 * Views: Task List, Kanban, Calendar, Agenda.
 */

import { TaskPanel } from "./ui/TaskPanel";
import { SettingsPanel } from "./ui/SettingsPanel";

interface PluginAPI {
  registerView(view: {
    id: string;
    name: string;
    icon?: string;
    location: "sidebar" | "main";
    extensions?: string[];
    component: unknown;
  }): void;
  registerSettingsTab(tab: {
    component: unknown;
  }): void;
  storage: {
    get(key: string): Promise<unknown>;
    set(key: string, value: unknown): Promise<void>;
  };
  drive: {
    createFile(name: string, content: string): Promise<{ id: string; name: string }>;
    updateFile(id: string, content: string): Promise<void>;
    readFile(id: string): Promise<string>;
    listFiles(folder?: string): Promise<Array<{ id: string; name: string }>>;
  };
  calendar?: {
    listEvents(options?: {
      timeMin?: string;
      timeMax?: string;
      query?: string;
      maxResults?: number;
      calendarId?: string;
    }): Promise<
      Array<{
        id: string;
        summary: string;
        description?: string;
        start: string;
        end: string;
        location?: string;
        status?: string;
        htmlLink?: string;
      }>
    >;
    createEvent(event: {
      summary: string;
      start: string;
      end: string;
      description?: string;
      location?: string;
      calendarId?: string;
    }): Promise<{ eventId: string; htmlLink: string }>;
    updateEvent(
      eventId: string,
      event: {
        summary?: string;
        start?: string;
        end?: string;
        description?: string;
        location?: string;
        calendarId?: string;
      }
    ): Promise<{ eventId: string; htmlLink: string }>;
    deleteEvent(eventId: string, calendarId?: string): Promise<void>;
  };
  onActiveFileChanged(
    callback: (detail: { fileId: string | null; fileName: string | null; mimeType: string | null }) => void
  ): () => void;
}

class TaskNotesPlugin {
  onload(api: PluginAPI): void {
    // Sidebar panel — primary task management interface
    api.registerView({
      id: "tasknotes",
      name: "TaskNotes",
      icon: "check-square",
      location: "sidebar",
      component: TaskPanel,
    });

    // Settings tab
    api.registerSettingsTab({
      component: SettingsPanel,
    });
  }

  onunload(): void {
    // cleanup handled by host
  }
}

module.exports = TaskNotesPlugin;
