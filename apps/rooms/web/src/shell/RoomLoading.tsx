"use client";

export function RoomLoading({ emoji, message }: { emoji: string; message: string }) {
  return (
    <div className="centered" style={{ textAlign: "center" }}>
      <div className="hero-logo emoji-orb lg">{emoji}</div>
      <p className="muted">{message}</p>
    </div>
  );
}
