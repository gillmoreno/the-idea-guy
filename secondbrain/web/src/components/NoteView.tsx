"use client";

import { NoteStore } from "@/lib/store";
import { HtmlPageEditor } from "./HtmlPageEditor";
import { NoteEditor } from "./NoteEditor";

interface NoteViewProps {
  noteId: string;
  store: NoteStore;
  onNavigate: (id: string) => void;
  onOpenAiForPage?: () => void;
}

export function NoteView({ noteId, store, onNavigate, onOpenAiForPage }: NoteViewProps) {
  if (store.isHtmlPage(noteId)) {
    return (
      <HtmlPageEditor
        noteId={noteId}
        store={store}
        onOpenAiForPage={onOpenAiForPage}
      />
    );
  }
  return <NoteEditor noteId={noteId} store={store} onNavigate={onNavigate} />;
}
