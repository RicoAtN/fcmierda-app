"use client";
import { useState, useMemo, useRef } from "react";
import Image from "next/image";
import { Roboto_Slab, Montserrat } from "next/font/google";
import Menu from "@/components/Menu";
import Footer from "@/components/Footer";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "600"] });

type Player = {
  id: string;
  number?: string;
  name: string;
  nickname?: string;
  role?: string;
  bio?: string;
  photo?: string;
  highlights?: string[];
};

const TEAM: Player[] = [
  // Management
  {
    id: "hans-mgr",
    name: "Hans",
    nickname: "Maestro",
    role: "Head Coach",
    bio: "Maestro & Pirlo — tactical architect who prioritises possession, structured build-up and midfield control.",
  },

  // Goalkeepers
  {
    id: "alon",
    number: "#1",
    name: "Alon",
    nickname: "Alon d'Or",
    role: "Goalkeeper",
    bio: "Alon d'Or — commanding presence in goal with quick reflexes, strong aerial control and excellent communication.",
    // photo: "/players/alon.jpg",
  },
  {
    id: "victor",
    number: "#12",
    name: "Victor",
    nickname: "Turbokwek",
    role: "Goalkeeper",
    bio: "Turbokwek — agile backup keeper, reliable with his feet and good at organising the defence.",
    // photo: "/players/victor.jpg",
  },

  // Defenders
  {
    id: "rico",
    number: "#88",
    name: "Rico",
    nickname: "Grey Wall",
    role: "Defender",
    bio: "Grey Wall — composed central defender, excels in positioning, aerial duels and reading opposition attacks.",
    photo: "/players/rico.png",
  },
  {
    id: "pim-s",
    number: "#26",
    name: "Pim S 🥸",
    nickname: "Snorremans",
    role: "Defender",
    bio: "Snorremans — energetic fullback with strong 1v1 defending and the willingness to support the attack.",
    // photo: "/players/pim-s.jpg",
  },
  {
    id: "kevin",
    number: "#32",
    name: "Kevin",
    nickname: "Oyabun",
    role: "Defender",
    bio: "Oyabun — physical defender who wins duels, reads the game well and provides stability at the back.",
    // photo: "/players/kevin.jpg",
  },
  {
    id: "mitchell",
    number: "#69",
    name: "Mitchell",
    nickname: "Satoshi",
    role: "Defender",
    bio: "Satoshi — quick and attentive fullback, reliable in recovery runs and one-on-one defending.",
    // photo: "/players/mitchell.jpg",
  },
  {
    id: "marten",
    number: "#4",
    name: "Marten Kraaij",
    nickname: "Kraaij",
    role: "Defender",
    bio: "Kraaij — strong, no-nonsense defender who organises the backline and wins physical battles.",
    // photo: "/players/marten.jpg",
  },
  {
    id: "bouwhuis",
    number: "#6",
    name: "Bouwhuis",
    nickname: "Senderos",
    role: "Defender",
    bio: "Senderos — disciplined marker with good timing in tackles and solid positional instincts.",
    // photo: "/players/bouwhuis.jpg",
  },

  // Midfielders
  {
    id: "mart",
    number: "#57",
    name: "Mart",
    nickname: "WingWizard",
    role: "Midfielder",
    bio: "WingWizard — pacey wide midfielder with excellent crossing and the ability to stretch defences.",
    // photo: "/players/mart.jpg",
  },
  {
    id: "niek",
    number: "#14",
    name: "Niek",
    nickname: "Bearzerker",
    role: "Midfielder",
    bio: "Bearzerker — industrious midfielder with strong tackling, high work-rate and late box runs.",
    // photo: "/players/niek.jpg",
  },
  {
    id: "jordy",
    number: "#10",
    name: "Jordy (CAPTAIN)",
    nickname: "Kapiteni",
    role: "Midfielder",
    bio: "Kapiteni — captain and chief playmaker; creative, calm under pressure and a set-piece leader.",
    // photo: "/players/jordy.jpg",
  },
  {
    id: "lennert",
    number: "#19",
    name: "Lennert",
    nickname: "Len",
    role: "Midfielder",
    bio: "Len — shielding midfielder with excellent positional sense, breaks up play and recycles possession.",
    // photo: "/players/lennert.jpg",
  },
  {
    id: "ka",
    number: "#22",
    name: "Ka",
    nickname: "Jake",
    role: "Midfielder",
    bio: "Jake — technically strong midfielder with vision to pick passes and control tempo.",
    // photo: "/players/ka.jpg",
  },
  {
    id: "daan",
    number: "#7",
    name: "Daan",
    nickname: "Koetje",
    role: "Midfielder",
    bio: "Koetje — energetic midfielder who presses aggressively and links defence to attack.",
    // photo: "/players/daan.jpg",
  },
  {
    id: "sud",
    number: "#20",
    name: "Marten Sud",
    nickname: "Zilveren Vos",
    role: "Midfielder",
    bio: "Zilveren Vos — intelligent operator who times runs into the box and creates overloads.",
    // photo: "/players/sud.jpg",
  },

  // Attackers
  {
    id: "sven",
    number: "#23",
    name: "Sven",
    nickname: "Zuenna",
    role: "Striker",
    bio: "Zuenna — versatile attacker with clever movement, good hold-up play and a nose for goal.",
    // photo: "/players/sven.jpg",
  },
  {
    id: "pim9",
    number: "#9",
    name: "Pim",
    nickname: "Inzaghi",
    role: "Striker",
    bio: "Inzaghi — clinical finisher and instinctive poacher who times runs to perfection.",
    // photo: "/players/pim.jpg",
  },
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
  const [selectedId, setSelectedId] = useState<string | null>(TEAM[1]?.id ?? null); // default to Alon

  // ref for the bio/detail panel to scroll into view
  const bioRef = useRef<HTMLDivElement | null>(null);

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

  const selected = useMemo(() => TEAM.find((p) => p.id === selectedId) ?? TEAM[1] ?? null, [selectedId]);

  // centralised selection handler — sets selection and scrolls bio into view
  function handleSelect(id: string) {
    setSelectedId(id);
    setTimeout(() => {
      bioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Menu />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <header className="mb-6 text-center">
          <h1 className={`text-3xl sm:text-4xl font-extrabold ${robotoSlab.className}`}>Meet the Team</h1>
          <p className={`mt-2 text-sm sm:text-base text-gray-300 ${montserrat.className}`}>
            Know the squad: quick bios, roles and call signs. Tap or click a player to view a focused profile.
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
                  const active = p.id === selectedId;
                  return (
                    <li key={p.id}>
                      <button
                        onClick={() => handleSelect(p.id)}
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
                          // eslint-disable-next-line jsx-a11y/alt-text
                          <div className="w-14 h-14 relative rounded-full overflow-hidden flex-shrink-0">
                            <Image src={p.photo} alt={p.name} fill className="object-cover" />
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
                      // eslint-disable-next-line jsx-a11y/alt-text
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

                    <p className="mt-4 text-gray-200 leading-relaxed">{selected.bio || "No bio available."}</p>

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