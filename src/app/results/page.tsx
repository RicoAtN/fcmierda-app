import { Roboto_Slab, Montserrat } from "next/font/google";
import Menu from "@/components/Menu";
import { Pool } from "pg";
import Footer from "@/components/Footer";
import React from "react";
import ClientMatchResults from "./ClientMatchResults";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "600"] });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Fetch all match results from Neon DB
async function getAllResults() {
  const { rows } = await pool.query(
    `SELECT *
     FROM match_result
     ORDER BY date DESC`
  );
  return rows;
}

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

// Competition overview types + helpers
type CompetitionOverviewRow = {
  competition_name: string;
  end_period: string | null;
  fcmierda_final_rank: number | null;
  competition_champion: string | null;
};

async function getCompetitionsOverview(): Promise<CompetitionOverviewRow[]> {
  const { rows } = await pool.query<CompetitionOverviewRow>(
    `SELECT competition_name, end_period, fcmierda_final_rank, competition_champion
     FROM competition
     ORDER BY competition_id DESC`
  );
  return rows;
}

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
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// Status pill for current competition when final rank is missing
function FinalRankCell({ rank }: { rank: number | null }) {
  if (rank == null) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-600/20 text-teal-300 border border-teal-500/40 text-xs font-semibold">
        CURRENT COMPETITION
      </span>
    );
  }
  return <>{rank}</>;
}

function isFcMierdaChampion(champion: string | null) {
  return !!champion && champion.toLowerCase().includes("fc mierda");
}

// Champion cell with status badge when FC Mierda is mentioned (only badge text when FC Mierda)
function ChampionCell({ champion }: { champion: string | null }) {
  const isFc = isFcMierdaChampion(champion);
  if (isFc) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-600/20 text-yellow-300 border border-yellow-500/40 text-[11px] font-semibold">
        FC MIERDA
      </span>
    );
  }
  return <span>{champion || "-"}</span>;
}

export default async function ResultsPage() {
  const allResults = await getAllResults();
  const competitions = await getCompetitionsOverview();

  return (
    <div className="relative min-h-screen flex flex-col items-center bg-gray-900">
      <Menu />

      {/* Results Intro Section */}
      <section
        className="w-full flex justify-center items-center py-10 px-4 bg-gray-900"
        style={{
          background: "linear-gradient(135deg, #232526 0%, #414345 100%)",
        }}
      >
        <div className="max-w-2xl w-full flex flex-col items-center text-center mt-16 sm:mt-32">
          <h1
            className={`text-3xl sm:text-5xl font-extrabold mb-4 ${robotoSlab.className}`}
            style={{
              letterSpacing: "0.07em",
              textShadow: `
                0 0 4px #0b3d1a,
                0 2px 0 #0b3d1a,
                0 1px 0 #fff
              `,
              color: "#fff",
              textTransform: "uppercase",
            }}
          >
            Team Results
          </h1>
          <p
            className={`text-lg sm:text-xl text-white font-medium mb-8 drop-shadow-lg ${montserrat.className}`}
            style={{ maxWidth: 600 }}
          >
            Here you can find the latest result of FC Mierda. Relive the match, check the score, and watch the video summary if available. <b>Click on the match below for more details.</b>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <a
              href="#all-results"
              className="px-6 py-3 rounded-lg bg-gray-800 text-gray-100 font-semibold shadow border border-gray-600 hover:bg-gray-700 hover:text-green-300 transition"
              aria-label="Go to All match results"
              style={{ letterSpacing: "0.03em" }}
            >
              See match results
            </a>
            <a
              href="#competitions-overview"
              className="px-6 py-3 rounded-lg bg-gray-800 text-gray-100 font-semibold shadow border border-gray-600 hover:bg-gray-700 hover:text-yellow-300 transition"
              aria-label="Go to Competitions overview"
              style={{ letterSpacing: "0.03em" }}
            >
              Competitions overview
            </a>
          </div>
        </div>
      </section>

      {/* Two-section content (removed Latest game result) */}
      <section className="w-full flex flex-col items-center gap-12 py-12 px-4 bg-gray-800">
        {/* All match results */}
        <div id="all-results" className="max-w-6xl w-full rounded-2xl p-6 sm:p-10 text-white bg-gray-900 shadow-xl mx-auto">
          <ClientMatchResults allResults={allResults} rowsToShow={5} />
        </div>

        {/* Competitions overview */}
        <div id="competitions-overview" className="max-w-4xl w-full rounded-2xl p-6 sm:p-10 text-white bg-gray-900 shadow-xl mx-auto">
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
                {competitions.length === 0 ? (
                  <tr>
                    <td className="px-4 py-3 border-b border-gray-800 text-white/60" colSpan={4}>
                      No competitions found
                    </td>
                  </tr>
                ) : (
                  competitions.map((r, idx) => {
                    const highlight = isFcMierdaChampion(r.competition_champion);
                    return (
                      <tr
                        key={idx}
                        className={`transition ${highlight ? "bg-yellow-900/20 font-bold" : "hover:bg-gray-800/60"}`}
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
      </section>

      <Footer />
    </div>
  );
}

export const dynamic = "force-dynamic";