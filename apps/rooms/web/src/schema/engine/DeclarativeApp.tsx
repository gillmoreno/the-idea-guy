"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { RoomConnecting } from "@/shell/RoomConnecting";
import { RoomLoading } from "@/shell/RoomLoading";
import { TopbarPersona } from "@/shell/TopbarPersona";
import { SyncBadge } from "@/shell/SyncBadge";
import { engineSupportsSchema, ENGINE_VERSION } from "@/schema/migrate";
import { useSchemaStore } from "@/schema/useSchemaStore";
import { DeclarativeSetup } from "./Setup";
import { DeclarativeProfilePicker } from "./ProfilePicker";
import { CollectionView } from "./CollectionView";
import { PeoplePanel } from "./PeoplePanel";
import { TemplateIcon } from "@/components/TemplateIcon";
import { EmptyState } from "@/components/kit";
import { RoomCodeShare } from "@/shell/RoomCodeShare";
import { RoomInviteSettings } from "@/shell/RoomInviteSettings";
import { RoomLocalStorage } from "@/shell/RoomLocalStorage";

export function DeclarativeApp() {
  const {
    mounted,
    roomCode,
    roomSchema,
    hasAdminAccess,
    isOwner,
    sync,
    currentMemberId,
    version,
  } = useRoomSession();
  const store = useSchemaStore();
  void version;

  const emoji = roomSchema?.emoji ?? "📋";
  const name = roomSchema?.name ?? "Room";

  if (!mounted)
    return (
      <RoomLoading
        emoji={emoji}
        accent={roomSchema?.accent}
        message={`Starting ${name}…`}
      />
    );
  if (!roomCode || !sync.localLoaded)
    return (
      <RoomLoading emoji={emoji} accent={roomSchema?.accent} message="Loading your data…" />
    );

  if (!roomSchema) {
    return (
      <div className="centered stack" style={{ textAlign: "center" }}>
        <h1>Schema not found</h1>
        <p className="muted">
          This declarative room has no schema in its synced document yet.
        </p>
      </div>
    );
  }

  if (!engineSupportsSchema(ENGINE_VERSION, roomSchema)) {
    return (
      <div className="centered stack" style={{ textAlign: "center" }}>
        <h1>Update required</h1>
        <p className="muted">
          This room needs a newer version of Rooms. Refresh the app or check for updates.
        </p>
      </div>
    );
  }

  if (!store || !store.isInitialized()) {
    if (isOwner && hasAdminAccess) return <DeclarativeSetup />;
    return (
      <RoomConnecting
        emoji={emoji}
        title={`Connecting to ${name}…`}
        organizerLabel="the organizer"
      />
    );
  }

  if (!currentMemberId || !store.getMember(currentMemberId)) {
    return <DeclarativeProfilePicker />;
  }

  const primaryCollection = roomSchema.collections[0]?.id;

  return (
    <div
      className="app"
      style={
        roomSchema.accent
          ? ({ "--template-accent": roomSchema.accent } as React.CSSProperties)
          : undefined
      }
    >
      <TopbarPersona
        title={store.getBoardName() ?? roomSchema.name}
        trailing={
          <>
            <SyncBadge connected={sync.connected} localLoaded={sync.localLoaded} />
            <TemplateIcon emoji={roomSchema.emoji} size="sm" />
          </>
        }
      />
      <div className="app-main stack">
        {roomSchema.collections.map((col) => (
          <CollectionView
            key={col.id}
            schema={roomSchema}
            collectionId={col.id}
            memberId={currentMemberId}
          />
        ))}
        {!primaryCollection && (
          <EmptyState>This schema has no collections defined.</EmptyState>
        )}

        <PeoplePanel />

        {hasAdminAccess && (
          <div className="card stack" style={{ marginTop: 8 }}>
            <RoomLocalStorage roomCode={roomCode} includeAdmin />
            <RoomInviteSettings
              onReserveMembers={(slots) => {
                for (const slot of slots) {
                  store.addMember({
                    id: slot.slotId,
                    name: slot.name,
                    color: slot.color,
                  });
                }
              }}
            />
            <RoomCodeShare
              roomCode={roomCode}
              hint="Or share the room code for members to join manually."
            />
          </div>
        )}
      </div>
    </div>
  );
}
