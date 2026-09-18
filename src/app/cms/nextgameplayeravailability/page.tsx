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
    <div className={`relative min-h-screen flex flex-col items-center w-full bg-gray-900 text-white overflow-x-hidden ${montserrat.className}`}>
      <Menu />

      <main className="w-full flex-1 flex flex-col items-center pt-24 sm:pt-36 pb-16 px-3.5 sm:px-6">
        {/* Navigation Breadcrumbs */}
        <div className="max-w-2xl w-full mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/cms"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gray-900/90 hover:bg-gray-800 border border-gray-700 text-xs font-semibold text-gray-200 hover:text-emerald-300 transition-all shadow-sm"
            >
              <span>←</span>
              <span>Back to CMS</span>
            </Link>
            <Link
              href="/fixtures"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gray-900/90 hover:bg-gray-800 border border-gray-700 text-xs font-semibold text-gray-200 hover:text-emerald-300 transition-all shadow-sm"
            >
              <span>View Fixtures</span>
            </Link>
          </div>
          <span className="text-xs text-gray-400 font-medium hidden sm:inline-block">Match Attendance</span>
        </div>

        {/* Hero Header */}
        <div className="max-w-2xl w-full text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-2xl mb-3 shadow-inner">
            👥
          </div>
          <h1 className={`text-2xl sm:text-3xl font-black tracking-tight text-white mb-1.5 ${robotoSlab.className}`}>
            Player Availability Tracker
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 font-medium max-w-md mx-auto">
            Mark your attendance for the upcoming match. Changes are instantly saved for the entire squad.
          </p>
        </div>

        {/* Main Form Card */}
        <div
          id="player-availability"
          className="max-w-2xl w-full rounded-2xl p-5 sm:p-7 text-white bg-gray-950/85 border border-gray-800 shadow-2xl backdrop-blur-md mx-auto mb-8"
        >
          {/* 3-Box Match Info Row */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gray-900/90 border border-gray-800 text-center">
              <div className="text-[10px] sm:text-xs text-gray-400 font-semibold uppercase tracking-wider">Date</div>
              <div className="text-xs sm:text-sm font-bold text-white truncate mt-1">
                {nextGame.date ? formatDateWithWeekday(nextGame.date) : "-"}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-center">
              <div className="text-[10px] sm:text-xs text-emerald-400 font-semibold uppercase tracking-wider">Kick-off</div>
              <div className="text-xs sm:text-sm font-mono font-bold text-emerald-300 truncate mt-1">
                {nextGame.kickoff || "-"}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-gray-900/90 border border-gray-800 text-center">
              <div className="text-[10px] sm:text-xs text-gray-400 font-semibold uppercase tracking-wider">Opponent</div>
              <div className="text-xs sm:text-sm font-bold text-white truncate mt-1">
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