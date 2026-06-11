"use client";

import { QRScanner } from "@/components/QRScanner";
import { normalizeContactCardInput } from "@/lib/contactCode";

export function ContactQRScanner({
  onScan,
  onClose,
}: {
  onScan: (contactCard: string) => void;
  onClose: () => void;
}) {
  return (
    <QRScanner
      normalize={normalizeContactCardInput}
      onScan={onScan}
      onClose={onClose}
      hint="Point your camera at their contact QR code"
    />
  );
}
