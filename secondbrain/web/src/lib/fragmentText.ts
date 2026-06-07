import * as Y from "yjs";

const BLOCK_NODES = new Set([
  "paragraph",
  "heading",
  "listItem",
  "blockquote",
  "callout",
  "codeBlock",
  "bulletList",
  "orderedList",
]);

/** Plain text from a collaborative Y.XmlFragment (source of truth for note body). */
export function fragmentToPlainText(root: Y.XmlFragment | Y.XmlElement): string {
  const chunks: string[] = [];

  const visit = (node: Y.XmlFragment | Y.XmlElement) => {
    for (let i = 0; i < node.length; i++) {
      const child = node.get(i);
      if (!child) continue;
      if (child instanceof Y.XmlText) {
        const t = child.toString();
        if (t) chunks.push(t);
      } else if (child instanceof Y.XmlElement) {
        visit(child);
        if (BLOCK_NODES.has(child.nodeName)) chunks.push(" ");
      }
    }
  };

  visit(root);
  return chunks.join("").replace(/\s+/g, " ").trim();
}

export function fragmentHasContent(root: Y.XmlFragment | Y.XmlElement): boolean {
  return fragmentToPlainText(root).length > 0;
}
