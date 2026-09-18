"use client";
import React, { useEffect, useState } from "react";
import { Montserrat } from "next/font/google";
import Link from "next/link";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "600", "700"] });

export default function UpcomingMatch() {
  const [nextGame, setNextGame] = useState<{ opponent: string; date: string; time: string; location: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Hydrate from session cache
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem("fcmierda_upcoming_match_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed) {
          setNextGame(parsed);
          setLoading(false);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // 2. Fresh fetch in background
  useEffect(() => {
    let isMounted = true;
    fetch("/api/next-game")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        
        let formattedDate = data.date || "TBD";
        if (data.date) {
          try {
            const d = new Date(data.date);
            if (!isNaN(d.getTime())) {
              formattedDate = d.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric"
              });
            }
          } catch (e) {}
        }

        const matchData = {
          opponent: data.opponent || "TBD",
          date: formattedDate,
          time: data.kickoff || "TBD",
          location: data.location || "Alexandria 66 Rotterdam",
        };

        setNextGame(matchData);
        try {
          sessionStorage.setItem("fcmierda_upcoming_match_cache", JSON.stringify(matchData));
        } catch {
          // ignore
        }
      })
      .catch((e) => {
        console.error("Failed to load upcoming match", e);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return (
      <div className={`bg-black/50 backdrop-blur-md border border-white/15 rounded-2xl p-5 text-center shadow-2xl w-full max-w-sm mx-auto mb-2 ${montserrat.className}`}>
        <p className="text-white/80 text-sm font-medium animate-pulse">Loading upcoming match...</p>
      </div>
    );
  }

  if (!nextGame) return null;

  const isUnknown = nextGame.opponent === "TBD" || nextGame.opponent === "To be announced soon";

  return (
    <Link
      href="/fixtures"
      className={`group block cursor-pointer bg-black/50 hover:bg-black/60 backdrop-blur-md border border-white/15 hover:border-emerald-500/50 rounded-2xl p-5 text-center shadow-2xl hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)] w-full max-w-sm mx-auto transition-all duration-300 hover:-translate-y-0.5 ${montserrat.className}`}
    >
      <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 font-bold text-[11px] sm:text-xs uppercase tracking-widest mb-2.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>Next Fixture</span>
      </div>

      {isUnknown ? (
        <>
          <p className="text-white text-base sm:text-lg font-semibold leading-relaxed">
            The upcoming match is <br />
            <span className="font-bold text-yellow-400">To be announced soon</span>
          </p>
        </>
      ) : (
        <>
          <p className="text-gray-200 text-sm sm:text-base font-medium">
            FC Mierda vs
          </p>
          <div className="text-xl sm:text-2xl font-extrabold text-yellow-300 tracking-wide mt-0.5 mb-1 font-mono">
            {nextGame.opponent}
          </div>
          <p className="text-white/90 text-xs sm:text-sm font-semibold">
            {nextGame.date} • {nextGame.time}
          </p>
          <p className="text-white/70 text-xs mt-1.5 font-medium flex items-center justify-center gap-1">
            📍 {nextGame.location}
          </p>
        </>
      )}

      <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-center gap-1 text-[11px] text-emerald-400 font-semibold group-hover:text-emerald-300 transition-colors">
        <span>View fixture details &amp; squad attendance</span>
        <span className="group-hover:translate-x-0.5 transition-transform">↗</span>
      </div>
    </Link>
  );
}