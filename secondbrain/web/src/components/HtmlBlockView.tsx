"use client";

import { useMemo, useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { Code, Eye, Pencil } from "lucide-react";
import { buildHtmlBlockSrcDoc } from "@/lib/htmlBlockExtension";

export function HtmlBlockView({ node, updateAttributes, selected }: NodeViewProps) {
  const html = (node.attrs.html as string) ?? "";
  const css = (node.attrs.css as string) ?? "";
  const [editing, setEditing] = useState(false);
  const [draftHtml, setDraftHtml] = useState(html);
  const [draftCss, setDraftCss] = useState(css);

  const srcDoc = useMemo(() => buildHtmlBlockSrcDoc(html, css), [html, css]);

  const openEditor = () => {
    setDraftHtml(html);
    setDraftCss(css);
    setEditing(true);
  };

  const apply = () => {
    updateAttributes({ html: draftHtml, css: draftCss });
    setEditing(false);
  };

  const cancel = () => {
    setDraftHtml(html);
    setDraftCss(css);
    setEditing(false);
  };

  return (
    <NodeViewWrapper
      className={`html-block-wrap ${selected ? "html-block-selected" : ""}`}
      data-drag-handle
    >
      <div className="html-block-chrome">
        <span className="html-block-badge">
          <Code size={12} />
          HTML block
        </span>
        <div className="html-block-actions">
          {!editing ? (
            <button type="button" className="html-block-btn" onClick={openEditor}>
              <Pencil size={12} />
              Edit
            </button>
          ) : (
            <>
              <button type="button" className="html-block-btn" onClick={apply}>
                Apply
              </button>
              <button type="button" className="html-block-btn muted" onClick={cancel}>
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <div className="html-block-editor">
          <label className="html-block-field">
            <span>HTML</span>
            <textarea
              className="input html-block-code"
              value={draftHtml}
              onChange={(e) => setDraftHtml(e.target.value)}
              spellCheck={false}
            />
          </label>
          <label className="html-block-field">
            <span>CSS</span>
            <textarea
              className="input html-block-code"
              value={draftCss}
              onChange={(e) => setDraftCss(e.target.value)}
              spellCheck={false}
            />
          </label>
          <p className="muted html-block-hint">
            <Eye size={12} style={{ verticalAlign: -2, marginRight: 4 }} />
            Preview updates when you click Apply. Styles are scoped inside this block (sandboxed
            iframe).
          </p>
        </div>
      ) : null}

      <iframe
        className="html-block-frame"
        title="Custom HTML preview"
        sandbox=""
        srcDoc={srcDoc}
      />
    </NodeViewWrapper>
  );
}
