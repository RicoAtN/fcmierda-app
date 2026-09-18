"use client";
import { useEffect, useState } from "react";
import { Roboto_Slab } from "next/font/google";
import Link from "next/link";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700"] });

type Props = { teamId: string | number; className?: string };

const colorFor = (r: string) =>
  r === "W"
    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-emerald-500/10"
    : r === "D"
    ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-amber-500/10"
    : r === "L"
    ? "bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-rose-500/10"
    : "bg-gray-800/40 text-gray-500 border-gray-700/40";

export default function TeamForm({ teamId, className = "" }: Props) {
  const [results, setResults] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // configurable refresh (ms). Modest 60s interval to prevent serverless load.
  const REFRESH_INTERVAL = 60000; // 60s

  const normalize = (r: string) => {
    const v = (r || "").trim().toUpperCase();
    if (v === "W" || v === "WIN" || v === "VICTORY") return "W";
    if (v === "D" || v === "DRAW" || v === "TIE") return "D";
    if (v === "L" || v === "LOSS" || v === "LOSE") return "L";
    return "";
  };

  const fetchForm = async () => {
    try {
      setError(null);
      const url = `/api/team-form?_t=${Date.now()}${teamId ? `&teamId=${encodeURIComponent(String(teamId))}` : ""}`;
      const res = await fetch(url, {
        cache: "no-store",
        headers: { "Accept": "application/json" }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      const next: string[] = j?.data?.results ?? [];
      // normalize for comparison before setting state
      const norm = next.map((r: string) => normalize(r));
      const current = (results ?? []).map(r => normalize(r));
      const changed = norm.length !== current.length || norm.some((v, i) => v !== current[i]);
      if (changed) {
        setResults(norm);
        try {
          sessionStorage.setItem("fcmierda_team_form_cache", JSON.stringify(norm));
        } catch {
          // ignore
        }
      }
    } catch (e: any) {
      // Keep prior results on background refresh failures
      if (!results) setResults([]);
      setError(e?.message || "Failed to load form");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Hydrate from cache immediately
    try {
      const cached = sessionStorage.getItem("fcmierda_team_form_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) setResults(parsed);
      }
    } catch {
      // ignore
    }

    // 2. Fetch fresh
    fetchForm();

    // polling with visibility awareness
    let intervalId: number | undefined;
    const start = () => {
      if (intervalId) return;
      intervalId = window.setInterval(() => {
        if (document.visibilityState === "visible" && navigator.onLine) {
          fetchForm();
        }
      }, REFRESH_INTERVAL);
    };
    const stop = () => {
      if (intervalId) {
        window.clearInterval(intervalId);
        intervalId = undefined;
      }
    };
    const onVis = () => {
      if (document.visibilityState === "visible") {
        fetchForm();
        start();
      } else {
        stop();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    start();

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  const items = (results ?? []).map(normalize);
  // Newest on the left, oldest on the right; pad missing older games on the right
  const padRightCount = Math.max(0, 5 - items.length);
  const display = items.concat(Array(padRightCount).fill(""));

  return (
    <Link
      href="/results"
      className={`group w-full max-w-sm mx-auto flex flex-col items-center gap-2 cursor-pointer bg-black/50 hover:bg-black/60 backdrop-blur-md border border-white/15 hover:border-emerald-500/50 rounded-2xl p-4 sm:p-5 text-center shadow-2xl hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.25)] transition-all duration-300 hover:-translate-y-0.5 ${className}`}
      aria-label="Team recent form"
    >
      <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 font-bold text-[11px] sm:text-xs uppercase tracking-widest">
        <span>⚡ Team Recent Form</span>
      </div>

      <span className="text-gray-300 text-xs sm:text-sm font-medium">
        Last 5 match outcomes
      </span>

      <div className="flex items-center justify-center gap-2 sm:gap-2.5 my-1">
        {display.map((r, i) => {
          const isLatest = i === 0;
          return (
            <span
              key={i}
              className={`inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border shadow-sm ${colorFor(r)} font-extrabold text-sm sm:text-base transition-transform group-hover:scale-105 ${isLatest ? "ring-2 ring-emerald-400/50" : ""}`}
              title={r === "W" ? "Win" : r === "D" ? "Draw" : r === "L" ? "Loss" : "No result"}
              aria-label={r || "No result"}
            >
              {r || "-"}
            </span>
          );
        })}
      </div>

      <div className="flex justify-between w-full px-2 text-[10px] text-gray-400 font-semibold">
        <span>← Most Recent</span>
        <span>Older →</span>
      </div>
    </Link>
  );
}

// <TeamForm teamId={1} className="mt-4" />