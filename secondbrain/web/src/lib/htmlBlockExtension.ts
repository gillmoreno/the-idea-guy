import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { HtmlBlockView } from "@/components/HtmlBlockView";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    htmlBlock: {
      insertHtmlBlock: (attrs?: { html?: string; css?: string }) => ReturnType;
    };
  }
}

export const DEFAULT_HTML_BLOCK = `<div class="card">
  <h3>Custom block</h3>
  <p>Edit HTML &amp; CSS — or ask AI to generate a layout.</p>
</div>`;

export const DEFAULT_HTML_BLOCK_CSS = `.card {
  padding: 1rem 1.25rem;
  border-radius: 12px;
  background: linear-gradient(135deg, #0d9488 0%, #6366f1 100%);
  color: #fff;
}
.card h3 { margin: 0 0 0.35rem; font-size: 1.1rem; }
.card p { margin: 0; opacity: 0.92; font-size: 0.9rem; }`;

export function buildHtmlBlockSrcDoc(html: string, css: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
* { box-sizing: border-box; }
html, body { width: 100%; min-height: 100%; margin: 0; }
body { padding: 0; font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; }
${css}
</style></head><body>${html}</body></html>`;
}

export const HtmlBlock = Node.create({
  name: "htmlBlock",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      html: {
        default: DEFAULT_HTML_BLOCK,
        parseHTML: (el) => el.getAttribute("data-html") ?? DEFAULT_HTML_BLOCK,
        renderHTML: (attrs) => ({ "data-html": attrs.html }),
      },
      css: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-css") ?? "",
        renderHTML: (attrs) => ({ "data-css": attrs.css }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-html-block="true"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-html-block": "true",
        class: "html-block-host",
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(HtmlBlockView);
  },

  addCommands() {
    return {
      insertHtmlBlock:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              html: attrs?.html ?? DEFAULT_HTML_BLOCK,
              css: attrs?.css ?? DEFAULT_HTML_BLOCK_CSS,
            },
          }),
    };
  },
});
