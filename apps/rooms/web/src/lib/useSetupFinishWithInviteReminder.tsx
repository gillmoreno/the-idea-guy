"use client";

import { useCallback, useState } from "react";
import { ConfirmModal } from "@/components/ConfirmModal";

/**
 * Setup finish flow — invites are never required. When invitedCount is below
 * suggestedMinContacts, show a soft reminder before continuing.
 */
export function useSetupFinishWithInviteReminder({
  invitedCount,
  suggestedMinContacts = 0,
  canFinish,
  onFinish,
  memberLabel = "members",
}: {
  invitedCount: number;
  /** Suggested invite count — triggers a reminder modal, never blocks. */
  suggestedMinContacts?: number;
  canFinish: boolean;
  onFinish: () => void | Promise<void>;
  memberLabel?: string;
}) {
  const [showReminder, setShowReminder] = useState(false);

  const requestFinish = useCallback(() => {
    if (!canFinish) return;
    if (suggestedMinContacts > 0 && invitedCount < suggestedMinContacts) {
      setShowReminder(true);
      return;
    }
    void onFinish();
  }, [canFinish, suggestedMinContacts, invitedCount, onFinish]);

  const confirmFinish = useCallback(() => {
    setShowReminder(false);
    void onFinish();
  }, [onFinish]);

  const cancelReminder = useCallback(() => setShowReminder(false), []);

  const reminderModal = (
    <ConfirmModal
      open={showReminder}
      icon="👋"
      title="No invites yet"
      message={
        <>
          You haven&apos;t invited anyone yet. You can add {memberLabel} later from room settings.
        </>
      }
      cancelLabel="Go back"
      confirmLabel="Continue anyway"
      onConfirm={confirmFinish}
      onCancel={cancelReminder}
    />
  );

  return { requestFinish, reminderModal };
}
