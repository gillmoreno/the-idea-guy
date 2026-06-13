"use client";

import { useEffect, useId, useRef } from "react";

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  icon,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  icon?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const messageId = useId();

  // Keep the latest onCancel without re-running the focus effect on every render
  // (consumers pass inline arrows), so focus is captured/restored only on open↔close.
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusables = () => {
      const card = cardRef.current;
      if (!card) return [] as HTMLElement[];
      return Array.from(
        card.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute("disabled"));
    };

    // Move focus into the dialog. The first control is Cancel — the safe default,
    // so a stray Enter never triggers a destructive confirm.
    (focusables()[0] ?? cardRef.current)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancelRef.current();
        return;
      }
      if (e.key === "Tab") {
        const els = focusables();
        if (els.length === 0) return;
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      // Restore focus to whatever opened the modal.
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const defaultIcon = variant === "danger" ? "⚠️" : "✓";

  return (
    <div className="modal-overlay" role="presentation" onClick={onCancel}>
      <div
        ref={cardRef}
        className={`modal-card modal-${variant}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`modal-icon ${variant === "danger" ? "danger" : ""}`} aria-hidden>
          {icon ?? defaultIcon}
        </div>
        <h2 id={titleId} className="modal-title">
          {title}
        </h2>
        <div id={messageId} className="modal-message">
          {message}
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost btn-block" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`btn btn-block ${variant === "danger" ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
