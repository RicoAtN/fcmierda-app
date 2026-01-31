"use client";
import { useEffect, useState } from "react";
import { Roboto_Slab } from "next/font/google";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700"] });

type Props = { teamId: string | number; className?: string };

const colorFor = (r: string) =>
  r === "W" ? "text-green-500" : r === "D" ? "text-amber-400" : r === "L" ? "text-red-500" : "text-gray-400";

export default function TeamForm({ teamId, className = "" }: Props) {
  const [results, setResults] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // configurable refresh (ms). Keep modest to reduce load.
  const REFRESH_INTERVAL = 30000; // 30s

  const normalize = (r: string) => {
    const v = (r || "").trim().toUpperCase();
    if (v === "W" || v === "WIN" || v === "VICTORY") return "W";
    if (v === "D" || v === "DRAW" || v === "TIE") return "D";
    if (v === "L" || v === "LOSS" || v === "LOSE") return "L";
    return "";
  };

  const fetchForm = async (signal?: AbortSignal) => {
    try {
      setError(null);
      if (!results) setLoading(true);
      const url = `/api/team-form${teamId ? `?teamId=${encodeURIComponent(String(teamId))}` : ""}`;
      const res = await fetch(url, {
        cache: "no-store",
        headers: { "Accept": "application/json" },
        signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      const next: string[] = j?.data?.results ?? [];
      // normalize for comparison before setting state
      const norm = next.map((r: string) => normalize(r));
      const current = (results ?? []).map(r => normalize(r));
      const changed = norm.length !== current.length || norm.some((v, i) => v !== current[i]);
      if (changed) setResults(norm);
    } catch (e: any) {
      // Keep prior results on background refresh failures
      if (!results) setResults([]);
      setError(e?.message || "Failed to load form");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setError(null);
    setResults(null);
    const ac = new AbortController();
    // initial load
    fetchForm(ac.signal);

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
      ac.abort();
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]); // keep teamId so rerenders can refetch if you later add filtering

  const items = (results ?? []).map(normalize);
  // Newest on the left, oldest on the right; pad missing older games on the right
  const padRightCount = Math.max(0, 5 - items.length);
  const display = items.concat(Array(padRightCount).fill(""));

  return (
    <div className={`w-fit mx-auto flex flex-col items-center gap-2 ${className}`} aria-label="Team recent form">
      <span className={`text-white font-extrabold text-lg sm:text-xl uppercase tracking-wide ${robotoSlab.className}`}>
        FC Mierda Form
      </span>
      <span className="text-gray-300 text-xs sm:text-sm font-medium">Latest 5 game results</span>
      {loading && (
        <span className="text-[11px] text-gray-400">Refreshing…</span>
      )}

      <div className="flex items-center gap-3">
        {display.map((r, i) => {
          const isLatest = i === 0;
          return (
            <span
              key={i}
              className={`inline-flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-md bg-gray-800/70 border border-gray-600 ${colorFor(r)} font-bold text-lg sm:text-xl ${isLatest ? "ring-1 ring-gray-500" : ""}`}
              title={r === "W" ? "Win" : r === "D" ? "Draw" : r === "L" ? "Loss" : "No result"}
              aria-label={r || "No result"}
            >
              {r || "-"}
            </span>
          );
        })}
      </div>

      <div className="flex justify-between w-full text-[11px] text-gray-300 font-semibold">
        <span>Latest</span>
        <span>Past</span>
      </div>
    </div>
  );
}

// <TeamForm teamId={1} className="mt-4" />