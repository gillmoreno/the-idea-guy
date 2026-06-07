"use client";

import { useEffect } from "react";

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
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onCancel]);

  if (!open) return null;

  const defaultIcon = variant === "danger" ? "⚠️" : "✓";

  return (
    <div className="modal-overlay" role="presentation" onClick={onCancel}>
      <div
        className={`modal-card modal-${variant}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`modal-icon ${variant === "danger" ? "danger" : ""}`}>
          {icon ?? defaultIcon}
        </div>
        <h2 id="modal-title" className="modal-title">
          {title}
        </h2>
        <div className="modal-message">{message}</div>
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
