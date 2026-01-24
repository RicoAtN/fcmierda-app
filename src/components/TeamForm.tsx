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

  useEffect(() => {
    setError(null);
    setResults(null);
    fetch(`/api/team-form`)
      .then(r => r.json())
      .then(j => setResults(j?.data?.results ?? []))
      .catch(e => setError(e?.message || "Failed to load form"));
  }, [teamId]); // keeping teamId so rerenders can refetch if you later add filtering

  const normalize = (r: string) => {
    const v = (r || "").trim().toUpperCase();
    if (v === "W" || v === "WIN" || v === "VICTORY") return "W";
    if (v === "D" || v === "DRAW" || v === "TIE") return "D";
    if (v === "L" || v === "LOSS" || v === "LOSE") return "L";
    return "";
  };

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