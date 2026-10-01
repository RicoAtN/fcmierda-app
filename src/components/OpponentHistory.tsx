"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Roboto_Slab } from "next/font/google";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700", "800"] });

export type MatchResultItem = {
  id: number;
  date: string;
  opponent: string;
  game_result?: string;
  goals_fcmierda?: number | string;
  goals_opponent?: number | string;
  youtube?: string;
  location?: string;
  competition?: string;
};

type Props = {
  allResults: MatchResultItem[];
};

type OpponentRecord = {
  name: string;
  cleanKey: string;
  matches: MatchResultItem[];
  totalPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  winRate: number;
  lastMatchDate: string;
};

function formatShortDate(dateStr: string) {
  if (!dateStr) return "-";
  const [year, month, day] = dateStr.split("-");
  if (!year || !month || !day) return dateStr;
  return `${day}-${month}-${year}`;
}

function getMatchOutcome(m: MatchResultItem): { outcome: "W" | "D" | "L"; gf: number; ga: number } {
  const gf = Number(m.goals_fcmierda ?? 0);
  const ga = Number(m.goals_opponent ?? 0);
  const gr = (m.game_result || "").trim().toLowerCase();

  let outcome: "W" | "D" | "L";
  if (gr === "win" || gr === "won" || gr === "w") {
    outcome = "W";
  } else if (gr === "loss" || gr === "lost" || gr === "l") {
    outcome = "L";
  } else if (gr === "draw" || gr === "d" || gr === "tie") {
    outcome = "D";
  } else {
    if (gf > ga) outcome = "W";
    else if (gf < ga) outcome = "L";
    else outcome = "D";
  }

  return { outcome, gf, ga };
}

const h2hColorFor = (outcome: "W" | "D" | "L") =>
  outcome === "W"
    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:border-emerald-400 hover:bg-emerald-500/30 shadow-emerald-500/10"
    : outcome === "D"
    ? "bg-amber-500/20 text-amber-300 border-amber-500/50 hover:border-amber-400 hover:bg-amber-500/30 shadow-amber-500/10"
    : "bg-rose-500/20 text-rose-300 border-rose-500/50 hover:border-rose-400 hover:bg-rose-500/30 shadow-rose-500/10";

type SortOption = "most-matches" | "most-wins" | "highest-winrate" | "recent" | "alphabetical";
type FilterOption = "all" | "winning" | "draw" | "losing";

export default function OpponentHistory({ allResults }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("most-matches");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [expandedOpponents, setExpandedOpponents] = useState<Record<string, boolean>>({});
  const [copiedLink, setCopiedLink] = useState(false);

  // Auto-scroll to this section if URL contains #opponent-history or #opponents or #h2h
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkHashAndScroll = () => {
      const hash = (window.location.hash || "").toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const sectionParam = (params.get("section") || params.get("tab") || "").toLowerCase();

      if (
        hash === "#opponent-history" ||
        hash === "#opponents" ||
        hash === "#h2h" ||
        hash === "#head-to-head" ||
        sectionParam === "opponent-history" ||
        sectionParam === "opponents" ||
        sectionParam === "h2h"
      ) {
        const attemptScroll = (count = 0) => {
          const el = document.getElementById("opponent-history");
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          } else if (count < 8) {
            setTimeout(() => attemptScroll(count + 1), 70);
          }
        };
        setTimeout(() => attemptScroll(0), 120);
      }
    };

    checkHashAndScroll();
    window.addEventListener("hashchange", checkHashAndScroll);
    return () => window.removeEventListener("hashchange", checkHashAndScroll);
  }, []);

  const copyDirectShareLink = () => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}${window.location.pathname}#opponent-history`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }).catch(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      });
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Group all results by opponent in memory (0 extra DB queries)
  const opponentRecords = useMemo<OpponentRecord[]>(() => {
    if (!allResults || allResults.length === 0) return [];

    const map = new Map<string, { name: string; matches: MatchResultItem[] }>();

    for (const match of allResults) {
      const oppRaw = (match.opponent || "").trim();
      if (!oppRaw) continue;
      const key = oppRaw.toLowerCase();

      if (!map.has(key)) {
        map.set(key, { name: oppRaw, matches: [] });
      }
      map.get(key)!.matches.push(match);
    }

    const records: OpponentRecord[] = [];

    for (const [cleanKey, data] of map.entries()) {
      const sortedMatches = [...data.matches].sort((a, b) => {
        const da = a.date || "";
        const db = b.date || "";
        if (da !== db) return db.localeCompare(da);
        return (b.id || 0) - (a.id || 0);
      });

      let wins = 0;
      let draws = 0;
      let losses = 0;
      let goalsFor = 0;
      let goalsAgainst = 0;

      for (const m of sortedMatches) {
        const { outcome, gf, ga } = getMatchOutcome(m);
        if (outcome === "W") wins++;
        else if (outcome === "D") draws++;
        else losses++;

        goalsFor += gf;
        goalsAgainst += ga;
      }

      const totalPlayed = sortedMatches.length;
      const winRate = totalPlayed > 0 ? Math.round((wins / totalPlayed) * 100) : 0;
      const goalDiff = goalsFor - goalsAgainst;
      const lastMatchDate = sortedMatches[0]?.date || "";

      records.push({
        name: data.name,
        cleanKey,
        matches: sortedMatches,
        totalPlayed,
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        goalDiff,
        winRate,
        lastMatchDate,
      });
    }

    return records;
  }, [allResults]);

  // Leader metrics: Most Wins, Most Goals Scored, Most Goals Against, Lowest Win Rate
  const statsOverview = useMemo(() => {
    const totalOpponents = opponentRecords.length;
    let totalWins = 0;
    let totalMatches = 0;

    let mostWinsOpp: OpponentRecord | null = null;
    let mostGoalsScoredOpp: OpponentRecord | null = null;
    let mostGoalsAgainstOpp: OpponentRecord | null = null;
    let lowestWinRateOpp: OpponentRecord | null = null;

    for (const opp of opponentRecords) {
      totalWins += opp.wins;
      totalMatches += opp.totalPlayed;

      if (!mostWinsOpp || opp.wins > mostWinsOpp.wins) {
        mostWinsOpp = opp;
      }
      if (!mostGoalsScoredOpp || opp.goalsFor > mostGoalsScoredOpp.goalsFor) {
        mostGoalsScoredOpp = opp;
      }
      if (!mostGoalsAgainstOpp || opp.goalsAgainst > mostGoalsAgainstOpp.goalsAgainst) {
        mostGoalsAgainstOpp = opp;
      }
      if (!lowestWinRateOpp) {
        lowestWinRateOpp = opp;
      } else {
        if (opp.winRate < lowestWinRateOpp.winRate) {
          lowestWinRateOpp = opp;
        } else if (opp.winRate === lowestWinRateOpp.winRate) {
          if (opp.totalPlayed > lowestWinRateOpp.totalPlayed) {
            lowestWinRateOpp = opp;
          } else if (opp.totalPlayed === lowestWinRateOpp.totalPlayed && opp.losses > lowestWinRateOpp.losses) {
            lowestWinRateOpp = opp;
          }
        }
      }
    }

    return {
      totalOpponents,
      totalMatches,
      totalWins,
      mostWinsOpp,
      mostGoalsScoredOpp,
      mostGoalsAgainstOpp,
      lowestWinRateOpp,
    };
  }, [opponentRecords]);

  // Filter and sort opponents
  const filteredAndSortedOpponents = useMemo(() => {
    let result = opponentRecords;

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      result = result.filter((opp) => opp.name.toLowerCase().includes(q));
    }

    if (filterBy === "winning") {
      result = result.filter((opp) => opp.wins > opp.losses);
    } else if (filterBy === "draw") {
      result = result.filter((opp) => opp.wins === opp.losses);
    } else if (filterBy === "losing") {
      result = result.filter((opp) => opp.losses > opp.wins);
    }

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case "most-matches":
          if (b.totalPlayed !== a.totalPlayed) return b.totalPlayed - a.totalPlayed;
          return b.wins - a.wins;
        case "most-wins":
          if (b.wins !== a.wins) return b.wins - a.wins;
          return b.totalPlayed - a.totalPlayed;
        case "highest-winrate":
          if (b.winRate !== a.winRate) return b.winRate - a.winRate;
          return b.totalPlayed - a.totalPlayed;
        case "recent":
          return (b.lastMatchDate || "").localeCompare(a.lastMatchDate || "");
        case "alphabetical":
          return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
        default:
          return 0;
      }
    });
  }, [opponentRecords, searchTerm, sortBy, filterBy]);

  const toggleExpand = (key: string) => {
    setExpandedOpponents((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSelectMatch = (matchId: number) => {
    if (typeof window === "undefined") return;
    window.location.hash = `match-${matchId}`;
    const el = document.getElementById("match-details");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section id="opponent-history" className="w-full mb-10 scroll-mt-24 sm:scroll-mt-28">
      <div className="max-w-4xl w-full rounded-2xl p-4 sm:p-7 md:p-8 text-white bg-gray-950/85 border border-gray-800 shadow-2xl backdrop-blur-sm mx-auto">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <span className="text-xl sm:text-2xl">⚔️</span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={`text-xl sm:text-2xl font-extrabold text-white tracking-tight ${robotoSlab.className}`}>
                  Opponent Head-to-Head History
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                Historic records, scoreline results, and recent form against every rival team.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
            {/* Share / Copy Direct URL Link Button */}
            <button
              type="button"
              onClick={copyDirectShareLink}
              title="Copy direct link to share this section"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-sm ${
                copiedLink
                  ? "bg-emerald-950 border-emerald-500 text-emerald-300"
                  : "bg-gray-900 hover:bg-gray-800 border-gray-700/80 hover:border-emerald-500/50 text-gray-200 hover:text-white"
              }`}
            >
              <span>{copiedLink ? "✓" : "🔗"}</span>
              <span>{copiedLink ? "Link Copied!" : "Share Link"}</span>
            </button>

            <span className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs font-bold text-emerald-300">
              {statsOverview.totalOpponents} Opponents
            </span>
          </div>
        </div>

        {/* Subtle Leader Highlights Cards */}
        {statsOverview.totalOpponents > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 mb-4">
            {/* 1. Most Wins */}
            <div
              onClick={() => statsOverview.mostWinsOpp && setSearchTerm(statsOverview.mostWinsOpp.name)}
              title={statsOverview.mostWinsOpp ? `Click to filter by ${statsOverview.mostWinsOpp.name}` : undefined}
              className="p-2.5 rounded-xl bg-gray-900/60 hover:bg-gray-900/90 border border-gray-800/80 hover:border-emerald-500/40 transition-all flex flex-col justify-between shadow-sm cursor-pointer group"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-400/90 flex items-center gap-1">
                  <span>🏆</span>
                  <span>Most Wins</span>
                </span>
                <span className="text-[10px] text-gray-500 group-hover:text-emerald-400 transition-colors">🔍</span>
              </div>
              <div className="mt-1.5 min-w-0">
                <div className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                  {statsOverview.mostWinsOpp?.name || "-"}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1 flex-wrap">
                  <strong className="text-emerald-400 font-mono font-bold">{statsOverview.mostWinsOpp?.wins ?? 0} wins</strong>
                  <span>({statsOverview.mostWinsOpp?.totalPlayed ?? 0} played)</span>
                </div>
              </div>
            </div>

            {/* 2. Most Goals Scored */}
            <div
              onClick={() => statsOverview.mostGoalsScoredOpp && setSearchTerm(statsOverview.mostGoalsScoredOpp.name)}
              title={statsOverview.mostGoalsScoredOpp ? `Click to filter by ${statsOverview.mostGoalsScoredOpp.name}` : undefined}
              className="p-2.5 rounded-xl bg-gray-900/60 hover:bg-gray-900/90 border border-gray-800/80 hover:border-emerald-500/40 transition-all flex flex-col justify-between shadow-sm cursor-pointer group"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-400/90 flex items-center gap-1">
                  <span>⚽</span>
                  <span>Most Goals Scored</span>
                </span>
                <span className="text-[10px] text-gray-500 group-hover:text-emerald-400 transition-colors">🔍</span>
              </div>
              <div className="mt-1.5 min-w-0">
                <div className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                  {statsOverview.mostGoalsScoredOpp?.name || "-"}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1 flex-wrap">
                  <strong className="text-emerald-400 font-mono font-bold">{statsOverview.mostGoalsScoredOpp?.goalsFor ?? 0} goals</strong>
                  <span>scored</span>
                </div>
              </div>
            </div>

            {/* 3. Most Goals Against */}
            <div
              onClick={() => statsOverview.mostGoalsAgainstOpp && setSearchTerm(statsOverview.mostGoalsAgainstOpp.name)}
              title={statsOverview.mostGoalsAgainstOpp ? `Click to filter by ${statsOverview.mostGoalsAgainstOpp.name}` : undefined}
              className="p-2.5 rounded-xl bg-gray-900/60 hover:bg-gray-900/90 border border-gray-800/80 hover:border-amber-500/40 transition-all flex flex-col justify-between shadow-sm cursor-pointer group"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1">
                  <span>🛡️</span>
                  <span>Most Goals Against</span>
                </span>
                <span className="text-[10px] text-gray-500 group-hover:text-amber-400 transition-colors">🔍</span>
              </div>
              <div className="mt-1.5 min-w-0">
                <div className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                  {statsOverview.mostGoalsAgainstOpp?.name || "-"}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1 flex-wrap">
                  <strong className="text-amber-400 font-mono font-bold">{statsOverview.mostGoalsAgainstOpp?.goalsAgainst ?? 0} goals</strong>
                  <span>conceded</span>
                </div>
              </div>
            </div>

            {/* 4. Lowest Win Rate */}
            <div
              onClick={() => statsOverview.lowestWinRateOpp && setSearchTerm(statsOverview.lowestWinRateOpp.name)}
              title={statsOverview.lowestWinRateOpp ? `Click to filter by ${statsOverview.lowestWinRateOpp.name}` : undefined}
              className="p-2.5 rounded-xl bg-gray-900/60 hover:bg-gray-900/90 border border-gray-800/80 hover:border-rose-500/40 transition-all flex flex-col justify-between shadow-sm cursor-pointer group"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-rose-400/90 flex items-center gap-1">
                  <span>📉</span>
                  <span>Lowest Win Rate</span>
                </span>
                <span className="text-[10px] text-gray-500 group-hover:text-rose-400 transition-colors">🔍</span>
              </div>
              <div className="mt-1.5 min-w-0">
                <div className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-rose-300 transition-colors">
                  {statsOverview.lowestWinRateOpp?.name || "-"}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1 flex-wrap">
                  <strong className="text-rose-400 font-mono font-bold">{statsOverview.lowestWinRateOpp?.winRate ?? 0}% win</strong>
                  <span>({statsOverview.lowestWinRateOpp?.wins ?? 0}W, {statsOverview.lowestWinRateOpp?.losses ?? 0}L)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Interactive Controls Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mb-4 p-2.5 sm:p-3 rounded-xl bg-gray-900/60 border border-gray-800/80">
          {/* Search box */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 pointer-events-none text-xs">
              🔍
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search opponent..."
              className="w-full bg-gray-950 text-white text-xs rounded-lg pl-8 pr-7 py-1.5 sm:py-2 border border-gray-700/80 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder-gray-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Filter pills */}
            <div className="hidden md:flex items-center gap-1 bg-gray-950 p-1 rounded-lg border border-gray-800 text-[11px]">
              <button
                type="button"
                onClick={() => setFilterBy("all")}
                className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                  filterBy === "all" ? "bg-emerald-950 text-emerald-300 font-bold border border-emerald-500/40" : "text-gray-400 hover:text-white"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterBy("winning")}
                className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                  filterBy === "winning" ? "bg-emerald-950 text-emerald-300 font-bold border border-emerald-500/40" : "text-gray-400 hover:text-white"
                }`}
              >
                Wins &gt; Losses
              </button>
              <button
                type="button"
                onClick={() => setFilterBy("losing")}
                className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                  filterBy === "losing" ? "bg-rose-950/80 text-rose-300 font-bold border border-rose-500/40" : "text-gray-400 hover:text-white"
                }`}
              >
                Losses &gt; Wins
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Sort opponents"
                className="appearance-none bg-gray-950 text-white text-xs font-medium rounded-lg pl-3 pr-7 py-1.5 sm:py-2 border border-gray-700/80 hover:border-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all cursor-pointer shadow-sm"
              >
                <option value="most-matches">Sort: Most Matches</option>
                <option value="most-wins">Sort: Most Wins</option>
                <option value="highest-winrate">Sort: Highest Win Rate</option>
                <option value="recent">Sort: Most Recent</option>
                <option value="alphabetical">Sort: Name (A-Z)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Short Explainer Note */}
        <div className="flex items-center gap-2 mb-3.5 px-3.5 py-2 rounded-xl bg-emerald-950/30 border border-emerald-500/25 text-xs text-emerald-300">
          <span className="text-sm shrink-0">💡</span>
          <span className="leading-relaxed">
            <strong className="font-semibold text-white">Interactive Table:</strong> Showing 5 rows at a time — scroll down inside to view all {filteredAndSortedOpponents.length} opponents. Click any score tile to jump directly to its match recap!
          </span>
        </div>

        {/* 5-Row Fixed Scrollable Container */}
        {filteredAndSortedOpponents.length === 0 ? (
          <div className="p-8 text-center text-xs sm:text-sm text-gray-400 bg-gray-900/40 rounded-xl border border-gray-800">
            No opponents match your search criteria.
          </div>
        ) : (
          <div className="rounded-xl border border-gray-800 bg-gray-900/90 shadow-inner overflow-hidden">
            {/* Scrollable body sized to show ~5 rows before scrolling */}
            <div
              className="overflow-y-auto custom-scrollbar divide-y divide-gray-800/80"
              style={{ maxHeight: "375px" }}
            >
              {filteredAndSortedOpponents.map((opp) => {
                const isExpanded = !!expandedOpponents[opp.cleanKey];
                const last5Matches = opp.matches.slice(0, 5);

                return (
                  <div
                    key={opp.cleanKey}
                    className="hover:bg-gray-800/40 transition-colors"
                  >
                    {/* Streamlined Opponent Row (No placeholder icon, larger desktop typography & tiles) */}
                    <div className="p-3 sm:px-4 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 min-h-[64px] sm:min-h-[72px]">
                      {/* Left: Opponent Name, Match Count & Goals */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className={`text-sm sm:text-base md:text-lg font-bold text-white tracking-tight truncate max-w-[190px] sm:max-w-[280px] ${robotoSlab.className}`}>
                            {opp.name}
                          </h3>
                          <span className="px-2 sm:px-2.5 py-0.5 rounded-full bg-gray-800/90 border border-gray-700/70 text-[11px] sm:text-xs font-semibold text-gray-200 whitespace-nowrap">
                            {opp.totalPlayed} {opp.totalPlayed === 1 ? "match" : "matches"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5 text-xs sm:text-sm text-gray-300 mt-1 flex-wrap">
                          <span>
                            Goals: <strong className="text-emerald-400 font-mono font-bold">{opp.goalsFor}</strong>:
                            <strong className="text-rose-400 font-mono font-bold">{opp.goalsAgainst}</strong>{" "}
                            <span className="text-gray-400 font-mono text-xs">
                              ({opp.goalDiff >= 0 ? `+${opp.goalDiff}` : opp.goalDiff})
                            </span>
                          </span>
                          <span className="text-gray-600 hidden sm:inline">•</span>
                          <span className="hidden sm:inline text-gray-400 text-xs">
                            Last match: <strong className="text-gray-200">{formatShortDate(opp.lastMatchDate)}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Right: Record Pills + Form Score Tiles + Matches Toggle */}
                      <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-800/50">
                        {/* W - D - L Record Pills */}
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-mono font-bold shrink-0">
                          <span className="px-2 sm:px-2.5 py-1 rounded-md bg-emerald-950/70 border border-emerald-500/40 text-emerald-300">
                            {opp.wins}W
                          </span>
                          <span className="px-2 sm:px-2.5 py-1 rounded-md bg-amber-950/70 border border-amber-500/40 text-amber-300">
                            {opp.draws}D
                          </span>
                          <span className="px-2 sm:px-2.5 py-1 rounded-md bg-rose-950/70 border border-rose-500/40 text-rose-300">
                            {opp.losses}L
                          </span>
                        </div>

                        {/* Recent Form Score Tiles (Fixtures style, enlarged for desktop) */}
                        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mr-0.5 hidden md:inline">
                            Form:
                          </span>
                          <div className="flex items-center gap-1 sm:gap-1.5 flex-nowrap">
                            {last5Matches.map((m) => {
                              const { outcome, gf, ga } = getMatchOutcome(m);
                              return (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => handleSelectMatch(m.id)}
                                  title={`${m.date ? `${formatShortDate(m.date)}: ` : ""}${
                                    outcome === "W" ? "Win" : outcome === "D" ? "Draw" : "Loss"
                                  } (${gf}-${ga}) vs ${m.opponent} (Click to view match report)`}
                                  className={`group/h2h flex flex-col items-center justify-center rounded-lg sm:rounded-xl border shadow-sm ${h2hColorFor(
                                    outcome
                                  )} px-1 py-0.5 sm:px-1.5 sm:py-1 w-7 sm:w-9 md:w-10 h-7 sm:h-9 md:h-10 shrink-0 transition-all duration-150 hover:scale-110 active:scale-95 cursor-pointer`}
                                >
                                  <span className="text-[9px] sm:text-xs md:text-sm font-black tracking-wider leading-none">
                                    {outcome}
                                  </span>
                                  <span className="text-[7px] sm:text-[9px] md:text-[10px] font-mono font-bold tracking-tight leading-none mt-0.5 opacity-90 group-hover/h2h:opacity-100">
                                    {gf}-{ga}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Accordion Expand / Collapse Button */}
                        <button
                          type="button"
                          onClick={() => toggleExpand(opp.cleanKey)}
                          className="px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-xs sm:text-sm font-semibold text-gray-200 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm"
                          aria-expanded={isExpanded}
                        >
                          <span>{isExpanded ? "Hide" : "Matches"}</span>
                          <span className="text-[10px] sm:text-xs">{isExpanded ? "▲" : "▼"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Accordion: Full Match Log vs this Opponent */}
                    {isExpanded && (
                      <div className="px-3 sm:px-4 pb-3.5 pt-1.5 border-t border-gray-800/80 bg-gray-950/70">
                        <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center justify-between">
                          <span>All Matches vs {opp.name} ({opp.matches.length})</span>
                          <span className="text-gray-500 font-normal text-[11px]">Sorted latest first</span>
                        </div>

                        <div className="overflow-x-auto max-h-52 overflow-y-auto custom-scrollbar rounded-lg border border-gray-800">
                          <table className="min-w-full text-xs sm:text-sm text-left">
                            <thead className="bg-gray-900/90 text-gray-400 uppercase font-semibold border-b border-gray-800 sticky top-0 z-10 text-[11px] sm:text-xs">
                              <tr>
                                <th className="px-3 py-2">Date</th>
                                <th className="px-3 py-2">Competition</th>
                                <th className="px-3 py-2 text-center">Result</th>
                                <th className="px-3 py-2 text-center">Score</th>
                                <th className="px-3 py-2 text-right">Report</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/60">
                              {opp.matches.map((m) => {
                                const { outcome, gf, ga } = getMatchOutcome(m);
                                return (
                                  <tr key={m.id} className="hover:bg-gray-800/30 transition-colors">
                                    <td className="px-3 py-2 text-gray-300 font-mono whitespace-nowrap">
                                      {formatShortDate(m.date)}
                                    </td>
                                    <td className="px-3 py-2 text-gray-300 truncate max-w-[160px]">
                                      {m.competition || "-"}
                                    </td>
                                    <td className="px-3 py-2 text-center whitespace-nowrap">
                                      {outcome === "W" && (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-bold text-xs">
                                          Win
                                        </span>
                                      )}
                                      {outcome === "D" && (
                                        <span className="px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 font-bold text-xs">
                                          Draw
                                        </span>
                                      )}
                                      {outcome === "L" && (
                                        <span className="px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/50 text-rose-300 font-bold text-xs">
                                          Loss
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-3 py-2 text-center font-mono font-bold text-white whitespace-nowrap">
                                      {gf} - {ga}
                                    </td>
                                    <td className="px-3 py-2 text-right whitespace-nowrap">
                                      <button
                                        type="button"
                                        onClick={() => handleSelectMatch(m.id)}
                                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
                                      >
                                        <span>View</span>
                                        <span>↗</span>
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Subtle scroll footer hint */}
            <div className="px-4 py-2.5 bg-gray-950 border-t border-gray-800 text-xs text-gray-400 flex items-center justify-between">
              <span>Showing {filteredAndSortedOpponents.length} opponents in table</span>
              <span className="text-gray-400 text-xs">Scroll inside to view more ↓</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
