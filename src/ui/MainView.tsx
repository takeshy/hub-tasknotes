/**
 * MainView — renders the full-screen task view when a .tasknotes file is opened.
 */

import * as React from "react";
import { TaskPanel } from "./TaskPanel";

interface MainViewProps {
  api: unknown;
  language?: string;
}

export function MainView({ api, language }: MainViewProps) {
  return (
    <div className="tn-main-view">
      <TaskPanel api={api as any} language={language} />
    </div>
  );
}
