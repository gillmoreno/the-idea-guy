"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { normalizeContactCardInput } from "@/lib/contactCode";

export function ContactQRScanner({
  onScan,
  onClose,
}: {
  onScan: (contactCard: string) => void;
  onClose: () => void;
}) {
  const reactId = useId().replace(/:/g, "");
  const elementId = `contact-qr-scanner-${reactId}`;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    const scanner = new Html5Qrcode(elementId);
    scannerRef.current = scanner;
    let stopped = false;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1 },
        (decoded) => {
          const card = normalizeContactCardInput(decoded);
          if (!card || stopped) return;
          stopped = true;
          void scanner.stop().then(() => onScanRef.current(card));
        },
        () => {
          /* no QR in frame */
        },
      )
      .then(() => setStarting(false))
      .catch((e: unknown) => {
        setStarting(false);
        setError(e instanceof Error ? e.message : "Could not open camera");
      });

    return () => {
      stopped = true;
      void scanner.stop().catch(() => {});
      scanner.clear();
      scannerRef.current = null;
    };
  }, [elementId]);

  return (
    <div className="contact-qr-scanner stack-sm">
      <p className="muted" style={{ fontSize: 13, margin: 0 }}>
        Point your camera at their contact QR code
      </p>
      <div className="contact-qr-scanner__viewport">
        <div id={elementId} className="contact-qr-scanner__reader" />
        {starting && (
          <div className="contact-qr-scanner__overlay muted">Starting camera…</div>
        )}
      </div>
      {error && <p className="image-field__error">{error}</p>}
      <button type="button" className="btn btn-ghost btn-block" onClick={onClose}>
        Cancel
      </button>
    </div>
  );
}
