"use client";
import React, { useEffect, useState } from "react";
import { Roboto_Slab, Montserrat } from "next/font/google";
import Menu from "@/components/Menu";
import Footer from "@/components/Footer";
import TeamForm from "@/components/TeamForm";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "600"] });

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
  // Fetch stats for top performers
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/player-statistics?_t=${Date.now()}`, { cache: "no-store" });
        const { data } = (await res.json()) as { data: PlayerStats[] };
        if (isMounted) setStats(data ?? []);
      } catch (e: any) {
        console.error("Failed to load player statistics", e);
      } finally {
        if (isMounted) setIsLoadingStats(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // Fetch team statistics
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [teamStatsError, setTeamStatsError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/team-statistics?_t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error((errJson as { error?: string })?.error || `HTTP ${res.status}`);
        }
        const { data } = (await res.json()) as { data: TeamStats };
        if (isMounted) {
          setTeamStats(data);
          setTeamStatsError(null);
        }
      } catch (e: any) {
        if (isMounted) {
          setTeamStatsError(e instanceof Error ? e.message : "Failed to load");
        }
      }
    })();
    return () => { isMounted = false; };
  }, []);

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
      .filter(s => toNum((s as any)[key]) !== null)
      .sort((a, b) => {
        const av = toNum((a as any)[key])!;
        const bv = toNum((b as any)[key])!;
        return bv - av;
      })
      .slice(0, take);

  const rankLowest = (items: PlayerStats[], key: StatKey, take = 5) =>
    [...items]
      .filter(s => toNum((s as any)[key]) !== null)
      .sort((a, b) => {
        const av = toNum((a as any)[key])!;
        const bv = toNum((b as any)[key])!;
        if (av === 0 && bv !== 0) return 1;
        if (bv === 0 && av !== 0) return -1;
        return av - bv;
      })
      .slice(0, take);

  const rankGroupedTop = (items: PlayerStats[], key: StatKey, take = 5) => {
    const validItems = items.filter(s => {
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

  const mains = stats.filter(s => s.main_player === true);

  const renderStatBlocks = (blocks: StatBlock[], scrollable: boolean = false, isLoading: boolean = false) => blocks.map((block, i) => (
    <div key={i}>
      <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">{block.heading}</div>
      <ul className={`space-y-2 ${scrollable ? "max-h-[432px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-black/10 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-600 hover:[&::-webkit-scrollbar-thumb]:bg-gray-500 [&::-webkit-scrollbar-thumb]:rounded-full" : ""}`}>
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
  // --- END STATS HELPER FUNCTIONS ---

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Menu />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        
        {/* Team statistics section */}
        <section id="team-stats" className="mb-8 bg-gray-800 rounded-xl p-5 shadow">
          <header className="mb-6 text-center">
            <h1 className={`text-3xl sm:text-4xl font-extrabold ${robotoSlab.className}`}>Team statistics</h1>
            <p className={`mt-2 text-sm sm:text-base text-gray-300 ${montserrat.className}`}>Mierda’s overall statistics for the recent period.</p>
            <TeamForm teamId={1} className="mt-6" />
          </header>

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
              <div className="bg-black/20 rounded-lg p-3 w-full flex flex-col items-center text-center">
                <div className="text-base sm:text-lg font-semibold text-green-300 leading-tight tabular-nums tracking-tight">{value}</div>
                <div className="mt-2 text-sm sm:text-base text-gray-300 leading-5 whitespace-normal break-words">{label}</div>
              </div>
            );

            if (!ts && !teamStatsError) {
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

        {/* All-time top performers */}
        <section id="top-performers" className="mb-8 bg-gray-800 rounded-xl p-5 shadow">
          <header className="mb-6 text-center">
            <h2 className={`text-3xl sm:text-4xl font-extrabold ${robotoSlab.className}`}>All-time top performers</h2>
            <p className={`mt-2 text-sm sm:text-base text-gray-300 ${montserrat.className}`}>
              Check the leading players in key performance metrics throughout FC Mierda's history. Click on the player's name to see more information and other statistics of the player.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderStatBlocks([
              { heading: "Top goal scorers", groupedList: rankGroupedTop(mains, "goals"), valueKey: "goals" },
              { heading: "Top assists", groupedList: rankGroupedTop(mains, "assists"), valueKey: "assists" },
              { heading: "Top goal involvement", groupedList: rankGroupedTop(mains, "goals_involvement"), valueKey: "goals_involvement" },
              { heading: "Most Man of the Match awards", groupedList: rankGroupedTop(mains, "fcmierda_man_of_the_match_awards"), valueKey: "fcmierda_man_of_the_match_awards" },
              {
                heading: "Top avg goals per match",
                list: rankTop(
                  mains.filter(s => (s.match_played ?? 0) >= 5),
                  "average_goals_per_match"
                ),
                valueKey: "average_goals_per_match",
                isAvg: true
              },
              {
                heading: "Lowest avg goals conceded per match",
                list: rankLowest(
                  mains.filter(s => (s.match_played ?? 0) >= 5),
                  "average_goals_conceded_per_match"
                ),
                valueKey: "average_goals_conceded_per_match",
                isAvg: true,
                invert: true
              },
              { heading: "Most clean sheets", groupedList: rankGroupedTop(mains, "clean_sheets"), valueKey: "clean_sheets" },
              { heading: "Most matches played", groupedList: rankGroupedTop(mains, "match_played"), valueKey: "match_played" },
            ], false, isLoadingStats)}
          </div>
        </section>

        {/* Overall statistics */}
        <section id="overall-statistics" className="mb-8 bg-gray-800 rounded-xl p-5 shadow">
          <header className="mb-6 text-center">
            <h2 className={`text-3xl sm:text-4xl font-extrabold ${robotoSlab.className}`}>Overall statistics</h2>
            <p className={`mt-2 text-sm sm:text-base text-gray-300 ${montserrat.className}`}>
              Comprehensive player statistics for all main players. Click on the player's name to view their full profile.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderStatBlocks([
              { heading: "Goals", list: rankTop(mains, "goals", mains.length), valueKey: "goals" },
              { heading: "Assists", list: rankTop(mains, "assists", mains.length), valueKey: "assists" },
              { heading: "Goals Involvement", list: rankTop(mains, "goals_involvement", mains.length), valueKey: "goals_involvement" },
              { heading: "Clean Sheets", list: rankTop(mains, "clean_sheets", mains.length), valueKey: "clean_sheets" },
              { heading: "Man of the Match Awards", list: rankTop(mains, "fcmierda_man_of_the_match_awards", mains.length), valueKey: "fcmierda_man_of_the_match_awards" },
              {
                heading: "Avg goals per match",
                list: rankTop(mains, "average_goals_per_match", mains.length),
                valueKey: "average_goals_per_match",
                isAvg: true
              },
              {
                heading: "Avg goals conceded per match",
                list: rankLowest(mains, "average_goals_conceded_per_match", mains.length),
                valueKey: "average_goals_conceded_per_match",
                isAvg: true,
                invert: true
              },
              { heading: "Matches played", list: rankTop(mains, "match_played", mains.length), valueKey: "match_played" },
            ], true, isLoadingStats)}
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}