"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

async function sendVercelEvent(name: string, payload?: Record<string, any>) {
  try {
    const mod = await import("@vercel/analytics");
    const fn = (mod as any).event ?? (mod as any).default;
    if (typeof fn === "function") fn(name, payload);
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