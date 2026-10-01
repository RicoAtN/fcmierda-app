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
  competitionList,
  playerMap,
  rowsToShow = 4,
}: {
  allResults: MatchResult[];
  competitionLinkMap?: Record<string, string>;
  competitionList?: string[];
  playerMap?: Record<string, PlayerMapData>;
  rowsToShow?: number;
}) {
  const [clientPlayerMap, setClientPlayerMap] = React.useState<Record<string, PlayerMapData>>(playerMap || {});
  const [resultsList, setResultsList] = React.useState<MatchResult[]>(allResults || []);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  // Competition round filter state
  const [selectedCompetition, setSelectedCompetition] = React.useState<string>("all");

  const hasFetchedPlayersRef = React.useRef(false);
  const hasFetchedMatchesRef = React.useRef(false);

  React.useEffect(() => {
    // 1. Initial hydration from server prop
    if (playerMap && Object.keys(playerMap).length > 0) {
      setClientPlayerMap((prev) => ({ ...playerMap, ...prev }));
      return; // Already provided by server SSR, skip redundant client call to save Neon & Vercel resources
    }

    // 2. Hydrate from session storage
    try {
      const cached = sessionStorage.getItem("fcmierda_main_squad_v3");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map: Record<string, PlayerMapData> = {};
          for (const p of parsed) {
            if (p.name) {
              map[p.name.trim().toLowerCase()] = {
                id: String(p.player_id),
                name: p.name,
                photo: p.photo || null,
                number: p.number || null,
              };
            }
          }
          setClientPlayerMap((prev) => ({ ...prev, ...map }));
          return; // Cached, skip network call
        }
      }
    } catch {
      // ignore
    }

    // 3. Fallback client fetch only if server prop and session storage are both empty
    if (hasFetchedPlayersRef.current) return;
    hasFetchedPlayersRef.current = true;

    (async () => {
      try {
        const res = await fetch(`/api/main-players`);
        if (res.ok) {
          const { data } = await res.json();
          const map: Record<string, PlayerMapData> = {};
          for (const p of data || []) {
            if (p.name) {
              map[p.name.trim().toLowerCase()] = {
                id: String(p.player_id),
                name: p.name,
                photo: p.photo || null,
                number: p.number || null,
              };
            }
          }
          setClientPlayerMap((prev) => ({ ...prev, ...map }));
          try {
            sessionStorage.setItem("fcmierda_main_squad_v3", JSON.stringify(data));
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      }
    })();
  }, [playerMap]);

  // Sync resultsList with server prop, or fetch client-side if server rendered empty
  React.useEffect(() => {
    if (allResults && allResults.length > 0) {
      setResultsList(allResults);
      return;
    }

    if (hasFetchedMatchesRef.current) return;
    hasFetchedMatchesRef.current = true;
    setIsLoading(true);

    (async () => {
      try {
        const res = await fetch(`/api/match-result?all=true`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setResultsList(data);
          }
        }
      } catch (err) {
        console.warn("Client fallback match results fetch failed:", err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [allResults]);

  // Extract all available competitions from match records + competition table
  const availableCompetitions = React.useMemo(() => {
    const set = new Set<string>();
    if (competitionList && Array.isArray(competitionList)) {
      for (const c of competitionList) {
        if (c && c.trim()) set.add(c.trim());
      }
    }
    for (const r of resultsList) {
      if (r.competition && r.competition.trim()) {
        set.add(r.competition.trim());
      }
    }
    return Array.from(set);
  }, [resultsList, competitionList]);

  // Filter matches client-side (instantaneous, 0 additional database queries)
  const filteredResults = React.useMemo(() => {
    if (selectedCompetition === "all") return resultsList;
    return resultsList.filter(
      (r) => (r.competition || "").trim().toLowerCase() === selectedCompetition.trim().toLowerCase()
    );
  }, [resultsList, selectedCompetition]);

  const [selectedId, setSelectedId] = React.useState<number | null>(
    resultsList && resultsList.length > 0 ? resultsList[0].id : null
  );

  React.useEffect(() => {
    if (!selectedId && filteredResults && filteredResults.length > 0) {
      setSelectedId(filteredResults[0].id);
    }
  }, [filteredResults, selectedId]);

  // ensure selectedResult is defined based on selectedId (fallback to first filtered result)
  const selectedResult: MatchResult | undefined =
    (filteredResults || []).find((r) => r.id === selectedId) || (filteredResults && filteredResults[0]);

  // Track on-demand fetched MOTM photos to avoid heavy SSR payloads while keeping MOTM photos crisp
  const [motmPhotoMap, setMotmPhotoMap] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    const rawMotm = selectedResult?.fcmierda_man_of_the_match?.trim();
    if (!rawMotm) return;

    const motmKey = rawMotm.toLowerCase();
    const cleanMotmKey = motmKey.replace(/[^\p{L}\p{N}]/gu, "");

    // 1. If we already have the photo in motmPhotoMap, nothing to do
    if (motmPhotoMap[motmKey] || (cleanMotmKey && motmPhotoMap[cleanMotmKey])) return;

    // 2. If clientPlayerMap already has this player's photo, populate motmPhotoMap
    const existing =
      clientPlayerMap[motmKey] ||
      clientPlayerMap[cleanMotmKey] ||
      Object.values(clientPlayerMap).find((p) => {
        const pKey = p.name.toLowerCase();
        const pClean = pKey.replace(/[^\p{L}\p{N}]/gu, "");
        return (
          pKey === motmKey ||
          pClean === cleanMotmKey ||
          pKey.startsWith(motmKey) ||
          motmKey.startsWith(pKey) ||
          (cleanMotmKey.length >= 3 && (pClean.startsWith(cleanMotmKey) || cleanMotmKey.startsWith(pClean)))
        );
      });

    if (existing?.photo) {
      setMotmPhotoMap((prev) => ({
        ...prev,
        [motmKey]: existing.photo!,
        ...(cleanMotmKey ? { [cleanMotmKey]: existing.photo! } : {}),
      }));
      return;
    }

    // 3. Otherwise fetch on-demand for this single player
    let isCancelled = false;
    (async () => {
      try {
        const motmId = existing?.id ?? getPlayerId(rawMotm);
        const queryParams = new URLSearchParams();
        if (motmId !== undefined) queryParams.set("id", String(motmId));
        queryParams.set("name", rawMotm);

        const res = await fetch(`/api/main-players?${queryParams.toString()}`);
        if (res.ok) {
          const { data } = await res.json();
          if (!isCancelled && data && data.photo) {
            setMotmPhotoMap((prev) => ({
              ...prev,
              [motmKey]: data.photo,
              ...(cleanMotmKey ? { [cleanMotmKey]: data.photo } : {}),
            }));
            setClientPlayerMap((prev) => ({
              ...prev,
              [motmKey]: {
                id: String(data.player_id || motmId || ""),
                name: data.name || rawMotm,
                photo: data.photo,
                number: data.number || prev[motmKey]?.number || null,
              },
            }));
          }
        }
      } catch (err) {
        console.warn("Failed to fetch MOTM photo:", err);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [selectedResult?.fcmierda_man_of_the_match, clientPlayerMap, motmPhotoMap]);

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
      const match = resultsList.find((r) => r.id === targetId);
      if (match) {
        setSelectedId(targetId);
        // If the match belongs to a specific competition, sync the filter if needed
        if (match.competition && selectedCompetition !== "all" && match.competition.trim().toLowerCase() !== selectedCompetition.trim().toLowerCase()) {
          setSelectedCompetition("all");
        }
        const matchIndex = filteredResults.findIndex((r) => r.id === targetId);
        if (matchIndex !== -1) {
          setVisibleCount((prev) => Math.max(prev, matchIndex + 5));
        }
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
  }, [resultsList, filteredResults, selectedCompetition, scrollToDetails]);

  React.useEffect(() => {
    syncMatchFromUrl();

    window.addEventListener("hashchange", syncMatchFromUrl);
    window.addEventListener("popstate", syncMatchFromUrl);

    return () => {
      window.removeEventListener("hashchange", syncMatchFromUrl);
      window.removeEventListener("popstate", syncMatchFromUrl);
    };
  }, [syncMatchFromUrl]);

  // Initial 10 matches visible, incrementally load 10 more when scrolling down
  const [visibleCount, setVisibleCount] = React.useState<number>(10);
  const sentinelDesktopRef = React.useRef<HTMLTableRowElement | null>(null);
  const sentinelMobileRef = React.useRef<HTMLDivElement | null>(null);

  const loadMore = React.useCallback(() => {
    setVisibleCount((prev) => {
      if (prev < filteredResults.length) {
        return Math.min(prev + 10, filteredResults.length);
      }
      return prev;
    });
  }, [filteredResults.length]);

  const handleTableScroll = React.useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      if (scrollHeight - scrollTop - clientHeight < 80) {
        loadMore();
      }
    },
    [loadMore]
  );

  // IntersectionObserver for desktop table end sentinel
  React.useEffect(() => {
    const el = sentinelDesktopRef.current;
    if (!el || visibleCount >= filteredResults.length) return;
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "80px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visibleCount, filteredResults.length, loadMore]);

  // IntersectionObserver for mobile list end sentinel
  React.useEffect(() => {
    const el = sentinelMobileRef.current;
    if (!el || visibleCount >= filteredResults.length) return;
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "80px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visibleCount, filteredResults.length, loadMore]);

  function handleSelectAndScroll(id: number) {
    setSelectedId(id);
    const matchIndex = filteredResults.findIndex((r) => r.id === id);
    if (matchIndex !== -1 && matchIndex >= visibleCount) {
      setVisibleCount((prev) => Math.max(prev, matchIndex + 5));
    }
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

  function handleCompetitionChange(comp: string) {
    setSelectedCompetition(comp);
    setVisibleCount(10);
    const nextList =
      comp === "all"
        ? resultsList
        : resultsList.filter(
            (r) => (r.competition || "").trim().toLowerCase() === comp.trim().toLowerCase()
          );
    if (nextList.length > 0 && (!selectedId || !nextList.some((r) => r.id === selectedId))) {
      setSelectedId(nextList[0].id);
    }
  }

  const displayedResults = React.useMemo(() => {
    return filteredResults.slice(0, visibleCount);
  }, [filteredResults, visibleCount]);

  if (!resultsList || resultsList.length === 0) {
    if (isLoading) {
      return (
        <div className="text-center text-emerald-400 py-10 flex flex-col items-center gap-2">
          <span className="w-5 h-5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
          <span className="text-xs text-gray-400">Loading match results from database...</span>
        </div>
      );
    }
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
      <section id="match-history" className="w-full mb-8 scroll-mt-24 sm:scroll-mt-28">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-2 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-lg">📋</span>
            <h2 className={`text-xl sm:text-2xl font-extrabold text-white tracking-tight ${robotoSlab.className}`}>
              Match History
            </h2>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto">
            {/* Subtle Competition Round Dropdown */}
            {availableCompetitions.length > 0 && (
              <div className="relative w-full sm:w-64">
                <select
                  id="results-competition-filter"
                  aria-label="Filter matches by competition round"
                  value={selectedCompetition}
                  onChange={(e) => handleCompetitionChange(e.target.value)}
                  className="w-full appearance-none bg-gray-950/90 hover:bg-gray-900 text-white text-xs font-medium rounded-lg pl-3 pr-8 py-1.5 border border-gray-700/80 hover:border-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all cursor-pointer shadow-sm"
                >
                  <option value="all">🏆 All Competitions ({resultsList.length})</option>
                  {availableCompetitions.map((comp) => {
                    const count = resultsList.filter(
                      (r) => (r.competition || "").trim().toLowerCase() === comp.trim().toLowerCase()
                    ).length;
                    return (
                      <option key={comp} value={comp}>
                        {comp} {count > 0 ? `(${count})` : ""}
                      </option>
                    );
                  })}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </div>
            )}

            <span className="text-xs font-semibold text-gray-400 shrink-0">
              Showing {displayedResults.length} of {filteredResults.length} matches
            </span>
          </div>
        </div>

        {/* Short explainer note */}
        <div className="flex items-center gap-2 mb-3.5 px-3.5 py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/25 text-xs text-emerald-300 shadow-sm">
          <span className="text-sm shrink-0">💡</span>
          <span className="leading-relaxed">
            <strong className="font-semibold text-white">Interactive Table:</strong> Click on any match row to view its full match result, Man of the Match, and recap below.
          </span>
        </div>

        <div className="rounded-xl overflow-hidden bg-gray-900/90 border border-gray-800 shadow-inner">
          {/* Desktop Table (sm and up) */}
          <div className="hidden sm:block">
            <div
              onScroll={handleTableScroll}
              className="overflow-y-auto custom-scrollbar"
              style={{ maxHeight: `${(rowsToShow || 4) * ROW_HEIGHT_PX}px` }}
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
                  {displayedResults.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3.5 py-8 text-center text-xs sm:text-sm text-gray-400">
                        No match results recorded for this competition round.
                      </td>
                    </tr>
                  ) : (
                    displayedResults.map((result) => {
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
                    })
                  )}

                  {/* Desktop bottom sentinel / loading indicator */}
                  {visibleCount < filteredResults.length && (
                    <tr ref={sentinelDesktopRef} className="bg-gray-950/60">
                      <td colSpan={5} className="px-3.5 py-3 text-center text-xs text-gray-400">
                        <div className="flex items-center justify-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                          <span>Scroll down to load earlier matches ({filteredResults.length - visibleCount} more)...</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Stacked Cards (under sm) */}
          <div className="sm:hidden">
            <div
              onScroll={handleTableScroll}
              className="overflow-y-auto custom-scrollbar divide-y divide-gray-800"
              style={{ maxHeight: `${(rowsToShow || 4) * (ROW_HEIGHT_PX + 20)}px` }}
            >
              {displayedResults.length === 0 ? (
                <div className="p-8 text-center text-xs sm:text-sm text-gray-400">
                  No match results recorded for this competition round.
                </div>
              ) : (
                displayedResults.map((result) => {
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
                })
              )}

              {/* Mobile bottom sentinel / loading indicator */}
              {visibleCount < filteredResults.length && (
                <div
                  ref={sentinelMobileRef}
                  className="p-3 text-center text-xs text-gray-400 flex items-center justify-center gap-2 bg-gray-950/60"
                >
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                  <span>Scroll down to load earlier matches ({filteredResults.length - visibleCount} more)...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Selected Match Details & Recap Showcase */}
      {selectedResult && (
        <section
          id="match-details"
          ref={detailsRef}
          className="w-full pt-6 border-t border-gray-800 scroll-mt-24 sm:scroll-mt-28"
        >
          {/* Section Header */}
          <div className="flex items-center justify-between gap-3 mb-4 max-w-3xl mx-auto px-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">⭐</span>
              <h2 className={`text-xl sm:text-2xl font-extrabold text-white tracking-tight ${robotoSlab.className}`}>
                {selectedResult.id === resultsList[0]?.id ? "Latest Match Report" : "Match Report"}
              </h2>
            </div>
            {selectedResult.id === resultsList[0]?.id && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                Latest Game
              </span>
            )}
          </div>

          {/* Match Recap Card */}
          <div className="rounded-2xl p-4 sm:p-7 md:p-8 text-white bg-gray-900/90 border border-gray-800 shadow-xl max-w-3xl mx-auto">
            {/* Header: Date & Competition Badges */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-5 border-b border-gray-800/80 text-xs sm:text-sm">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/40 border border-gray-800 text-xs sm:text-sm">
                <span className="text-sm shrink-0">🗓️</span>
                <span className="text-gray-400 font-medium">Match Date:</span>
                <span className="font-bold text-gray-100">
                  {formatDateWithWeekday(selectedResult.date)}
                </span>
              </div>

              {selectedResult.competition && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-300 font-semibold self-start sm:self-auto">
                  <span>🏆</span>
                  <span className="truncate max-w-[260px] sm:max-w-xs">{selectedResult.competition}</span>
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

            {/* Goals & Assists Table - Compact & Centered */}
            <div className="mb-6 max-w-lg mx-auto w-full">
              <div className="flex items-center justify-center gap-2 mb-2.5">
                <span className="text-base">⚽</span>
                <h4 className={`text-sm sm:text-base font-bold text-emerald-400 ${robotoSlab.className}`}>
                  Goals &amp; Assists
                </h4>
              </div>

              {parseGoalScorers(selectedResult.goal_scorers).length > 0 ? (
                <div className="rounded-xl overflow-hidden border border-gray-800 bg-black/40 shadow-inner">
                  <table className="w-full text-xs sm:text-sm text-left table-fixed">
                    <colgroup>
                      <col style={{ width: "20%" }} />
                      <col style={{ width: "40%" }} />
                      <col style={{ width: "40%" }} />
                    </colgroup>
                    <thead className="bg-gray-950/80 text-gray-400 text-xs font-bold uppercase tracking-wider border-b border-gray-800">
                      <tr>
                        <th className="px-3 py-2 text-center">Goal</th>
                        <th className="px-3.5 py-2">Scorer</th>
                        <th className="px-3.5 py-2">Assist</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/80">
                      {parseGoalScorers(selectedResult.goal_scorers).map((g: GoalScorer, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-900/40 transition-colors">
                          <td className="px-3 py-2 font-mono font-bold text-emerald-400 text-center">
                            {g.goalNumber ? String(g.goalNumber).replace(/^#\s*/, "") : (idx + 1)}
                          </td>
                          <td className="px-3.5 py-2 font-semibold text-white truncate">
                            {g.scorer && getPlayerId(g.scorer) !== undefined ? (
                              <Link href={`/team?playerId=${getPlayerId(g.scorer)}#player-bio`} className="hover:underline text-emerald-300">
                                {g.scorer}
                              </Link>
                            ) : (
                              g.scorer ?? "-"
                            )}
                          </td>
                          <td className="px-3.5 py-2 text-blue-300 truncate">
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
              const rawMotm = selectedResult.fcmierda_man_of_the_match.trim();
              const motmName = rawMotm;
              const motmKey = motmName.toLowerCase();
              const cleanMotmKey = motmKey.replace(/[^\p{L}\p{N}]/gu, "");

              const playerData =
                clientPlayerMap[motmKey] ||
                clientPlayerMap[cleanMotmKey] ||
                Object.values(clientPlayerMap).find((p) => {
                  const pKey = p.name.toLowerCase();
                  const pClean = pKey.replace(/[^\p{L}\p{N}]/gu, "");
                  return (
                    pKey === motmKey ||
                    pClean === cleanMotmKey ||
                    pKey.startsWith(motmKey) ||
                    motmKey.startsWith(pKey) ||
                    (cleanMotmKey.length >= 3 && (pClean.startsWith(cleanMotmKey) || cleanMotmKey.startsWith(pClean)))
                  );
                });

              const motmId = playerData?.id ?? getPlayerId(motmName);
              const motmPhoto =
                motmPhotoMap[motmKey] ||
                (cleanMotmKey ? motmPhotoMap[cleanMotmKey] : undefined) ||
                playerData?.photo;

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
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={motmPhoto}
                          alt={motmName}
                          className="w-full h-full object-cover"
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
              <div className="mb-6 max-w-2xl mx-auto w-full">
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
              <div className="mb-6 max-w-2xl mx-auto w-full">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">📝</span>
                  <h4 className={`text-sm sm:text-base font-bold text-emerald-400 ${robotoSlab.className}`}>
                    Match Summary &amp; Recap
                  </h4>
                </div>
                <div className="p-4 sm:p-5 rounded-xl bg-black/50 border border-gray-800 text-gray-200 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed shadow-inner">
                  {selectedResult.match_summary || selectedResult.matchSummary}
                </div>
              </div>
            )}

            {/* Match Info & Squad Roster */}
            <div className="pt-4 border-t border-gray-800 space-y-4 max-w-2xl mx-auto w-full">
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