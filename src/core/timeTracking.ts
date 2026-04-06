/**
 * Time tracking & Pomodoro timer utilities.
 */

import { Task, TimeEntry } from "../types";

/** Start a time tracking session on a task */
export function startTimer(task: Task): Task {
  // If there's already a running entry, don't start another
  if (hasRunningTimer(task)) return task;

  const entry: TimeEntry = {
    start: new Date().toISOString(),
    end: null,
  };

  return {
    ...task,
    timeEntries: [...task.timeEntries, entry],
    modifiedDate: new Date().toISOString(),
  };
}

/** Stop the current running timer on a task */
export function stopTimer(task: Task): Task {
  if (!hasRunningTimer(task)) return task;

  const entries = task.timeEntries.map((entry) => {
    if (entry.end === null) {
      return { ...entry, end: new Date().toISOString() };
    }
    return entry;
  });

  return {
    ...task,
    timeEntries: entries,
    modifiedDate: new Date().toISOString(),
  };
}

/** Check if a task has a running timer */
export function hasRunningTimer(task: Task): boolean {
  return task.timeEntries.some((entry) => entry.end === null);
}

/** Get elapsed time of current running entry in seconds */
export function getRunningElapsed(task: Task): number {
  const running = task.timeEntries.find((entry) => entry.end === null);
  if (!running) return 0;
  return Math.floor((Date.now() - new Date(running.start).getTime()) / 1000);
}

/** Format seconds as "Xh Ym" or "Ym Zs" */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    const secs = seconds % 60;
    return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/** Format total minutes for display */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// --- Pomodoro ---

export interface PomodoroState {
  isRunning: boolean;
  isBreak: boolean;
  /** Remaining seconds */
  remaining: number;
  /** Number of completed pomodoros in this session */
  completedCount: number;
}

export function createPomodoroState(durationMinutes: number): PomodoroState {
  return {
    isRunning: false,
    isBreak: false,
    remaining: durationMinutes * 60,
    completedCount: 0,
  };
}

/** Tick the pomodoro timer by one second. Returns new state + whether it just finished. */
export function tickPomodoro(
  state: PomodoroState,
  workDuration: number,
  breakDuration: number,
): { state: PomodoroState; justFinished: boolean } {
  if (!state.isRunning || state.remaining <= 0) {
    if (state.remaining <= 0 && state.isRunning) {
      // Timer just expired
      if (state.isBreak) {
        // Break over, start new work session
        return {
          state: { ...state, isBreak: false, remaining: workDuration * 60, isRunning: false },
          justFinished: true,
        };
      } else {
        // Work over, start break
        return {
          state: {
            ...state,
            isBreak: true,
            remaining: breakDuration * 60,
            isRunning: false,
            completedCount: state.completedCount + 1,
          },
          justFinished: true,
        };
      }
    }
    return { state, justFinished: false };
  }

  return {
    state: { ...state, remaining: state.remaining - 1 },
    justFinished: false,
  };
}
