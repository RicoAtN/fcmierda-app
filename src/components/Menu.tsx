"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminMenuDropdown from "./AdminMenuDropdown";
import { useAudio } from "./MusicProvider";
import SoundWaveIcon from "./SoundWaveIcon";

const NAV_LINKS = [
  { href: "/fixtures", label: "Fixtures" },
  { href: "/results", label: "Results" },
  { href: "/team", label: "Team" },
  { href: "/statistics", label: "Statistics" },
];

export default function Menu() {
  const { isMuted, isPlaying, toggleMute } = useAudio();
  const pathname = usePathname();

  return (
    <nav className="absolute top-0 left-0 w-full flex items-center justify-between py-3 sm:py-4 md:py-6 z-30 px-2.5 sm:px-4 md:px-8 max-w-7xl mx-auto right-0">
      {/* Left side controls */}
      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
        <Link
          href="/"
          className="relative flex flex-col items-center group -mt-1"
          aria-label="Return to Home"
          title="Return to Home"
        >
          <div className="relative w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12">
            <Image
              src="/FCMierda-team-logo.png"
              alt="FC Mierda Logo"
              fill
              className="rounded-full object-cover shadow-md transition-transform duration-200 group-hover:scale-105"
              sizes="(max-width: 640px) 32px, (max-width: 768px) 40px, 48px"
              priority
            />
          </div>
          <span className="absolute -bottom-3.5 sm:-bottom-4 text-[9px] sm:text-xs font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] opacity-90 group-hover:text-emerald-400 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none">
            Home
          </span>
        </Link>
        <button
          onClick={toggleMute}
          className="text-white hover:text-emerald-400 transition-all duration-200 focus:outline-none flex items-center justify-center p-1 sm:p-1.5 hover:scale-110 active:scale-95"
          aria-label={isMuted ? "Unmute background music" : "Mute background music"}
          title={isMuted ? "Unmute music" : "Mute music"}
        >
          {isMuted ? (
            <span className="text-lg sm:text-xl md:text-2xl leading-none select-none">🔇</span>
          ) : (
            <SoundWaveIcon isAnimated={isPlaying} className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
          )}
        </button>
      </div>

      {/* Main Navigation Glass Capsule */}
      <ul className="flex flex-nowrap items-center justify-center gap-0.5 sm:gap-1.5 md:gap-3 lg:gap-6 bg-white/70 hover:bg-white/80 backdrop-blur-xl px-2 sm:px-3.5 md:px-6 lg:px-8 py-1 sm:py-1.5 md:py-2.5 rounded-full shadow-lg shadow-black/15 border border-white/40 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] mx-1 sm:mx-2 flex-shrink-0 transition-all duration-200">
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href;
          return (
            <li key={link.href} className="flex-shrink-0">
              <Link
                href={link.href}
                className={`block font-bold text-[11px] sm:text-xs md:text-sm lg:text-base px-2 sm:px-2.5 md:px-3.5 py-1 sm:py-1.5 rounded-full transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? "text-emerald-950 bg-emerald-500/20 shadow-inner"
                    : "text-gray-900 hover:text-emerald-700 hover:bg-black/5"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Right side controls */}
      <div className="flex items-center flex-shrink-0">
        <AdminMenuDropdown />
      </div>
    </nav>
  );
}