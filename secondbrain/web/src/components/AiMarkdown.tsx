"use client";

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AICitation } from "@/lib/types";

/** Turn cited note titles in markdown into internal note: links. */
function linkifyCitations(content: string, citations: AICitation[]): string {
  let result = content;
  const sorted = [...citations].sort((a, b) => b.title.length - a.title.length);

  for (const cite of sorted) {
    if (!cite.title.trim()) continue;
    const escaped = cite.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // **Title** → linked bold
    result = result.replace(
      new RegExp(`\\*\\*${escaped}\\*\\*`, "gi"),
      `[**${cite.title}**](note:${cite.id})`,
    );
    // "Title" in quotes
    result = result.replace(
      new RegExp(`"${escaped}"`, "gi"),
      `["${cite.title}"](note:${cite.id})`,
    );
    // note titled "Title" / note titled **Title**
    result = result.replace(
      new RegExp(`(note titled\\s+)\\*\\*${escaped}\\*\\*`, "gi"),
      `$1[**${cite.title}**](note:${cite.id})`,
    );
    result = result.replace(
      new RegExp(`(note titled\\s+)"${escaped}"`, "gi"),
      `$1["${cite.title}"](note:${cite.id})`,
    );
  }

  return result;
}

interface AiMarkdownProps {
  content: string;
  citations?: AICitation[];
  onOpenNote?: (id: string) => void;
}

export function AiMarkdown({ content, citations = [], onOpenNote }: AiMarkdownProps) {
  const processed = linkifyCitations(content, citations);

  const components: Components = {
    a: ({ href, children }) => {
      if (href?.startsWith("note:")) {
        const id = href.slice(5);
        return (
          <button
            type="button"
            className="ai-md-note-link"
            onClick={() => onOpenNote?.(id)}
          >
            {children}
          </button>
        );
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="ai-md-link">
          {children}
        </a>
      );
    },
  };

  return (
    <div className="ai-markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {processed}
      </ReactMarkdown>
    </div>
  );
}
