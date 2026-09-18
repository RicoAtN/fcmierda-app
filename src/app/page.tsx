import Image from "next/image";
import Link from "next/link";
import { Roboto_Slab, Montserrat } from "next/font/google";
import Menu from "@/components/Menu";
import Footer from "@/components/Footer";
import TeamForm from "@/components/TeamForm";
import UpcomingMatch from "@/components/UpcomingMatch";
import Sponsors from "@/components/Sponsors";
import SubscribeNotificationsButton from "@/components/SubscribeNotificationsButton";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700", "800"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col items-center w-full overflow-x-hidden bg-gray-900 text-white">
      {/* Navigation Bar */}
      <Menu />

      {/* Hero Section */}
      <main
        className="relative z-10 flex flex-col items-center justify-start text-center px-4 w-full min-h-screen pt-28 sm:pt-36 pb-12 sm:pb-20"
        style={{
          backgroundImage: "url('/fcmierda-background.gif')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Subtle dark backdrop overlay for enhanced contrast and text legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center justify-center mb-8 sm:mb-12 w-full max-w-4xl mx-auto">
          <h2
            className={`text-xl sm:text-3xl font-semibold text-gray-200 tracking-widest uppercase mb-1 drop-shadow-md ${montserrat.className}`}
          >
            Welcome to
          </h2>

          <h1
            className={`text-6xl sm:text-8xl md:text-9xl font-extrabold mb-2 tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)] ${robotoSlab.className}`}
            style={{
              color: "#ffffff",
              textTransform: "uppercase",
            }}
          >
            FC Mierda
          </h1>

          {/* Official club hub est 2017 badge placed below FC Mierda big title */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-emerald-300 text-xs sm:text-sm font-bold uppercase tracking-widest my-2.5 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Official Club Hub • Est. 2017</span>
          </div>

          <p
            className={`text-lg sm:text-2xl text-gray-100 font-medium mb-8 drop-shadow-lg max-w-xl leading-relaxed ${montserrat.className}`}
          >
            Your favorite below-average football team from Rotterdam.
          </p>

          <div className="relative mb-8 group cursor-pointer">
            <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-green-500/20 rounded-full blur-xl opacity-75 group-hover:opacity-100 transition duration-500" />
            <Image
              src="/FCMierda-team-logo.png"
              alt="FC Mierda Logo"
              width={320}
              height={320}
              className="relative max-w-[240px] sm:max-w-[300px] h-auto drop-shadow-[0_12px_30px_rgba(0,0,0,0.7)] group-hover:scale-105 transition-transform duration-300 ease-out"
              priority
            />
          </div>

          {/* Match & Form Cards */}
          <div className="w-full max-w-md mx-auto space-y-4">
            <UpcomingMatch />
            <TeamForm teamId={1} className="mt-4" />
          </div>
        </div>
      </main>

      {/* Club Sponsors Section */}
      <Sponsors />

      {/* Section 1: The Trophy Cabinet */}
      <section
        className="relative w-full flex justify-center items-center py-20 px-4"
        style={{
          backgroundImage: "url('/fcmierda-celebration.gif')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="relative z-10 max-w-3xl w-full rounded-2xl shadow-2xl p-6 sm:p-10 text-white text-center border border-amber-500/35 bg-black/40">
          {/* Header Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/80 border border-amber-400/50 text-amber-300 text-xs font-bold uppercase tracking-widest mb-4 shadow-lg">
            <span className="text-base">🏆</span>
            <span>Club Honors &amp; Silverware</span>
          </div>

          <h2 className={`text-3xl sm:text-5xl font-extrabold mb-3 tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,1)] ${robotoSlab.className}`}>
            The Trophy Cabinet
          </h2>

          <p className={`text-base sm:text-lg text-gray-100 font-medium mb-8 max-w-xl mx-auto leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,1)] ${montserrat.className}`}>
            Others catch the fever, but <span className="text-amber-400 font-bold drop-shadow">FC Mierda catches trophies</span>.
          </p>

          {/* Trophy Showcase Grid - High Contrast Plaque Cards over Visible Background */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 mb-8 text-left">
            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-black/85 border border-amber-400/40 hover:border-amber-300 shadow-xl shadow-black/70 transition-all hover:-translate-y-0.5 group">
              <div className="w-11 h-11 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                🏆
              </div>
              <div className="min-w-0">
                <div className="text-sm sm:text-base font-bold text-amber-300 tracking-tight leading-snug">
                  Powerleague Summer 2025
                </div>
                <div className="inline-flex items-center px-2 py-0.5 mt-1 rounded bg-amber-950/90 border border-amber-500/40 text-[11px] font-semibold text-amber-200">
                  Division 2 Champions
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-black/85 border border-amber-400/40 hover:border-amber-300 shadow-xl shadow-black/70 transition-all hover:-translate-y-0.5 group">
              <div className="w-11 h-11 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                🏆
              </div>
              <div className="min-w-0">
                <div className="text-sm sm:text-base font-bold text-amber-300 tracking-tight leading-snug">
                  Powerleague Summer 2024
                </div>
                <div className="inline-flex items-center px-2 py-0.5 mt-1 rounded bg-amber-950/90 border border-amber-500/40 text-[11px] font-semibold text-amber-200">
                  Division Champions
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-black/85 border border-amber-400/40 hover:border-amber-300 shadow-xl shadow-black/70 transition-all hover:-translate-y-0.5 group">
              <div className="w-11 h-11 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                🏆
              </div>
              <div className="min-w-0">
                <div className="text-sm sm:text-base font-bold text-amber-300 tracking-tight leading-snug">
                  Powerleague Winter 2023
                </div>
                <div className="inline-flex items-center px-2 py-0.5 mt-1 rounded bg-amber-950/90 border border-amber-500/40 text-[11px] font-semibold text-amber-200">
                  Winter Champions
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-black/85 border border-amber-400/40 hover:border-amber-300 shadow-xl shadow-black/70 transition-all hover:-translate-y-0.5 group">
              <div className="w-11 h-11 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                🏆
              </div>
              <div className="min-w-0">
                <div className="text-sm sm:text-base font-bold text-amber-300 tracking-tight leading-snug">
                  Footy 2022 Summer
                </div>
                <div className="inline-flex items-center px-2 py-0.5 mt-1 rounded bg-amber-950/90 border border-amber-500/40 text-[11px] font-semibold text-amber-200">
                  Summer Champions
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-black/85 border border-amber-400/40 hover:border-amber-300 shadow-xl shadow-black/70 transition-all hover:-translate-y-0.5 group">
              <div className="w-11 h-11 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                🏆
              </div>
              <div className="min-w-0">
                <div className="text-sm sm:text-base font-bold text-amber-300 tracking-tight leading-snug">
                  Footy 2022 Spring
                </div>
                <div className="inline-flex items-center px-2 py-0.5 mt-1 rounded bg-amber-950/90 border border-amber-500/40 text-[11px] font-semibold text-amber-200">
                  Spring Champions
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-black/85 border border-amber-400/40 hover:border-amber-300 shadow-xl shadow-black/70 transition-all hover:-translate-y-0.5 group">
              <div className="w-11 h-11 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                ⭐
              </div>
              <div className="min-w-0">
                <div className="text-sm sm:text-base font-bold text-amber-300 tracking-tight leading-snug">
                  Third Half Trophies
                </div>
                <div className="inline-flex items-center px-2 py-0.5 mt-1 rounded bg-amber-950/90 border border-amber-500/40 text-[11px] font-semibold text-amber-200">
                  Undefeated Champions
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/team#team-stats"
            className="group inline-flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base sm:text-lg px-8 py-3.5 rounded-full shadow-xl shadow-black/60 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          >
            <span>View All-Time Top Performers</span>
            <svg
              className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Section 2: Match Center, Recaps & Push Notifications */}
      <section className="w-full flex justify-center items-center py-16 px-4 bg-gradient-to-b from-gray-900 via-gray-850 to-gray-900 border-t border-gray-800 relative">
        <div className="max-w-3xl w-full rounded-2xl p-8 sm:p-12 text-center bg-gray-950/80 border border-gray-800 shadow-2xl backdrop-blur-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">
            <span>🎥</span>
            <span>Match Recaps &amp; Notifications</span>
          </div>

          <h2 className={`text-3xl sm:text-5xl font-extrabold text-white mb-4 tracking-tight ${robotoSlab.className}`}>
            Never Miss a Match
          </h2>

          <p className={`text-base sm:text-lg text-gray-300 leading-relaxed mb-8 max-w-xl mx-auto ${montserrat.className}`}>
            Get instant match alerts on your device, relive every goal with YouTube highlight recordings, and check official scores, goal scorers, and Man of the Match awards.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
            {/* Reusable Push Notification Subscription Button */}
            <SubscribeNotificationsButton />

            <Link
              href="/results"
              className="group inline-flex items-center justify-center gap-2.5 w-full sm:w-auto bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 hover:border-gray-600 font-bold text-sm sm:text-base px-6 py-3.5 rounded-full shadow-md transition-all duration-200 hover:-translate-y-0.5"
            >
              <span>View Match Results</span>
              <svg
                className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>

            <Link
              href="/fixtures"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-black/50 hover:bg-black/70 text-gray-200 hover:text-white border border-white/20 font-semibold text-sm sm:text-base px-6 py-3.5 rounded-full transition-all duration-200 hover:-translate-y-0.5"
            >
              <span>Upcoming Fixtures</span>
              <span className="text-gray-400 text-xs">↗</span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
