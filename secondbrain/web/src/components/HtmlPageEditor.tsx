"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bot, Clock, Code, Eye, HardDrive, Pencil } from "lucide-react";
import { buildHtmlPageSrcDoc } from "@/lib/htmlPageDefaults";
import { NoteStore } from "@/lib/store";
import { formatBytes, noteStorageBytes } from "@/lib/storageStats";
import { useSecondBrain } from "@/lib/SecondBrainContext";

interface HtmlPageEditorProps {
  noteId: string;
  store: NoteStore;
  onOpenAiForPage?: () => void;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function HtmlPageEditor({ noteId, store, onOpenAiForPage }: HtmlPageEditorProps) {
  const { version, refreshSearch } = useSecondBrain();
  void version;

  const note = store.getNote(noteId);
  const [title, setTitle] = useState(note?.title ?? "");
  const [editing, setEditing] = useState(false);
  const [draftHtml, setDraftHtml] = useState(note?.pageHtml ?? "");
  const [draftCss, setDraftCss] = useState(note?.pageCss ?? "");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const n = store.getNote(noteId);
    if (!n) return;
    setTitle(n.title);
    if (!editing) {
      setDraftHtml(n.pageHtml ?? "");
      setDraftCss(n.pageCss ?? "");
    }
  }, [noteId, store, version, editing]);

  const pageHtml = editing ? draftHtml : (note?.pageHtml ?? "");
  const pageCss = editing ? draftCss : (note?.pageCss ?? "");
  const srcDoc = useMemo(() => buildHtmlPageSrcDoc(pageHtml, pageCss), [pageHtml, pageCss]);

  const persist = useCallback(
    (html: string, css: string) => {
      store.syncHtmlPageContent(noteId, html, css);
      refreshSearch();
    },
    [store, noteId, refreshSearch],
  );

  const debouncedPersist = useCallback(
    (html: string, css: string) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => persist(html, css), 500);
    },
    [persist],
  );

  const saveTitle = () => {
    const trimmed = title.trim() || "Untitled page";
    setTitle(trimmed);
    store.updateNote(noteId, { title: trimmed });
  };

  const applyCode = () => {
    persist(draftHtml, draftCss);
    setEditing(false);
  };

  if (!note) return null;

  const bytes = noteStorageBytes({
    ...note,
    title,
    plainText: note.plainText,
    html: pageHtml,
  });

  return (
    <div className="editor-shell editor-shell-html">
      <div className="html-page-paper">
        <div className="html-page-toolbar">
          <span className="html-page-badge">
            <Code size={13} />
            HTML page
          </span>
          <div className="html-page-toolbar-actions">
            {!editing ? (
              <button type="button" className="pill-btn" onClick={() => setEditing(true)}>
                <Pencil size={13} />
                Edit code
              </button>
            ) : (
              <>
                <button type="button" className="pill-btn" onClick={applyCode}>
                  <Eye size={13} />
                  Apply
                </button>
                <button
                  type="button"
                  className="pill-btn"
                  onClick={() => {
                    setDraftHtml(note.pageHtml ?? "");
                    setDraftCss(note.pageCss ?? "");
                    setEditing(false);
                  }}
                >
                  Cancel
                </button>
              </>
            )}
            {onOpenAiForPage && (
              <button
                type="button"
                className="pill-btn btn-primary-soft"
                onClick={onOpenAiForPage}
              >
                <Bot size={13} />
                AI generate page
              </button>
            )}
          </div>
        </div>

        <div className="html-page-meta">
          <input
            className="html-page-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            placeholder="Page title (vault label)"
          />
          <div className="html-page-meta-row">
            <Clock size={12} />
            <span>{formatDate(note.updatedAt)}</span>
            <span>·</span>
            <HardDrive size={12} />
            <span>{formatBytes(bytes)}</span>
          </div>
        </div>

        {editing && (
          <div className="html-page-code-pane">
            <label className="html-block-field">
              <span>HTML (body)</span>
              <textarea
                className="input html-page-code"
                value={draftHtml}
                onChange={(e) => {
                  setDraftHtml(e.target.value);
                  debouncedPersist(e.target.value, draftCss);
                }}
                spellCheck={false}
              />
            </label>
            <label className="html-block-field">
              <span>CSS</span>
              <textarea
                className="input html-page-code"
                value={draftCss}
                onChange={(e) => {
                  setDraftCss(e.target.value);
                  debouncedPersist(draftHtml, e.target.value);
                }}
                spellCheck={false}
              />
            </label>
          </div>
        )}

        <div className="html-page-preview">
          <iframe
            className="html-page-frame"
            title={title}
            sandbox=""
            srcDoc={srcDoc}
          />
        </div>
      </div>
    </div>
  );
}
