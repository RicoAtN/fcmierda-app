"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/* runtime-safe sender that accepts multiple shapes the package may expose */
async function sendVercelEvent(name: string, payload?: Record<string, unknown>) {
  try {
    const mod = await import("@vercel/analytics");
    const anyMod = mod as unknown as Record<string, unknown>;

    // named export `event(name, payload)`
    if (typeof (anyMod as any).event === "function") {
      (anyMod as any).event(name, payload);
      return;
    }

    // default export might be a function: `default(name, payload)`
    if (typeof (anyMod as any).default === "function") {
      (anyMod as any).default(name, payload);
      return;
    }

    // or default.export.track(name, payload) / track(name, payload)
    if ((anyMod as any).default && typeof (anyMod as any).default.track === "function") {
      (anyMod as any).default.track(name, payload);
      return;
    }
    if (typeof (anyMod as any).track === "function") {
      (anyMod as any).track(name, payload);
      return;
    }
  } catch {
    // ignore - analytics package may not be available locally or types differ
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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