"use client";
import React, { useEffect, useState, useMemo } from "react";
import { Roboto_Slab, Montserrat } from "next/font/google";
import Menu from "@/components/Menu";
import Footer from "@/components/Footer";
import TeamForm from "@/components/TeamForm";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "600"] });

function CrownIcon({ className = "w-3.5 h-3.5 text-amber-400" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
    </svg>
  );
}

function TrophyIcon({ className = "w-3.5 h-3.5 text-emerald-400" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.45 1-1 1H7v4h10v-4h-2c-.55 0-1-.45-1-1v-2.34" />
      <path d="M6 4h12v7a6 6 0 0 1-12 0V4z" />
    </svg>
  );
}

function ChevronDownIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

type CompetitionItem = {
  id: string;
  competition_name: string;
  start_period?: string | null;
  end_period?: string | null;
};

type PlayerStats = {
  player_id: number;
  player_name?: string;
  match_played: number;
  goals: number;
  assists: number;
  clean_sheets: number;
  goals_involvement?: number;
  average_goals_per_match?: number;
  average_goals_conceded_per_match?: number;
  main_player?: boolean;
  fcmierda_man_of_the_match_awards?: number;
};

type TeamStats = {
  match_played: number;
  clean_sheets: number;
  total_wins: number;
  total_losses: number;
  total_draws: number;
  goals_scored: number;
  average_goals_per_match: number;
  goals_conceded: number;
  average_goals_conceded_per_match: number;
  win_percentage: number;
};

export default function StatisticsPage() {
  // Competitions list
  const [competitions, setCompetitions] = useState<CompetitionItem[]>([]);

  // Selected filters
  const [selectedTeamComp, setSelectedTeamComp] = useState<string>("all");
  const [selectedPlayerComp, setSelectedPlayerComp] = useState<string>("all");

  // Hydrate initial stats from session cache for instant render
  useEffect(() => {
    try {
      const cachedComps = sessionStorage.getItem("fcmierda_stats_comps_cache");
      const cachedStats = sessionStorage.getItem("fcmierda_stats_players_all_cache");
      const cachedTeam = sessionStorage.getItem("fcmierda_stats_team_all_cache");

      if (cachedComps) {
        const parsed = JSON.parse(cachedComps);
        if (Array.isArray(parsed) && parsed.length > 0) setCompetitions(parsed);
      }
      if (cachedStats) {
        const parsed = JSON.parse(cachedStats);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStats(parsed);
          setIsLoadingStats(false);
        }
      }
      if (cachedTeam) {
        const parsed = JSON.parse(cachedTeam);
        if (parsed) {
          setTeamStats(parsed);
          setIsLoadingTeamStats(false);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch available competitions
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/competition?_t=${Date.now()}`, { cache: "no-store" });
        if (res.ok) {
          const { data } = (await res.json()) as { data: CompetitionItem[] };
          if (isMounted && Array.isArray(data)) {
            setCompetitions(data);
            try {
              sessionStorage.setItem("fcmierda_stats_comps_cache", JSON.stringify(data));
            } catch {
              // ignore
            }
          }
        }
      } catch (err) {
        console.error("Failed to load competitions", err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch stats for top performers & overall stats
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const compQuery = selectedPlayerComp !== "all" ? `&competition=${encodeURIComponent(selectedPlayerComp)}` : "";
        const res = await fetch(`/api/player-statistics?_t=${Date.now()}${compQuery}`, { cache: "no-store" });
        const { data } = (await res.json()) as { data: PlayerStats[] };
        if (isMounted) {
          setStats(data ?? []);
          if (selectedPlayerComp === "all") {
            try {
              sessionStorage.setItem("fcmierda_stats_players_all_cache", JSON.stringify(data ?? []));
            } catch {
              // ignore
            }
          }
        }
      } catch (e: any) {
        console.error("Failed to load player statistics", e);
      } finally {
        if (isMounted) setIsLoadingStats(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [selectedPlayerComp]);

  // Fetch team statistics
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [isLoadingTeamStats, setIsLoadingTeamStats] = useState(true);
  const [teamStatsError, setTeamStatsError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const compQuery = selectedTeamComp !== "all" ? `&competition=${encodeURIComponent(selectedTeamComp)}` : "";
        const res = await fetch(`/api/team-statistics?_t=${Date.now()}${compQuery}`, { cache: "no-store" });
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error((errJson as { error?: string })?.error || `HTTP ${res.status}`);
        }
        const { data } = (await res.json()) as { data: TeamStats };
        if (isMounted) {
          setTeamStats(data);
          setTeamStatsError(null);
          if (selectedTeamComp === "all") {
            try {
              sessionStorage.setItem("fcmierda_stats_team_all_cache", JSON.stringify(data));
            } catch {
              // ignore
            }
          }
        }
      } catch (e: any) {
        if (isMounted) {
          setTeamStatsError(e instanceof Error ? e.message : "Failed to load");
        }
      } finally {
        if (isMounted) setIsLoadingTeamStats(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [selectedTeamComp]);

  // --- STATS HELPER FUNCTIONS ---
  type StatKey =
    | "goals"
    | "assists"
    | "average_goals_per_match"
    | "average_goals_conceded_per_match"
    | "match_played"
    | "clean_sheets"
    | "goals_involvement"
    | "fcmierda_man_of_the_match_awards";

  interface GroupedStat {
    score: number;
    players: PlayerStats[];
  }

  interface StatBlock {
    heading: string;
    list?: PlayerStats[];
    groupedList?: GroupedStat[];
    valueKey: StatKey;
    isAvg?: boolean;
    invert?: boolean;
  }

  const toNum = (v: unknown) => {
    if (typeof v === "number") return Number.isFinite(v) ? v : null;
    if (typeof v === "string") {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  const rankTop = (items: PlayerStats[], key: StatKey, take = 5) =>
    [...items]
      .filter((s) => toNum((s as any)[key]) !== null)
      .sort((a, b) => {
        const av = toNum((a as any)[key])!;
        const bv = toNum((b as any)[key])!;
        return bv - av;
      })
      .slice(0, take);

  const rankLowest = (items: PlayerStats[], key: StatKey, take = 5) =>
    [...items]
      .filter((s) => toNum((s as any)[key]) !== null)
      .sort((a, b) => {
        const av = toNum((a as any)[key])!;
        const bv = toNum((b as any)[key])!;
        if (av === 0 && bv !== 0) return 1;
        if (bv === 0 && av !== 0) return -1;
        return av - bv;
      })
      .slice(0, take);

  const rankGroupedTop = (items: PlayerStats[], key: StatKey, take = 5) => {
    const validItems = items.filter((s) => {
      const val = toNum((s as any)[key]);
      return val !== null && val > 0;
    });
    const sorted = [...validItems].sort((a, b) => {
      const av = toNum((a as any)[key])!;
      const bv = toNum((b as any)[key])!;
      return bv - av;
    });
    const groups: GroupedStat[] = [];
    for (const item of sorted) {
      const score = toNum((item as any)[key])!;
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.score === score) {
        lastGroup.players.push(item);
      } else {
        groups.push({ score, players: [item] });
      }
    }
    return groups.slice(0, take);
  };

  const mains = useMemo(() => stats.filter((s) => s.main_player === true), [stats]);

  // Determine minimum matches threshold for averages:
  // All-time: min 5 matches; Competition: min 2 matches (or min 1 if matches played is very small)
  const isAllTimePlayerView = selectedPlayerComp === "all";
  const minMatchesThreshold = isAllTimePlayerView ? 5 : 2;

  interface TopPerformerBlock {
    heading: string;
    subtitle?: string;
    list?: PlayerStats[];
    groupedList?: GroupedStat[];
    valueKey: StatKey;
    isAvg?: boolean;
    invert?: boolean;
  }

  const renderTopPerformerCards = (blocks: TopPerformerBlock[], isLoading: boolean = false) =>
    blocks.map((block, i) => (
      <div
        key={i}
        className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50 hover:border-gray-600/70 transition-colors flex flex-col justify-between"
      >
        <div>
          {/* Card Header */}
          <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-gray-700/40">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">
              {block.heading}
            </span>
            {block.subtitle && (
              <span className="text-[11px] text-gray-400 font-normal">
                {block.subtitle}
              </span>
            )}
          </div>

          {/* List */}
          <ul className="space-y-1.5">
            {(block.list || []).map((ps, idx) => {
              const name = (ps.player_name || `Player ${ps.player_id}`).trim();
              const raw = toNum((ps as any)[block.valueKey]) ?? 0;
              const val = block.isAvg ? raw.toFixed(2) : String(raw);
              const isFirst = idx === 0;

              return (
                <li
                  key={`${block.valueKey}-${ps.player_id}`}
                  className={`flex items-center justify-between rounded-md px-3 py-2 cursor-pointer transition-colors group text-sm ${
                    isFirst
                      ? isAllTimePlayerView
                        ? "bg-amber-500/10 border border-amber-500/30 text-amber-100 hover:bg-amber-500/15"
                        : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-100 hover:bg-emerald-500/15"
                      : "bg-black/20 hover:bg-black/40 text-gray-200"
                  }`}
                  onClick={() => window.location.assign(`/team?playerId=${ps.player_id}#player-bio`)}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex items-center gap-1 w-7 shrink-0">
                      {isFirst ? (
                        <>
                          <span className={`font-bold ${isAllTimePlayerView ? "text-amber-400" : "text-emerald-400"}`}>1.</span>
                          {isAllTimePlayerView ? (
                            <CrownIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          ) : (
                            <TrophyIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400">{idx + 1}.</span>
                      )}
                    </span>
                    <span
                      className={`truncate font-medium transition-colors ${
                        isFirst
                          ? isAllTimePlayerView
                            ? "text-amber-100 group-hover:text-amber-50 font-semibold"
                            : "text-emerald-100 group-hover:text-emerald-50 font-semibold"
                          : "text-gray-200 group-hover:text-green-300"
                      }`}
                    >
                      {name}
                    </span>
                  </div>

                  <span
                    className={`ml-3 tabular-nums font-semibold ${
                      isFirst
                        ? isAllTimePlayerView
                          ? "text-amber-300"
                          : "text-emerald-300"
                        : "text-green-300"
                    }`}
                  >
                    {val}
                  </span>
                </li>
              );
            })}

            {(block.groupedList || []).map((group, idx) => {
              const val = block.isAvg ? group.score.toFixed(2) : String(group.score);
              const isFirst = idx === 0;

              return (
                <li
                  key={`${block.valueKey}-group-${idx}`}
                  className={`flex items-start justify-between rounded-md px-3 py-2 transition-colors text-sm ${
                    isFirst
                      ? isAllTimePlayerView
                        ? "bg-amber-500/10 border border-amber-500/30 text-amber-100"
                        : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-100"
                      : "bg-black/20 text-gray-200"
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <span className="flex items-center gap-1 w-7 shrink-0 mt-0.5">
                      {isFirst ? (
                        <>
                          <span className={`font-bold ${isAllTimePlayerView ? "text-amber-400" : "text-emerald-400"}`}>1.</span>
                          {isAllTimePlayerView ? (
                            <CrownIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          ) : (
                            <TrophyIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400">{idx + 1}.</span>
                      )}
                    </span>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 flex-1 min-w-0">
                      {group.players.map((ps, pIdx) => {
                        const name = (ps.player_name || `Player ${ps.player_id}`).trim();
                        return (
                          <React.Fragment key={ps.player_id}>
                            <a
                              href={`/team?playerId=${ps.player_id}#player-bio`}
                              className={`transition-colors truncate max-w-full ${
                                isFirst
                                  ? isAllTimePlayerView
                                    ? "font-semibold text-amber-100 hover:text-white"
                                    : "font-semibold text-emerald-100 hover:text-white"
                                  : "font-medium text-gray-200 hover:text-green-300"
                              }`}
                            >
                              {name}
                            </a>
                            {pIdx < group.players.length - 1 && (
                              <span className={isFirst ? (isAllTimePlayerView ? "text-amber-400/60" : "text-emerald-400/60") : "text-gray-500"}>,</span>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>

                  <span
                    className={`ml-3 tabular-nums font-semibold shrink-0 ${
                      isFirst
                        ? isAllTimePlayerView
                          ? "text-amber-300"
                          : "text-emerald-300"
                        : "text-green-300"
                    }`}
                  >
                    {val}
                  </span>
                </li>
              );
            })}

            {isLoading ? (
              <li className="text-xs text-gray-500 animate-pulse py-2 text-center">Loading data...</li>
            ) : !(block.list?.length) && !(block.groupedList?.length) ? (
              <li className="text-xs text-gray-500 py-1 text-center">No data for this competition.</li>
            ) : null}
          </ul>
        </div>
      </div>
    ));

  const renderStatBlocks = (blocks: StatBlock[], scrollable: boolean = false, isLoading: boolean = false) =>
    blocks.map((block, i) => (
      <div key={i}>
        <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">{block.heading}</div>
        <ul
          className={`space-y-2 ${
            scrollable
              ? "max-h-[432px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-black/10 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-600 hover:[&::-webkit-scrollbar-thumb]:bg-gray-500 [&::-webkit-scrollbar-thumb]:rounded-full"
              : ""
          }`}
        >
          {(block.list || []).map((ps, idx) => {
            const name = (ps.player_name || `Player ${ps.player_id}`).trim();
            const raw = toNum((ps as any)[block.valueKey]) ?? 0;
            const val = block.isAvg ? raw.toFixed(2) : String(raw);
            return (
              <li
                key={`${block.valueKey}-${ps.player_id}`}
                className="flex items-center justify-between bg-black/20 hover:bg-black/40 cursor-pointer rounded-md px-3 py-2 text-sm transition-colors group"
                onClick={() => window.location.assign(`/team?playerId=${ps.player_id}#player-bio`)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-gray-400 w-5">{idx + 1}.</span>
                  <span className="font-medium truncate group-hover:text-green-300 transition-colors">{name}</span>
                </div>
                <span className="font-semibold tabular-nums text-green-300">{val}</span>
              </li>
            );
          })}
          {(block.groupedList || []).map((group, idx) => {
            const val = block.isAvg ? group.score.toFixed(2) : String(group.score);
            return (
              <li
                key={`${block.valueKey}-group-${idx}`}
                className="flex items-start justify-between bg-black/20 rounded-md px-3 py-2 text-sm"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <span className="text-gray-400 w-5">{idx + 1}.</span>
                  <div className="flex flex-wrap gap-x-2 gap-y-1 flex-1">
                    {group.players.map((ps, pIdx) => {
                      const name = (ps.player_name || `Player ${ps.player_id}`).trim();
                      return (
                        <React.Fragment key={ps.player_id}>
                          <a href={`/team?playerId=${ps.player_id}#player-bio`} className="font-medium hover:text-green-300 transition-colors">
                            {name}
                          </a>
                          {pIdx < group.players.length - 1 && <span className="text-gray-500">,</span>}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
                <span className="font-semibold tabular-nums text-green-300 ml-4">{val}</span>
              </li>
            );
          })}
          {isLoading ? (
            <li className="text-xs text-gray-500 animate-pulse">Loading data...</li>
          ) : !(block.list?.length) && !(block.groupedList?.length) ? (
            <li className="text-xs text-gray-500">No data.</li>
          ) : null}
        </ul>
      </div>
    ));

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Menu />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* Team statistics section */}
        <section id="team-stats" className="mb-8 bg-gray-800 rounded-xl p-5 shadow">
          <header className="mb-6 text-center">
            <h1 className={`text-3xl sm:text-4xl font-extrabold ${robotoSlab.className}`}>Team statistics</h1>
            <p className={`mt-2 text-sm sm:text-base text-gray-300 ${montserrat.className}`}>
              Mierda’s overall statistics for the recent period.
            </p>
            <TeamForm teamId={1} className="mt-6" />
          </header>

          {/* Competition Dropdown for Team Statistics */}
          <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-900/60 p-3.5 rounded-xl border border-gray-700/60">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
              <TrophyIcon className="w-4 h-4 text-emerald-400" />
              <span>Filter Team Statistics:</span>
            </div>
            <div className="relative w-full sm:w-80">
              <select
                id="team-competition-select"
                value={selectedTeamComp}
                onChange={(e) => setSelectedTeamComp(e.target.value)}
                className="w-full appearance-none bg-gray-800 hover:bg-gray-750 text-white text-sm font-medium rounded-lg px-4 py-2.5 pr-9 border border-gray-700 hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer shadow-sm"
              >
                <option value="all">🏆 All-Time (All Competitions)</option>
                {competitions.map((c) => (
                  <option key={c.id} value={c.competition_name}>
                    {c.competition_name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                <ChevronDownIcon className="w-4 h-4" />
              </div>
            </div>
          </div>

          {teamStatsError && <div className="mt-3 text-sm text-red-400">Error: {teamStatsError}</div>}

          {(() => {
            const ts = teamStats;
            const fmtInt = (n?: number | string | null) => {
              const v = typeof n === "number" ? n : n == null ? 0 : Number(n);
              return String(isNaN(v) ? 0 : Math.round(v));
            };
            const fmtAvg = (n?: number | string | null) => {
              const v = typeof n === "number" ? n : n == null ? 0 : Number(n);
              const safe = isNaN(v) ? 0 : v;
              return safe.toFixed(2);
            };

            const Tile = ({ label, value }: { label: string; value: string | number }) => (
              <div className="bg-black/20 rounded-lg p-3 w-full flex flex-col items-center text-center transition-transform hover:scale-[1.01]">
                <div className="text-base sm:text-lg font-semibold text-green-300 leading-tight tabular-nums tracking-tight">
                  {value}
                </div>
                <div className="mt-2 text-sm sm:text-base text-gray-300 leading-5 whitespace-normal break-words">
                  {label}
                </div>
              </div>
            );

            if ((!ts && !teamStatsError) || isLoadingTeamStats) {
              return (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="bg-black/20 rounded-lg p-3 h-20 animate-pulse" />
                  ))}
                </div>
              );
            }

            return (
              <div className="mt-4 space-y-5">
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">Results</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Tile label="Matches played" value={fmtInt(ts?.match_played)} />
                    <Tile label="Wins" value={fmtInt(ts?.total_wins)} />
                    <Tile label="Draws" value={fmtInt(ts?.total_draws)} />
                    <Tile label="Losses" value={fmtInt(ts?.total_losses)} />
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">Averages</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Tile label="Avg goals p/m" value={fmtAvg(ts?.average_goals_per_match)} />
                    <Tile label="Avg conceded p/m" value={fmtAvg(ts?.average_goals_conceded_per_match)} />
                    <Tile label="Win percentage" value={`${fmtAvg(ts?.win_percentage)}%`} />
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">Totals</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Tile label="Goals scored" value={fmtInt(ts?.goals_scored)} />
                    <Tile label="Goals against" value={fmtInt(ts?.goals_conceded)} />
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">Defence</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Tile label="Clean sheets" value={fmtInt(ts?.clean_sheets)} />
                  </div>
                </div>
              </div>
            );
          })()}
        </section>

        {/* Top performers section (All-Time Hall of Fame or Specific Competition) */}
        <section
          id="top-performers"
          className={`relative mb-10 rounded-2xl p-5 sm:p-8 border shadow-xl overflow-hidden transition-colors ${
            isAllTimePlayerView
              ? "bg-gradient-to-b from-gray-850 via-gray-800 to-gray-850 border-amber-500/25"
              : "bg-gradient-to-b from-gray-850 via-gray-800 to-gray-850 border-emerald-500/30"
          }`}
        >
          {/* Subtle Ambient Accent Glow */}
          <div
            className={`absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-28 blur-2xl pointer-events-none transition-all ${
              isAllTimePlayerView
                ? "bg-gradient-to-b from-amber-500/10 via-emerald-500/5 to-transparent"
                : "bg-gradient-to-b from-emerald-500/15 via-teal-500/10 to-transparent"
            }`}
          />

          {/* Competition Selector inside Top Performers Card */}
          <div className="relative z-10 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-900/70 p-3.5 rounded-xl border border-gray-700/60 shadow-inner">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
              {isAllTimePlayerView ? (
                <CrownIcon className="w-4 h-4 text-amber-400" />
              ) : (
                <TrophyIcon className="w-4 h-4 text-emerald-400" />
              )}
              <span>Filter Top Performers:</span>
            </div>
            <div className="relative w-full sm:w-80">
              <select
                id="player-competition-select"
                value={selectedPlayerComp}
                onChange={(e) => setSelectedPlayerComp(e.target.value)}
                className="w-full appearance-none bg-gray-800 hover:bg-gray-750 text-white text-sm font-medium rounded-lg px-4 py-2.5 pr-9 border border-gray-700 hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all cursor-pointer shadow-sm"
              >
                <option value="all">👑 All-Time (Hall of Fame)</option>
                {competitions.map((c) => (
                  <option key={c.id} value={c.competition_name}>
                    {c.competition_name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                <ChevronDownIcon className="w-4 h-4" />
              </div>
            </div>
          </div>

          <header className="relative mb-8 text-center flex flex-col items-center">
            {isAllTimePlayerView ? (
              <>
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-semibold tracking-wider uppercase mb-3 shadow-sm">
                  <CrownIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span>Hall of Fame</span>
                </div>
                <h2
                  className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-white via-amber-100 to-amber-300 bg-clip-text text-transparent tracking-tight drop-shadow-sm ${robotoSlab.className}`}
                >
                  All-Time Top Performers
                </h2>
                <p className={`mt-2.5 text-sm sm:text-base text-gray-300 max-w-2xl ${montserrat.className}`}>
                  Leading players in key performance metrics throughout FC Mierda&apos;s history. The top spot in each category holds the crown. Click on any player to view their profile.
                </p>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold tracking-wider uppercase mb-3 shadow-sm">
                  <TrophyIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Competition Standings</span>
                </div>
                <h2
                  className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-white via-emerald-100 to-emerald-300 bg-clip-text text-transparent tracking-tight drop-shadow-sm ${robotoSlab.className}`}
                >
                  Top Performers — {selectedPlayerComp}
                </h2>
                <p className={`mt-2.5 text-sm sm:text-base text-gray-300 max-w-2xl ${montserrat.className}`}>
                  Top individual statistics and leaderboards for {selectedPlayerComp}. Click on any player to view their profile.
                </p>
              </>
            )}
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {renderTopPerformerCards(
              [
                { heading: "Top goal scorers", groupedList: rankGroupedTop(mains, "goals"), valueKey: "goals" },
                { heading: "Top assists", groupedList: rankGroupedTop(mains, "assists"), valueKey: "assists" },
                { heading: "Top goal involvement", groupedList: rankGroupedTop(mains, "goals_involvement"), valueKey: "goals_involvement" },
                { heading: "Most Man of the Match awards", groupedList: rankGroupedTop(mains, "fcmierda_man_of_the_match_awards"), valueKey: "fcmierda_man_of_the_match_awards" },
                {
                  heading: "Top avg goals per match",
                  subtitle: `min. ${minMatchesThreshold} matches`,
                  list: rankTop(
                    mains.filter((s) => (s.match_played ?? 0) >= minMatchesThreshold),
                    "average_goals_per_match"
                  ),
                  valueKey: "average_goals_per_match",
                  isAvg: true,
                },
                {
                  heading: "Lowest avg goals conceded per match",
                  subtitle: `min. ${minMatchesThreshold} matches`,
                  list: rankLowest(
                    mains.filter((s) => (s.match_played ?? 0) >= minMatchesThreshold),
                    "average_goals_conceded_per_match"
                  ),
                  valueKey: "average_goals_conceded_per_match",
                  isAvg: true,
                  invert: true,
                },
                { heading: "Most clean sheets", groupedList: rankGroupedTop(mains, "clean_sheets"), valueKey: "clean_sheets" },
                { heading: "Most matches played", groupedList: rankGroupedTop(mains, "match_played"), valueKey: "match_played" },
              ],
              isLoadingStats
            )}
          </div>
        </section>

        {/* Overall statistics */}
        <section id="overall-statistics" className="mb-8 bg-gray-800 rounded-xl p-5 shadow">
          <header className="mb-6 text-center">
            <h2 className={`text-3xl sm:text-4xl font-extrabold ${robotoSlab.className}`}>
              {isAllTimePlayerView ? "Overall statistics" : `Overall statistics — ${selectedPlayerComp}`}
            </h2>
            <p className={`mt-2 text-sm sm:text-base text-gray-300 ${montserrat.className}`}>
              {isAllTimePlayerView
                ? "Comprehensive player statistics for all main players. Click on the player's name to view their full profile."
                : `Comprehensive player statistics for ${selectedPlayerComp}. Click on the player's name to view their full profile.`}
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderStatBlocks(
              [
                { heading: "Goals", list: rankTop(mains, "goals", mains.length), valueKey: "goals" },
                { heading: "Assists", list: rankTop(mains, "assists", mains.length), valueKey: "assists" },
                { heading: "Goals Involvement", list: rankTop(mains, "goals_involvement", mains.length), valueKey: "goals_involvement" },
                { heading: "Clean Sheets", list: rankTop(mains, "clean_sheets", mains.length), valueKey: "clean_sheets" },
                { heading: "Man of the Match Awards", list: rankTop(mains, "fcmierda_man_of_the_match_awards", mains.length), valueKey: "fcmierda_man_of_the_match_awards" },
                {
                  heading: "Avg goals per match",
                  list: rankTop(mains, "average_goals_per_match", mains.length),
                  valueKey: "average_goals_per_match",
                  isAvg: true,
                },
                {
                  heading: "Avg goals conceded per match",
                  list: rankLowest(mains, "average_goals_conceded_per_match", mains.length),
                  valueKey: "average_goals_conceded_per_match",
                  isAvg: true,
                  invert: true,
                },
                { heading: "Matches played", list: rankTop(mains, "match_played", mains.length), valueKey: "match_played" },
              ],
              true,
              isLoadingStats
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}