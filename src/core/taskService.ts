/**
 * Task CRUD service — manages tasks as Markdown files via the GemiHub Drive API.
 */

import { Task, TaskFilter, TaskSort, PRIORITY_VALUES } from "../types";
import { parseTask, serializeTask, createDefaultTask } from "./taskSerializer";
import { computeFormulas } from "./formulas";
import { getNextOccurrence } from "./recurrence";

export interface DriveAPI {
  createFile(name: string, content: string): Promise<{ id: string; name: string }>;
  updateFile(id: string, content: string): Promise<void>;
  readFile(id: string): Promise<string>;
  listFiles(folder?: string): Promise<Array<{ id: string; name: string }>>;
  deleteFile?(id: string): Promise<void>;
}

export interface StorageAPI {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
}

export class TaskService {
  private drive: DriveAPI;
  private storage: StorageAPI;
  private taskFolder: string;
  /** Cached tasks keyed by id */
  private cache: Map<string, { task: Task; fileId: string }> = new Map();

  constructor(drive: DriveAPI, storage: StorageAPI, taskFolder: string) {
    this.drive = drive;
    this.storage = storage;
    this.taskFolder = taskFolder;
  }

  /** Load all tasks from the task folder */
  async loadAll(): Promise<Task[]> {
    const files = await this.drive.listFiles(this.taskFolder);
    const tasks: Task[] = [];

    for (const file of files) {
      if (!file.name.endsWith(".md")) continue;
      try {
        const content = await this.drive.readFile(file.id);
        const id = file.name.replace(/\.md$/, "");
        const task = parseTask(id, content);
        this.cache.set(id, { task, fileId: file.id });
        tasks.push(task);
      } catch {
        // Skip unreadable files
      }
    }

    return tasks;
  }

  /** Create a new task */
  async create(task: Task): Promise<Task> {
    const content = serializeTask(task);
    const fileName = `${this.taskFolder}/${task.id}.md`;
    const file = await this.drive.createFile(fileName, content);
    this.cache.set(task.id, { task, fileId: file.id });
    return task;
  }

  /** Update an existing task */
  async update(task: Task): Promise<Task> {
    const updated = { ...task, modifiedDate: new Date().toISOString() };
    const content = serializeTask(updated);
    const cached = this.cache.get(task.id);
    if (cached) {
      await this.drive.updateFile(cached.fileId, content);
      this.cache.set(task.id, { task: updated, fileId: cached.fileId });
    }
    return updated;
  }

  /** Delete a task */
  async delete(taskId: string): Promise<void> {
    const cached = this.cache.get(taskId);
    if (cached && this.drive.deleteFile) {
      await this.drive.deleteFile(cached.fileId);
      this.cache.delete(taskId);
    }
  }

  /** Complete a task (handle recurrence) */
  async complete(taskId: string): Promise<Task | null> {
    const cached = this.cache.get(taskId);
    if (!cached) return null;

    let task = { ...cached.task };
    const today = new Date().toISOString().slice(0, 10);

    if (task.recurrence) {
      task.complete_instances = [...task.complete_instances, today];
      const baseDate = task.recurrence.recurrenceAnchor === "completion" ? today : (task.due || today);
      const nextDue = getNextOccurrence(task.recurrence, baseDate);
      if (nextDue) {
        task.due = nextDue;
        task.status = "todo";
      } else {
        task.status = "done";
        task.completedDate = new Date().toISOString();
      }
    } else {
      task.status = "done";
      task.completedDate = new Date().toISOString();
    }

    return this.update(task);
  }

  /** Skip a recurring task instance — add to skipped_instances and advance to next occurrence */
  async skip(taskId: string): Promise<Task | null> {
    const cached = this.cache.get(taskId);
    if (!cached) return null;

    let task = { ...cached.task };
    if (!task.recurrence) return null;

    const today = new Date().toISOString().slice(0, 10);
    task.skipped_instances = [...task.skipped_instances, today];
    const baseDate = task.recurrence.recurrenceAnchor === "completion" ? today : (task.due || today);
    const nextDue = getNextOccurrence(task.recurrence, baseDate);
    if (nextDue) {
      task.due = nextDue;
    } else {
      task.due = null;
    }

    return this.update(task);
  }

  /** Get a task by ID */
  get(taskId: string): Task | null {
    return this.cache.get(taskId)?.task ?? null;
  }

  /** Get the Drive file ID for a task */
  getFileId(taskId: string): string | null {
    return this.cache.get(taskId)?.fileId ?? null;
  }

  /** Get the task ID for a Drive file ID */
  getTaskIdByFileId(fileId: string): string | null {
    for (const [id, entry] of this.cache) {
      if (entry.fileId === fileId) return id;
    }
    return null;
  }

  /** Filter and sort tasks */
  query(tasks: Task[], filter: TaskFilter, sort: TaskSort): Task[] {
    let result = tasks;

    if (filter.hideCompleted) {
      result = result.filter((t) => t.status !== "done" && t.status !== "cancelled");
    }
    if (filter.status && filter.status.length > 0) {
      result = result.filter((t) => filter.status!.includes(t.status));
    }
    if (filter.priority && filter.priority.length > 0) {
      result = result.filter((t) => filter.priority!.includes(t.priority));
    }
    if (filter.contexts && filter.contexts.length > 0) {
      result = result.filter((t) => t.contexts.some((c) => filter.contexts!.includes(c)));
    }
    if (filter.projects && filter.projects.length > 0) {
      result = result.filter((t) => t.projects.some((p) => filter.projects!.includes(p)));
    }
    if (filter.dueBefore) {
      result = result.filter((t) => t.due && t.due <= filter.dueBefore!);
    }
    if (filter.dueAfter) {
      result = result.filter((t) => t.due && t.due >= filter.dueAfter!);
    }
    if (filter.tags && filter.tags.length > 0) {
      result = result.filter((t) => t.tags.some((tag) => filter.tags!.includes(tag)));
    }
    if (filter.hideArchived) {
      result = result.filter((t) => !t.archived);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.body.toLowerCase().includes(q) ||
          t.contexts.some((c) => c.toLowerCase().includes(q)) ||
          t.projects.some((p) => p.toLowerCase().includes(q)),
      );
    }

    result = [...result].sort((a, b) => {
      const dir = sort.direction === "asc" ? 1 : -1;
      switch (sort.field) {
        case "title":
          return a.title.localeCompare(b.title) * dir;
        case "due": {
          if (!a.due && !b.due) return 0;
          if (!a.due) return 1;
          if (!b.due) return -1;
          return a.due.localeCompare(b.due) * dir;
        }
        case "priority":
          return (PRIORITY_VALUES[a.priority] - PRIORITY_VALUES[b.priority]) * dir;
        case "status":
          return a.status.localeCompare(b.status) * dir;
        case "createdDate":
          return a.createdDate.localeCompare(b.createdDate) * dir;
        case "scheduled": {
          if (!a.scheduled && !b.scheduled) return 0;
          if (!a.scheduled) return 1;
          if (!b.scheduled) return -1;
          return a.scheduled.localeCompare(b.scheduled) * dir;
        }
        case "urgencyScore": {
          const aScore = computeFormulas(a).urgencyScore;
          const bScore = computeFormulas(b).urgencyScore;
          return (aScore - bScore) * dir;
        }
        default:
          return 0;
      }
    });

    return result;
  }

  /** Get all unique contexts across all tasks */
  getAllContexts(tasks: Task[]): string[] {
    const set = new Set<string>();
    for (const t of tasks) for (const c of t.contexts) set.add(c);
    return [...set].sort();
  }

  /** Get all unique projects across all tasks */
  getAllProjects(tasks: Task[]): string[] {
    const set = new Set<string>();
    for (const t of tasks) for (const p of t.projects) set.add(p);
    return [...set].sort();
  }
}
