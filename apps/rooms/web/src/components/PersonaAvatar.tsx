"use client";

import { parseAvatarValue, resolveAvatarDisplay } from "@/lib/avatarValue";

export function PersonaAvatar({
  displayName,
  color,
  avatar,
  size = "md",
  className,
}: {
  displayName: string;
  color: string;
  avatar?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const display = resolveAvatarDisplay(avatar, { displayName, color });
  const cls = ["persona-avatar", `persona-avatar--${size}`, className]
    .filter(Boolean)
    .join(" ");

  if (display.mode === "image") {
    return (
      <span className={cls} style={{ background: color }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={display.src} alt="" />
      </span>
    );
  }

  if (display.mode === "emoji") {
    return (
      <span className={cls} style={{ background: "var(--surface-2)" }} aria-hidden>
        {display.emoji}
      </span>
    );
  }

  return (
    <span className={cls} style={{ background: display.color }}>
      {display.initials}
    </span>
  );
}

/** Live preview while editing avatar in forms. */
export function AvatarPreview({
  displayName,
  color,
  avatar,
}: {
  displayName: string;
  color: string;
  avatar: string;
}) {
  void parseAvatarValue(avatar);
  return <PersonaAvatar displayName={displayName} color={color} avatar={avatar} size="lg" />;
}
