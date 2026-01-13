"use client";
import Menu from "@/components/Menu";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";

type CompetitionOverviewRow = {
  competition_name: string;
  end_period: string | null;
  fcmierda_final_rank: number | null;
  competition_champion: string | null;
};

// Remove the first N words from a string (default: 2)
function removeFirstWords(input: string | null, count = 2) {
  if (!input) return "-";
  const words = input.trim().split(/\s+/);
  const result = words.slice(Math.min(count, words.length)).join(" ").trim();
  return result || "-";
}

// Format date string to "Month Year" (e.g., "October 2025")
function formatMonthYear(dateStr: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr; // fallback to raw if not a valid date
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// Status pill for current competition when final rank is missing
function FinalRankCell({ rank }: { rank: number | null }) {
  if (rank == null) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-600/20 text-teal-300 border border-teal-500/40 text-xs font-semibold">
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="12" r="8" />
        </svg>
        CURRENT COMPETITION
      </span>
    );
  }
  return <>{rank}</>;
}

// Highlight row when champion contains "FC Mierda"
function isFcMierdaChampion(champion: string | null) {
  return !!champion && champion.toLowerCase().includes("fc mierda");
}

// Champion cell with status badge when FC Mierda is mentioned
function ChampionCell({ champion }: { champion: string | null }) {
  const isFc = isFcMierdaChampion(champion);
  if (isFc) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-600/20 text-yellow-300 border border-yellow-500/40 text-[11px] font-semibold">
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M5 17h14l-2-7-3 3-3-5-3 5-3-3-2 7z" />
        </svg>
        FC MIERDA
      </span>
    );
  }
  return <span>{champion || "-"}</span>;
}

export default function CompetitionCMSPage() {
  const [rows, setRows] = useState<CompetitionOverviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/competition", { cache: "no-store" });
        const json = await res.json();
        if (res.ok && Array.isArray(json.data)) {
          setRows(json.data);
        } else {
          console.error("Load competitions failed:", json?.error);
        }
      } catch (e) {
        console.error("Fetch competitions error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center bg-gray-900">
      <Menu />

      {/* Intro section */}
      <section className="w-full flex justify-center items-center py-12 px-4 bg-gray-900">
        <div className="max-w-2xl w-full flex flex-col items-center text-center mt-16 sm:mt-28">
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-4 text-white uppercase tracking-wider">
            Competitions
          </h1>
          <p className="text-white/80 text-lg sm:text-xl">
            Manage competition rounds: overview and creation.
          </p>
        </div>
      </section>

      {/* Main content */}
      <section className="w-full flex flex-col items-center gap-12 py-12 px-4 bg-gray-800">
        {/* Competitions overview */}
        <div className="max-w-4xl w-full rounded-2xl p-6 sm:p-10 text-white bg-gray-900 shadow-xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Competitions overview</h2>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="min-w-full border border-gray-700 rounded-lg text-left">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-2 border-b border-gray-700">Competition</th>
                  <th className="px-4 py-2 border-b border-gray-700">End period</th>
                  <th className="px-4 py-2 border-b border-gray-700">FC Mierda final rank</th>
                  <th className="px-4 py-2 border-b border-gray-700">Champion</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-4 py-3 border-b border-gray-800 text-white/60" colSpan={4}>
                      Loading...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-3 border-b border-gray-800 text-white/60" colSpan={4}>
                      No competitions found
                    </td>
                  </tr>
                ) : (
                  rows.map((r, idx) => {
                    const highlight = isFcMierdaChampion(r.competition_champion);
                    return (
                      <tr
                        key={idx}
                        className={`transition ${
                          highlight
                            ? "bg-yellow-900/20 font-bold"
                            : "hover:bg-gray-800/60"
                        }`}
                      >
                        <td className="px-4 py-2 border-b border-gray-800">{removeFirstWords(r.competition_name)}</td>
                        <td className="px-4 py-2 border-b border-gray-800">{formatMonthYear(r.end_period)}</td>
                        <td className="px-4 py-2 border-b border-gray-800">
                          <FinalRankCell rank={r.fcmierda_final_rank} />
                        </td>
                        <td className="px-4 py-2 border-b border-gray-800">
                          <ChampionCell champion={r.competition_champion} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create new competition */}
        <div className="max-w-2xl w-full rounded-2xl p-6 sm:p-10 text-white bg-gray-900 shadow-xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Create new competition</h2>
          <form className="space-y-4 text-left">
            <div>
              <label className="block font-semibold mb-1">Competition name</label>
              <input
                type="text"
                className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white"
                placeholder="e.g. Powerleague First Division Rotterdam 7vs7 - October 2025"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Opponents (comma-separated)</label>
              <textarea
                className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white"
                placeholder="e.g. Peenvogels, ABC-Positief, FC Multiplein, FC Degradatiekandidaten, Ramnous Rotterdam"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-700 text-white font-semibold shadow-sm hover:bg-slate-600 active:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reset
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-teal-600 text-white font-semibold shadow-sm hover:bg-teal-500 active:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                Create
              </button>
            </div>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
}