"use client";

import type { ReactNode } from "react";

/** Fixed bottom tab bar — use when a template has 3–5 primary sections. */
export function BottomNav({ children }: { children: ReactNode }) {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {children}
    </nav>
  );
}

export function BottomNavItem({
  icon,
  label,
  active,
  badge,
  onClick,
}: {
  icon: string;
  label: string;
  active: boolean;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={active ? "active" : undefined}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
    >
      <span className="bottom-nav__icon-wrap">
        <span className="ico" aria-hidden>
          {icon}
        </span>
        {badge != null && badge > 0 ? (
          <span className="bottom-nav__badge" aria-label={`${badge} pending`}>
            {badge}
          </span>
        ) : null}
      </span>
      <span className="bottom-nav__label">{label}</span>
    </button>
  );
}
