"use client";

import QRCode from "react-qr-code";

export function QRBlock({
  value,
  label,
  size = 160,
}: {
  value: string;
  label?: string;
  size?: number;
}) {
  if (!value) return null;
  return (
    <div className="qr-block">
      {label && <p className="muted" style={{ fontSize: 12, marginBottom: 8 }}>{label}</p>}
      <div
        className="qr-frame"
        style={{
          background: "#fff",
          padding: 12,
          borderRadius: 12,
          display: "inline-block",
        }}
      >
        <QRCode value={value} size={size} level="M" />
      </div>
    </div>
  );
}
