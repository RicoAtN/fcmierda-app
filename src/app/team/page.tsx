"use client";
import React, { useEffect, useState } from "react";
import { useMemo, useRef } from "react";
import Image from "next/image";
import { Roboto_Slab, Montserrat } from "next/font/google";
import Menu from "@/components/Menu";
import Footer from "@/components/Footer";
import TeamForm from "@/components/TeamForm";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "600"] });

type Player = {
  player_id: string;
  number?: string;
  name: string;
  nickname?: string;
  role?: string;
  highlights?: string[];
  biography_detail?: string;
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
  biography_main?: string;
  biography_detail?: string;
  main_player?: boolean; // <-- added
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
};

const CATEGORIES = [
  { key: "All", label: "All", matcher: () => true },
  { key: "Goalkeepers", label: "Goalkeepers", matcher: (r?: string) => !!r && r.toLowerCase().includes("goalkeeper") },
  { key: "Defenders", label: "Defenders", matcher: (r?: string) => !!r && r.toLowerCase().includes("defend") },
  { key: "Midfielders", label: "Midfielders", matcher: (r?: string) => !!r && r.toLowerCase().includes("midfield") },
  { key: "Attackers", label: "Attackers", matcher: (r?: string) => !!r && (r.toLowerCase().includes("striker") || r.toLowerCase().includes("forward") || r.toLowerCase().includes("attack")) },
];

const initials = (name?: string) => {
  const n = (name || "").trim();
  if (!n) return "?";
  return n.split(/\s+/).slice(0, 2).map(s => s[0]).join("").toUpperCase();
};

const roleRank = (r?: string) => {
  const s = (r || "").toLowerCase();
  if (s.includes("coach")) return 0;
  if (s.includes("goalkeeper") || /\bgk\b/.test(s)) return 1;
  if (s.includes("defend") || /\b(df|cb|lb|rb)\b/.test(s)) return 2;
  if (s.includes("midfield") || /\b(cm|cdm|cam|dm|am)\b/.test(s)) return 3;
  if (s.includes("forward") || s.includes("attack") || s.includes("striker") || /\bfw\b/.test(s)) return 4;
  return 5; // others
};

const hasPhoto = (p: { photo?: string | null }) => !!(p.photo && p.photo.trim().length);
const toNum = (n?: string | null) => {
  if (!n) return NaN;
  const digits = n.replace(/[^\d]/g, "");
  return digits ? Number(digits) : NaN;
};

const displayNumber = (n?: string | null) => {
  const s = (n ?? "").trim();
  if (!s) return "-";
  return s.startsWith("#") ? s : `#${s}`;
};

type DBPlayerWithStats = {
  player_id: string;
  number?: string | null;
  name: string;
  nickname?: string | null;
  role?: string | null;
  photo?: string | null;
  match_played?: number | string | null;
  goals?: number | string | null;
  assists?: number | string | null;
  clean_sheets?: number | string | null;
  goals_involvement?: number | string | null;
  average_goals_per_match?: number | string | null;
  average_goals_conceded_per_match?: number | string | null;
  biography_main?: string | null;
  biography_detail?: string | null;
  main_player?: boolean | null;
};

const compareDbPlayers = (a: DBPlayerWithStats, b: DBPlayerWithStats) => {
  const ap = hasPhoto(a), bp = hasPhoto(b);
  if (ap !== bp) return ap ? -1 : 1;

  const ar = roleRank(a.role || undefined), br = roleRank(b.role || undefined);
  if (ar !== br) return ar - br;

  const na = toNum(a.number || undefined), nb = toNum(b.number || undefined);
  const aHasNum = !Number.isNaN(na), bHasNum = !Number.isNaN(nb);
  if (aHasNum && bHasNum && na !== nb) return na - nb;
  if (aHasNum !== bHasNum) return aHasNum ? -1 : 1;

  return (a.name || "").localeCompare(b.name || "");
};

export default function TeamPage() {
  // Fetch stats for top performers
  const [stats, setStats] = useState<PlayerStats[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/player-statistics", { cache: "no-store" });
        const { data } = (await res.json()) as { data: PlayerStats[] };
        if (!cancelled) setStats(data ?? []);
      } catch (e) {
        console.error("Failed to load player statistics", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Fetch team statistics
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [teamStatsError, setTeamStatsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/team-statistics", { cache: "no-store" });
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error((errJson as { error?: string })?.error || `HTTP ${res.status}`);
        }
        const { data } = (await res.json()) as { data: TeamStats };
        if (!cancelled) {
          setTeamStats(data);
          setTeamStatsError(null);
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to load";
        console.error("Failed to load team statistics", e);
        if (!cancelled) setTeamStatsError(message);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const statsMap = useMemo(() => {
    const m = new Map<string, PlayerStats>();
    for (const s of stats) m.set(String(s.player_id), s);
    return m;
  }, [stats]);

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const filteredStats = useMemo(() => {
    return stats.filter((s) => {
      const name = (s.player_name ?? "").trim();
      return name && !name.toLowerCase().includes("player");
    });
  }, [stats]);

  const topGoals = useMemo(() => [...filteredStats].sort((a,b)=> (b.goals||0)-(a.goals||0)).slice(0,5), [filteredStats]);
  const topAssists = useMemo(() => [...filteredStats].sort((a,b)=> (b.assists||0)-(a.assists||0)).slice(0,5), [filteredStats]);
  const topAvgGoals = useMemo(() => [...filteredStats].filter(s => (s.match_played || 0) > 3).sort((a,b)=> (b.average_goals_per_match||0)-(a.average_goals_per_match||0)).slice(0,5), [filteredStats]);
  const topAvgConceded = useMemo(() => [...filteredStats].filter(s => s.average_goals_conceded_per_match != null).filter(s => (s.match_played || 0) > 3).sort((a,b)=> (a.average_goals_conceded_per_match ?? 9999) - (b.average_goals_conceded_per_match ?? 9999)).slice(0,5), [filteredStats]);
  const topMatches = useMemo(() => [...filteredStats].sort((a,b)=> (b.match_played||0)-(a.match_played||0)).slice(0,5), [filteredStats]);

  // Meet the Team (DB-backed)
  const [dbPlayers, setDbPlayers] = useState<DBPlayerWithStats[]>([]);
  const [dbError, setDbError] = useState<string | null>(null);
  const [dbLoading, setDbLoading] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setDbLoading(true);
      try {
        const res = await fetch("/api/main-players", { cache: "no-store" });
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error((errJson as { error?: string })?.error || `HTTP ${res.status}`);
        }
        const { data } = (await res.json()) as { data: DBPlayerWithStats[] };
        if (!cancelled) {
          const filtered = (data || []).filter(p => p.main_player === true);
          setDbPlayers(filtered);
          setDbError(null);
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to load";
        console.error("Failed to load main players", e);
        if (!cancelled) setDbError(msg);
      } finally {
        if (!cancelled) setDbLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const [dbQuery, setDbQuery] = useState("");
  const [dbRoleFilter, setDbRoleFilter] = useState<string>("All");
  const [selectedDbId, setSelectedDbId] = useState<string | null>(null);
  const dbBioRef = useRef<HTMLDivElement | null>(null);

  const dbCountsByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const cat of CATEGORIES) {
      map.set(cat.key, dbPlayers.filter((p) => cat.matcher(p.role || undefined)).length);
    }
    return map;
  }, [dbPlayers]);

  const dbFiltered = useMemo(() => {
    const roleCat = CATEGORIES.find((c) => c.key === dbRoleFilter) ?? CATEGORIES[0];
    const items = dbPlayers.filter((p) => {
      if (!roleCat.matcher(p.role || undefined)) return false;
      const q = dbQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        (p.name || "").toLowerCase().includes(q) ||
        (p.number || "").toLowerCase().includes(q) ||
        (p.role || "").toLowerCase().includes(q) ||
        (p.nickname || "").toLowerCase().includes(q)
      );
    });
    return items.sort(compareDbPlayers);
  }, [dbPlayers, dbQuery, dbRoleFilter]);

  const selectedDb = useMemo(() => {
    const id = selectedDbId ?? dbFiltered[0]?.player_id ?? null;
    return id ? dbPlayers.find((p) => p.player_id === id) ?? null : null;
  }, [selectedDbId, dbFiltered, dbPlayers]);

  function handleDbSelect(id: string) {
    setSelectedDbId(id);
    setTimeout(() => {
      dbBioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Menu />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* Page overview / quick navigation */}
        <section className="mb-10 bg-gray-800 rounded-xl p-6 shadow">
          <h1 className={`text-3xl sm:text-4xl font-extrabold mb-4 text-center ${robotoSlab.className}`}>FC Mierda team overview</h1>
          <p className={`text-sm sm:text-base text-gray-300 leading-relaxed text-center ${montserrat.className}`}>
            This page gives you a complete snapshot of FC Mierda: team-wide performance metrics, standout individual performers,
            and detailed profiles for every squad member.
          </p>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => scrollTo("team-stats")}
              className="group flex flex-col items-start rounded-lg border border-green-600/40 bg-green-600/10 px-4 py-3 hover:bg-green-600/20 transition"
            >
              <span className="text-sm font-semibold text-green-300">Team statistics</span>
              <span className="mt-1 text-xs text-gray-300">
                Core results, averages and totals for the current recorded period.
              </span>
            </button>
            <button
              onClick={() => scrollTo("top-performers")}
              className="group flex flex-col items-start rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-4 py-3 hover:bg-indigo-500/20 transition"
            >
              <span className="text-sm font-semibold text-indigo-300">All-time top performers</span>
              <span className="mt-1 text-xs text-gray-300">
                Leading goal scorers, assist providers, efficiency and match appearance leaders.
              </span>
            </button>
            <button
              onClick={() => scrollTo("meet-team-2")}
              className="group flex flex-col items-start rounded-lg border border-gray-500/40 bg-gray-500/10 px-4 py-3 hover:bg-gray-500/20 transition"
            >
              <span className="text-sm font-semibold text-gray-200">Meet the team</span>
              <span className="mt-1 text-xs text-gray-300">
                Individual player bios, roles, call signs and up-to-date personal stats.
              </span>
            </button>
          </div>
        </section>

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

        {/* All-time top performers (direct from player_statistics) */}
        <section id="top-performers" className="mb-8 bg-gray-800 rounded-xl p-5 shadow">
          <header className="mb-6 text-center">
            <h2 className={`text-3xl sm:text-4xl font-extrabold ${robotoSlab.className}`}>All-time top performers</h2>
            <p className={`mt-2 text-sm sm:text-base text-gray-300 ${montserrat.className}`}>
              Top 5 per stat using player_name from player_statistics.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(() => {
              type StatKey =
                | "goals"
                | "assists"
                | "average_goals_per_match"
                | "average_goals_conceded_per_match"
                | "match_played";

              interface StatBlock {
                heading: string;
                list: PlayerStats[];
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
                    return av - bv;
                  })
                  .slice(0, take);

              // Only include main players
              const mains = stats.filter(s => s.main_player === true);

              const blocks: StatBlock[] = [
                { heading: "Top goal scorers", list: rankTop(mains, "goals"), valueKey: "goals" },
                { heading: "Top assists", list: rankTop(mains, "assists"), valueKey: "assists" },
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
                { heading: "Most matches played", list: rankTop(mains, "match_played"), valueKey: "match_played" },
              ];

              return blocks.map((block, i) => (
                <div key={i}>
                  <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">{block.heading}</div>
                  <ul className="space-y-2">
                    {block.list.map((ps, idx) => {
                      const name = (ps.player_name || `Player ${ps.player_id}`).trim();
                      const raw = toNum((ps as any)[block.valueKey]) ?? 0;
                      const val = block.isAvg ? raw.toFixed(2) : String(raw);
                      return (
                        <li key={`${block.valueKey}-${ps.player_id}`} className="flex items-center justify-between bg-black/20 rounded-md px-3 py-2 text-sm">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-gray-400 w-5">{idx + 1}.</span>
                            <span className="font-medium truncate">{name}</span>
                          </div>
                          <span className="font-semibold tabular-nums text-green-300">{val}</span>
                        </li>
                      );
                    })}
                    {block.list.length === 0 && <li className="text-xs text-gray-500">No data.</li>}
                  </ul>
                </div>
              ));
            })()}
          </div>
        </section>

        {/* Meet the Team (DB-backed) */}
        <header id="meet-team-2" className="mt-12 mb-6 text-center">
          <h1 className={`text-3xl sm:text-4xl font-extrabold ${robotoSlab.className}`}>Meet the Team </h1>
          <p className={`mt-2 text-sm sm:text-base text-gray-300 ${montserrat.className}`}>
Detailed player profiles with roles, bios, call signs and current performance statistics.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Controls + list (DB) */}
          <aside className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl p-4 shadow">
              <div className="flex gap-2 flex-wrap mb-3">
                {CATEGORIES.map((cat) => {
                  const active = cat.key === dbRoleFilter;
                  const count = dbCountsByCategory.get(cat.key) ?? 0;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => setDbRoleFilter(cat.key)}
                      className={`text-xs px-3 py-1 rounded-full transition flex items-center gap-2 ${
                        active ? "bg-green-600 text-white" : "bg-gray-700 text-gray-200 hover:bg-gray-600"
                      }`}
                      title={`${cat.label} (${count})`}
                    >
                      <span>{cat.label}</span>
                      <span className="inline-block bg-black/30 px-2 py-0.5 rounded text-xs">{count}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 mb-4">
                <input
                  type="search"
                  aria-label="Search players (DB)"
                  placeholder={`Search by name, number, role or call sign${dbRoleFilter !== "All" ? ` — filtering ${dbRoleFilter}` : ""}`}
                  value={dbQuery}
                  onChange={(e) => setDbQuery(e.target.value)}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <div className="text-sm text-gray-400 hidden sm:block">{dbFiltered.length}/{dbPlayers.length}</div>
              </div>

              {dbError && <div className="text-sm text-red-400 mb-2">Error: {dbError}</div>}
              {dbLoading && <div className="text-sm text-gray-400 mb-2">Loading players…</div>}

              <ul className="divide-y divide-gray-700 max-h-[60vh] overflow-auto">
                {dbFiltered.map((p) => {
                  const active = p.player_id === selectedDbId;
                  return (
                    <li key={p.player_id}>
                      <button
                        onClick={() => handleDbSelect(p.player_id)}
                        className={`w-full text-left flex items-center gap-3 p-3 rounded-md transition ${
                          active ? "bg-gradient-to-r from-green-700/20 to-transparent ring-1 ring-green-500" : "hover:bg-gray-700/40"
                        }`}
                      >
                        <div className="w-14 flex-shrink-0 flex items-center justify-center">
                          <div className="mt-1 text-lg sm:text-xl font-extrabold text-green-300 truncate">{displayNumber(p.number)}</div>
                        </div>

                        {p.photo ? (
                          <div className="w-14 h-14 relative rounded-full overflow-hidden flex-shrink-0">
                            <Image src={p.photo} alt={p.name} fill className="object-cover scale-125" />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-200">
                            {initials(p.name)}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium truncate">{p.name}</div>
                              {p.nickname && <div className="text-xs text-gray-400 italic truncate">{p.nickname}</div>}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400 truncate">{p.role || "-"}</div>
                        </div>
                      </button>
                    </li>
                  );
                })}
                {dbFiltered.length === 0 && <li className="p-3 text-sm text-gray-400">No players found.</li>}
              </ul>
            </div>
          </aside>

          {/* Right: Highlight / profile (DB) */}
          <section className="lg:col-span-2">
            <div ref={dbBioRef} className="bg-gray-800 rounded-xl p-6 shadow min-h-[360px]">
              {selectedDb ? (
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex-shrink-0 relative">
                    {selectedDb.photo ? (
                      <div className="relative">
                        <Image src={selectedDb.photo} width={280} height={280} className="rounded-xl object-cover" alt={selectedDb.name} />
                      </div>
                    ) : (
                      <div className="w-[280px] h-[280px] rounded-xl bg-gray-700 flex items-center justify-center text-5xl font-bold text-gray-200">
                        {initials(selectedDb.name)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items.start justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-bold">{selectedDb.name}</h2>
                        {selectedDb.nickname && (
                          <div className="text-sm text-gray-300 mt-1 italic">
                            Call sign: <span className="text-green-300 font-semibold not-italic">{selectedDb.nickname}</span>
                          </div>
                        )}
                        <div className="text-sm text-gray-300 mt-1">Position: {selectedDb.role || "-"}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl sm:text-4xl font-extrabold text-green-300">{displayNumber(selectedDb.number)}</div>
                      </div>
                    </div>

                    {(() => {
                      const role = (selectedDb.role || "").toLowerCase();
                      const isCoach = role.includes("coach");
                      if (isCoach) return null;

                      const isMidfielder = role.includes("midfield");
                      const isAttacker = role.includes("striker") || role.includes("forward") || role.includes("attack");
                      const isKeeperOrDef = role.includes("goalkeeper") || role.includes("defend");

                      const StatTile = ({ label, value }: { label: string; value: string | number }) => (
                        <div className="bg-black/20 rounded-lg p-3 w-full flex flex-col items-center text-center">
                          <div className="text-lg sm:text-xl font-semibold text-green-300 leading-tight tabular-nums tracking-tight">{value}</div>
                          <div className="mt-2 text-sm sm:text-base text-gray-300 leading-5 whitespace-normal break-words">{label}</div>
                        </div>
                      );

                      const fmtInt = (n: number | string | null | undefined) => {
                        const v = typeof n === "number" ? n : n == null ? 0 : Number(n);
                        return String(isNaN(v) ? 0 : Math.round(v));
                      };
                      const fmtAvg = (n: number | string | null | undefined) => {
                        const v = typeof n === "number" ? n : n == null ? 0 : Number(n);
                        const safe = isNaN(v) ? 0 : v;
                        return safe.toFixed(2);
                      };

                      const tiles: { label: string; value: string | number }[] = [
                        { label: "Matches", value: fmtInt(selectedDb.match_played) },
                        { label: "Goals", value: fmtInt(selectedDb.goals) },
                        { label: "Assists", value: fmtInt(selectedDb.assists) },
                      ];

                      if (isKeeperOrDef) {
                        tiles.push({ label: "Clean sheets", value: fmtInt(selectedDb.clean_sheets) });
                        tiles.push({ label: "Avg conceded p/m", value: fmtAvg(selectedDb.average_goals_conceded_per_match) });
                      }
                      if (isMidfielder) {
                        tiles.push({ label: "Goals involvement", value: fmtInt(selectedDb.goals_involvement) });
                      }
                      if (isAttacker) {
                        tiles.push({ label: "Avg goals p/m", value: fmtAvg(selectedDb.average_goals_per_match) });
                      }

                      return (
                        <div className="mt-4">
                          <h4 className="text-sm text-gray-300 font-semibold mb-2">Statistics</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-stretch content-stretch">
                            {tiles.map((t, i) => (
                              <StatTile key={i} label={t.label} value={t.value} />
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {(() => {
                      const mainBio = (selectedDb.biography_main || "").trim();
                      const detail = (selectedDb.biography_detail || "").trim();

                      return (
                        <div className="mt-6">
                          <h4 className="text-xs uppercase tracking-wide text-gray-400 mb-1">Summary</h4>
                          <p className="text-gray-200 leading-relaxed text-base sm:text-lg font-medium border-l border-gray-700 pl-3">
                            {mainBio || "N/A"}
                          </p>
                          {detail ? (
                            <p className="mt-2 text-gray-400 leading-relaxed text-sm sm:text-base">
                              {detail}
                            </p>
                          ) : null}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-gray-300">Select a player from the left to view their profile.</div>
              )}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}