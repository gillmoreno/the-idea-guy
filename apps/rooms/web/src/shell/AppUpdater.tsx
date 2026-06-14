"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const RUNNING_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "dev";
const POLL_MS = 60_000;

/**
 * Registers the service worker and keeps the installed PWA current.
 *
 * Detection runs two ways, belt-and-suspenders, because "I'm stuck on an old
 * build" is the failure we care about most:
 *   1. SW lifecycle — a deploy ships a byte-different sw.js (versioned cache),
 *      so the browser finds a new worker; we watch it reach "installed".
 *   2. /version.json poll — compared against the build baked into this bundle,
 *      in case the SW path is unavailable.
 *
 * When an update is ready we surface a toast. Per product choice it also
 * auto-applies when the app is refocused (or cold-started), so a user who never
 * taps the toast still lands on the latest build next time they open it. Room
 * data is CRDT-synced, so reloading is always safe.
 */
export function AppUpdater() {
  const [ready, setReady] = useState(false);
  const regRef = useRef<ServiceWorkerRegistration | null>(null);
  const reloadingRef = useRef(false);

  const apply = useCallback(() => {
    if (reloadingRef.current) return;
    reloadingRef.current = true;
    const waiting = regRef.current?.waiting;
    if (waiting) {
      // controllerchange (below) reloads once the new worker takes over.
      waiting.postMessage({ type: "SKIP_WAITING" });
    } else {
      window.location.reload();
    }
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    let cancelled = false;
    const sw = navigator.serviceWorker;

    const markReady = () => {
      if (!cancelled) setReady(true);
    };

    // A new worker reaching "installed" while one already controls the page
    // means a fresh build is waiting.
    const watchInstalling = (reg: ServiceWorkerRegistration) => {
      const w = reg.installing;
      if (!w) return;
      w.addEventListener("statechange", () => {
        if (w.state === "installed" && navigator.serviceWorker.controller) markReady();
      });
    };

    sw.register("/sw.js")
      .then((reg) => {
        if (cancelled) return;
        regRef.current = reg;
        if (reg.waiting && navigator.serviceWorker.controller) markReady();
        watchInstalling(reg);
        reg.addEventListener("updatefound", () => watchInstalling(reg));
      })
      .catch(() => {
        /* offline / unsupported — best-effort */
      });

    // Reload once the worker we asked to activate takes control. Guarded on
    // reloadingRef so the first-install clients.claim() doesn't bounce the page.
    const onControllerChange = () => {
      if (reloadingRef.current) window.location.reload();
    };
    sw.addEventListener("controllerchange", onControllerChange);

    const checkVersion = async () => {
      try {
        const res = await fetch("/version.json", { cache: "no-store" });
        if (!res.ok) return;
        const { version } = (await res.json()) as { version?: string };
        if (version && version !== RUNNING_VERSION) markReady();
      } catch {
        /* offline — ignore */
      }
    };

    const checkForUpdate = () => {
      regRef.current?.update().catch(() => {});
      void checkVersion();
    };

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      // Refocus is the moment to both re-check and quietly apply a pending update.
      if (ready) {
        apply();
        return;
      }
      checkForUpdate();
    };

    checkForUpdate();
    const interval = window.setInterval(checkForUpdate, POLL_MS);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      sw.removeEventListener("controllerchange", onControllerChange);
    };
  }, [apply, ready]);

  if (!ready) return null;

  return (
    <div className="app-update-toast" role="status" aria-live="polite">
      <span className="app-update-toast__text">A new version is available</span>
      <button type="button" className="btn btn-primary btn-sm" onClick={apply}>
        Update
      </button>
    </div>
  );
}
