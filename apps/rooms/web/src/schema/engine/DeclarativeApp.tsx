"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { RoomConnecting } from "@/shell/RoomConnecting";
import { RoomLoading } from "@/shell/RoomLoading";
import { SyncBadge } from "@/shell/SyncBadge";
import { engineSupportsSchema, ENGINE_VERSION } from "@/schema/migrate";
import { useSchemaStore } from "@/schema/useSchemaStore";
import { DeclarativeSetup } from "./Setup";
import { DeclarativeProfilePicker } from "./ProfilePicker";
import { CollectionView } from "./CollectionView";

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

  if (!mounted) return <RoomLoading emoji={emoji} message={`Starting ${name}…`} />;
  if (!roomCode || !sync.localLoaded) return <RoomLoading emoji={emoji} message="Loading your data…" />;

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
      <div className="topbar">
        <div>
          <h1>{store.getBoardName() ?? roomSchema.name}</h1>
          <div className="sub">
            <SyncBadge connected={sync.connected} localLoaded={sync.localLoaded} />
          </div>
        </div>
        <span className="emoji-orb sm">{roomSchema.emoji}</span>
      </div>
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
          <div className="empty">This schema has no collections defined.</div>
        )}
      </div>
    </div>
  );
}
