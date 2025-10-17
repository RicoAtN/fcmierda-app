"use client";
import React from "react";
import { Roboto_Slab } from "next/font/google";
import { useRouter } from "next/navigation";
const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700"] });

type GoalScorer = {
  goalNumber?: number | string;
  scorer?: string;
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
};

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
  rowsToShow = 5,
}: {
  allResults: MatchResult[];
  rowsToShow?: number;
}) {
  const [selectedId, setSelectedId] = React.useState<number | null>(
    allResults && allResults.length > 0 ? allResults[0].id : null
  );

  // ensure selectedResult is defined based on selectedId (fallback to first result)
  const selectedResult: MatchResult | undefined =
    (allResults || []).find((r) => r.id === selectedId) || (allResults && allResults[0]);

  // ref not strictly required here but kept in case you want to use it later
  const detailsRef = React.useRef<HTMLElement | null>(null);
  const router = useRouter();

  // If page loaded with a hash like #match-123, select that match and scroll
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash || "";
    const match = hash.match(/#match-(\d+)/);
    if (match) {
      const id = Number(match[1]);
      if (!Number.isNaN(id)) {
        setSelectedId(id);
        // slight delay to allow DOM render
        setTimeout(() => {
          const el = document.getElementById("match-details");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 50);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSelectAndScroll(id: number) {
    setSelectedId(id);
    // update URL hash without navigation
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
    // smooth scroll to details section
    setTimeout(() => {
      const el = document.getElementById("match-details");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  if (!allResults || allResults.length === 0) {
    return (
      <div className="text-center text-gray-400 py-10">
        No match results available.
      </div>
    );
  }

  const ROW_HEIGHT_PX = 56; // desktop row height (adjust if needed)

  return (
    <>
      {/* Table */}
      <section className="w-full flex flex-col items-center py-8 px-2 bg-gray-900">
        <div className="max-w-4xl w-full mx-auto mb-8">
          <h2 className={`text-xl sm:text-2xl font-bold mb-6 text-center ${robotoSlab.className}`}>
            All Match Results
          </h2>

          <div className="rounded-lg shadow overflow-hidden bg-gray-800">
            {/* Desktop table (sm and up) */}
            <div className="hidden sm:block">
              {/* scrollable rows container - desktop */}
              <div
                className="overflow-y-auto custom-scrollbar"
                style={{ maxHeight: `${(rowsToShow || 5) * ROW_HEIGHT_PX}px` }}
              >
                <table className="min-w-full w-full text-sm table-fixed">
                  <colgroup>
                    <col style={{ width: "18%" }} />
                    <col style={{ width: "42%" }} />
                    <col style={{ width: "16%" }} />
                    <col style={{ width: "16%" }} />
                    <col style={{ width: "8%" }} />
                  </colgroup>

                  <thead className="text-green-300 text-sm font-semibold">
                    <tr>
                      <th className="px-3 py-2 text-left sticky top-0 z-20 bg-gray-900">Date</th>
                      <th className="px-3 py-2 text-left sticky top-0 z-20 bg-gray-900">Opponent</th>
                      <th className="px-3 py-2 text-left sticky top-0 z-20 bg-gray-900">Result</th>
                      <th className="px-3 py-2 text-center sticky top-0 z-20 bg-gray-900">Score</th>
                      <th className="px-3 py-2 text-center sticky top-0 z-20 bg-gray-900">Video</th>
                    </tr>
                  </thead>

                  <tbody>
                    {allResults.map((result) => {
                      const isSelected = selectedId === result.id;
                      const lower = (result.game_result || "").toLowerCase();
                      return (
                        <tr
                          key={result.id}
                          onClick={() => handleSelectAndScroll(result.id)}
                          className={`cursor-pointer border-b border-gray-700 ${isSelected ? "bg-green-900/60" : "hover:bg-green-950/20"}`}
                          style={{ height: ROW_HEIGHT_PX }}
                        >
                          <td className="px-3 text-white align-middle">{result.date ? formatShortDate(result.date) : "-"}</td>
                          <td className="px-3 text-white align-middle">{result.opponent ?? "-"}</td>
                          <td className="px-3 align-middle">
                            {lower === "win" && <span className="px-2 py-1 rounded bg-green-600 text-white font-bold">Win</span>}
                            {lower === "draw" && <span className="px-2 py-1 rounded bg-amber-500 text-white font-bold">Draw</span>}
                            {["loss", "lost"].includes(lower) && <span className="px-2 py-1 rounded bg-red-600 text-white font-bold">Loss</span>}
                            {!result.game_result && <span className="px-2 py-1 rounded bg-gray-700 text-white font-bold">-</span>}
                            {result.game_result && !["win","draw","loss","lost"].includes(lower) && (
                              <span className="px-2 py-1 rounded bg-gray-700 text-white font-bold">{result.game_result}</span>
                            )}
                          </td>
                          <td className="px-3 text-center align-middle text-white">
                            {(result.goals_fcmierda ?? "-") + " - " + (result.goals_opponent ?? "-")}
                          </td>
                          <td className="px-3 text-center align-middle">
                            {result.youtube ? (
                              <span className="px-2 py-1 rounded bg-green-600 text-white font-bold">Yes</span>
                            ) : (
                              <span className="px-2 py-1 rounded bg-gray-700 text-white font-bold">No</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile stacked cards (under sm) */}
            <div className="sm:hidden">
              <div
                className="overflow-y-auto custom-scrollbar"
                style={{ maxHeight: `${(rowsToShow || 5) * (ROW_HEIGHT_PX + 24)}px` }}
              >
                {allResults.map((result) => {
                  const isSelected = selectedId === result.id;
                  const lower = (result.game_result || "").toLowerCase();
                  return (
                    <button
                      key={result.id}
                      onClick={() => handleSelectAndScroll(result.id)}
                      className={`w-full text-left px-4 py-3 border-b border-gray-700 ${isSelected ? "bg-green-900/60" : "hover:bg-green-950/20"}`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <div className="text-base font-semibold text-white">{result.opponent ?? "-"}</div>
                          <div className="text-xs text-gray-300 mt-1">{result.date ? formatShortDate(result.date) : "-"}</div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="text-sm text-gray-300">
                            {(result.goals_fcmierda ?? "-") + " - " + (result.goals_opponent ?? "-")}
                          </div>
                          <div className="mt-2">
                            {lower === "win" && <span className="px-2 py-1 rounded bg-green-600 text-white font-bold">Win</span>}
                            {lower === "draw" && <span className="px-2 py-1 rounded bg-amber-500 text-white font-bold">Draw</span>}
                            {["loss", "lost"].includes(lower) && <span className="px-2 py-1 rounded bg-red-600 text-white font-bold">Loss</span>}
                            {!result.game_result && <span className="px-2 py-1 rounded bg-gray-700 text-white font-bold">-</span>}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Details Section */}
      {selectedResult && (
        <section id="match-details" ref={detailsRef} className="w-full flex flex-col items-center py-8 px-4 bg-gray-900">
          <div className="max-w-2xl w-full rounded-2xl p-6 sm:p-10 text-white bg-gray-800 shadow-xl mx-auto mb-8">
            {/* Date */}
            <h2 className={`text-xl sm:text-2xl font-bold mb-6 text-center ${robotoSlab.className}`}>
              {selectedResult.date
                ? new Date(selectedResult.date).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
                : "-"}
            </h2>

            {/* Match Title & Score */}
            <div className="mb-6 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white mb-2">
                <span className="text-green-400">FC Mierda</span> vs <br />
                <span className="text-red-400">{selectedResult.opponent}</span>
              </div>

              <div className="text-3xl sm:text-4xl font-extrabold text-green-300">
                {selectedResult.goals_fcmierda ?? "-"}
                <span className="mx-3 text-white font-normal">-</span>
                <span className="text-red-400">{selectedResult.goals_opponent ?? "-"}</span>
              </div>
            </div>

            {/* Result */}
            <div className="mb-4 text-center">
              {selectedResult.game_result === "win" && (
                <span className="px-4 py-2 rounded bg-green-600 text-white font-bold">Win</span>
              )}
              {selectedResult.game_result === "draw" && (
                <span className="px-4 py-2 rounded bg-amber-500 text-white font-bold">Draw</span>
              )}
              {["loss", "lost"].includes((selectedResult.game_result || "").toLowerCase()) && (
                <span className="px-4 py-2 rounded bg-red-600 text-white font-bold">Loss</span>
              )}
              {!selectedResult.game_result && (
                <span className="px-4 py-2 rounded bg-gray-700 text-white font-bold">-</span>
              )}
            </div>

            {/* Goals & Assists */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-green-300">Goals & Assists</h3>
              {parseGoalScorers(selectedResult.goal_scorers).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border-separate border-spacing-y-2">
                    <thead>
                      <tr>
                        <th className="text-left text-gray-400 font-semibold px-2">Goal</th>
                        <th className="text-left text-gray-400 font-semibold px-2">Scorer</th>
                        <th className="text-left text-gray-400 font-semibold px-2">Assist</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parseGoalScorers(selectedResult.goal_scorers).map((g: GoalScorer, idx: number) => (
                        <tr key={idx} className="bg-gray-900 rounded">
                          <td className="px-2 py-1 text-green-400 font-semibold">{g.goalNumber ?? "-"}</td>
                          <td className="px-2 py-1 text-white font-bold">{g.scorer ?? "-"}</td>
                          <td className="px-2 py-1 text-blue-300">{g.assist ?? <span className="text-gray-500">-</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-gray-400 text-left">No goal details available.</div>
              )}
            </div>

            {/* Youtube Video */}
            <div className="mb-6 flex flex-col items-center">
              {selectedResult.youtube ? (
                <div className="w-full aspect-video max-w-xl mb-2">
                  <iframe
                    className="rounded-lg"
                    width="100%"
                    height="315"
                    src={getYoutubeEmbedUrl(selectedResult.youtube)}
                    title="Match Video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="text-gray-400 text-center text-base py-6">No video summary available yet.</div>
              )}
            </div>

            {/* Extra Info */}
            <div className="mb-6 flex flex-col gap-2">
              <div className="flex flex-row items-center gap-2">
                <span className="font-semibold text-green-300 min-w-[110px]">Location:</span>
                <span className="text-white">{selectedResult.location ?? "-"}</span>
              </div>

              <div className="flex flex-row items-center gap-2">
                <span className="font-semibold text-green-300 min-w-[110px]">Competition:</span>
                <span className="text-white">{selectedResult.competition ?? "-"}</span>
              </div>

              <div className="flex flex-row items-center gap-2">
                <span className="font-semibold text-green-300 min-w-[110px]">Attendance:</span>
                <span className="text-white font-bold">{safeArray(selectedResult.attendance).length}</span>
              </div>

              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {safeArray(selectedResult.attendance).map((name: string, idx: number) => (
                  <span key={idx} className="bg-gray-900 rounded px-2 py-1 text-white text-xs w-full text-center">{name}</span>
                ))}
              </div>

              <div className="flex flex-row items-center gap-2 mt-2">
                <span className="font-semibold text-blue-300 min-w-[110px]">Supporter/Coach:</span>
                <span className="text-white font-bold">{safeArray(selectedResult.support_coach).length}</span>
              </div>

              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {safeArray(selectedResult.support_coach).map((name: string, idx: number) => (
                  <span key={idx} className="bg-gray-900 rounded px-2 py-1 text-white text-xs">{name}</span>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}