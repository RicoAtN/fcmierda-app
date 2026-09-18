"use client";
import Menu from "@/components/Menu";
import Footer from "@/components/Footer";
import PlayerAttendance from "@/components/PlayerAttendance";
import { Roboto_Slab, Montserrat } from "next/font/google";
import Link from "next/link";
import { useEffect, useState } from "react";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700", "800"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

function formatDateWithWeekday(dateStr: string) {
  if (!dateStr || dateStr === "-") return "-";
  
  let d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    const parts = dateStr.trim().split(/[-/.]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      } else {
        d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      }
    }
  }

  if (!isNaN(d.getTime())) {
    const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleDateString("en-US", { month: "short" });
    const year = d.getFullYear();
    return `${weekday}, ${day} ${month} ${year}`;
  }

  return dateStr;
}

export default function NextGameDetailsPage() {
  // next game info for the info row (hydrated from cache or PlayerAttendance fetch)
  const [nextGame, setNextGame] = useState<{
    date: string;
    kickoff: string;
    opponent: string;
  }>({
    date: "",
    kickoff: "",
    opponent: "",
  });

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem("fcmierda_nextgame_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed) {
          setNextGame({
            date: parsed.date || "",
            kickoff: parsed.kickoff || "",
            opponent: parsed.opponent || "",
          });
        }
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center w-full bg-gray-900 text-white overflow-x-hidden">
      <Menu />

      <main className="w-full flex flex-col items-center pt-20 sm:pt-28 pb-12 px-3 sm:px-4">
        {/* Compact Hero Header */}
        <div className="max-w-2xl w-full text-center mb-4 sm:mb-5">
          <h1 className={`text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-1.5 ${robotoSlab.className}`}>
            Availability
          </h1>

          <p className={`text-xs sm:text-sm text-gray-300 font-medium mb-3 ${montserrat.className}`}>
            Mark your availability for the upcoming match.
          </p>

          <Link
            href="/fixtures"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs font-semibold text-gray-200 hover:text-white transition-all shadow-sm"
          >
            <span>←</span>
            <span>Back to fixtures</span>
          </Link>
        </div>

        {/* Main Form Card - Compact & Focused */}
        <div
          id="player-availability"
          className="max-w-2xl w-full rounded-xl p-4 sm:p-6 text-white bg-gray-950/90 border border-gray-800 shadow-xl mx-auto mb-8"
        >
          <h2 className={`text-lg sm:text-xl font-bold mb-3 text-center text-white ${robotoSlab.className}`}>
            Submit your availability
          </h2>

          {/* Simple 3-Box Match Info Row */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
            <div className="p-2 sm:p-2.5 rounded-lg bg-gray-900 border border-gray-800 text-center">
              <div className="text-[10px] sm:text-xs text-gray-400 font-medium uppercase tracking-wider">Date</div>
              <div className="text-xs sm:text-sm font-bold text-white truncate mt-0.5">
                {nextGame.date ? formatDateWithWeekday(nextGame.date) : "-"}
              </div>
            </div>
            <div className="p-2 sm:p-2.5 rounded-lg bg-gray-900 border border-gray-800 text-center">
              <div className="text-[10px] sm:text-xs text-emerald-400 font-medium uppercase tracking-wider">Kick-off</div>
              <div className="text-xs sm:text-sm font-mono font-bold text-emerald-300 truncate mt-0.5">
                {nextGame.kickoff || "-"}
              </div>
            </div>
            <div className="p-2 sm:p-2.5 rounded-lg bg-gray-900 border border-gray-800 text-center">
              <div className="text-[10px] sm:text-xs text-gray-400 font-medium uppercase tracking-wider">Opponent</div>
              <div className="text-xs sm:text-sm font-bold text-white truncate mt-0.5">
                {nextGame.opponent || "-"}
              </div>
            </div>
          </div>

          <PlayerAttendance onGameDataLoaded={setNextGame} />
        </div>
      </main>

      <Footer />
    </div>
  );
}