"use client";

import type { ReactNode } from "react";

/** Standard tab row below {@link TopbarPersona} — shared padding and gap across room apps. */
export function AppTabBar({ children }: { children: ReactNode }) {
  return (
    <div className="app-tab-bar">
      <div className="tabs" role="tablist">
        {children}
      </div>
    </div>
  );
}
