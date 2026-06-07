"use client";

import { splitEmojiGlyphs } from "@/lib/templateIcon";

export function TemplateIcon({
  emoji,
  size = "sm",
  className,
  style,
}: {
  emoji: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  style?: React.CSSProperties;
}) {
  const [primary, secondary] = splitEmojiGlyphs(emoji);
  const cls = [
    "template-icon",
    `template-icon--${size}`,
    secondary ? "template-icon--duo" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (!secondary) {
    return (
      <span className={cls} style={style} aria-hidden>
        <span className="template-icon__glyph">{primary}</span>
      </span>
    );
  }

  return (
    <span className={cls} style={style} aria-hidden>
      <span className="template-icon__glyph template-icon__glyph--primary">{primary}</span>
      <span className="template-icon__badge" aria-hidden>
        <span className="template-icon__glyph template-icon__glyph--secondary">{secondary}</span>
      </span>
    </span>
  );
}
