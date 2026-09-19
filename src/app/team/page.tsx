"use client";
import React, { useEffect, useState, useMemo, useRef } from "react";
import Image from "next/image";
import { Roboto_Slab, Montserrat } from "next/font/google";
import Menu from "@/components/Menu";
import Footer from "@/components/Footer";
import DatabaseUnavailableNotice from "@/components/DatabaseUnavailableNotice";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700", "800", "900"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

const CATEGORIES = [
  { key: "All", label: "All", matcher: () => true },
  { key: "Goalkeepers", label: "Goalkeepers", matcher: (r?: string) => !!r && r.toLowerCase().includes("goalkeeper") },
  { key: "Defenders", label: "Defenders", matcher: (r?: string) => !!r && r.toLowerCase().includes("defend") },
  { key: "Midfielders", label: "Midfielders", matcher: (r?: string) => !!r && r.toLowerCase().includes("midfield") },
  { key: "Attackers", label: "Attackers", matcher: (r?: string) => !!r && (r.toLowerCase().includes("striker") || r.toLowerCase().includes("forward") || r.toLowerCase().includes("attack")) },
];

const initials = (name?: string) => {
  const clean = (name || "").replace(/[^\p{L}\p{N}\s]/gu, "").trim();
  if (!clean) return "FC";
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
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
  if (!s || s === "null" || s === "undefined" || s === "?") return "-";
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
  fcmierda_man_of_the_match_awards?: number | string | null;
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

const SQUAD_CACHE_KEY = "fcmierda_main_squad_v3";

export default function TeamPage() {
  // Meet the Team (DB-backed)
  const [dbPlayers, setDbPlayers] = useState<DBPlayerWithStats[]>([]);
  const [dbError, setDbError] = useState<string | null>(null);
  const [dbLoading, setDbLoading] = useState<boolean>(true);

  // 1. Instant hydration from session cache
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(SQUAD_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const onlyMain = parsed.filter((p: DBPlayerWithStats) => p.main_player === true && p.name && p.name.trim().length > 0);
          if (onlyMain.length > 0) {
            setDbPlayers(onlyMain);
            setDbLoading(false);
          }
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // 2. Background fresh fetch
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/main-players");
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error((errJson as { error?: string })?.error || `HTTP ${res.status}`);
        }
        const { data } = (await res.json()) as { data: DBPlayerWithStats[] };
        if (!cancelled) {
          const filtered = (data || []).filter(
            (p) => p.main_player === true && p.name && p.name.trim().length > 0 && !p.name.toLowerCase().startsWith("invaller") && !p.name.toLowerCase().startsWith("own")
          );
          setDbPlayers(filtered);
          setDbError(null);
          try {
            sessionStorage.setItem(SQUAD_CACHE_KEY, JSON.stringify(filtered));
          } catch {
            // ignore
          }
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to load";
        console.error("Failed to load main players", e);
        if (!cancelled && dbPlayers.length === 0) setDbError(msg);
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

  // Read the playerId from the URL if navigating from the Statistics or Results page
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const pid = params.get("playerId");
      if (pid) {
        setSelectedDbId(pid);
      }
    }
  }, []);

  // Auto-scroll to bio when a specific player is requested via URL and the data finishes loading
  useEffect(() => {
    if (dbPlayers.length > 0 && selectedDbId) {
      const params = new URLSearchParams(window.location.search);
      const pid = params.get("playerId");
      if (pid === selectedDbId) {
        setTimeout(() => {
          dbBioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 200);
      }
    }
  }, [dbPlayers, selectedDbId]);

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
    return id ? dbPlayers.find((p) => String(p.player_id) === String(id)) ?? null : null;
  }, [selectedDbId, dbFiltered, dbPlayers]);

  function handleDbSelect(id: string) {
    setSelectedDbId(id);
    setTimeout(() => {
      dbBioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center w-full bg-gray-900 text-white overflow-x-hidden">
      <Menu />

      {/* Main Team Content */}
      <main className="w-full flex flex-col items-center pt-24 sm:pt-36 pb-14 sm:pb-20 px-3.5 sm:px-6">
        {/* Intro Hero Header */}
        <div className="max-w-3xl w-full text-center mb-6 sm:mb-10">
          <h1 className={`text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-2.5 sm:mb-3 drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)] ${robotoSlab.className}`}>
            Meet the Team
          </h1>

          <p className={`text-sm sm:text-base md:text-lg text-gray-200 font-medium max-w-xl mx-auto leading-relaxed ${montserrat.className}`}>
            Get to know the players of FC Mierda. Detailed player profiles, squad numbers, call signs, match statistics, and biographies.
          </p>
        </div>

        {/* Main Content Showcase Card */}
        <div className="max-w-5xl w-full rounded-2xl p-4 sm:p-7 text-white bg-gray-950/85 border border-gray-800 shadow-2xl backdrop-blur-sm mx-auto mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Player Directory / Filters (lg:col-span-5) */}
            <aside className="lg:col-span-5 w-full">
              <div className="bg-gray-900/90 rounded-xl p-3.5 sm:p-4 border border-gray-800 shadow-inner">
                {/* Category Filter Chips */}
                <div className="flex gap-1.5 sm:gap-2 flex-wrap mb-3.5">
                  {CATEGORIES.map((cat) => {
                    const active = cat.key === dbRoleFilter;
                    const count = dbCountsByCategory.get(cat.key) ?? 0;
                    return (
                      <button
                        key={cat.key}
                        onClick={() => setDbRoleFilter(cat.key)}
                        className={`text-xs px-3 py-1 rounded-full transition-all flex items-center gap-1.5 font-medium ${
                          active
                            ? "bg-emerald-600 text-white font-bold shadow-sm border border-emerald-400/50 scale-[1.02]"
                            : "bg-gray-800/80 text-gray-300 hover:bg-gray-700/80 hover:text-white border border-gray-700/50"
                        }`}
                        title={`${cat.label} (${count})`}
                      >
                        <span>{cat.label}</span>
                        <span className={`inline-block px-1.5 py-0.2 rounded-full text-[10px] font-mono ${active ? "bg-emerald-950 text-emerald-200" : "bg-black/40 text-gray-400"}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Search Input Bar */}
                <div className="flex items-center gap-2.5 mb-3.5">
                  <div className="relative flex-1">
                    <input
                      type="search"
                      aria-label="Search players"
                      placeholder={`Search player or call sign...`}
                      value={dbQuery}
                      onChange={(e) => setDbQuery(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg pl-3 pr-8 py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    />
                    {dbQuery && (
                      <button
                        onClick={() => setDbQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="text-xs font-mono font-bold text-gray-400 bg-gray-950 px-2.5 py-2 rounded-lg border border-gray-800 shrink-0">
                    {dbFiltered.length}/{dbPlayers.length}
                  </div>
                </div>

                {dbError && (
                  <DatabaseUnavailableNotice
                    title="Squad Data Offline"
                    description="Player profiles and stats cannot be retrieved right now because database protections are active."
                    className="mb-3 text-left"
                    compact={true}
                  />
                )}
                {dbLoading && (
                  <div className="text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 rounded-lg p-2.5 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Loading squad members…
                  </div>
                )}

                {/* Player List */}
                <ul className="divide-y divide-gray-800/80 max-h-[58vh] overflow-y-auto custom-scrollbar rounded-lg">
                  {dbFiltered.map((p) => {
                    const active = String(p.player_id) === String(selectedDbId);
                    return (
                      <li key={p.player_id}>
                        <button
                          onClick={() => handleDbSelect(p.player_id)}
                          className={`w-full text-left flex items-center gap-3 p-2.5 sm:p-3 transition-colors ${
                            active
                              ? "bg-emerald-950/50 border-l-4 border-l-emerald-400 ring-1 ring-emerald-500/30"
                              : "hover:bg-gray-800/50"
                          }`}
                        >
                          {/* Number Badge */}
                          <div className="w-10 sm:w-11 shrink-0 flex items-center justify-center">
                            <span className="text-base sm:text-lg font-black font-mono text-emerald-300">
                              {displayNumber(p.number)}
                            </span>
                          </div>

                          {/* Circular Avatar with Head & Upper Body Framing */}
                          {hasPhoto(p) && p.photo ? (
                            <div className="w-14 h-14 sm:w-16 sm:h-16 relative rounded-full overflow-hidden shrink-0 border-2 border-emerald-500/40 ring-1 ring-black/70 bg-gray-950 shadow-md">
                              <Image
                                src={p.photo}
                                alt={p.name}
                                fill
                                unoptimized
                                className="object-cover"
                                style={{ objectPosition: "center 42%" }}
                              />
                            </div>
                          ) : (
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-emerald-500/30 flex items-center justify-center text-sm sm:text-base font-black font-mono text-emerald-300 shrink-0 shadow-md">
                              {initials(p.name)}
                            </div>
                          )}

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm text-white truncate">
                              {p.name}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {p.nickname && (
                                <span className="text-[11px] text-amber-300 font-medium italic truncate">
                                  &ldquo;{p.nickname}&rdquo;
                                </span>
                              )}
                              <span className="text-[11px] text-gray-400 truncate">
                                {p.role || "-"}
                              </span>
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                  {dbFiltered.length === 0 && !dbLoading && (
                    <li className="p-6 text-center text-xs sm:text-sm text-gray-400">
                      No squad members found matching your search.
                    </li>
                  )}
                </ul>
              </div>
            </aside>

            {/* Right Column: Player Bio & Stats Showcase (lg:col-span-7) */}
            <section className="lg:col-span-7 w-full">
              <div
                id="player-bio"
                ref={dbBioRef}
                className="bg-gray-900/90 rounded-xl p-4 sm:p-6 border border-gray-800 shadow-xl min-h-[380px] scroll-mt-24 sm:scroll-mt-32"
              >
                {selectedDb ? (
                  <div>
                    {/* Header Card: Whole Photo + Identity & Summary */}
                    <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 items-center sm:items-start pb-6 mb-6 border-b border-gray-800/80">
                      {/* Photo or Avatar (Exact natural wrap without cropping or black bars) */}
                      <div className="shrink-0 relative flex items-center justify-center">
                        {hasPhoto(selectedDb) && selectedDb.photo ? (
                          <img
                            src={selectedDb.photo}
                            alt={selectedDb.name}
                            className="w-auto h-auto max-h-[260px] sm:max-h-[300px] lg:max-h-[340px] max-w-[240px] sm:max-w-[280px] rounded-2xl border-2 border-emerald-500/50 shadow-[0_10px_30px_rgba(0,0,0,0.85)] ring-1 ring-emerald-500/20 block"
                          />
                        ) : (
                          <div className="w-48 h-60 sm:w-56 sm:h-68 rounded-2xl bg-gradient-to-br from-gray-800 via-gray-900 to-gray-950 border-2 border-emerald-500/50 flex flex-col items-center justify-center text-5xl sm:text-6xl font-black font-mono text-emerald-300 shadow-[0_10px_30px_rgba(0,0,0,0.85)] ring-1 ring-emerald-500/20">
                            <span>{initials(selectedDb.name)}</span>
                            <span className="text-[11px] uppercase tracking-widest text-gray-400 mt-3 font-sans font-bold">FC Mierda</span>
                          </div>
                        )}
                      </div>

                      {/* Identity Details & Integrated Summary */}
                      <div className="flex-1 text-center sm:text-left min-w-0 w-full flex flex-col justify-between self-stretch">
                        <div>
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                            <div>
                              <h2 className={`text-2xl sm:text-3xl font-black text-white tracking-tight ${robotoSlab.className}`}>
                                {selectedDb.name}
                              </h2>
                              {selectedDb.nickname && (
                                <div className="text-xs sm:text-sm text-amber-300 font-semibold mt-1 flex items-center justify-center sm:justify-start gap-1">
                                  <span className="text-gray-400 font-normal">Call sign:</span>
                                  <span>&ldquo;{selectedDb.nickname}&rdquo;</span>
                                </div>
                              )}
                            </div>

                            <div className="shrink-0 self-center sm:self-start">
                              <span className="text-3xl sm:text-4xl font-black font-mono text-emerald-400 drop-shadow-[0_2px_8px_rgba(16,185,129,0.4)]">
                                {displayNumber(selectedDb.number)}
                              </span>
                            </div>
                          </div>

                          {/* Position Badge */}
                          <div className="mt-2.5 flex flex-wrap gap-2 justify-center sm:justify-start">
                            <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-semibold text-xs shadow-sm">
                              Position: {selectedDb.role || "-"}
                            </span>
                          </div>
                        </div>

                        {/* Player Summary Callout */}
                        {selectedDb.biography_main && (
                          <div className="mt-4 pt-3.5 border-t border-gray-800/80">
                            <div className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold mb-1.5 flex items-center justify-center sm:justify-start gap-1">
                              <span>📝</span>
                              <span>Summary</span>
                            </div>
                            <p className="text-gray-100 leading-relaxed text-xs sm:text-sm font-medium border-l-2 border-emerald-500/60 pl-3 bg-emerald-950/20 py-2 rounded-r-lg">
                              {selectedDb.biography_main}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats Matrix */}
                    {(() => {
                      const role = (selectedDb.role || "").toLowerCase();
                      const isCoach = role.includes("coach");
                      if (isCoach) return null;

                      const StatTile = ({ label, value }: { label: string; value: string | number }) => (
                        <div className="bg-black/50 border border-gray-800 rounded-xl p-2.5 sm:p-3 flex flex-col items-center justify-center text-center shadow-inner hover:border-gray-700 transition-colors">
                          <div className="text-lg sm:text-xl font-black font-mono text-emerald-300 leading-tight tabular-nums tracking-tight">
                            {value}
                          </div>
                          <div className="mt-1 text-[11px] sm:text-xs text-gray-300 font-medium leading-tight text-center">
                            {label}
                          </div>
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
                        { label: "Involvement", value: fmtInt(selectedDb.goals_involvement) },
                        { label: "Clean Sheets", value: fmtInt(selectedDb.clean_sheets) },
                        { label: "MOTM Awards", value: fmtInt(selectedDb.fcmierda_man_of_the_match_awards) },
                        { label: "Avg Goals p/m", value: fmtAvg(selectedDb.average_goals_per_match) },
                        { label: "Avg Conceded", value: fmtAvg(selectedDb.average_goals_conceded_per_match) },
                      ];

                      return (
                        <div className="mb-6">
                          <div className="flex items-center gap-2 mb-2.5">
                            <span className="text-sm">📊</span>
                            <h3 className={`text-xs uppercase tracking-wider text-emerald-400 font-bold ${robotoSlab.className}`}>
                              Season Statistics
                            </h3>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                            {tiles.map((t, i) => (
                              <StatTile key={i} label={t.label} value={t.value} />
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Detailed Biography (if present) */}
                    {selectedDb.biography_detail && (
                      <div className="mt-6 pt-5 border-t border-gray-800/80">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm">📖</span>
                          <h3 className={`text-xs uppercase tracking-wider text-emerald-400 font-bold ${robotoSlab.className}`}>
                            Full Biography &amp; Background
                          </h3>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed pl-3.5 border-l-2 border-gray-800">
                          {selectedDb.biography_detail}
                        </p>
                      </div>
                    )}
                  </div>
                ) : dbError && dbPlayers.length === 0 ? (
                  <div className="py-12">
                    <DatabaseUnavailableNotice
                      title="Squad Profiles Temporarily Offline"
                      description="Player profiles, biographies, and season statistics cannot be loaded because database protections or quota cooldowns are currently active."
                    />
                  </div>
                ) : (
                  <div className="py-24 text-center text-gray-400 text-sm">
                    Select a squad member from the directory to view their complete profile.
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}