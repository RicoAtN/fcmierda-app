"use client";
import React, { useEffect, useState } from "react";
import { useMemo, useRef } from "react";
import Image from "next/image";
import { Roboto_Slab, Montserrat } from "next/font/google";
import Menu from "@/components/Menu";
import Footer from "@/components/Footer";

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

  // Read the playerId from the URL if navigating from the Statistics page
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const pid = params.get("playerId");
      if (pid) {
        setSelectedDbId(pid);
      }
    }
  }, []);

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
        {/* Meet the Team Header */}
        <header id="meet-team-2" className="mb-10 bg-gray-800 rounded-xl p-6 shadow text-center">
          <h1 className={`text-3xl sm:text-4xl font-extrabold mb-4 ${robotoSlab.className}`}>Meet the Team</h1>
          <p className={`text-sm sm:text-base text-gray-300 leading-relaxed ${montserrat.className}`}>
            Get to know the players of FC Mierda. Here you'll find detailed player profiles including their roles, bios, call signs, and current performance statistics.
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
                        { label: "Goals Involvement", value: fmtInt(selectedDb.goals_involvement) },
                        { label: "Clean Sheets", value: fmtInt(selectedDb.clean_sheets) },
                        { label: "Avg Goals p/m", value: fmtAvg(selectedDb.average_goals_per_match) },
                        { label: "Avg Conceded p/m", value: fmtAvg(selectedDb.average_goals_conceded_per_match) },
                      ];

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