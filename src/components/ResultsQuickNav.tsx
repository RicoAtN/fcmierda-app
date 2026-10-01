"use client";
import React from "react";

export default function ResultsQuickNav() {
  const scrollTo = (id: string) => {
    const attemptScroll = (count = 0) => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (count < 6) {
        setTimeout(() => attemptScroll(count + 1), 50);
      }
    };
    attemptScroll();
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-6 sm:mb-8 px-1">
      <div className="p-3.5 sm:p-5 rounded-2xl bg-gradient-to-r from-gray-950 via-gray-900/90 to-gray-950 border border-gray-800 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 mb-3 pb-2.5 border-b border-gray-800/80">
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg">🧭</span>
            <h2 className="text-xs sm:text-sm font-bold text-white tracking-wide uppercase">
              Page Guide &amp; Quick Jump
            </h2>
          </div>
          <span className="text-[11px] sm:text-xs text-gray-400">
            Click any section below to jump directly to it:
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {/* 1. Match History Table */}
          <button
            type="button"
            onClick={() => scrollTo("match-history")}
            className="group flex items-center sm:flex-col sm:items-start gap-3 sm:gap-1.5 p-3 rounded-xl bg-gray-900/80 hover:bg-emerald-950/40 border border-gray-800 hover:border-emerald-500/50 shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 text-left cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-sm shrink-0 group-hover:scale-110 transition-transform">
              📋
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center justify-between sm:justify-start gap-1">
                <span>Match History Table</span>
                <span className="text-xs text-emerald-400 group-hover:translate-y-0.5 transition-transform">↓</span>
              </div>
              <p className="text-[11px] text-gray-400 leading-snug line-clamp-1 sm:line-clamp-2 mt-0.5">
                Past matches, scorelines &amp; round filter
              </p>
            </div>
          </button>

          {/* 2. Latest Match Report */}
          <button
            type="button"
            onClick={() => scrollTo("match-details")}
            className="group flex items-center sm:flex-col sm:items-start gap-3 sm:gap-1.5 p-3 rounded-xl bg-gray-900/80 hover:bg-emerald-950/40 border border-gray-800 hover:border-emerald-500/50 shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 text-left cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-sm shrink-0 group-hover:scale-110 transition-transform">
              ⭐
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center justify-between sm:justify-start gap-1">
                <span>Latest Match Report</span>
                <span className="text-xs text-emerald-400 group-hover:translate-y-0.5 transition-transform">↓</span>
              </div>
              <p className="text-[11px] text-gray-400 leading-snug line-clamp-1 sm:line-clamp-2 mt-0.5">
                Detailed recap, Man of the Match &amp; goals
              </p>
            </div>
          </button>

          {/* 3. Competition Overview */}
          <button
            type="button"
            onClick={() => scrollTo("competitions-overview")}
            className="group flex items-center sm:flex-col sm:items-start gap-3 sm:gap-1.5 p-3 rounded-xl bg-gray-900/80 hover:bg-emerald-950/40 border border-gray-800 hover:border-emerald-500/50 shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 text-left cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-sm shrink-0 group-hover:scale-110 transition-transform">
              🏆
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center justify-between sm:justify-start gap-1">
                <span>Competition Overview</span>
                <span className="text-xs text-emerald-400 group-hover:translate-y-0.5 transition-transform">↓</span>
              </div>
              <p className="text-[11px] text-gray-400 leading-snug line-clamp-1 sm:line-clamp-2 mt-0.5">
                League seasons, final ranks &amp; champions
              </p>
            </div>
          </button>

          {/* 4. Opponent History */}
          <button
            type="button"
            onClick={() => scrollTo("opponent-history")}
            className="group flex items-center sm:flex-col sm:items-start gap-3 sm:gap-1.5 p-3 rounded-xl bg-gray-900/80 hover:bg-emerald-950/40 border border-gray-800 hover:border-emerald-500/50 shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 text-left cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-sm shrink-0 group-hover:scale-110 transition-transform">
              ⚔️
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center justify-between sm:justify-start gap-1">
                <span>Opponent History</span>
                <span className="text-xs text-emerald-400 group-hover:translate-y-0.5 transition-transform">↓</span>
              </div>
              <p className="text-[11px] text-gray-400 leading-snug line-clamp-1 sm:line-clamp-2 mt-0.5">
                Head-to-head records &amp; match form
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
