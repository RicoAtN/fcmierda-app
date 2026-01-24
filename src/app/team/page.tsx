"use client";
import React, { useEffect, useState } from "react";
import { useMemo, useRef } from "react";
import Image from "next/image";
import { Roboto_Slab, Montserrat } from "next/font/google";
import Menu from "@/components/Menu";
import Footer from "@/components/Footer";
import TeamForm from "@/components/TeamForm";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "600"] });

type Player = {
  player_id: string;
  number?: string;
  name: string;
  nickname?: string;
  role?: string;
  bio?: string;
  photo?: string;
  highlights?: string[];
  biography_detail?: string; // NEW: inline detail fallback
};

type PlayerStats = {
  player_id: number;
  match_played: number;
  goals: number;
  assists: number;
  clean_sheets: number;
  goals_involvement?: number;
  average_goals_per_match?: number;
  average_goals_conceded_per_match?: number;
  biography_main?: string;  // renamed from biography
  biography_detail?: string;
};

type TeamStats = {
  match_played: number;
  clean_sheets: number;
  total_wins: number;
  total_losses: number;
  total_draws: number;
  goals_scored: number;
  average_goals_per_match: number;
  goals_conceded: number;
  average_goals_conceded_per_match: number;
};

const TEAM: Player[] = [
  // Management
  {
    player_id: "99",
    name: "Hans",
    nickname: "Maestro",
    role: "Head Coach",
    bio: "Hans is the undisputed legend and founding architect of FC Mierda, a man who commands the pitch through sheer tactical dominance. The team loves him for who he is—a tactical genius who knows exactly how to prepare the squad for every unique challenge they face.",
     photo: "/players/hans1OfficialPhoto.png",
    biography_detail: `As a founding member of FC Mierda, Hans carries the club’s DNA in everything he does, ensuring that the team’s foundation is as solid as his own legacy. He is a tactical chameleon on the touchline, possessing the rare intelligence to know exactly when to dominate the game with possession or when to "park the bus" to secure a result. His preparation is meticulous; he knows exactly how to prime the team for each game, ensuring every player understands their role in his master plan. This strategic brilliance is exactly why the players respect him, trusting his vision because he consistently proves he knows exactly what he is doing. His authority is rooted in his recent history on the pitch, where he was feared as a fierce competitor with an unmatched aggressive edge. However, he wasn't just a hard hitter; he balanced that intensity with a finesse in his passing and shooting that mirrored the elegance of Andrea Pirlo. This "aggressive maestro" style made him a nightmare for opponents who couldn't handle his blend of grit and world-class vision. Now, as a coach, he demands that same level of dual-threat excellence from every player he selects for his starting eleven. He has an uncanny knack for spotting weaknesses in the opposition and exploiting them with surgical precision. Even in the heat of a match, Hans remains the calm eye of the storm, guiding his players with the wisdom of a veteran and the passion of a founder. Ultimately, the success of FC Mierda is a reflection of his character: tough, brilliant, and always one step ahead.`
  },

  // Goalkeepers
  {
    player_id: "1",
    number: "#1",
    name: "Alon",
    nickname: "Alon d'Or",
    role: "Goalkeeper",
    bio: "Alon d'Or — commanding presence in goal with quick reflexes, strong aerial control and excellent communication.",
    photo: "/players/alonOfficialPhoto.png",
  },
  {
    player_id: "12",
    number: "#12",
    name: "Victor",
    nickname: "Turbokwek",
    role: "Goalkeeper",
    bio: "Turbokwek — agile backup keeper, reliable with his feet and good at organising the defence.",
    // photo: "/players/victor.jpg",
  },

  // Defenders
  {
    player_id: "88",
    number: "#88",
    name: "Rico",
    nickname: "Grey Wall",
    role: "Defender",
    bio: "Grey Wall — composed central defender, excels in positioning, aerial duels and reading opposition attacks.",
    photo: "/players/ricoOfficialPhoto.png",
  },
  {
    player_id: "26",
    number: "#26",
    name: "Pim S 🥸",
    nickname: "Snorremans",
    role: "Defender",
    bio: "Snorremans — energetic fullback with strong 1v1 defending and the willingness to support the attack.",
    photo: "/players/pimSOfficialPhoto.png",
  },
  {
    player_id: "32",
    number: "#32",
    name: "Kevin",
    nickname: "Oyabun",
    role: "Defender",
    bio: "Oyabun — physical defender who wins duels, reads the game well and provides stability at the back.",
    photo: "/players/kevinOfficialPhoto.png",
  },
  {
    player_id: "69",
    number: "#69",
    name: "Mitchell",
    nickname: "Satoshi",
    role: "Defender",
    bio: "Satoshi — quick and attentive fullback, reliable in recovery runs and one-on-one defending.",
    photo: "/players/mitchellOfficialPhoto.png",
  },
    {
    player_id: "3",
    number: "#3",
    name: "Jochem",
    nickname: "Jochem",
    role: "Defender",
    bio: "Jochem — versatile defender known for his tactical awareness, solid tackling, and ability to read the game effectively.",
    photo: "/players/jochemOfficialPhoto.png",
  },
  {
    player_id: "4",
    number: "#4",
    name: "Marten Kraaij",
    nickname: "Kraaij",
    role: "Defender",
    bio: "Kraaij is a hard-hitting defender who masterfully balances raw physicality with elite positional intelligence. He is a dual-threat in the backline, capable of winning punishing battles against the leagues toughest strikers while simultaneously acting as a deep-lying playmaker who distributes the ball with surgical precision.",
    biography_detail:"Kraaij is the rare type of defender who can dominate a game through both his brain and his brawn, making him a cornerstone of the FC Mierda defense. He has an innate sense of timing, knowing exactly where to position himself to intercept passes and shut down dangerous lanes before the opposition can even react. When the ball is at his feet, he transforms into a distributor, launching pinpoint passes over the field to ignite lightning-fast counter-attacks from deep. However, his technical vision never softens his edge; he actively relishes the hard battles and thrives when the game gets physical. Any attacker attempting to bully their way past him will find that Kraaij can withstand his man with immovable strength, refusing to give up a single inch of grass. This ability to absorb pressure and immediately turn it into a forward-thinking play makes him a nightmare for tactical planners to account for. He sets the tone for the entire team, proving that you can be a ruthless enforcer while maintaining the composure of a world-class playmaker. Whether he is flattening a center-forward or spraying a forty-yard diagonal ball to the wing, Kraaij executes his role with a level of confidence that anchors the entire squad. Ultimately, he is the complete package—a defensive powerhouse who controls the pitch through sheer force of will and a brilliant footballing mind.",
    // photo: "/players/marten.jpg",
  },
  {
    player_id: "6",
    number: "#6",
    name: "Sander",
    nickname: "Senderos",
    role: "Defender",
    bio: "Senderos — disciplined marker with good timing in tackles and solid positional instincts.",
    // photo: "/players/bouwhuis.jpg",
  },

  // Midfielders
  {
    player_id: "57",
    number: "#57",
    name: "Mart",
    nickname: "WingWizard",
    role: "Midfielder",
    bio: "WingWizard — pacey wide midfielder with excellent crossing and the ability to stretch defences.",
    // photo: "/players/mart.jpg",
  },
  {
    player_id: "14",
    number: "#14",
    name: "Niek",
    nickname: "Bearzerker",
    role: "Midfielder",
    bio: "Bearzerker — industrious midfielder with strong tackling, high work-rate and late box runs.",
    // photo: "/players/niek.jpg",
  },
  {
    player_id: "10",
    number: "#10",
    name: "Jordy (CAPTAIN)",
    nickname: "Kapiteni",
    role: "Midfielder",
    bio: "Kapiteni — captain and chief playmaker; creative, calm under pressure and a set-piece leader.",
    photo: "/players/jordyOfficialPhoto.png",
  },
  {
    player_id: "19",
    number: "#19",
    name: "Lennert",
    nickname: "Len",
    role: "Midfielder",
    bio: "Len — shielding midfielder with excellent positional sense, breaks up play and recycles possession.",
    photo: "/players/lennertOfficialPhoto.png",
  },
  {
    player_id: "22",
    number: "#22",
    name: "Ka",
    nickname: "Jake",
    role: "Midfielder",
    bio: "Jake — technically strong midfielder with vision to pick passes and control tempo.",
    photo: "/players/kaOfficialPhoto.png",
  },
  {
    player_id: "7",
    number: "#7",
    name: "Daan",
    nickname: "Koetje",
    role: "Midfielder",
    bio: "Koetje — energetic midfielder who presses aggressively and links defence to attack.",
    // photo: "/players/daan.jpg",
  },
   {
    player_id: "11",
    number: "#11",
    name: "Frank",
    nickname: "Frank",
    role: "Midfielder",
    bio: "Frank.",
    // photo: "/players/frank.jpg",
  },
  {
    player_id: "20",
    number: "#20",
    name: "Marten Sud",
    nickname: "Zilveren Vos",
    role: "Midfielder",
    bio: "Sud is a relentless winger whose game is built on a foundation of raw determination and a fierce aggressive edge. He is the ultimate team player, consistently delivering goals in crucial moments while quietly handling the high-intensity dirty work that paves the way for FC Mierda’s success.",
    biography_detail: "Sud is the type of player who operates under the radar, yet his impact on the match is felt by every opponent who tries to share his flank. His best qualities are his aggression and unshakable determination, traits he uses to harass defenders and win back possession in dangerous areas. You might not always notice him in the flashy highlight reels, but that is because he is busy doing the essential work that allows the rest of the team to shine. Whether he is tracking back to stop a counter-attack or making a selfless run to open space, he does exactly what is required to secure a win. Despite his blue-collar work ethic, he possesses a clinical instinct for the goal, appearing in the box to score precisely when the team needs a breakthrough. This blend of grit and finishing ability makes him a vital tactical tool, as he provides a balance of defensive stability and offensive threat. He never stops running, using his stamina to wear down opponents until they eventually crack under his persistent pressure. Ultimately, Sud is the engine of efficiency for FC Mierda—a winger who values the result over the spotlight and proves that the dirty work is what truly builds champions."
    // photo: "/players/sud.jpg",
  },

  // Attackers
  {
    player_id: "23",
    number: "#23",
    name: "Sven",
    nickname: "Zuenna",
    role: "Striker",
    bio: "Zuenna — versatile attacker with clever movement, good hold-up play and a nose for goal.",
    photo: "/players/svenOfficialPhoto.png",
  },
  {
    player_id: "9",
    number: "#9",
    name: "Pim",
    nickname: "Inzaghi",
    role: "Striker",
    bio: "Inzaghi — clinical finisher and instinctive poacher who times runs to perfection.",
    photo: "/players/pimOfficialPhoto.png",
  },
  {
    player_id: "15",
    number: "#15",
    name: "Flavio",
    nickname: "Flavio",
    role: "Striker",
    bio: "Flavio.",
    // photo: "/players/flavio.jpg",
  }
];

const CATEGORIES = [
  { key: "All", label: "All", matcher: () => true },
  { key: "Goalkeepers", label: "Goalkeepers", matcher: (r?: string) => !!r && r.toLowerCase().includes("goalkeeper") },
  { key: "Defenders", label: "Defenders", matcher: (r?: string) => !!r && r.toLowerCase().includes("defend") },
  { key: "Midfielders", label: "Midfielders", matcher: (r?: string) => !!r && r.toLowerCase().includes("midfield") },
  { key: "Attackers", label: "Attackers", matcher: (r?: string) => !!r && (r.toLowerCase().includes("striker") || r.toLowerCase().includes("forward") || r.toLowerCase().includes("attack")) },
];

export default function TeamPage() {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [selectedId, setSelectedId] = useState<string | null>(TEAM[1]?.player_id ?? null); // default to Alon

  // ref for the bio/detail panel to scroll into view
  const bioRef = useRef<HTMLDivElement | null>(null);

  // Fetch stats on the client and map by string(player_id)
  const [stats, setStats] = useState<PlayerStats[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/player-statistics", { cache: "no-store" });
        const { data } = (await res.json()) as { data: PlayerStats[] };
        if (!cancelled) setStats(data ?? []);
      } catch (e) {
        console.error("Failed to load player statistics", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch team statistics
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [teamStatsError, setTeamStatsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/team-statistics", { cache: "no-store" });
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error((errJson as { error?: string })?.error || `HTTP ${res.status}`);
        }
        const { data } = (await res.json()) as { data: TeamStats };
        if (!cancelled) {
          setTeamStats(data);
          setTeamStatsError(null);
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to load";
        console.error("Failed to load team statistics", e);
        if (!cancelled) setTeamStatsError(message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const statsMap = useMemo(() => {
    const m = new Map<string, PlayerStats>();
    for (const s of stats) m.set(String(s.player_id), s);
    return m;
  }, [stats]);

  const countsByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const cat of CATEGORIES) {
      map.set(cat.key, TEAM.filter((p) => cat.matcher(p.role)).length);
    }
    return map;
  }, []);

  const filtered = useMemo(() => {
    const roleCat = CATEGORIES.find((c) => c.key === roleFilter) ?? CATEGORIES[0];
    return TEAM.filter((p) => {
      if (!roleCat.matcher(p.role)) return false;
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.number || "").toLowerCase().includes(q) ||
        (p.role || "").toLowerCase().includes(q) ||
        (p.nickname || "").toLowerCase().includes(q)
      );
    });
  }, [query, roleFilter]);

  const selected = useMemo(() => TEAM.find((p) => p.player_id === selectedId) ?? TEAM[1] ?? null, [selectedId]);

  // centralised selection handler — sets selection and scrolls bio into view
  function handleSelect(id: string) {
    setSelectedId(id);
    setTimeout(() => {
      bioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  const filteredStats = useMemo(() => {
    return stats.filter(s => {
      const teamPlayer = TEAM.find(p => String(p.player_id) === String(s.player_id));
      const name = teamPlayer?.name ?? `Player ${s.player_id}`;
      return !name.toLowerCase().includes("player");
    });
  }, [stats]);

  const topGoals = useMemo(
    () => [...filteredStats].sort((a,b)=> (b.goals||0)-(a.goals||0)).slice(0,5),
    [filteredStats]
  );
  const topAssists = useMemo(
    () => [...filteredStats].sort((a,b)=> (b.assists||0)-(a.assists||0)).slice(0,5),
    [filteredStats]
  );
  const topAvgGoals = useMemo(
    () => [...filteredStats]
      .filter(s => (s.match_played || 0) > 3)
      .sort((a,b)=> (b.average_goals_per_match||0)-(a.average_goals_per_match||0)).slice(0,5),
    [filteredStats]
  );
  const topAvgConceded = useMemo(
    () => [...filteredStats]
      .filter(s => s.average_goals_conceded_per_match != null)
      .filter(s => (s.match_played || 0) > 3)
      .sort((a,b)=> (a.average_goals_conceded_per_match ?? 9999) - (b.average_goals_conceded_per_match ?? 9999))
      .slice(0,5),
    [filteredStats]
  );
  const topMatches = useMemo(
    () => [...filteredStats].sort((a,b)=> (b.match_played||0)-(a.match_played||0)).slice(0,5),
    [filteredStats]
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Menu />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* Page overview / quick navigation */}
        <section className="mb-10 bg-gray-800 rounded-xl p-6 shadow">
          <h1 className={`text-3xl sm:text-4xl font-extrabold mb-4 text-center ${robotoSlab.className}`}>FC Mierda team overview</h1>
          <p className={`text-sm sm:text-base text-gray-300 leading-relaxed text-center ${montserrat.className}`}>
            This page gives you a complete snapshot of FC Mierda: team-wide performance metrics, standout individual performers,
            and detailed profiles for every squad member.
          </p>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => scrollTo("team-stats")}
              className="group flex flex-col items-start rounded-lg border border-green-600/40 bg-green-600/10 px-4 py-3 hover:bg-green-600/20 transition"
            >
              <span className="text-sm font-semibold text-green-300">Team statistics</span>
              <span className="mt-1 text-xs text-gray-300">
                Core results, averages and totals for the current recorded period.
              </span>
            </button>
            <button
              onClick={() => scrollTo("top-performers")}
              className="group flex flex-col items-start rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-4 py-3 hover:bg-indigo-500/20 transition"
            >
              <span className="text-sm font-semibold text-indigo-300">All-time top performers</span>
              <span className="mt-1 text-xs text-gray-300">
                Leading goal scorers, assist providers, efficiency and match appearance leaders.
              </span>
            </button>
            <button
              onClick={() => scrollTo("meet-team")}
              className="group flex flex-col items-start rounded-lg border border-gray-500/40 bg-gray-500/10 px-4 py-3 hover:bg-gray-500/20 transition"
            >
              <span className="text-sm font-semibold text-gray-200">Meet the team</span>
              <span className="mt-1 text-xs text-gray-300">
                Individual player bios, roles, call signs and up-to-date personal stats.
              </span>
            </button>
          </div>
        </section>

        {/* Team statistics section */}
        <section id="team-stats" className="mb-8 bg-gray-800 rounded-xl p-5 shadow">
          <header className="mb-6 text-center">
            <h1 className={`text-3xl sm:text-4xl font-extrabold ${robotoSlab.className}`}>Team statistics</h1>
            <p className={`mt-2 text-sm sm:text-base text-gray-300 ${montserrat.className}`}>
              Mierda’s overall statistics for the recent period.
            </p>
            <TeamForm teamId={1} className="mt-6" />
          </header>

          {teamStatsError && (
            <div className="mt-3 text-sm text-red-400">Error: {teamStatsError}</div>
          )}

          {(() => {
            const ts = teamStats;
            const fmtInt = (n?: number) => String(n ?? 0);
            const fmtAvg = (n?: number) => (n ?? 0).toFixed(2);

            const Tile = ({ label, value }: { label: string; value: string | number }) => (
              <div className="bg-black/20 rounded-lg p-3 w-full flex flex-col items-center text-center">
                <div className="text-base sm:text-lg font-semibold text-green-300 leading-tight tabular-nums tracking-tight">
                  {value}
                </div>
                <div className="mt-2 text-sm sm:text-base text-gray-300 leading-5 whitespace-normal break-words">
                  {label}
                </div>
              </div>
            );

            if (!ts && !teamStatsError) {
              // simple loading skeleton
              return (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="bg-black/20 rounded-lg p-3 h-20 animate-pulse" />
                  ))}
                </div>
              );
            }

            return (
              <div className="mt-4 space-y-5">
                {/* Results */}
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">Results</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Tile label="Matches played" value={fmtInt(ts?.match_played)} />
                    <Tile label="Wins" value={fmtInt(ts?.total_wins)} />
                    <Tile label="Draws" value={fmtInt(ts?.total_draws)} />
                    <Tile label="Losses" value={fmtInt(ts?.total_losses)} />
                  </div>
                </div>

                {/* Averages */}
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">Averages</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Tile label="Avg goals p/m" value={fmtAvg(ts?.average_goals_per_match)} />
                    <Tile label="Avg conceded p/m" value={fmtAvg(ts?.average_goals_conceded_per_match)} />
                  </div>
                </div>

                {/* Totals */}
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">Totals</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Tile label="Goals scored" value={fmtInt(ts?.goals_scored)} />
                    <Tile label="Goals against" value={fmtInt(ts?.goals_conceded)} />
                  </div>
                </div>

                {/* Defence */}
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">Defence</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Tile label="Clean sheets" value={fmtInt(ts?.clean_sheets)} />
                  </div>
                </div>
              </div>
            );
          })()}
        </section>

        {/* All-time top performers section */}
        <section id="top-performers" className="mb-8 bg-gray-800 rounded-xl p-5 shadow">
          <header className="mb-6 text-center">
            <h2 className={`text-3xl sm:text-4xl font-extrabold ${robotoSlab.className}`}>All-time top performers</h2>
            <p className={`mt-2 text-sm sm:text-base text-gray-300 ${montserrat.className}`}>
              Leading FC Mierda performers (data since June 2025 – full historic expansion in progress).
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(() => {
              type StatKey =
                | "goals"
                | "assists"
                | "average_goals_per_match"
                | "average_goals_conceded_per_match"
                | "match_played";

              interface StatBlock {
                heading: string;
                list: PlayerStats[];
                valueKey: StatKey;
                isAvg?: boolean;
              }

              const getValue = (ps: PlayerStats, key: StatKey) => {
                const v = ps[key];
                return typeof v === "number" ? v : 0;
              };

              const blocks: StatBlock[] = [
                { heading: "Top goal scorers", list: topGoals, valueKey: "goals" },
                { heading: "Top assists", list: topAssists, valueKey: "assists" },
                { heading: "Top avg goals p/m", list: topAvgGoals, valueKey: "average_goals_per_match", isAvg: true },
                { heading: "Lowest avg goals conceded p/m", list: topAvgConceded, valueKey: "average_goals_conceded_per_match", isAvg: true },
                { heading: "Most matches played", list: topMatches, valueKey: "match_played" }
              ];

              return blocks.map((block, i) => (
                <div key={i}>
                  <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">{block.heading}</div>
                  <ul className="space-y-2">
                    {block.list.map((ps, idx) => {
                      const player = TEAM.find(p => String(p.player_id) === String(ps.player_id));
                      const name = player?.name ?? `Player ${ps.player_id}`;
                      if (name.toLowerCase().includes("player")) return null;
                      const raw = getValue(ps, block.valueKey);
                      const val = block.isAvg ? raw.toFixed(2) : String(raw);
                      return (
                        <li
                          key={ps.player_id}
                          className="flex items-center justify-between bg-black/20 rounded-md px-3 py-2 text-sm"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-gray-400 w-5">{idx + 1}.</span>
                            <span className="font-medium truncate">{name}</span>
                          </div>
                          <span className="font-semibold text-green-300 tabular-nums">{val}</span>
                        </li>
                      );
                    })}
                    {block.list.length === 0 && (
                      <li className="text-xs text-gray-500">No data.</li>
                    )}
                  </ul>
                </div>
              ));
            })()}
          </div>

        </section> {/* <-- added closing tag for top-performers section */}

        <header id="meet-team" className="mb-6 text-center">
          <h1 className={`text-3xl sm:text-4xl font-extrabold ${robotoSlab.className}`}>Meet the Team</h1>
          <p className={`mt-2 text-sm sm:text-base text-gray-300 ${montserrat.className}`}>
            Detailed player profiles with roles, bios, call signs and current performance statistics.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Controls + list */}
          <aside className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl p-4 shadow">
              {/* category filters */}
              <div className="flex gap-2 flex-wrap mb-3">
                {CATEGORIES.map((cat) => {
                  const active = cat.key === roleFilter;
                  const count = countsByCategory.get(cat.key) ?? 0;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => setRoleFilter(cat.key)}
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
                  aria-label="Search players"
                  placeholder={`Search by name, number, role or call sign${roleFilter !== "All" ? ` — filtering ${roleFilter}` : ""}`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <div className="text-sm text-gray-400 hidden sm:block">{filtered.length}/{TEAM.length}</div>
              </div>

              <ul className="divide-y divide-gray-700 max-h-[60vh] overflow-auto">
                {filtered.map((p) => {
                  const active = p.player_id === selectedId;
                  return (
                    <li key={p.player_id}>
                      <button
                        onClick={() => handleSelect(p.player_id)}
                        className={`w-full text-left flex items-center gap-3 p-3 rounded-md transition ${
                          active ? "bg-gradient-to-r from-green-700/20 to-transparent ring-1 ring-green-500" : "hover:bg-gray-700/40"
                        }`}
                      >
                        {/* prominent number column */}
                        <div className="w-14 flex-shrink-0 flex items-center justify-center">
                          <div className="mt-1 text-lg sm:text-xl font-extrabold text-green-300">{p.number ?? "-"}</div>
                        </div>

                        {/* avatar */}
                        {p.photo ? (
                          <div className="w-14 h-14 relative rounded-full overflow-hidden flex-shrink-0">
                            <Image src={p.photo} alt={p.name} fill className="object-cover scale-125" />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-200">
                            {p.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium truncate">{p.name}</div>
                              {p.nickname && <div className="text-xs text-gray-400 italic truncate"> {p.nickname}</div>}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400 truncate">{p.role}</div>
                        </div>
                      </button>
                    </li>
                  );
                })}
                {filtered.length === 0 && <li className="p-3 text-sm text-gray-400">No players found.</li>}
              </ul>
            </div>
          </aside>

          {/* Right: Highlight / profile */}
          <section className="lg:col-span-2">
            {/* attach ref here so handleSelect can scroll to this panel */}
            <div ref={bioRef} className="bg-gray-800 rounded-xl p-6 shadow min-h-[360px]">
              {selected ? (
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex-shrink-0 relative">
                    {selected.photo ? (
                      <div className="relative">
                        <Image src={selected.photo} width={280} height={280} className="rounded-xl object-cover" alt={selected.name} />
                      </div>
                    ) : (
                      <div className="w-[280px] h-[280px] rounded-xl bg-gray-700 flex items-center justify-center text-5xl font-bold text-gray-200">
                        {selected.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-bold">{selected.name}</h2>
                        {selected.nickname && (
                          <div className="text-sm text-gray-300 mt-1 italic">
                            Call sign: <span className="text-green-300 font-semibold not-italic">{selected.nickname}</span>
                          </div>
                        )}
                        <div className="text-sm text-gray-300 mt-1">Position: {selected.role}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl sm:text-3xl font-extrabold text-green-300">{selected.number ?? "-"}</div>
                      </div>
                    </div>

                    {/* Stats block — moved above summary */}
                    {(() => {
                      const s = statsMap.get(selected.player_id);
                      const role = (selected.role || "").toLowerCase();
                      const isCoach = role.includes("coach");
                      if (isCoach) return null;

                      const isMidfielder = role.includes("midfield");
                      const isAttacker = role.includes("striker") || role.includes("forward") || role.includes("attack");
                      const isKeeperOrDef = role.includes("goalkeeper") || role.includes("defend");

                      const StatTile = ({ label, value }: { label: string; value: string | number }) => (
                        <div className="bg-black/20 rounded-lg p-3 w-full flex flex-col items-center text-center">
                          <div className="text-lg sm:text-xl font-semibold text-green-300 leading-tight tabular-nums tracking-tight">
                            {value}
                          </div>
                          <div className="mt-2 text-sm sm:text-base text-gray-300 leading-5 whitespace-normal break-words">
                            {label}
                          </div>
                        </div>
                      );

                      const fmtInt = (n: number | undefined) => String(n ?? 0);
                      const fmtAvg = (n: number | undefined) => (n ?? 0).toFixed(2);

                      const tiles: { label: string; value: string | number }[] = [
                        { label: "Matches", value: fmtInt(s?.match_played) },
                        { label: "Goals", value: fmtInt(s?.goals) },
                        { label: "Assists", value: fmtInt(s?.assists) },
                      ];

                      if (isKeeperOrDef) {
                        tiles.push({ label: "Clean sheets", value: fmtInt(s?.clean_sheets) });
                        tiles.push({ label: "Avg conceded p/m", value: fmtAvg(s?.average_goals_conceded_per_match) });
                      }
                      if (isMidfielder) {
                        tiles.push({ label: "Goals involvement", value: fmtInt(s?.goals_involvement) });
                      }
                      if (isAttacker) {
                        tiles.push({ label: "Avg goals p/m", value: fmtAvg(s?.average_goals_per_match) });
                      }

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

                    {/* Summary block — now below stats */}
                    {(() => {
                      const s = statsMap.get(selected.player_id);
                      const dbBio = s?.biography_main?.trim();
                      const dbDetail = s?.biography_detail?.trim();
                      const mainBio = dbBio ?? selected.bio;
                      const detail = (dbDetail ?? selected.biography_detail)?.trim();

                      return (
                        <div className="mt-6">
                          <h4 className="text-xs uppercase tracking-wide text-gray-400 mb-1">Summary</h4>
                          <p className="text-gray-200 leading-relaxed text-base sm:text-lg font-medium border-l border-gray-700 pl-3">
                            {mainBio || "No summary available."}
                          </p>
                          {detail && (
                            <p className="mt-2 text-gray-400 leading-relaxed text-sm sm:text-base">
                              {detail}
                            </p>
                          )}
                        </div>
                      );
                    })()}

                    {/* Highlights block */}
                    {selected.highlights?.length ? (
                      <div className="mt-6">
                        <h4 className="text-sm text-gray-300 font-semibold mb-2">Highlights</h4>
                        <ul className="flex flex-wrap gap-2">
                          {selected.highlights.map((h, i) => (
                            <li key={i} className="text-xs bg-green-600/20 text-green-300 px-3 py-1 rounded-full">
                              {h}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
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