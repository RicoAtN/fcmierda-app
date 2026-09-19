import { Roboto_Slab, Montserrat } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import Menu from "@/components/Menu";
import Footer from "@/components/Footer";
import { sql } from "@/lib/db";
import TeamForm from "@/components/TeamForm";
import Sponsors from "@/components/Sponsors";
import SubscribeNotificationsButton from "@/components/SubscribeNotificationsButton";
import DatabaseUnavailableNotice from "@/components/DatabaseUnavailableNotice";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fixtures & Next Match | FC Mierda",
  description: "Check FC Mierda's upcoming match details, kickoff times, location, and player availability.",
};

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700", "800"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const revalidate = 30;

// Helper to format date with Weekday and structured components (timezone-safe)
function formatMatchDate(dateStr: string) {
  if (!dateStr || dateStr === "-") {
    return {
      weekday: "Matchday",
      dateFormatted: "Date to be announced",
      fullDate: "Date to be announced",
      raw: dateStr,
    };
  }

  const clean = dateStr.trim();
  const parts = clean.split(/[-/.]/);
  let year: number, month: number, day: number;

  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      year = Number(parts[0]);
      month = Number(parts[1]) - 1;
      day = Number(parts[2]);
    } else if (parts[2].length === 4) {
      // DD-MM-YYYY
      day = Number(parts[0]);
      month = Number(parts[1]) - 1;
      year = Number(parts[2]);
    } else {
      day = Number(parts[0]);
      month = Number(parts[1]) - 1;
      year = Number(parts[2]);
      if (year < 100) year += 2000;
    }
  } else {
    const d = new Date(clean);
    if (!isNaN(d.getTime())) {
      year = d.getFullYear();
      month = d.getMonth();
      day = d.getDate();
    } else {
      return {
        weekday: "Matchday",
        dateFormatted: dateStr,
        fullDate: dateStr,
        raw: dateStr,
      };
    }
  }

  // Create local date with year, month, day at noon to avoid UTC midnight timezone shifts
  const localDate = new Date(year, month, day, 12, 0, 0);
  const weekday = localDate.toLocaleDateString("en-US", { weekday: "long" });
  const monthName = localDate.toLocaleDateString("en-US", { month: "long" });
  const dateFormatted = `${day} ${monthName} ${year}`;

  return {
    weekday,
    dateFormatted,
    fullDate: `${weekday}, ${dateFormatted}`,
    raw: dateStr,
  };
}

// Helper to calculate gathering time (30 min before kickoff)
function getGatheringTime(kickoff: string) {
  if (!kickoff || !/^\d{1,2}:\d{2}$/.test(kickoff.trim())) return "-";
  const [h, m] = kickoff.trim().split(":").map(Number);
  let gh = h,
    gm = m - 30;
  if (gm < 0) {
    gh = h - 1;
    gm = 60 + gm;
  }
  if (gh < 0) gh = 23;
  return `${String(gh).padStart(2, "0")}:${String(gm).padStart(2, "0")}`;
}

// Fetch the latest game from Neon Serverless with explicit error detection
async function getNextGameDirect(): Promise<{ data: any | null; isDbError: boolean }> {
  try {
    const rows = await sql`
      SELECT * FROM next_game ORDER BY id DESC LIMIT 1
    `;
    return { data: rows[0] || null, isDbError: false };
  } catch (err) {
    console.warn("[FixturesPage] Could not load next game from database:", err instanceof Error ? err.message : err);
    return { data: null, isDbError: true };
  }
}

// Fetch competition details for current next game
async function getCompetitionDetails(competitionName?: string) {
  try {
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
  const [nextGameRes, playersMap] = await Promise.all([
    getNextGameDirect(),
    getPlayersMap(),
  ]);

  const nextGame = nextGameRes.data;

  // 1. Explicit Database Connection / Quota Restriction state
  if (nextGameRes.isDbError) {
    return (
      <div className="relative min-h-screen flex flex-col items-center bg-gray-900 text-white">
        <Menu />
        <main className="flex-1 w-full flex flex-col items-center justify-center pt-24 sm:pt-36 pb-14 px-3.5 sm:px-6">
          <DatabaseUnavailableNotice
            title="Fixture & Availability Data Temporarily Unavailable"
            description="The next match fixture details, kickoff time, and squad availability cannot be retrieved right now because database access is offline or restricted by quota limits."
            className="my-8"
          />
        </main>
        <Sponsors />
        <Footer />
      </div>
    );
  }

  // 2. Legitimate empty database state (no upcoming fixture entered yet)
  if (!nextGame) {
    return (
      <div className="relative min-h-screen flex flex-col items-center bg-gray-900 text-white">
        <Menu />
        <main className="flex-1 flex flex-col items-center justify-center pt-24 sm:pt-36 pb-14 p-6 text-center">
          <div className="p-8 rounded-2xl bg-gray-950/80 border border-gray-800 shadow-xl max-w-md">
            <div className="inline-block px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-3">
              Fixture Schedule
            </div>
            <h2 className={`text-2xl font-bold mb-2 text-white ${robotoSlab.className}`}>Next Match Schedule Pending</h2>
            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mb-5">
              The match schedule for the upcoming round is currently being finalized with the league organizer.
            </p>
            <div className="flex justify-center">
              <SubscribeNotificationsButton variant="subtle" />
            </div>
          </div>
        </main>
        <Sponsors />
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

  const matchDate = formatMatchDate(safeGame.date);
  const gatheringTime = getGatheringTime(safeGame.kickoff);

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
            Kickoff times, venue details, and live squad attendance for FC Mierda&apos;s next match.
          </p>
        </div>

        {/* Next Game Match Center Card */}
        <div className="max-w-4xl w-full rounded-2xl sm:rounded-3xl p-2.5 sm:p-8 md:p-10 text-white bg-gradient-to-b from-gray-950 via-gray-950/95 to-gray-900/90 border border-gray-800 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-md mx-auto mb-10">

          {/* Centered Recent Form Badge */}
          <div className="flex justify-center mb-5 pb-3 border-b border-gray-800/80">
            <TeamForm teamId={1} />
          </div>

          {/* Unified Kick-Off Tile Container */}
          <div className="p-3.5 sm:p-6 md:p-7 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-gray-950 via-black/90 to-gray-950 border border-emerald-500/35 shadow-[0_0_35px_rgba(16,185,129,0.18)] w-full max-w-2xl mx-auto space-y-3 sm:space-y-4">
            
            {/* 1. Top Header: Stacked Match Date */}
            <div className="flex flex-col items-center justify-center pb-2 border-b border-gray-800/80 w-full text-center">
              <span className="text-emerald-400 font-extrabold text-xs sm:text-sm tracking-wide uppercase">
                {matchDate.weekday}
              </span>
              <span className="text-white font-bold text-sm sm:text-base md:text-lg tracking-tight">
                {matchDate.dateFormatted}
              </span>
            </div>

            {/* 2. Central Row: FC Mierda (Left) | Kick-Off Time (Center) | Opponent (Right) */}
            <div className="flex items-center justify-between gap-2 sm:gap-4 md:gap-6 py-1 sm:py-2 w-full">
              
              {/* Left Side: FC Mierda */}
              <div className="flex flex-col items-center text-center flex-1 max-w-[100px] sm:max-w-[140px] shrink-0">
                <div className="relative w-14 h-14 sm:w-20 sm:h-20 md:w-22 md:h-22 mb-1.5 drop-shadow-[0_4px_16px_rgba(16,185,129,0.35)] shrink-0">
                  <Image
                    src="/FCMierda-team-logo.png"
                    alt="FC Mierda"
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 56px, (max-width: 768px) 80px, 88px"
                    priority
                  />
                </div>
                <h3 className={`text-xs sm:text-base md:text-lg font-black text-white tracking-tight break-words ${robotoSlab.className}`}>
                  FC Mierda
                </h3>
              </div>

              {/* Center: Kick-Off Digital Clock & Gathering */}
              <div className="flex flex-col items-center justify-center text-center px-1 sm:px-3 flex-1 min-w-[125px] sm:min-w-[180px]">
                <div className="text-[11px] sm:text-xs md:text-sm font-extrabold uppercase tracking-widest text-gray-300">
                  Kick-Off
                </div>
                <div className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black font-mono text-white tracking-tight drop-shadow-[0_2px_16px_rgba(16,185,129,0.6)] my-1 sm:my-1.5">
                  {safeGame.kickoff}
                </div>
                <div className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-xl bg-gray-900/90 border border-gray-700/80 text-[10px] sm:text-xs md:text-sm font-semibold text-gray-200 shadow-sm mt-0.5">
                  <span className="text-emerald-400">⏰</span>
                  <span>Gathering at:</span>
                  <strong className="font-mono text-emerald-300 font-bold text-xs sm:text-sm md:text-base">
                    {gatheringTime}
                  </strong>
                </div>
              </div>

              {/* Right Side: Opponent */}
              <div className="flex flex-col items-center text-center flex-1 max-w-[100px] sm:max-w-[140px] shrink-0">
                <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-22 md:h-22 mb-1.5 rounded-full bg-gradient-to-br from-gray-800 to-gray-950 border-2 border-gray-700 shadow-xl flex items-center justify-center text-xl sm:text-3xl md:text-4xl drop-shadow-md shrink-0">
                  ⚽
                </div>
                <h3 className={`text-xs sm:text-base md:text-lg font-black text-white tracking-tight break-words font-mono ${robotoSlab.className}`}>
                  {safeGame.opponent}
                </h3>
              </div>

            </div>

            {/* 3. Bottom Footer: Location, Competition & Note */}
            <div className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 pt-2 border-t border-gray-800/80 w-full">
              {safeGame.location && safeGame.location !== "-" && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(safeGame.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/loc inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-xl bg-gray-900/90 hover:bg-gray-800 border border-gray-800 hover:border-emerald-500/50 text-gray-300 hover:text-white text-[10px] sm:text-xs transition-all max-w-full shadow-sm"
                  title={`Open ${safeGame.location} in Google Maps`}
                >
                  <span className="text-emerald-400 shrink-0 text-xs">📍</span>
                  <span className="font-medium truncate">{safeGame.location}</span>
                  <span className="text-[9px] text-gray-400 group-hover/loc:text-emerald-300 group-hover/loc:translate-x-0.5 transition-transform shrink-0">↗</span>
                </a>
              )}

              {safeGame.competition && safeGame.competition !== "-" && (
                <div className="text-[10px] sm:text-xs text-gray-300 px-1">
                  <span className="font-semibold text-amber-300 text-center">
                    {safeGame.competition}
                  </span>
                </div>
              )}

              {/* Match Note */}
              {safeGame.note && safeGame.note !== "-" && (
                <div className="pt-1 border-t border-gray-800/60 w-full flex items-center justify-center text-center px-2">
                  <p className={`text-[11px] sm:text-xs text-gray-300 italic max-w-md mx-auto ${montserrat.className}`}>
                    &ldquo;{safeGame.note}&rdquo;
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* Player Attendance Section */}
          <div className="mt-8 pt-6 border-t border-gray-800">
            <div className="text-center mb-4 sm:mb-6">
              <h3 className={`text-xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2 ${robotoSlab.className}`}>
                <span className="text-emerald-400">👥</span>
                <span>Live Squad Availability Tracker</span>
              </h3>
            </div>

            {/* Attendance Status Columns: 3-column side-by-side on mobile & desktop */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-4 mb-6">
              {/* Present Column - HERO HIGHLIGHT */}
              <div className="relative overflow-hidden p-2 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-b from-emerald-950/80 via-emerald-950/40 to-black/70 border sm:border-2 border-emerald-400/90 shadow-[0_0_25px_rgba(16,185,129,0.2)] ring-1 ring-emerald-400/30 flex flex-col justify-between min-w-0">
                <div className="min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 mb-2 sm:mb-3 pb-1.5 sm:pb-2.5 border-b border-emerald-500/30">
                    <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                      <span className="relative flex h-2 w-2 sm:h-3 sm:w-3 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 sm:h-3 sm:w-3 bg-emerald-500"></span>
                      </span>
                      <div className="min-w-0">
                        <span className="text-[11px] sm:text-sm md:text-base font-black uppercase tracking-wider text-emerald-300 block truncate">
                          Present
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-emerald-400/80 font-medium hidden sm:block">
                          Ready to play
                        </span>
                      </div>
                    </div>

                    {/* Prominent Glow Counter Badge */}
                    <div className="px-1.5 py-0.5 sm:px-3 sm:py-1 rounded-md sm:rounded-xl bg-emerald-500/20 border border-emerald-400/80 sm:border-2 shadow-[0_0_12px_rgba(16,185,129,0.35)] flex items-center justify-center self-start sm:self-auto min-w-[28px] sm:min-w-[48px]">
                      <span className="text-base sm:text-3xl md:text-4xl font-black font-mono text-emerald-200 drop-shadow-[0_2px_8px_rgba(16,185,129,0.6)]">
                        {present.length}
                      </span>
                    </div>
                  </div>

                  {/* Position Breakdown Subtle Counter */}
                  {present.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pt-0.5 pb-1.5 sm:pb-2 mb-2 sm:mb-3 border-b border-emerald-500/20 text-[9px] sm:text-xs">
                      <span
                        className="px-1 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-0.5 shadow-sm"
                        title="Verdedigers (v)"
                      >
                        <span>🛡️</span>
                        <span>{defendersCount}</span>
                        <span className="text-emerald-400/70 hidden sm:inline">(v)</span>
                      </span>
                      <span
                        className="px-1 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-0.5 shadow-sm"
                        title="Middenvelders (m)"
                      >
                        <span>⚙️</span>
                        <span>{midfieldersCount}</span>
                        <span className="text-emerald-400/70 hidden sm:inline">(m)</span>
                      </span>
                      <span
                        className="px-1 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-0.5 shadow-sm"
                        title="Aanvallers (a)"
                      >
                        <span>⚡</span>
                        <span>{attackersCount}</span>
                        <span className="text-emerald-400/70 hidden sm:inline">(a)</span>
                      </span>
                    </div>
                  )}

                  {/* Present Players List */}
                  {present.length > 0 ? (
                    <div className="space-y-1 sm:space-y-1.5 min-w-0">
                      {present.map((name) => {
                        const playerInfo = findPlayerData(name, playersMap);
                        return (
                          <div
                            key={name}
                            className="px-1.5 py-1 sm:px-2.5 sm:py-2 rounded-md sm:rounded-lg bg-black/50 border border-emerald-500/30 text-[10px] sm:text-xs md:text-sm font-semibold text-emerald-100 flex items-center justify-between shadow-sm min-w-0"
                          >
                            <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 flex-1">
                              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 shrink-0" />
                              {playerInfo?.id !== undefined ? (
                                <Link
                                  href={`/team?playerId=${playerInfo.id}#player-bio`}
                                  className="truncate hover:underline hover:text-emerald-300 transition-colors inline-flex items-center gap-1 min-w-0 flex-1"
                                  title={`View ${name}'s bio`}
                                >
                                  {playerInfo.number && (
                                    <span className="font-mono text-emerald-400 font-bold text-[9px] sm:text-xs shrink-0">
                                      #{playerInfo.number}
                                    </span>
                                  )}
                                  <span className="truncate">{name}</span>
                                  {playerInfo.positionCode && (
                                    <span className="text-emerald-400/90 font-bold text-[9px] sm:text-xs shrink-0">
                                      ({playerInfo.positionCode})
                                    </span>
                                  )}
                                </Link>
                              ) : (
                                <div className="truncate inline-flex items-center gap-1 min-w-0 flex-1">
                                  {playerInfo?.number && (
                                    <span className="font-mono text-emerald-400 font-bold text-[9px] sm:text-xs shrink-0">
                                      #{playerInfo.number}
                                    </span>
                                  )}
                                  <span className="truncate">{name}</span>
                                  {playerInfo?.positionCode && (
                                    <span className="text-emerald-400/90 font-bold text-[9px] sm:text-xs shrink-0">
                                      ({playerInfo.positionCode})
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <span className="hidden md:inline-flex text-[9px] uppercase font-black text-emerald-400/90 tracking-wider shrink-0 ml-1 px-1 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30">
                              IN
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-[10px] sm:text-xs text-gray-400 italic py-2 text-center">None</div>
                  )}
                </div>
              </div>

              {/* Not Sure Column */}
              <div className="p-2 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl bg-amber-950/30 border border-amber-500/30 shadow-md flex flex-col justify-between min-w-0">
                <div className="min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 mb-2 sm:mb-3 pb-1.5 sm:pb-2.5 border-b border-amber-500/20">
                    <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                      <span className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[11px] sm:text-xs md:text-sm font-bold uppercase tracking-wider text-amber-300 block truncate">
                          Not Sure
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-amber-400/70 font-medium hidden sm:block">
                          Pending
                        </span>
                      </div>
                    </div>
                    <div className="px-1.5 py-0.5 sm:px-2.5 sm:py-0.5 rounded-md sm:rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center self-start sm:self-auto min-w-[24px] sm:min-w-[36px]">
                      <span className="text-base sm:text-xl md:text-2xl font-black font-mono text-amber-300">
                        {notSure.length}
                      </span>
                    </div>
                  </div>

                  {notSure.length > 0 ? (
                    <div className="space-y-1 sm:space-y-1.5 min-w-0">
                      {notSure.map((name) => {
                        const playerInfo = findPlayerData(name, playersMap);
                        return (
                          <div
                            key={name}
                            className="px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-md sm:rounded-lg bg-black/40 border border-amber-500/20 text-[10px] sm:text-xs md:text-sm font-semibold text-amber-100 flex items-center gap-1 sm:gap-1.5 shadow-sm min-w-0"
                          >
                            <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-amber-400 shrink-0" />
                            {playerInfo?.id !== undefined ? (
                              <Link
                                href={`/team?playerId=${playerInfo.id}#player-bio`}
                                className="truncate hover:underline hover:text-amber-200 transition-colors inline-flex items-center gap-1 min-w-0 flex-1"
                                title={`View ${name}'s bio`}
                              >
                                {playerInfo.number && (
                                  <span className="font-mono text-amber-400 font-bold text-[9px] sm:text-xs shrink-0">
                                    #{playerInfo.number}
                                  </span>
                                )}
                                <span className="truncate">{name}</span>
                                {playerInfo.positionCode && (
                                  <span className="text-amber-400/80 font-semibold text-[9px] sm:text-[11px] shrink-0">
                                    ({playerInfo.positionCode})
                                  </span>
                                )}
                              </Link>
                            ) : (
                              <div className="truncate inline-flex items-center gap-1 min-w-0 flex-1">
                                {playerInfo?.number && (
                                  <span className="font-mono text-amber-400 font-bold text-[9px] sm:text-xs shrink-0">
                                    #{playerInfo.number}
                                  </span>
                                )}
                                <span className="truncate">{name}</span>
                                {playerInfo?.positionCode && (
                                  <span className="text-amber-400/80 font-semibold text-[9px] sm:text-[11px] shrink-0">
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
                    <div className="text-[10px] sm:text-xs text-gray-400 italic py-2 text-center">None</div>
                  )}
                </div>
              </div>

              {/* Absent Column */}
              <div className="p-2 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl bg-rose-950/25 border border-rose-500/25 shadow-md flex flex-col justify-between opacity-90 min-w-0">
                <div className="min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 mb-2 sm:mb-3 pb-1.5 sm:pb-2.5 border-b border-rose-500/20">
                    <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                      <span className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full bg-rose-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[11px] sm:text-xs md:text-sm font-bold uppercase tracking-wider text-rose-300 block truncate">
                          Absent
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-rose-400/70 font-medium hidden sm:block">
                          Unavailable
                        </span>
                      </div>
                    </div>
                    <div className="px-1.5 py-0.5 sm:px-2.5 sm:py-0.5 rounded-md sm:rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center self-start sm:self-auto min-w-[24px] sm:min-w-[36px]">
                      <span className="text-base sm:text-xl md:text-2xl font-black font-mono text-rose-300">
                        {absent.length}
                      </span>
                    </div>
                  </div>

                  {absent.length > 0 ? (
                    <div className="space-y-1 sm:space-y-1.5 min-w-0">
                      {absent.map((name) => {
                        const playerInfo = findPlayerData(name, playersMap);
                        return (
                          <div
                            key={name}
                            className="px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-md sm:rounded-lg bg-black/40 border border-rose-500/20 text-[10px] sm:text-xs md:text-sm font-semibold text-rose-200/80 flex items-center gap-1 sm:gap-1.5 shadow-sm min-w-0"
                          >
                            <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-rose-400 shrink-0" />
                            {playerInfo?.id !== undefined ? (
                              <Link
                                href={`/team?playerId=${playerInfo.id}#player-bio`}
                                className="truncate hover:underline hover:text-rose-100 transition-colors inline-flex items-center gap-1 min-w-0 flex-1"
                                title={`View ${name}'s bio`}
                              >
                                {playerInfo.number && (
                                  <span className="font-mono text-rose-400 font-bold text-[9px] sm:text-xs shrink-0">
                                    #{playerInfo.number}
                                  </span>
                                )}
                                <span className="truncate">{name}</span>
                                {playerInfo.positionCode && (
                                  <span className="text-rose-400/80 font-semibold text-[9px] sm:text-[11px] shrink-0">
                                    ({playerInfo.positionCode})
                                  </span>
                                )}
                              </Link>
                            ) : (
                              <div className="truncate inline-flex items-center gap-1 min-w-0 flex-1">
                                {playerInfo?.number && (
                                  <span className="font-mono text-rose-400 font-bold text-[9px] sm:text-xs shrink-0">
                                    #{playerInfo.number}
                                  </span>
                                )}
                                <span className="truncate">{name}</span>
                                {playerInfo?.positionCode && (
                                  <span className="text-rose-400/80 font-semibold text-[9px] sm:text-[11px] shrink-0">
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
                    <div className="text-[10px] sm:text-xs text-gray-400 italic py-2 text-center">None</div>
                  )}
                </div>
              </div>
            </div>

            {/* Coach & Supporters Section - Compact & Subtle */}
            {supporters.length > 0 && (
              <div className="my-3 sm:my-4 p-2 sm:p-2.5 rounded-xl bg-gray-900/50 border border-blue-500/20 flex flex-col items-center justify-center text-center gap-1.5 max-w-xs sm:max-w-sm mx-auto shadow-sm backdrop-blur-sm">
                <div className="flex items-center justify-center gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-blue-300">
                  <span className="text-xs">📣</span>
                  <span>Coach &amp; Supporters ({supporters.length})</span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-1">
                  {supporters.map((name) => (
                    <span
                      key={name}
                      className="px-2 py-0.5 rounded-full bg-blue-950/70 border border-blue-500/25 text-blue-200 text-[10px] sm:text-xs font-medium shadow-sm"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Call-to-Action & Notification Button */}
            <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-800/80">
              {/* Prominent Hero CTA Button */}
              <Link
                href="/cms/nextgameplayeravailability#player-availability"
                className="group relative inline-flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:via-emerald-400 hover:to-emerald-500 text-white font-extrabold text-base sm:text-lg px-8 sm:px-10 py-3.5 sm:py-4 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.35)] hover:shadow-[0_0_45px_rgba(16,185,129,0.55)] ring-2 ring-emerald-400/40 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 w-full sm:w-auto text-center"
                prefetch={true}
              >
                <span className="text-xl">✍️</span>
                <span>Submit Your Availability</span>
                <svg
                  className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>

              {/* Secondary Actions Row */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 w-full sm:w-auto">
                {leagueLink && (
                  <a
                    href={leagueLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-gray-900/90 hover:bg-gray-800 text-gray-300 hover:text-emerald-300 border border-gray-700/80 hover:border-gray-600 text-xs sm:text-sm font-semibold transition-all hover:-translate-y-0.5 shadow-md w-full sm:w-auto text-center"
                  >
                    <span>League Table &amp; Schedule</span>
                    <span className="text-gray-400 text-xs">↗</span>
                  </a>
                )}

                <SubscribeNotificationsButton variant="subtle" className="w-full sm:w-auto text-xs sm:text-sm py-2.5" />
              </div>
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
