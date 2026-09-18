"use client";
import React from "react";
import Image from "next/image";
import { Roboto_Slab, Montserrat } from "next/font/google";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type PlayerMapData = {
  id: string;
  name: string;
  photo: string | null;
  number?: string | null;
};

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700", "800"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

type GoalScorer = {
  goalNumber?: number | string;
  scorer?: string;
  scorer_id?: string;
  assist?: string;
};

type MatchResult = {
  id: number;
  date: string;
  opponent: string;
  game_result?: string;
  goals_fcmierda?: number | string;
  goals_opponent?: number | string;
  youtube?: string;
  location?: string;
  competition?: string;
  attendance?: string[] | string;
  support_coach?: string[] | string;
  goal_scorers?: GoalScorer[] | string;
  fcmierda_man_of_the_match?: string;
  fcmierda_man_of_the_match_id?: string;
  match_summary?: string;
  matchSummary?: string;
};

const playerNameToIdMap: { [key: string]: number } = {
  'Hans': 0,
  'Alon': 1,
  'Jochem': 3,
  'Kraaij': 4,
  'Sander': 6,
  'Daan': 7,
  'Pim': 9,
  'Jordy': 10,
  'Frank': 11,
  'Victor': 12,
  'Niek': 14,
  'Flavio': 15,
  'Lennert': 19,
  'Sud': 20,
  'Ka': 22,
  'Sven': 23,
  'Pim S🥸': 26,
  'Kevin': 32,
  'Mart': 57,
  'Mitchell': 69,
  'Rico': 88
};

const getPlayerId = (name: string) => playerNameToIdMap[name];

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

function formatShortDate(dateString: string) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

function getYoutubeEmbedUrl(url: string) {
  if (!url) return "";
  if (url.includes("embed")) return url;
  const match = url.match(/(?:v=|\/embed\/|\.be\/)([A-Za-z0-9_-]{11})/);
  const videoId = match ? match[1] : "";
  return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
}

function parseGoalScorers(goalScorers: GoalScorer[] | string | undefined): GoalScorer[] {
  if (Array.isArray(goalScorers)) return goalScorers;
  if (typeof goalScorers === "string" && goalScorers.trim().startsWith("[")) {
    try {
      const arr = JSON.parse(goalScorers);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }
  return [];
}

function safeArray(val: unknown): string[] {
  if (Array.isArray(val)) return val as string[];
  if (typeof val === "string" && val.trim().startsWith("[")) {
    try {
      const arr = JSON.parse(val);
      return Array.isArray(arr) ? arr as string[] : [];
    } catch {
      return [];
    }
  }
  return [];
}

export default function ClientMatchResults({
  allResults,
  competitionLinkMap,
  playerMap,
  rowsToShow = 5,
}: {
  allResults: MatchResult[];
  competitionLinkMap?: Record<string, string>;
  playerMap?: Record<string, PlayerMapData>;
  rowsToShow?: number;
}) {
  const [clientPlayerMap, setClientPlayerMap] = React.useState<Record<string, PlayerMapData>>(playerMap || {});

  React.useEffect(() => {
    if (playerMap && Object.keys(playerMap).length > 0) {
      setClientPlayerMap(playerMap);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/main-players?_t=${Date.now()}`);
        if (res.ok) {
          const { data } = await res.json();
          const map: Record<string, PlayerMapData> = {};
          for (const p of data || []) {
            if (p.name) {
              map[p.name.trim().toLowerCase()] = {
                id: String(p.player_id),
                name: p.name,
                photo: p.photo,
                number: p.number,
              };
            }
          }
          setClientPlayerMap(map);
        }
      } catch {
        // ignore
      }
    })();
  }, [playerMap]);

  const [selectedId, setSelectedId] = React.useState<number | null>(
    allResults && allResults.length > 0 ? allResults[0].id : null
  );

  // ensure selectedResult is defined based on selectedId (fallback to first result)
  const selectedResult: MatchResult | undefined =
    (allResults || []).find((r) => r.id === selectedId) || (allResults && allResults[0]);

  const detailsRef = React.useRef<HTMLElement | null>(null);
  const router = useRouter();

  const scrollToDetails = React.useCallback(() => {
    const attemptScroll = (count = 0) => {
      const el = document.getElementById("match-details");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (count < 8) {
        setTimeout(() => attemptScroll(count + 1), 60);
      }
    };
    setTimeout(() => attemptScroll(0), 80);
  }, []);

  const syncMatchFromUrl = React.useCallback(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash || "";
    const params = new URLSearchParams(window.location.search);
    const queryId = params.get("matchId") || params.get("id");

    const matchHash = hash.match(/#match-?(\d+)/i);
    let targetId: number | null = null;

    if (matchHash) {
      targetId = Number(matchHash[1]);
    } else if (queryId) {
      targetId = Number(queryId);
    }

    if (targetId && !Number.isNaN(targetId)) {
      const matchExists = allResults && allResults.some((r) => r.id === targetId);
      if (matchExists) {
        setSelectedId(targetId);
      }
      scrollToDetails();
    } else if (
      hash === "#match-details" ||
      hash === "#match-detail" ||
      hash === "#details" ||
      hash.startsWith("#match")
    ) {
      scrollToDetails();
    }
  }, [allResults, scrollToDetails]);

  React.useEffect(() => {
    syncMatchFromUrl();

    window.addEventListener("hashchange", syncMatchFromUrl);
    window.addEventListener("popstate", syncMatchFromUrl);

    return () => {
      window.removeEventListener("hashchange", syncMatchFromUrl);
      window.removeEventListener("popstate", syncMatchFromUrl);
    };
  }, [syncMatchFromUrl]);

  function handleSelectAndScroll(id: number) {
    setSelectedId(id);
    try {
      const newHash = `#match-${id}`;
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, "", newHash);
      } else {
        window.location.hash = newHash;
      }
    } catch {
      /* ignore in non-browser env */
    }
    scrollToDetails();
  }

  if (!allResults || allResults.length === 0) {
    return (
      <div className="text-center text-gray-400 py-10">
        No match results available.
      </div>
    );
  }

  const ROW_HEIGHT_PX = 52;

  return (
    <>
      {/* Table Section */}
      <section className="w-full mb-8">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-lg">📋</span>
            <h2 className={`text-xl sm:text-2xl font-extrabold text-white tracking-tight ${robotoSlab.className}`}>
              Match History
            </h2>
          </div>
          <span className="text-xs font-semibold text-gray-400">
            {allResults.length} matches
          </span>
        </div>

        <div className="rounded-xl overflow-hidden bg-gray-900/90 border border-gray-800 shadow-inner">
          {/* Desktop Table (sm and up) */}
          <div className="hidden sm:block">
            <div
              className="overflow-y-auto custom-scrollbar"
              style={{ maxHeight: `${(rowsToShow || 5) * ROW_HEIGHT_PX}px` }}
            >
              <table className="min-w-full w-full text-xs sm:text-sm table-fixed">
                <colgroup>
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "38%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "14%" }} />
                </colgroup>

                <thead className="text-emerald-400 text-xs font-bold uppercase tracking-wider sticky top-0 z-20 bg-gray-950 border-b border-gray-800">
                  <tr>
                    <th className="px-3.5 py-2.5 text-left">Date</th>
                    <th className="px-3.5 py-2.5 text-left">Opponent</th>
                    <th className="px-3.5 py-2.5 text-left">Result</th>
                    <th className="px-3.5 py-2.5 text-center">Score</th>
                    <th className="px-3.5 py-2.5 text-center">Video</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-800/80">
                  {allResults.map((result) => {
                    const isSelected = selectedId === result.id;
                    const lower = (result.game_result || "").toLowerCase();
                    return (
                      <tr
                        key={result.id}
                        onClick={() => handleSelectAndScroll(result.id)}
                        className={`cursor-pointer transition-colors ${isSelected
                            ? "bg-emerald-950/50 border-l-4 border-l-emerald-400 font-bold"
                            : "hover:bg-gray-800/50"
                          }`}
                        style={{ height: ROW_HEIGHT_PX }}
                      >
                        <td className="px-3.5 text-gray-300 align-middle">
                          {result.date ? formatShortDate(result.date) : "-"}
                        </td>
                        <td className="px-3.5 text-white font-medium align-middle truncate">
                          {result.opponent ?? "-"}
                        </td>
                        <td className="px-3.5 align-middle">
                          {lower === "win" && (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-bold text-xs shadow-sm">
                              Win
                            </span>
                          )}
                          {lower === "draw" && (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 font-bold text-xs shadow-sm">
                              Draw
                            </span>
                          )}
                          {["loss", "lost"].includes(lower) && (
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/50 text-rose-300 font-bold text-xs shadow-sm">
                              Loss
                            </span>
                          )}
                          {!result.game_result && (
                            <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-400 text-xs">
                              -
                            </span>
                          )}
                        </td>
                        <td className="px-3.5 text-center align-middle font-mono font-bold text-gray-100">
                          {(result.goals_fcmierda ?? "-") + " - " + (result.goals_opponent ?? "-")}
                        </td>
                        <td className="px-3.5 text-center align-middle">
                          {result.youtube ? (
                            <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-semibold text-[11px]">
                              Available
                            </span>
                          ) : (
                            <span className="text-gray-600 text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Stacked Cards (under sm) */}
          <div className="sm:hidden">
            <div
              className="overflow-y-auto custom-scrollbar divide-y divide-gray-800"
              style={{ maxHeight: `${(rowsToShow || 5) * (ROW_HEIGHT_PX + 20)}px` }}
            >
              {allResults.map((result) => {
                const isSelected = selectedId === result.id;
                const lower = (result.game_result || "").toLowerCase();
                return (
                  <button
                    key={result.id}
                    onClick={() => handleSelectAndScroll(result.id)}
                    className={`w-full text-left px-3.5 py-2.5 transition-colors ${isSelected ? "bg-emerald-950/50 border-l-4 border-l-emerald-400" : "hover:bg-gray-800/50"
                      }`}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-white truncate">
                          {result.opponent ?? "-"}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>{result.date ? formatShortDate(result.date) : "-"}</span>
                          {result.youtube && (
                            <span className="text-emerald-400/90 font-semibold">• Video available</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <div className="font-mono font-bold text-sm text-gray-200">
                          {(result.goals_fcmierda ?? "-") + " - " + (result.goals_opponent ?? "-")}
                        </div>
                        <div>
                          {lower === "win" && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-bold text-[11px]">
                              Win
                            </span>
                          )}
                          {lower === "draw" && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 font-bold text-[11px]">
                              Draw
                            </span>
                          )}
                          {["loss", "lost"].includes(lower) && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/50 text-rose-300 font-bold text-[11px]">
                              Loss
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Selected Match Details & Recap Showcase */}
      {selectedResult && (
        <section
          id="match-details"
          ref={detailsRef}
          className="w-full pt-6 border-t border-gray-800 scroll-mt-6 sm:scroll-mt-8"
        >
          {/* Match Recap Card */}
          <div className="rounded-2xl p-4 sm:p-7 text-white bg-gray-900/90 border border-gray-800 shadow-xl">
            {/* Header: Date & Tag */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-5 border-b border-gray-800/80 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <span className="text-base shrink-0">🗓️</span>
                <span className="text-gray-400 font-medium">Match Date:</span>
                <span className="font-bold text-gray-100">
                  {formatDateWithWeekday(selectedResult.date)}
                </span>
              </div>

              {selectedResult.competition && (
                <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold self-start sm:self-auto">
                  <span>🏆</span>
                  <span>{selectedResult.competition}</span>
                </div>
              )}
            </div>

            {/* Versus & Score Hero Display */}
            <div className="text-center mb-6 pb-6 border-b border-gray-800/80">
              <h3 className={`text-2xl sm:text-4xl font-black text-white tracking-tight break-words mb-3 ${robotoSlab.className}`}>
                FC Mierda <span className="text-gray-500 font-normal text-xl sm:text-2xl">vs</span>{" "}
                <span className="text-emerald-300 drop-shadow-[0_2px_12px_rgba(16,185,129,0.3)] font-mono">
                  {selectedResult.opponent}
                </span>
              </h3>

              {/* Large Score Numeral Display */}
              <div className="inline-flex items-center justify-center gap-4 px-6 py-2 rounded-2xl bg-black/50 border border-gray-800 shadow-inner mb-3">
                <span className="text-3xl sm:text-5xl font-black font-mono text-emerald-400 drop-shadow-[0_2px_8px_rgba(16,185,129,0.5)]">
                  {selectedResult.goals_fcmierda ?? "-"}
                </span>
                <span className="text-2xl sm:text-3xl font-light text-gray-600">-</span>
                <span className="text-3xl sm:text-5xl font-black font-mono text-rose-400 drop-shadow-[0_2px_8px_rgba(244,63,94,0.5)]">
                  {selectedResult.goals_opponent ?? "-"}
                </span>
              </div>

              {/* Game Result Pill */}
              <div className="mt-1">
                {selectedResult.game_result === "win" && (
                  <span className="inline-block px-4 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 font-black text-xs sm:text-sm uppercase tracking-wider shadow-md">
                    Victory
                  </span>
                )}
                {selectedResult.game_result === "draw" && (
                  <span className="inline-block px-4 py-1 rounded-full bg-amber-950/90 border border-amber-500/60 text-amber-300 font-black text-xs sm:text-sm uppercase tracking-wider shadow-md">
                    Draw
                  </span>
                )}
                {["loss", "lost"].includes((selectedResult.game_result || "").toLowerCase()) && (
                  <span className="inline-block px-4 py-1 rounded-full bg-rose-950/90 border border-rose-500/60 text-rose-300 font-black text-xs sm:text-sm uppercase tracking-wider shadow-md">
                    Defeat
                  </span>
                )}
              </div>
            </div>

            {/* Goals & Assists Table */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-base">⚽</span>
                <h4 className={`text-sm sm:text-base font-bold text-emerald-400 ${robotoSlab.className}`}>
                  Goals &amp; Assists
                </h4>
              </div>

              {parseGoalScorers(selectedResult.goal_scorers).length > 0 ? (
                <div className="rounded-xl overflow-hidden border border-gray-800 bg-black/40">
                  <table className="min-w-full text-xs sm:text-sm text-left">
                    <thead className="bg-gray-950/80 text-gray-400 text-xs font-bold uppercase tracking-wider border-b border-gray-800">
                      <tr>
                        <th className="px-3.5 py-2">Goal</th>
                        <th className="px-3.5 py-2">Scorer</th>
                        <th className="px-3.5 py-2">Assist</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/80">
                      {parseGoalScorers(selectedResult.goal_scorers).map((g: GoalScorer, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-900/40">
                          <td className="px-3.5 py-2 font-mono font-bold text-emerald-400">
                            {g.goalNumber ? String(g.goalNumber).replace(/^#\s*/, "") : (idx + 1)}
                          </td>
                          <td className="px-3.5 py-2 font-semibold text-white">
                            {g.scorer && getPlayerId(g.scorer) !== undefined ? (
                              <Link href={`/team?playerId=${getPlayerId(g.scorer)}#player-bio`} className="hover:underline text-emerald-300">
                                {g.scorer}
                              </Link>
                            ) : (
                              g.scorer ?? "-"
                            )}
                          </td>
                          <td className="px-3.5 py-2 text-blue-300">
                            {g.assist && getPlayerId(g.assist) !== undefined ? (
                              <Link href={`/team?playerId=${getPlayerId(g.assist)}#player-bio`} className="hover:underline">
                                {g.assist}
                              </Link>
                            ) : (
                              g.assist ?? <span className="text-gray-600">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-black/30 border border-gray-800 text-xs text-gray-400 italic text-center">
                  No goal details recorded for this match.
                </div>
              )}
            </div>

            {/* Subtle Centered Clickable Man of the Match Card */}
            {selectedResult.fcmierda_man_of_the_match && (() => {
              const motmName = selectedResult.fcmierda_man_of_the_match.trim();
              const playerData =
                clientPlayerMap[motmName.toLowerCase()] ||
                Object.values(clientPlayerMap).find((p) => p.name.toLowerCase() === motmName.toLowerCase());
              const motmId = playerData?.id ?? getPlayerId(motmName);
              const motmPhoto = playerData?.photo;

              const getInitials = (name: string) => {
                const clean = name.replace(/[^\p{L}\p{N}\s]/gu, "").trim();
                if (!clean) return "⭐";
                const parts = clean.split(/\s+/).filter(Boolean);
                if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
                return (parts[0][0] + parts[1][0]).toUpperCase();
              };

              const cardContent = (
                <>
                  {/* Compact MOTM Avatar */}
                  <div className="shrink-0 relative">
                    {motmPhoto ? (
                      <div className="w-12 h-12 sm:w-14 sm:h-14 relative rounded-full overflow-hidden border-2 border-amber-400/70 shadow-md bg-gray-950 group-hover:scale-105 group-hover:border-amber-300 transition-transform duration-200">
                        <Image
                          src={motmPhoto}
                          alt={motmName}
                          fill
                          unoptimized
                          className="object-cover"
                          style={{ objectPosition: "center 35%" }}
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-amber-950/70 border-2 border-amber-400/70 flex items-center justify-center text-sm sm:text-base font-black font-mono text-amber-300 shadow-md group-hover:scale-105 group-hover:border-amber-300 transition-transform duration-200">
                        {getInitials(motmName)}
                      </div>
                    )}
                  </div>

                  {/* MOTM Text Details */}
                  <div className="flex flex-col items-start text-left min-w-0">
                    <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-amber-400 uppercase tracking-wider">
                      <span>⭐</span>
                      <span>Man of the Match</span>
                    </div>
                    <div className="text-base sm:text-lg font-black text-white group-hover:text-amber-200 transition-colors truncate mt-0.5 flex items-center gap-1.5">
                      <span>{motmName}</span>
                      {playerData?.number && (
                        <span className="text-xs font-mono font-bold text-amber-300/90 bg-black/50 px-2 py-0.5 rounded-md border border-amber-400/30">
                          #{playerData.number}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              );

              if (motmId !== undefined) {
                return (
                  <Link
                    href={`/team?playerId=${motmId}#player-bio`}
                    className="group mb-6 p-3.5 sm:p-4 rounded-2xl bg-amber-950/20 hover:bg-amber-950/35 border border-amber-500/25 hover:border-amber-400/50 flex items-center justify-center gap-3 sm:gap-4 text-center shadow-md hover:shadow-amber-500/10 max-w-md mx-auto transition-all duration-200 cursor-pointer"
                    title={`View ${motmName}'s bio`}
                  >
                    {cardContent}
                  </Link>
                );
              }

              return (
                <div className="mb-6 p-3.5 sm:p-4 rounded-2xl bg-amber-950/20 border border-amber-500/25 flex items-center justify-center gap-3 sm:gap-4 text-center shadow-md max-w-md mx-auto">
                  {cardContent}
                </div>
              );
            })()}

            {/* YouTube Video Highlight */}
            {selectedResult.youtube && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-base">🎥</span>
                  <h4 className={`text-sm sm:text-base font-bold text-emerald-400 ${robotoSlab.className}`}>
                    Match Highlights
                  </h4>
                </div>
                <div className="w-full aspect-video rounded-xl overflow-hidden border border-gray-800 shadow-xl bg-black">
                  <iframe
                    className="w-full h-full"
                    src={getYoutubeEmbedUrl(selectedResult.youtube)}
                    title="Match Video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Match Summary & Recap Note */}
            {(selectedResult.match_summary || selectedResult.matchSummary) && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">📝</span>
                  <h4 className={`text-sm sm:text-base font-bold text-emerald-400 ${robotoSlab.className}`}>
                    Match Summary &amp; Recap
                  </h4>
                </div>
                <div className="p-4 rounded-xl bg-black/50 border border-gray-800 text-gray-200 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed shadow-inner">
                  {selectedResult.match_summary || selectedResult.matchSummary}
                </div>
              </div>
            )}

            {/* Match Info & Squad Roster */}
            <div className="pt-4 border-t border-gray-800 space-y-4">
              {/* Location & Competition Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {selectedResult.location && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-black/40 border border-gray-800">
                    <span className="text-sm shrink-0">📍</span>
                    <span className="text-gray-400 font-medium">Location:</span>
                    <span className="font-semibold text-gray-200 truncate">{selectedResult.location}</span>
                  </div>
                )}

                {selectedResult.competition && (
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-black/40 border border-gray-800">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm shrink-0">🏆</span>
                      <span className="font-semibold text-amber-300 truncate">{selectedResult.competition}</span>
                    </div>
                    {competitionLinkMap?.[selectedResult.competition.trim()] && (
                      <a
                        href={competitionLinkMap[selectedResult.competition.trim()]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 underline shrink-0 font-semibold inline-flex items-center gap-1"
                        title="Click to view the full league table and other team results on the official organizer's website"
                      >
                        <span>League Table &amp; Results</span>
                        <span className="text-xs">↗</span>
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Attendance Squad */}
              {safeArray(selectedResult.attendance).length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                    <span>👥</span>
                    <span>Squad Attendance ({safeArray(selectedResult.attendance).length}):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {safeArray(selectedResult.attendance).map((name: string, idx: number) => (
                      getPlayerId(name) !== undefined ? (
                        <Link
                          key={idx}
                          href={`/team?playerId=${getPlayerId(name)}#player-bio`}
                          className="px-2.5 py-1 rounded-lg bg-black/50 border border-emerald-500/30 text-emerald-100 text-xs font-medium hover:bg-emerald-950/60 hover:border-emerald-400 transition-colors"
                        >
                          {name}
                        </Link>
                      ) : (
                        <span key={idx} className="px-2.5 py-1 rounded-lg bg-black/50 border border-gray-800 text-gray-300 text-xs">
                          {name}
                        </span>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Supporters & Coach */}
              {safeArray(selectedResult.support_coach).length > 0 && (
                <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/30">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-300 mb-2">
                    <span>📣</span>
                    <span>Supporters &amp; Coach ({safeArray(selectedResult.support_coach).length}):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {safeArray(selectedResult.support_coach).map((name: string, idx: number) => (
                      getPlayerId(name) !== undefined ? (
                        <Link
                          key={idx}
                          href={`/team?playerId=${getPlayerId(name)}#player-bio`}
                          className="px-2.5 py-1 rounded-full bg-blue-900/60 border border-blue-400/40 text-blue-200 text-xs font-semibold hover:bg-blue-800/80 transition-colors"
                        >
                          {name}
                        </Link>
                      ) : (
                        <span key={idx} className="px-2.5 py-1 rounded-full bg-blue-900/60 border border-blue-400/40 text-blue-200 text-xs font-semibold">
                          {name}
                        </span>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}