"use client";

import { Roboto_Slab, Montserrat } from "next/font/google";
import Menu from "@/components/Menu";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useRouter } from "next/navigation";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700", "800"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

const CMS_MODULES = [
  {
    title: "Next Match & Fixtures",
    description: "Update kickoff times, venue, opponent, matchday notes, and broadcast push notifications.",
    href: "/cms/nextgamedetails",
    icon: "📅",
    badge: "Matchday Hub",
    buttonText: "Manage Next Game →",
  },
  {
    title: "Match Results & Recaps",
    description: "Post new match scores, record goal scorers, assists, YouTube highlights, and Man of the Match.",
    href: "/cms/postmatchresult",
    icon: "⚽",
    badge: "Scores & Stats",
    buttonText: "Post / Edit Results →",
  },
  {
    title: "Competitions & Standings",
    description: "Create or edit tournament seasons, manage opponent team rosters, and link live league tables.",
    href: "/cms/competition",
    icon: "🏆",
    badge: "League Overview",
    buttonText: "Manage Competitions →",
  },
  {
    title: "Squad & Player Management",
    description: "Add new squad members, edit callsigns, jersey numbers, positions, photos, and player biographies.",
    href: "/cms/teammanagement",
    icon: "👥",
    badge: "Squad Roster",
    buttonText: "Manage Players →",
  },
  {
    title: "Club Sponsors & Partners",
    description: "Manage official sponsor badges, company logos with cloud storage, descriptions, and URLs.",
    href: "/cms/sponsors",
    icon: "🤝",
    badge: "Partnerships",
    buttonText: "Manage Sponsors →",
  },
  {
    title: "Logging & Analytics",
    description: "Track all creations & edits across matches, players, competitions, and sponsors with admin account audit trails.",
    href: "/cms/analytics",
    icon: "📜",
    badge: "Audit Logs & Admins",
    buttonText: "View Activity & Logs →",
  },
];

export default function CMSPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen flex flex-col items-center w-full bg-gray-900 text-white overflow-x-hidden">
      <Menu />

      <main className="w-full flex flex-col items-center pt-24 sm:pt-36 pb-14 sm:pb-20 px-3.5 sm:px-6">
        {/* Intro Hero Header */}
        <div className="max-w-3xl w-full text-center mb-8 sm:mb-12">
          <h1 className={`text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-3 drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)] ${robotoSlab.className}`}>
            Club Management Hub
          </h1>

          <p className={`text-sm sm:text-base md:text-lg text-gray-200 font-medium max-w-2xl mx-auto leading-relaxed ${montserrat.className}`}>
            Manage matchday operations, publish match results and player statistics, update squad profiles, and configure club competitions and sponsors.
          </p>
        </div>

        {/* CMS Modules Grid */}
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12">
          {CMS_MODULES.map((module) => (
            <div
              key={module.href}
              onClick={() => router.push(module.href)}
              className="group cursor-pointer rounded-2xl p-5 sm:p-6 bg-gray-950/85 hover:bg-gray-900/95 border border-gray-800 hover:border-emerald-500/40 shadow-xl hover:shadow-[0_0_25px_rgba(16,185,129,0.15)] transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-3xl p-2 rounded-xl bg-black/50 border border-gray-800 shrink-0">
                    {module.icon}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-black/60 border border-gray-700 text-gray-300">
                    {module.badge}
                  </span>
                </div>

                <h2 className={`text-lg sm:text-xl font-bold text-white group-hover:text-emerald-300 transition-colors mb-2 ${robotoSlab.className}`}>
                  {module.title}
                </h2>

                <p className={`text-xs sm:text-sm text-gray-300 leading-relaxed mb-4 ${montserrat.className}`}>
                  {module.description}
                </p>
              </div>

              <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs font-bold text-emerald-400 group-hover:text-emerald-300">
                <span>{module.buttonText}</span>
                <span className="text-base group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Links Row */}
        <div className="max-w-3xl w-full text-center p-4 sm:p-5 rounded-2xl bg-gray-950/70 border border-gray-800/80 backdrop-blur-sm shadow-md">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-2">
            Quick Public Site Navigation
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold">
            <Link href="/fixtures" className="px-3 py-1 rounded-full bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-emerald-300 border border-gray-700 transition-colors">
              Fixtures ↗
            </Link>
            <Link href="/results" className="px-3 py-1 rounded-full bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-emerald-300 border border-gray-700 transition-colors">
              Results ↗
            </Link>
            <Link href="/team" className="px-3 py-1 rounded-full bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-emerald-300 border border-gray-700 transition-colors">
              Team ↗
            </Link>
            <Link href="/statistics" className="px-3 py-1 rounded-full bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-emerald-300 border border-gray-700 transition-colors">
              Statistics ↗
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}