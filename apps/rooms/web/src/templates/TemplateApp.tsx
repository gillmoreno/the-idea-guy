"use client";

import { Suspense, lazy } from "react";
import { loadVault } from "@the-idea-guy/room-kit";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { RoomDeleted } from "@/shell/RoomDeleted";
import { RoomLoading } from "@/shell/RoomLoading";
import { RoomTypePending } from "@/shell/RoomTypePending";
import { inferTemplateFromDoc, resolveRoomType } from "@/shell/resolveRoomType";
import { DeclarativeApp } from "@/schema/engine/DeclarativeApp";
import { getBuiltinTemplate, isBuiltinTemplateId } from "./registry";

const ChoreBoardApp = lazy(() =>
  import("./choreboard/ChoreBoardApp").then((m) => ({ default: m.ChoreBoardApp })),
);
const TripSplitApp = lazy(() =>
  import("./tripsplit/TripSplitApp").then((m) => ({ default: m.TripSplitApp })),
);
const BookClubApp = lazy(() =>
  import("./bookclub/BookClubApp").then((m) => ({ default: m.BookClubApp })),
);
const BacklogApp = lazy(() =>
  import("./backlog/BacklogApp").then((m) => ({ default: m.BacklogApp })),
);
const FitCrewApp = lazy(() =>
  import("./fitcrew/FitCrewApp").then((m) => ({ default: m.FitCrewApp })),
);
const RoomLedgerApp = lazy(() =>
  import("./roomledger/RoomLedgerApp").then((m) => ({ default: m.RoomLedgerApp })),
);
const WhosInApp = lazy(() =>
  import("./whosin/WhosInApp").then((m) => ({ default: m.WhosInApp })),
);

function UnknownTemplate({ templateId }: { templateId: string }) {
  return (
    <div className="centered stack" style={{ textAlign: "center" }}>
      <h1>Unknown room type</h1>
      <p className="muted">
        This room uses template <code>{templateId}</code>, which is not installed in this app
        version.
      </p>
      <a className="btn btn-primary" href="/">
        Home
      </a>
    </div>
  );
}

function BuiltinLoader({ templateId }: { templateId: string }) {
  const def = getBuiltinTemplate(templateId);
  const emoji = def?.emoji ?? "📦";
  const name = def?.name ?? "room";

  const App = (() => {
    switch (templateId) {
      case "choreboard":
        return ChoreBoardApp;
      case "tripsplit":
        return TripSplitApp;
      case "bookclub":
        return BookClubApp;
      case "backlog":
        return BacklogApp;
      case "fitcrew":
        return FitCrewApp;
      case "roomledger":
        return RoomLedgerApp;
      case "whosin":
        return WhosInApp;
      default:
        return null;
    }
  })();

  if (!App) return <UnknownTemplate templateId={templateId} />;

  return (
    <Suspense
      fallback={
        <RoomLoading
          emoji={emoji}
          accent={def?.accent}
          message={`Loading ${name}…`}
        />
      }
    >
      <App />
    </Suspense>
  );
}

export function TemplateApp() {
  const { mounted, roomCode, templateKind, templateId, roomMeta, docs, sync } =
    useRoomSession();

  if (!mounted) return <RoomLoading emoji="🏠" message="Starting Rooms…" />;
  if (!sync.localLoaded) return <RoomLoading emoji="🏠" message="Loading your data…" />;
  if (roomMeta?.deletedAt) return <RoomDeleted />;

  const vaultRoom = roomCode ? loadVault().rooms[roomCode] ?? null : null;
  const inferred = docs ? inferTemplateFromDoc(docs.publicDoc) : null;
  const resolved = resolveRoomType({
    roomMeta,
    vaultRoom,
    vaultTemplateId: templateId,
    vaultTemplateKind: templateKind,
    inferredId: inferred,
  });

  if (
    resolved.templateKind === "declarative" ||
    resolved.templateId === "declarative"
  ) {
    return <DeclarativeApp />;
  }

  if (resolved.isPending) {
    return <RoomTypePending />;
  }

  if (!isBuiltinTemplateId(resolved.templateId)) {
    return <UnknownTemplate templateId={resolved.templateId} />;
  }

  return <BuiltinLoader templateId={resolved.templateId} />;
}
