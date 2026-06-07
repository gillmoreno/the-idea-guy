"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { RoomInviteRecord } from "@the-idea-guy/room-kit";
import { roomUrl } from "@the-idea-guy/room-kit/links";
import { getBuiltinTemplate } from "@/templates/registry";
import { TemplateIcon } from "@/components/TemplateIcon";
import { DECLARATIVE_TEMPLATE_ID } from "@the-idea-guy/room-kit";
import { usePersonaContacts } from "@/shell/PersonaContactsProvider";

function inviteEmoji(templateId: string): string {
  if (templateId === DECLARATIVE_TEMPLATE_ID) return "📋";
  return getBuiltinTemplate(templateId)?.emoji ?? "🏠";
}

function InviteCard({
  invite,
  onAccept,
  onDecline,
  busy,
}: {
  invite: RoomInviteRecord;
  onAccept: (id: string) => Promise<string | null>;
  onDecline: (id: string) => void;
  busy: string | null;
}) {
  const router = useRouter();
  const working = busy === invite.messageId;
  const builtin = getBuiltinTemplate(invite.templateId);

  return (
    <div className="card room-invite-card row gap-sm" style={{ alignItems: "center" }}>
      <TemplateIcon
        emoji={inviteEmoji(invite.templateId)}
        size="sm"
        style={
          builtin?.accent
            ? ({ "--template-accent": builtin.accent } as React.CSSProperties)
            : undefined
        }
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <strong>{invite.fromName}</strong>
        <div style={{ fontSize: 14 }}>
          invited you to <strong>{invite.roomName}</strong>
        </div>
      </div>
      <div className="row gap-sm" style={{ flexShrink: 0 }}>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={!!busy}
          onClick={() => onDecline(invite.messageId)}
        >
          Decline
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={!!busy}
          onClick={() =>
            void onAccept(invite.messageId).then((code) => {
              if (code) router.push(roomUrl(code));
            })
          }
        >
          {working ? "Joining…" : "Accept"}
        </button>
      </div>
    </div>
  );
}

/** Pending room invites — show on home when the user opens the app. */
export function RoomInvitesBanner({ compact = false }: { compact?: boolean }) {
  const { pendingRoomInvites, acceptRoomInvite, declineRoomInvite } = usePersonaContacts();
  const [busy, setBusy] = useState<string | null>(null);

  if (pendingRoomInvites.length === 0) return null;

  const accept = async (messageId: string) => {
    setBusy(messageId);
    try {
      return await acceptRoomInvite(messageId);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="stack-sm">
      <div className="section-title">
        Room invitations{pendingRoomInvites.length > 1 ? ` (${pendingRoomInvites.length})` : ""}
      </div>
      {!compact && (
        <p className="muted" style={{ fontSize: 13, margin: 0 }}>
          Accept to join with your persona — no profile picker needed.
        </p>
      )}
      {pendingRoomInvites.map((invite) => (
        <InviteCard
          key={invite.messageId}
          invite={invite}
          busy={busy}
          onAccept={accept}
          onDecline={declineRoomInvite}
        />
      ))}
    </div>
  );
}
