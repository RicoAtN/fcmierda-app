import { Roboto_Slab, Montserrat } from "next/font/google";
import Menu from "@/components/Menu";
import { neon } from "@neondatabase/serverless";
import Footer from "@/components/Footer";
import React from "react";
import ClientMatchResults from "./ClientMatchResults";
import TeamForm from "@/components/TeamForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Match Results & Recaps | FC Mierda",
  description: "View past FC Mierda match results, goal scorers, man of the match highlights, and competition standings.",
};

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700", "800"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

// Fetch all match results from Neon DB
async function getAllResults(): Promise<MatchResult[]> {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) return [];
    const sql = neon(dbUrl);
    const rows = await sql`
      SELECT *
      FROM match_result
      ORDER BY date DESC
    `;
    return rows as MatchResult[];
  } catch {
    return [];
  }
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
  fcmierda_man_of_the_match?: string;
  match_summary?: string;
};

// Competition overview types + helpers
type CompetitionOverviewRow = {
  competition_name: string;
  end_period: string | null;
  fcmierda_final_rank: number | null;
  competition_champion: string | null;
  league_link?: string | null;
};

async function getCompetitionsOverview(): Promise<CompetitionOverviewRow[]> {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) return [];
    const sql = neon(dbUrl);
    const rows = await sql`
      SELECT competition_name, end_period, fcmierda_final_rank, competition_champion, league_link
      FROM competition
      ORDER BY end_period DESC NULLS LAST, competition_id DESC
    `;
    return rows as CompetitionOverviewRow[];
  } catch {
    return [];
  }
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
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold uppercase tracking-wider">
        Active
      </span>
    );
  }
  return <span className="font-bold text-white">{rank}</span>;
}

function isFcMierdaChampion(champion: string | null) {
  return !!champion && champion.toLowerCase().includes("fc mierda");
}

// Champion cell with status badge when FC Mierda is mentioned
function ChampionCell({ champion }: { champion: string | null }) {
  const isFc = isFcMierdaChampion(champion);
  if (isFc) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950/90 text-amber-300 border border-amber-500/50 text-xs font-black tracking-wider shadow-sm">
        <span>🏆</span>
        <span>FC MIERDA</span>
      </span>
    );
  }
  return <span className="text-gray-300 font-medium">{champion || "-"}</span>;
}

type PlayerMapData = {
  id: string;
  name: string;
  photo: string | null;
  number?: string | null;
};

async function getPlayerMap(): Promise<Record<string, PlayerMapData>> {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) return {};
    const sql = neon(dbUrl);
    const rows = await sql`
      SELECT
        ps.player_id::text AS id,
        ps.player_name AS name,
        ps.player_number::text AS number,
        CASE
          WHEN ps.photo_link IS NULL OR TRIM(ps.photo_link) = '' THEN NULL
          WHEN ps.photo_link ~ '^[a-z]+://' THEN ps.photo_link
          WHEN LEFT(ps.photo_link, 5) = 'data:' THEN ps.photo_link
          WHEN LEFT(ps.photo_link, 1) = '/' THEN ps.photo_link
          ELSE '/' || ps.photo_link
        END AS photo
      FROM player_statistics ps
      WHERE ps.player_name IS NOT NULL
    `;
    const map: Record<string, PlayerMapData> = {};
    for (const r of rows) {
      if (r.name) {
        map[r.name.trim().toLowerCase()] = {
          id: r.id,
          name: r.name,
          photo: r.photo,
          number: r.number,
        };
      }
    }
    return map;
  } catch {
    return {};
  }
}

export default async function ResultsPage() {
  const allResults = await getAllResults();
  const competitions = await getCompetitionsOverview();
  const playerMap = await getPlayerMap();

  // Create dictionary mapping competition name -> league_link
  const competitionLinkMap: Record<string, string> = {};
  competitions.forEach((c) => {
    if (c.competition_name && c.league_link) {
      competitionLinkMap[c.competition_name.trim()] = c.league_link.trim();
    }
  });

  const latestCompWithLink = competitions.find((c) => c.league_link && c.league_link.trim().length);
  const activeLeagueLink =
    latestCompWithLink?.league_link ||
    "https://www.powerleague.com/nl/5-a-side-leagues-near-me-nl?search_location=Rotterdam%2C+NL&single_location=&default_lat=&default_lng=&search_lat=51.9244424&search_lng=4.47775&territory_id=322&search_range=35&search_league_type_category=&search_league_type=&search_league_day=&action=searchLeagueSites";

  return (
    <div className="relative min-h-screen flex flex-col items-center w-full bg-gray-900 text-white overflow-x-hidden">
      <Menu />

      {/* Main Results Section */}
      <main className="w-full flex flex-col items-center pt-24 sm:pt-36 pb-14 sm:pb-20 px-3.5 sm:px-6">
        {/* Intro Hero Header */}
        <div className="max-w-3xl w-full text-center mb-6 sm:mb-10">
          <h1 className={`text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-2.5 sm:mb-3 drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)] ${robotoSlab.className}`}>
            Match Results &amp; Recaps
          </h1>

          <p className={`text-sm sm:text-base md:text-lg text-gray-200 font-medium max-w-xl mx-auto leading-relaxed ${montserrat.className}`}>
            Review FC Mierda&apos;s match scores, goal scorers, highlights, and competition standings.
          </p>
        </div>

        {/* All match results & Interactive Detail Card */}
        <div id="all-results" className="max-w-5xl w-full rounded-2xl p-4 sm:p-8 text-white bg-gray-950/85 border border-gray-800 shadow-2xl backdrop-blur-sm mx-auto mb-8">
          <div className="flex justify-center mb-6">
            <TeamForm teamId={1} />
          </div>

          <ClientMatchResults
            allResults={allResults}
            competitionLinkMap={competitionLinkMap}
            playerMap={playerMap}
            rowsToShow={5}
          />
        </div>

        {/* League Table & Opponents Link Section */}
        <div
          id="league-info"
          className="max-w-3xl w-full bg-gray-950/85 rounded-2xl p-5 sm:p-7 text-center border border-gray-800 shadow-xl mb-10 backdrop-blur-sm"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-xl">📊</span>
            <h3 className={`text-base sm:text-xl font-bold text-white ${robotoSlab.className}`}>
              Official League Hub &amp; Live Standings
            </h3>
          </div>

          <p className="text-xs sm:text-sm text-gray-300 max-w-xl mx-auto mb-4 leading-relaxed">
            Want to see how FC Mierda is ranking in the current league, check match scores from other teams in the division, or view upcoming fixture schedules? Click the link below to visit the official organizer&apos;s portal:
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 mb-5 text-[11px] sm:text-xs text-gray-400">
            <span className="px-3 py-1 rounded-full bg-black/40 border border-gray-800 flex items-center gap-1.5">
              <span>🏆</span> Live Division Standings
            </span>
            <span className="px-3 py-1 rounded-full bg-black/40 border border-gray-800 flex items-center gap-1.5">
              <span>⚽</span> Other Teams&apos; Match Scores
            </span>
            <span className="px-3 py-1 rounded-full bg-black/40 border border-gray-800 flex items-center gap-1.5">
              <span>📅</span> Full Season Schedule
            </span>
          </div>

          <a
            href={activeLeagueLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 hover:text-white text-xs sm:text-sm font-bold transition-all shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-0.5 group"
          >
            <span>
              View {latestCompWithLink ? removeFirstWords(latestCompWithLink.competition_name) : "Official Competition"} on Organizer Site
            </span>
            <span className="text-xs group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">↗</span>
          </a>
        </div>

        {/* Competitions overview */}
        <div id="competitions-overview" className="max-w-4xl w-full rounded-2xl p-4 sm:p-8 text-white bg-gray-950/85 border border-gray-800 shadow-2xl backdrop-blur-sm mx-auto mb-10">
          <div className="mb-4 pb-3 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏆</span>
              <h2 className={`text-xl sm:text-2xl font-extrabold text-white tracking-tight ${robotoSlab.className}`}>
                Competitions Overview
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-1.5">
              Historical log of all FC Mierda league seasons. Click any highlighted competition (<span className="text-emerald-400 font-semibold">↗</span>) to open the organizer&apos;s official page for full division standings and other teams&apos; match results.
            </p>
          </div>
          <div className="overflow-x-auto max-h-72 overflow-y-auto custom-scrollbar rounded-xl border border-gray-800">
            <table className="min-w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-900/90 text-emerald-400 text-xs font-bold uppercase tracking-wider sticky top-0 z-10 border-b border-gray-800">
                <tr>
                  <th className="px-4 py-3">Competition</th>
                  <th className="px-4 py-3">End period</th>
                  <th className="px-4 py-3">FC Mierda Rank</th>
                  <th className="px-4 py-3">Champion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/80">
                {competitions.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-center text-gray-400 italic" colSpan={4}>
                      No competitions found
                    </td>
                  </tr>
                ) : (
                  competitions.map((r, idx) => {
                    const highlight = isFcMierdaChampion(r.competition_champion);
                    return (
                      <tr
                        key={idx}
                        className={`transition-colors ${highlight ? "bg-amber-950/20 font-semibold" : "hover:bg-gray-900/50"}`}
                      >
                        <td className="px-4 py-2.5">
                          {r.league_link ? (
                            <a
                              href={r.league_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-400 hover:text-emerald-300 underline inline-flex items-center gap-1 font-semibold"
                              title="View official league table & standings"
                            >
                              <span>{removeFirstWords(r.competition_name)}</span>
                              <span className="text-xs">↗</span>
                            </a>
                          ) : (
                            <span className="text-gray-200">{removeFirstWords(r.competition_name)}</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-gray-300">{formatMonthYear(r.end_period)}</td>
                        <td className="px-4 py-2.5">
                          <FinalRankCell rank={r.fcmierda_final_rank} />
                        </td>
                        <td className="px-4 py-2.5">
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
      </main>

      <Footer />
    </div>
  );
}

export const dynamic = "force-dynamic";