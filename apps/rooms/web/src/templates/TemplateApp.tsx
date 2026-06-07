"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { BacklogApp } from "@/templates/backlog/BacklogApp";
import { BookClubApp } from "@/templates/bookclub/BookClubApp";
import { ChoreBoardApp } from "@/templates/choreboard/ChoreBoardApp";
import { TripSplitApp } from "@/templates/tripsplit/TripSplitApp";

export function TemplateApp() {
  const { templateId } = useRoomSession();

  if (templateId === "tripsplit") return <TripSplitApp />;
  if (templateId === "bookclub") return <BookClubApp />;
  if (templateId === "backlog") return <BacklogApp />;
  return <ChoreBoardApp />;
}
