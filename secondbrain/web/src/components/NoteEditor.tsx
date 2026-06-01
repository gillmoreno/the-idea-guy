"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Collaboration from "@tiptap/extension-collaboration";
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { NoteStore } from "@/lib/store";
import { Note } from "@/lib/types";

const InternalLink = Link.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      "data-note-id": {
        default: null,
        parseHTML: (el) => el.getAttribute("data-note-id"),
        renderHTML: (attrs) => {
          if (!attrs["data-note-id"]) return {};
          return {
            "data-note-id": attrs["data-note-id"],
            href: `note://${attrs["data-note-id"]}`,
          };
        },
      },
    };
  },
});

interface NoteEditorProps {
  noteId: string;
  store: NoteStore;
  onNavigate: (id: string) => void;
}

export function NoteEditor({ noteId, store, onNavigate }: NoteEditorProps) {
  const note = store.getNote(noteId);
  const [title, setTitle] = useState(note?.title ?? "");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const n = store.getNote(noteId);
    setTitle(n?.title ?? "");
  }, [noteId, store]);

  const debouncedSync = useCallback(
    (html: string) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        store.syncNoteContent(noteId, html);
      }, 400);
    },
    [store, noteId],
  );

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ history: false }),
        InternalLink.configure({
          openOnClick: false,
          HTMLAttributes: { class: "internal-link" },
        }),
        Placeholder.configure({ placeholder: "Start writing… Type [[ to link a note" }),
        Collaboration.configure({
          document: store.doc,
          field: store.contentField(noteId),
        }),
        WikiLinkSuggestion.configure({ store, currentNoteId: noteId, onNavigate }),
      ],
      editorProps: {
        attributes: { class: "tiptap-editor" },
        handleClick: (_view, _pos, event) => {
          const target = event.target as HTMLElement;
          const anchor = target.closest("a[data-note-id]") as HTMLAnchorElement | null;
          if (anchor) {
            const id = anchor.getAttribute("data-note-id");
            if (id) {
              event.preventDefault();
              onNavigate(id);
              return true;
            }
          }
          return false;
        },
      },
      onCreate: ({ editor: ed }) => {
        const n = store.getNote(noteId);
        if (n?.html && n.html !== "<p></p>" && ed.isEmpty) {
          ed.commands.setContent(n.html, false);
        }
      },
      onUpdate: ({ editor: ed }) => {
        debouncedSync(ed.getHTML());
      },
    },
    [noteId],
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (editor) {
        store.syncNoteContent(noteId, editor.getHTML());
      }
    };
  }, [editor, noteId, store]);

  const saveTitle = () => {
    const trimmed = title.trim() || "Untitled";
    setTitle(trimmed);
    store.updateNote(noteId, { title: trimmed });
  };

  if (!note) return null;

  return (
    <div className="editor-pane">
      <input
        className="note-title-input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={saveTitle}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        placeholder="Untitled"
      />
      <EditorContent editor={editor} />
    </div>
  );
}

/** [[ autocomplete — inserts internal links with data-note-id. */
const WikiLinkSuggestion = Extension.create({
  name: "wikiLinkSuggestion",

  addOptions() {
    return {
      store: null as NoteStore | null,
      currentNoteId: "",
      onNavigate: (_id: string) => {},
    };
  },

  addProseMirrorPlugins() {
    const store = this.options.store as NoteStore;
    const currentNoteId = this.options.currentNoteId as string;
    const onNavigate = this.options.onNavigate as (id: string) => void;
    const key = new PluginKey("wikiLinkSuggestion");

    return [
      new Plugin({
        key,
        props: {
          handleKeyDown(view, event) {
            if (event.key !== "[") return false;
            const { state } = view;
            const { $from } = state.selection;
            const textBefore = $from.parent.textBetween(
              Math.max(0, $from.parentOffset - 1),
              $from.parentOffset,
              undefined,
              "\ufffc",
            );
            if (textBefore !== "[") return false;

            event.preventDefault();
            const notes = store.listNotes().filter((n) => n.id !== currentNoteId);
            if (notes.length === 0) return true;

            showPicker(notes, (selected: Note) => {
              const from = $from.pos - 1;
              const to = $from.pos + 1;
              const text = selected.title || "Untitled";
              const linkMark = state.schema.marks.link?.create({
                href: `note://${selected.id}`,
                "data-note-id": selected.id,
              });
              if (linkMark) {
                view.dispatch(
                  state.tr
                    .delete(from, to)
                    .insertText(text, from)
                    .addMark(from, from + text.length, linkMark),
                );
              } else {
                view.dispatch(state.tr.delete(from, to).insertText(text, from));
              }
            });
            return true;
          },
        },
      }),
    ];
  },
});

function showPicker(notes: Note[], onSelect: (n: Note) => void) {
  const overlay = document.createElement("div");
  overlay.className = "wiki-picker-overlay";
  const panel = document.createElement("div");
  panel.className = "wiki-picker";
  panel.innerHTML = `<div class="wiki-picker-title">Link to note</div>`;

  const input = document.createElement("input");
  input.className = "input";
  input.placeholder = "Search notes…";
  panel.appendChild(input);

  const list = document.createElement("div");
  list.className = "wiki-picker-list";
  panel.appendChild(list);

  const render = (filter = "") => {
    list.innerHTML = "";
    const q = filter.toLowerCase();
    const items = notes.filter(
      (n) =>
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.plainText.toLowerCase().includes(q),
    );
    for (const n of items.slice(0, 8)) {
      const btn = document.createElement("button");
      btn.className = "wiki-picker-item";
      btn.textContent = n.title || "Untitled";
      btn.onclick = () => {
        cleanup();
        onSelect(n);
      };
      list.appendChild(btn);
    }
    if (items.length === 0) {
      list.innerHTML = '<div class="muted" style="padding:8px">No matches</div>';
    }
  };

  render();
  input.oninput = () => render(input.value);
  input.onkeydown = (e) => {
    if (e.key === "Escape") cleanup();
  };

  overlay.onclick = (e) => {
    if (e.target === overlay) cleanup();
  };

  function cleanup() {
    overlay.remove();
  }

  overlay.appendChild(panel);
  document.body.appendChild(overlay);
  input.focus();
}
