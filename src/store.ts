/**
 * Module-level shared state store (pub/sub).
 * Bridges sidebar (TaskPanel) and main view (MainView) across separate React trees.
 */

import * as React from "react";
import { Task, TaskFilter, TaskSort, TaskNotesSettings, ViewType, CalendarEvent, DEFAULT_SETTINGS } from "./types";

export interface StoreState {
  /** All loaded tasks */
  tasks: Task[];
  /** Currently selected/editing task */
  selectedTask: Task | null;
  /** Current view type */
  currentView: ViewType;
  /** Active filter */
  filter: TaskFilter;
  /** Active sort */
  sort: TaskSort;
  /** Plugin settings */
  settings: TaskNotesSettings;
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Currently running timer task ID */
  timerTaskId: string | null;
  /** Task ID of the file currently open in the main editor */
  activeTaskId: string | null;
  /** Whether Google Calendar API is available */
  calendarAvailable: boolean;
  /** Google Calendar events fetched from the API */
  calendarEvents: CalendarEvent[];
}

type Listener = (state: StoreState) => void;

let state: StoreState = {
  tasks: [],
  selectedTask: null,
  currentView: "list",
  filter: { hideCompleted: true, hideArchived: true },
  sort: { field: "urgencyScore", direction: "desc" },
  settings: DEFAULT_SETTINGS,
  loading: false,
  error: null,
  timerTaskId: null,
  activeTaskId: null,
  calendarAvailable: false,
  calendarEvents: [],
};
const listeners = new Set<Listener>();

export function getState(): StoreState {
  return state;
}

export function setState(partial: Partial<StoreState>): void {
  state = { ...state, ...partial };
  for (const fn of listeners) fn(state);
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Load settings from persistent storage and merge into store */
export async function initSettings(storage: { get(key: string): Promise<unknown>; set(key: string, value: unknown): Promise<void> }): Promise<void> {
  const stored = await storage.get("settings") as import("./types").TaskNotesSettings | null;
  if (stored) {
    setState({ settings: { ...state.settings, ...stored } });
  }
}

/** React hook — subscribes to store changes. */
export function useStore(): StoreState {
  const [snap, setSnap] = React.useState(getState);
  React.useEffect(() => {
    const unsub = subscribe(setSnap);
    setSnap(getState());
    return unsub;
  }, []);
  return snap;
}
