/** Split a template emoji string into graphemes (e.g. "📚☕" → ["📚", "☕"]). */
export function splitEmojiGlyphs(text: string): string[] {
  const t = text.trim();
  if (!t) return ["📦"];

  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    const parts = [...seg.segment(t)].map((s) => s.segment).filter(Boolean);
    if (parts.length > 0) return parts.slice(0, 2);
  }

  return [t];
}
