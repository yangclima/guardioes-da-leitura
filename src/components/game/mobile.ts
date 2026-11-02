"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

/** Primary input is a finger (phones and tablets). */
export const TOUCH_QUERY = "(pointer: coarse)";
/** Touch device whose short side is phone-sized. */
export const PHONE_QUERY = "(pointer: coarse) and (max-width: 599px), (pointer: coarse) and (max-height: 599px)";
export const PORTRAIT_QUERY = "(orientation: portrait)";

const HAPTIC_MS = 8;

type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: "landscape") => Promise<void>;
  unlock?: () => void;
};

/** Reactive `matchMedia`; false during SSR and hydration. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}

/**
 * Real fullscreen (hides Chrome's address bar) plus an optional landscape lock.
 * Must be called synchronously inside a user gesture. Failures are fine: the
 * CSS immersive layout and the rotate prompt cover browsers that refuse.
 */
export async function enterImmersive(lockLandscape: boolean): Promise<void> {
  const root = document.documentElement;
  if (!document.fullscreenElement && document.fullscreenEnabled) {
    try {
      await root.requestFullscreen({ navigationUI: "hide" });
    } catch {
      return;
    }
  }
  if (!lockLandscape) return;
  try {
    await (screen.orientation as LockableOrientation).lock?.("landscape");
  } catch {
    // Lock not supported: the rotate prompt asks the player instead.
  }
}

export function exitImmersive(): void {
  try {
    (screen.orientation as LockableOrientation).unlock?.();
  } catch {
    // Nothing was locked.
  }
  if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
}

export function toggleFullscreen(target: HTMLElement): void {
  if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
  else void target.requestFullscreen?.({ navigationUI: "hide" }).catch(() => undefined);
}

/** Tiny tap feedback on Android Chrome; silently ignored elsewhere. */
export function haptic(): void {
  try {
    navigator.vibrate?.(HAPTIC_MS);
  } catch {
    // Vibration blocked by the browser.
  }
}

/** Keeps the screen from dimming while the game runs. */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;
    const request = () => {
      if (document.visibilityState !== "visible") return;
      navigator.wakeLock
        .request("screen")
        .then((s) => {
          if (cancelled) void s.release();
          else sentinel = s;
        })
        .catch(() => undefined);
    };
    request();
    document.addEventListener("visibilitychange", request);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", request);
      void sentinel?.release().catch(() => undefined);
    };
  }, [active]);
}
