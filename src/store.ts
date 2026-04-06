/**
 * Module-level shared state store (pub/sub).
 * Bridges sidebar (TaskPanel) and main view (MainView) across separate React trees.
 */

import * as React from "react";
import { Task, TaskFilter, TaskSort, TaskNotesSettings, ViewType, DEFAULT_SETTINGS } from "./types";
import { PomodoroState } from "./core/timeTracking";

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
  /** Pomodoro timer state */
  pomodoro: PomodoroState | null;
  /** Currently running timer task ID */
  timerTaskId: string | null;
  /** Task ID of the file currently open in the main editor */
  activeTaskId: string | null;
}

type Listener = (state: StoreState) => void;

let state: StoreState = {
  tasks: [],
  selectedTask: null,
  currentView: "list",
  filter: { hideCompleted: true },
  sort: { field: "urgencyScore", direction: "desc" },
  settings: DEFAULT_SETTINGS,
  loading: false,
  error: null,
  pomodoro: null,
  timerTaskId: null,
  activeTaskId: null,
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
