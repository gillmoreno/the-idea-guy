"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "rooms.installPromptDismissed";

function isStandalone(): boolean {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari standalone flag
    ("standalone" in window.navigator &&
      (window.navigator as { standalone?: boolean }).standalone === true)
  );
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    // iPadOS pretends to be a Mac
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/**
 * One-tap "install as app": uses the real install prompt on Chrome/Android,
 * shows Add-to-Home-Screen instructions on iOS (no API exists there).
 * Hidden when already installed or previously dismissed.
 */
export function InstallAppPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [iosExpanded, setIosExpanded] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;
    setHidden(false);

    if (isIos()) {
      setShowIosHelp(true);
      return;
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setHidden(true);
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") setHidden(true);
    setInstallEvent(null);
  };

  if (hidden || (!installEvent && !showIosHelp)) return null;

  return (
    <div className="card stack-sm">
      <div className="row gap-sm" style={{ alignItems: "center" }}>
        <span style={{ fontSize: 22 }} aria-hidden>
          📲
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong>Put Rooms on your home screen</strong>
          <div className="muted" style={{ fontSize: 13 }}>
            Opens full-screen like a real app — no address bar, no typing URLs.
          </div>
        </div>
      </div>

      {installEvent && (
        <button type="button" className="btn btn-primary btn-block" onClick={install}>
          Install app
        </button>
      )}

      {showIosHelp && !iosExpanded && (
        <button type="button" className="btn btn-primary btn-block" onClick={() => setIosExpanded(true)}>
          Show me how
        </button>
      )}

      {showIosHelp && iosExpanded && (
        <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14 }} className="stack-sm">
          <li>
            Tap the <strong>Share</strong> button <span aria-hidden>(the ⬆️ square)</span> in
            Safari&apos;s toolbar
          </li>
          <li>
            Scroll down and tap <strong>Add to Home Screen</strong>
          </li>
          <li>
            Tap <strong>Add</strong> — the Rooms icon appears with your other apps
          </li>
        </ol>
      )}

      <button type="button" className="btn btn-ghost btn-sm" onClick={dismiss}>
        Not now
      </button>
    </div>
  );
}
