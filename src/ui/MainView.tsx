/**
 * MainView — renders the full-screen task view when a .tasknotes file is opened.
 */

import * as React from "react";
import { TaskPanel } from "./TaskPanel";

interface MainViewProps {
  api: unknown;
  locale?: string;
}

export function MainView({ api, locale }: MainViewProps) {
  return (
    <div className="tn-main-view">
      <TaskPanel api={api as any} locale={locale} />
    </div>
  );
}
