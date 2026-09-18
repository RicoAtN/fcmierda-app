import { Roboto_Slab, Montserrat } from "next/font/google";
import Link from "next/link";
import Menu from "@/components/Menu";
import Footer from "@/components/Footer";
import { neon } from "@neondatabase/serverless";
import TeamForm from "@/components/TeamForm";
import Sponsors from "@/components/Sponsors";
import SubscribeNotificationsButton from "@/components/SubscribeNotificationsButton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fixtures & Next Match | FC Mierda",
  description: "Check FC Mierda's upcoming match details, kickoff times, location, and player availability.",
};

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700", "800"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const dynamic = "force-dynamic";

// Helper to format date with Day of the Week (e.g., "Friday, 18 Sep 2026")
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

// Helper to calculate gathering time
function getGatheringTime(kickoff: string) {
  if (!kickoff || !/^\d{2}:\d{2}$/.test(kickoff)) return "-";
  const [h, m] = kickoff.split(":").map(Number);
  let gh = h,
    gm = m - 30;
  if (gm < 0) {
    gh = h - 1;
    gm = 60 + gm;
  }
  return `${String(gh).padStart(2, "0")}:${String(gm).padStart(2, "0")}`;
}

// Fetch the latest game from Neon Serverless
async function getNextGameDirect() {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) return null;
    const sql = neon(dbUrl);
    const rows = await sql`
      SELECT * FROM next_game ORDER BY id DESC LIMIT 1
    `;
    return rows[0] || null;
  } catch {
    return null;
  }
}

// Fetch competition details for current next game
async function getCompetitionDetails(competitionName?: string) {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) return null;
    const sql = neon(dbUrl);
    if (competitionName && competitionName.trim().length) {
      const rows = await sql`
        SELECT competition_name, league_link, organisation
        FROM competition
        WHERE TRIM(competition_name) = TRIM(${competitionName})
        LIMIT 1
      `;
      if (rows.length && rows[0].league_link) return rows[0];
    }
    // Fallback to latest competition with league_link
    const latest = await sql`
      SELECT competition_name, league_link, organisation
      FROM competition
      WHERE league_link IS NOT NULL AND TRIM(league_link) != ''
      ORDER BY competition_id DESC
      LIMIT 1
    `;
    return latest[0] || null;
  } catch {
    return null;
  }
}

// Helper to map positions to (v) verdediger, (m) middenvelder, (a) aanvaller
function getPositionCategory(position?: string | null): "v" | "m" | "a" | null {
  if (!position) return null;
  const p = position.toLowerCase().trim();

  if (
    p.includes("def") ||
    p.includes("verd") ||
    p.includes("back") ||
    p.includes("keeper") ||
    p.includes("doel") ||
    p === "gk" ||
    p === "cb" ||
    p === "lb" ||
    p === "rb"
  ) {
    return "v";
  }

  if (
    p.includes("mid") ||
    p.includes("midden") ||
    p === "cm" ||
    p === "cam" ||
    p === "cdm" ||
    p === "lm" ||
    p === "rm"
  ) {
    return "m";
  }

  if (
    p.includes("forw") ||
    p.includes("att") ||
    p.includes("aanv") ||
    p.includes("strik") ||
    p.includes("spits") ||
    p.includes("wing") ||
    p === "st" ||
    p === "lw" ||
    p === "rw" ||
    p === "cf"
  ) {
    return "a";
  }

  return null;
}

type PlayerMapItem = {
  id: number;
  name: string;
  number: string | null;
  position: string | null;
  positionCode: "v" | "m" | "a" | null;
};

// Fetch player metadata (number, position, id) from database
async function getPlayersMap(): Promise<Record<string, PlayerMapItem>> {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) return {};
    const sql = neon(dbUrl);
    const rows = await sql`
      SELECT player_id, player_name, player_number, player_position
      FROM player_statistics
      WHERE player_name IS NOT NULL
    `;
    const map: Record<string, PlayerMapItem> = {};
    for (const r of rows) {
      if (r.player_name) {
        const code = getPositionCategory(r.player_position);
        map[r.player_name.trim().toLowerCase()] = {
          id: Number(r.player_id),
          name: r.player_name.trim(),
          number: r.player_number ? String(r.player_number).replace(/^#\s*/, "") : null,
          position: r.player_position,
          positionCode: code,
        };
      }
    }
    return map;
  } catch {
    return {};
  }
}

function findPlayerData(name: string, playersMap: Record<string, PlayerMapItem>): PlayerMapItem | null {
  const clean = name.trim().toLowerCase();
  if (playersMap[clean]) return playersMap[clean];
  for (const [key, val] of Object.entries(playersMap)) {
    if (key === clean || key.includes(clean) || clean.includes(key)) {
      return val;
    }
  }
  return null;
}

export default async function FixturesPage() {
  const [nextGame, playersMap] = await Promise.all([
    getNextGameDirect(),
    getPlayersMap(),
  ]);

  if (!nextGame) {
    return (
      <div className="relative min-h-screen flex flex-col items-center bg-gray-900 text-white">
        <Menu />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="p-8 rounded-2xl bg-gray-950/80 border border-gray-800 shadow-xl max-w-md">
            <h2 className={`text-2xl font-bold mb-2 ${robotoSlab.className}`}>No Fixtures Scheduled</h2>
            <p className="text-gray-400 text-sm">Please check back soon for upcoming match details.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Defensive: fallback for missing fields
  const safeGame = {
    date: nextGame.date || "-",
    kickoff: nextGame.kickoff || "-",
    opponent: nextGame.opponent || "-",
    location: nextGame.location || "-",
    competition: nextGame.competition || "-",
    note: nextGame.note || "-",
  };

  const competitionInfo = await getCompetitionDetails(safeGame.competition);
  const leagueLink = competitionInfo?.league_link;

  // Attendance processing
  const attendance = nextGame.attendance || {};
  const present = Object.entries(attendance)
    .filter(([_, status]) => status === "present")
    .map(([name]) => name);
  const notSure = Object.entries(attendance)
    .filter(([_, status]) => status === "not sure")
    .map(([name]) => name);
  const absent = Object.entries(attendance)
    .filter(([_, status]) => status === "absent")
    .map(([name]) => name);
  const supporters = Object.entries(attendance)
    .filter(
      ([_, status]) => status === "supporter" || status === "coach"
    )
    .map(([name]) => name);

  // Position breakdown counts for present players
  let defendersCount = 0;
  let midfieldersCount = 0;
  let attackersCount = 0;

  present.forEach((name) => {
    const p = findPlayerData(name, playersMap);
    if (p?.positionCode === "v") defendersCount++;
    else if (p?.positionCode === "m") midfieldersCount++;
    else if (p?.positionCode === "a") attackersCount++;
  });

  return (
    <div className="relative min-h-screen flex flex-col items-center w-full bg-gray-900 text-white overflow-x-hidden">
      {/* Navigation Bar */}
      <Menu />

      {/* Main Fixtures Container */}
      <main className="w-full flex flex-col items-center pt-24 sm:pt-36 pb-14 sm:pb-20 px-3.5 sm:px-6">
        {/* Hero Header */}
        <div className="max-w-3xl w-full text-center mb-6 sm:mb-10">
          <h1 className={`text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-2.5 sm:mb-3 drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)] ${robotoSlab.className}`}>
            Upcoming Fixture
          </h1>

          <p className={`text-sm sm:text-base md:text-lg text-gray-200 font-medium max-w-xl mx-auto leading-relaxed px-2 ${montserrat.className}`}>
            Kickoff times, venue details, notes, and live squad attendance for FC Mierda&apos;s next match.
          </p>
        </div>

        {/* Next Game Glass Card */}
        <div className="max-w-4xl w-full rounded-2xl p-4 sm:p-8 md:p-10 text-white bg-gray-950/85 border border-gray-800 shadow-2xl backdrop-blur-sm mx-auto mb-10">
          {/* Team Form Badge */}
          <div className="flex justify-center mb-5 sm:mb-6">
            <TeamForm teamId={1} />
          </div>

          {/* Versus Header */}
          <div className="text-center mb-6 sm:mb-8 pb-5 sm:pb-6 border-b border-gray-800/80">
            <div className="inline-block px-3 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-2">
              Next Match
            </div>
            <h2 className={`text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight break-words ${robotoSlab.className}`}>
              FC Mierda <span className="text-gray-500 font-normal">vs</span>{" "}
              <span className="text-emerald-300 drop-shadow-[0_2px_14px_rgba(16,185,129,0.35)] font-mono">
                {safeGame.opponent}
              </span>
            </h2>

            {safeGame.note && safeGame.note !== "-" && (
              <div className="mt-3.5 sm:mt-4 p-3 sm:p-3.5 rounded-xl bg-gray-900/80 border border-gray-800 max-w-lg mx-auto">
                <p className={`text-xs sm:text-sm text-gray-300 italic ${montserrat.className}`}>
                  &ldquo;{safeGame.note}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* Unified Match Schedule, Times & Venue Tile - Compact & Balanced */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-gray-950/70 border border-gray-800 shadow-md mb-5">
            {/* Date & Location Header Strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-gray-800/80 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <span className="text-base shrink-0">🗓️</span>
                <span className="text-gray-400 font-medium">Date:</span>
                <span className="font-bold text-gray-100">{formatDateWithWeekday(safeGame.date)}</span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-gray-300 min-w-0">
                <span className="shrink-0">📍</span>
                <span className="text-gray-400 font-medium shrink-0">Location:</span>
                <span className="font-semibold text-gray-200 truncate">{safeGame.location}</span>
              </div>
            </div>

            {/* Compact Kick-off & Gathering Timers */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 my-2.5">
              <div className="p-2 sm:p-2.5 rounded-lg bg-black/40 border border-gray-800 flex items-center justify-between px-3">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Kick-off
                </span>
                <span className="text-base sm:text-lg font-bold font-mono text-emerald-300">
                  {safeGame.kickoff}
                </span>
              </div>
              <div className="p-2 sm:p-2.5 rounded-lg bg-black/40 border border-gray-800 flex items-center justify-between px-3">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Gathering
                </span>
                <span className="text-base sm:text-lg font-bold font-mono text-emerald-200">
                  {getGatheringTime(safeGame.kickoff)}
                </span>
              </div>
            </div>

            {/* Subtle Competition Footnote */}
            {safeGame.competition && safeGame.competition !== "-" && (
              <div className="pt-2 border-t border-gray-800/80 flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-amber-300/80 font-medium">
                <span>🏆</span>
                <span className="truncate">{safeGame.competition}</span>
              </div>
            )}
          </div>

          {/* Compact, Tasteful Availability Strip */}
          <div className="my-5 sm:my-6 p-3.5 sm:p-4 rounded-xl bg-gray-900/90 border border-emerald-500/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-center sm:text-left shadow-md">
            <div className="flex items-center gap-3 text-left">
              <span className="text-xl shrink-0">📝</span>
              <div>
                <div className="text-xs sm:text-sm font-bold text-gray-100">
                  Playing in this match?
                </div>
                <div className="text-[11px] sm:text-xs text-gray-400">
                  Update your matchday attendance for the squad.
                </div>
              </div>
            </div>

            <Link
              href="/cms/nextgameplayeravailability#player-availability"
              className="group inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-full shadow-md shadow-emerald-600/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 shrink-0 w-full sm:w-auto"
              prefetch={true}
            >
              <span>Submit Availability</span>
              <svg
                className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>

          {/* Player Attendance Section */}
          <div className="pt-6 border-t border-gray-800">
            <div className="text-center mb-6">
              <h3 className={`text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2.5 ${robotoSlab.className}`}>
                <span className="text-emerald-400">👥</span>
                <span>Live Squad Availability Tracker</span>
              </h3>
            </div>

            {/* Attendance Status Columns with HIGHLIGHTED Present Counter */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 mb-6">
              {/* Present Column - HERO HIGHLIGHT */}
              <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-emerald-950/80 via-emerald-950/40 to-black/70 border-2 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.22)] ring-1 ring-emerald-400/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3 pb-2.5 border-b border-emerald-500/30">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                      <div>
                        <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-300 block">Present</span>
                        <span className="text-[10px] text-emerald-400/80 font-medium">Ready to play</span>
                      </div>
                    </div>

                    {/* Prominent Glow Counter Badge */}
                    <div className="px-3.5 py-1 rounded-xl bg-emerald-500/20 border-2 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center justify-center min-w-[52px]">
                      <span className="text-3xl sm:text-4xl font-black font-mono text-emerald-200 drop-shadow-[0_2px_8px_rgba(16,185,129,0.6)]">
                        {present.length}
                      </span>
                    </div>
                  </div>

                  {/* Position Breakdown Subtle Counter */}
                  {present.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 pb-2 mb-3 border-b border-emerald-500/20 text-[11px] sm:text-xs">
                      <span
                        className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-1 shadow-sm"
                        title="Verdedigers (v)"
                      >
                        <span>🛡️</span>
                        <span>{defendersCount} (v)</span>
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-1 shadow-sm"
                        title="Middenvelders (m)"
                      >
                        <span>⚙️</span>
                        <span>{midfieldersCount} (m)</span>
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-1 shadow-sm"
                        title="Aanvallers (a)"
                      >
                        <span>⚡</span>
                        <span>{attackersCount} (a)</span>
                      </span>
                    </div>
                  )}

                  {present.length > 0 ? (
                    <div className="space-y-1.5">
                      {present.map((name) => {
                        const playerInfo = findPlayerData(name, playersMap);
                        return (
                          <div
                            key={name}
                            className="px-3 py-2 rounded-lg bg-black/50 border border-emerald-500/30 text-xs sm:text-sm font-bold text-emerald-100 flex items-center justify-between shadow-sm"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                              {playerInfo?.id !== undefined ? (
                                <Link
                                  href={`/team?playerId=${playerInfo.id}#player-bio`}
                                  className="truncate hover:underline hover:text-emerald-300 transition-colors inline-flex items-center gap-1.5"
                                  title={`View ${name}'s bio`}
                                >
                                  {playerInfo.number && (
                                    <span className="font-mono text-emerald-400 font-bold text-xs shrink-0">
                                      #{playerInfo.number}
                                    </span>
                                  )}
                                  <span className="truncate">{name}</span>
                                  {playerInfo.positionCode && (
                                    <span className="text-emerald-400/90 font-bold text-[11px] sm:text-xs shrink-0">
                                      ({playerInfo.positionCode})
                                    </span>
                                  )}
                                </Link>
                              ) : (
                                <div className="truncate inline-flex items-center gap-1.5">
                                  {playerInfo?.number && (
                                    <span className="font-mono text-emerald-400 font-bold text-xs shrink-0">
                                      #{playerInfo.number}
                                    </span>
                                  )}
                                  <span className="truncate">{name}</span>
                                  {playerInfo?.positionCode && (
                                    <span className="text-emerald-400/90 font-bold text-[11px] sm:text-xs shrink-0">
                                      ({playerInfo.positionCode})
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <span className="text-[10px] uppercase font-black text-emerald-400/90 tracking-wider shrink-0 ml-1.5 px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30">
                              IN
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 italic py-2 text-center">No players registered yet</div>
                  )}
                </div>
              </div>

              {/* Not Sure Column */}
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/30 border border-amber-500/30 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-amber-500/20">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-300 block">Not Sure</span>
                        <span className="text-[10px] text-amber-400/70 font-medium">Pending</span>
                      </div>
                    </div>
                    <div className="px-2.5 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <span className="text-xl sm:text-2xl font-black font-mono text-amber-300">
                        {notSure.length}
                      </span>
                    </div>
                  </div>

                  {notSure.length > 0 ? (
                    <div className="space-y-1.5">
                      {notSure.map((name) => {
                        const playerInfo = findPlayerData(name, playersMap);
                        return (
                          <div
                            key={name}
                            className="px-2.5 py-1.5 rounded-lg bg-black/40 border border-amber-500/20 text-xs sm:text-sm font-semibold text-amber-100 flex items-center gap-2 shadow-sm"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                            {playerInfo?.id !== undefined ? (
                              <Link
                                href={`/team?playerId=${playerInfo.id}#player-bio`}
                                className="truncate hover:underline hover:text-amber-200 transition-colors inline-flex items-center gap-1.5"
                                title={`View ${name}'s bio`}
                              >
                                {playerInfo.number && (
                                  <span className="font-mono text-amber-400 font-bold text-xs shrink-0">
                                    #{playerInfo.number}
                                  </span>
                                )}
                                <span className="truncate">{name}</span>
                                {playerInfo.positionCode && (
                                  <span className="text-amber-400/80 font-semibold text-[11px] shrink-0">
                                    ({playerInfo.positionCode})
                                  </span>
                                )}
                              </Link>
                            ) : (
                              <div className="truncate inline-flex items-center gap-1.5">
                                {playerInfo?.number && (
                                  <span className="font-mono text-amber-400 font-bold text-xs shrink-0">
                                    #{playerInfo.number}
                                  </span>
                                )}
                                <span className="truncate">{name}</span>
                                {playerInfo?.positionCode && (
                                  <span className="text-amber-400/80 font-semibold text-[11px] shrink-0">
                                    ({playerInfo.positionCode})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 italic py-2 text-center">None</div>
                  )}
                </div>
              </div>

              {/* Absent Column */}
              <div className="p-4 sm:p-5 rounded-2xl bg-rose-950/25 border border-rose-500/25 shadow-md flex flex-col justify-between opacity-90">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-rose-500/20">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-rose-300 block">Absent</span>
                        <span className="text-[10px] text-rose-400/70 font-medium">Unavailable</span>
                      </div>
                    </div>
                    <div className="px-2.5 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/30">
                      <span className="text-xl sm:text-2xl font-black font-mono text-rose-300">
                        {absent.length}
                      </span>
                    </div>
                  </div>

                  {absent.length > 0 ? (
                    <div className="space-y-1.5">
                      {absent.map((name) => {
                        const playerInfo = findPlayerData(name, playersMap);
                        return (
                          <div
                            key={name}
                            className="px-2.5 py-1.5 rounded-lg bg-black/40 border border-rose-500/20 text-xs sm:text-sm font-semibold text-rose-200/80 flex items-center gap-2 shadow-sm"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                            {playerInfo?.id !== undefined ? (
                              <Link
                                href={`/team?playerId=${playerInfo.id}#player-bio`}
                                className="truncate hover:underline hover:text-rose-100 transition-colors inline-flex items-center gap-1.5"
                                title={`View ${name}'s bio`}
                              >
                                {playerInfo.number && (
                                  <span className="font-mono text-rose-400 font-bold text-xs shrink-0">
                                    #{playerInfo.number}
                                  </span>
                                )}
                                <span className="truncate">{name}</span>
                                {playerInfo.positionCode && (
                                  <span className="text-rose-400/80 font-semibold text-[11px] shrink-0">
                                    ({playerInfo.positionCode})
                                  </span>
                                )}
                              </Link>
                            ) : (
                              <div className="truncate inline-flex items-center gap-1.5">
                                {playerInfo?.number && (
                                  <span className="font-mono text-rose-400 font-bold text-xs shrink-0">
                                    #{playerInfo.number}
                                  </span>
                                )}
                                <span className="truncate">{name}</span>
                                {playerInfo?.positionCode && (
                                  <span className="text-rose-400/80 font-semibold text-[11px] shrink-0">
                                    ({playerInfo.positionCode})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 italic py-2 text-center">None</div>
                  )}
                </div>
              </div>
            </div>

            {/* Coach & Supporters Section */}
            {supporters.length > 0 && (
              <div className="p-3.5 sm:p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-blue-300 shrink-0">
                  <span>📣</span>
                  <span>Supporters &amp; Coach ({supporters.length}):</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {supporters.map((name) => (
                    <span
                      key={name}
                      className="px-2.5 py-1 rounded-full bg-blue-900/60 border border-blue-400/40 text-blue-200 text-xs font-semibold"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Links & Notification Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-5 sm:pt-6 border-t border-gray-800/80">
              <Link
                href="/cms/nextgameplayeravailability#player-availability"
                className="group inline-flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm sm:text-base px-7 py-3.5 rounded-full shadow-lg shadow-emerald-600/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 w-full sm:w-auto text-center"
                prefetch={true}
              >
                <span>Submit Your Availability</span>
                <svg
                  className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>

              {leagueLink && (
                <a
                  href={leagueLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-gray-900 hover:bg-gray-800 text-gray-200 hover:text-emerald-300 border border-gray-700/80 hover:border-gray-600 text-xs sm:text-sm font-semibold transition-all hover:-translate-y-0.5 shadow-md w-full sm:w-auto text-center"
                >
                  <span>League Table &amp; Schedule</span>
                  <span className="text-gray-400 text-xs">↗</span>
                </a>
              )}

              <SubscribeNotificationsButton variant="subtle" className="w-full sm:w-auto text-xs sm:text-sm py-3" />
            </div>
          </div>
        </div>
      </main>

      {/* Club Sponsors Section */}
      <Sponsors />

      {/* Footer */}
      <Footer />
    </div>
  );
}
