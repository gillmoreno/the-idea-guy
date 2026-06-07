"use client";

import { TemplateIcon } from "@/components/TemplateIcon";

export function RoomLoading({
  emoji,
  message,
  accent,
}: {
  emoji: string;
  message: string;
  accent?: string;
}) {
  return (
    <div className="centered" style={{ textAlign: "center" }}>
      <TemplateIcon
        emoji={emoji}
        size="lg"
        style={accent ? ({ "--template-accent": accent } as React.CSSProperties) : undefined}
      />
      <p className="muted" style={{ marginTop: 16 }}>
        {message}
      </p>
    </div>
  );
}
