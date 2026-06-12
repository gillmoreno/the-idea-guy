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
const DoseLogApp = lazy(() =>
  import("./doselog/DoseLogApp").then((m) => ({ default: m.DoseLogApp })),
);
const CarpoolApp = lazy(() =>
  import("./carpool/CarpoolApp").then((m) => ({ default: m.CarpoolApp })),
);
const GameNightApp = lazy(() =>
  import("./gamenight/GameNightApp").then((m) => ({ default: m.GameNightApp })),
);
const CareCircleApp = lazy(() =>
  import("./carecircle/CareCircleApp").then((m) => ({ default: m.CareCircleApp })),
);
const CabinCalApp = lazy(() =>
  import("./cabincal/CabinCalApp").then((m) => ({ default: m.CabinCalApp })),
);
const BracketApp = lazy(() =>
  import("./bracket/BracketApp").then((m) => ({ default: m.BracketApp })),
);
const CarLogApp = lazy(() =>
  import("./carlog/CarLogApp").then((m) => ({ default: m.CarLogApp })),
);
const CoParentApp = lazy(() =>
  import("./coparent/CoParentApp").then((m) => ({ default: m.CoParentApp })),
);
const GroupFundApp = lazy(() =>
  import("./groupfund/GroupFundApp").then((m) => ({ default: m.GroupFundApp })),
);
const SitCoopApp = lazy(() =>
  import("./sitcoop/SitCoopApp").then((m) => ({ default: m.SitCoopApp })),
);
const SupperClubApp = lazy(() =>
  import("./supperclub/SupperClubApp").then((m) => ({ default: m.SupperClubApp })),
);
const SymptomDiaryApp = lazy(() =>
  import("./symptomdiary/SymptomDiaryApp").then((m) => ({ default: m.SymptomDiaryApp })),
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
      case "doselog":
        return DoseLogApp;
      case "carpool":
        return CarpoolApp;
      case "gamenight":
        return GameNightApp;
      case "carecircle":
        return CareCircleApp;
      case "cabincal":
        return CabinCalApp;
      case "bracket":
        return BracketApp;
      case "carlog":
        return CarLogApp;
      case "coparent":
        return CoParentApp;
      case "groupfund":
        return GroupFundApp;
      case "sitcoop":
        return SitCoopApp;
      case "supperclub":
        return SupperClubApp;
      case "symptomdiary":
        return SymptomDiaryApp;
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
