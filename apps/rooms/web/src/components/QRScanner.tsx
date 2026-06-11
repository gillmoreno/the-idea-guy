"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";

async function releaseScanner(scanner: Html5Qrcode) {
  try {
    const state = scanner.getState();
    if (
      state === Html5QrcodeScannerState.SCANNING ||
      state === Html5QrcodeScannerState.PAUSED
    ) {
      await scanner.stop();
    }
  } catch {
    /* already stopped or never started */
  }
  try {
    scanner.clear();
  } catch {
    /* ignore */
  }
}

/** Camera QR scanner. Frames are fed through `normalize`; the first frame it
 *  accepts (non-null) stops the camera and is passed to `onScan`. */
export function QRScanner<T>({
  normalize,
  onScan,
  onClose,
  hint,
}: {
  normalize: (decoded: string) => T | null;
  onScan: (value: T) => void;
  onClose: () => void;
  hint: string;
}) {
  const reactId = useId().replace(/:/g, "");
  const elementId = `qr-scanner-${reactId}`;
  const onScanRef = useRef(onScan);
  const normalizeRef = useRef(normalize);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    onScanRef.current = onScan;
    normalizeRef.current = normalize;
  }, [onScan, normalize]);

  useEffect(() => {
    const scanner = new Html5Qrcode(elementId);
    let disposed = false;
    let scanHandled = false;

    const startTask = scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1 },
        (decoded) => {
          if (scanHandled || disposed) return;
          const value = normalizeRef.current(decoded);
          if (value === null) return;
          scanHandled = true;
          void releaseScanner(scanner).then(() => {
            if (!disposed) onScanRef.current(value);
          });
        },
        () => {
          /* no QR in frame */
        },
      )
      .then(() => {
        if (disposed) {
          return releaseScanner(scanner);
        }
        setStarting(false);
      })
      .catch((e: unknown) => {
        if (disposed) return;
        setStarting(false);
        setError(e instanceof Error ? e.message : "Could not open camera");
      });

    return () => {
      disposed = true;
      void startTask.finally(() => releaseScanner(scanner));
    };
  }, [elementId]);

  return (
    <div className="contact-qr-scanner stack-sm">
      <p className="muted" style={{ fontSize: 13, margin: 0 }}>
        {hint}
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
