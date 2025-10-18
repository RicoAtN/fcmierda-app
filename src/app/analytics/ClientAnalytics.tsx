"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

type TrackFn = (name: string, payload?: Record<string, unknown>) => void;

/** runtime-safe sender that handles multiple shapes the @vercel/analytics package may expose */
async function sendVercelEvent(name: string, payload?: Record<string, unknown>) {
  try {
    const mod = await import("@vercel/analytics");
    const modObj = mod as unknown as Record<string, unknown>;

    const evt = modObj["event"];
    if (typeof evt === "function") {
      (evt as unknown as TrackFn)(name, payload);
      return;
    }

    const def = modObj["default"];
    if (typeof def === "function") {
      (def as unknown as TrackFn)(name, payload);
      return;
    }

    if (def && typeof (def as Record<string, unknown>)["track"] === "function") {
      const t = (def as Record<string, unknown>)["track"];
      (t as unknown as TrackFn)(name, payload);
      return;
    }

    const track = modObj["track"];
    if (typeof track === "function") {
      (track as unknown as TrackFn)(name, payload);
      return;
    }
  } catch {
    // ignore - package shape may differ or not be available in this environment
  }
}

export default function ClientAnalytics() {
  const pathname = usePathname();
  const startRef = useRef<number>(Date.now());
  const prevPathRef = useRef<string | null>(pathname ?? null);

  useEffect(() => {
    if (prevPathRef.current && prevPathRef.current !== pathname) {
      const now = Date.now();
      const durationSec = Math.round((now - startRef.current) / 1000);
      sendVercelEvent("session_duration", { path: prevPathRef.current, duration: durationSec });
      startRef.current = Date.now();
      prevPathRef.current = pathname;
    } else {
      prevPathRef.current = pathname;
      startRef.current = Date.now();
    }
  }, [pathname]);

  useEffect(() => {
    function sendNow(reason: string) {
      const now = Date.now();
      const durationSec = Math.round((now - startRef.current) / 1000);
      sendVercelEvent("session_duration", { path: pathname || "/", duration: durationSec, reason });
      startRef.current = Date.now();
    }

    function handleVisibility() {
      if (document.visibilityState === "hidden") sendNow("hidden");
    }
    function handleBeforeUnload() {
      sendNow("unload");
    }

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [pathname]);

  return null;
}