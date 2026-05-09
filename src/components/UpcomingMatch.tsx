"use client";
import React, { useEffect, useState } from "react";
import { Montserrat } from "next/font/google";
import Link from "next/link";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "600", "700"] });

export default function UpcomingMatch() {
  const [nextGame, setNextGame] = useState<{ opponent: string; date: string; time: string; location: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch(`/api/next-game?_t=${Date.now()}`, { cache: "no-store" })
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

        setNextGame({
          opponent: data.opponent || "TBD",
          date: formattedDate,
          time: data.kickoff || "TBD",
          location: data.location || "Alexandria 66 Rotterdam",
        });
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
      <div className={`bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-5 text-center shadow-2xl w-full max-w-sm mx-auto mb-2 ${montserrat.className}`}>
        <p className="text-white text-sm font-medium">Loading upcoming match...</p>
      </div>
    );
  }

  if (!nextGame) return null;

  const isUnknown = nextGame.opponent === "TBD" || nextGame.opponent === "To be announced soon";

  return (
    <Link href="/fixtures" className={`block cursor-pointer hover:bg-black/50 transition-colors bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-5 text-center shadow-2xl w-full max-w-sm mx-auto mb-2 ${montserrat.className}`}>
      <h3 className="text-emerald-400 font-extrabold text-sm sm:text-base mb-2 uppercase tracking-widest">
        Upcoming Match
      </h3>
      {isUnknown ? (
        <>
          <p className="text-white text-base sm:text-lg font-medium leading-relaxed">
            The upcoming match is <br></br><span className="font-bold text-yellow-400">To be announced</span>
          </p>
        </>
      ) : (
        <>
          <p className="text-white text-base sm:text-lg font-medium leading-relaxed">
            FC Mierda plays against <br></br><span className="font-bold text-yellow-400">{nextGame.opponent}</span>
          </p>
          <p className="text-white/80 text-sm sm:text-base mt-2 font-medium">
            on {nextGame.date} at {nextGame.time}
          </p>
          <p className="text-white/70 text-xs sm:text-sm mt-1.5 font-medium flex items-center justify-center gap-1">
            📍 {nextGame.location}
          </p>
        </>
      )}
    </Link>
  );
}