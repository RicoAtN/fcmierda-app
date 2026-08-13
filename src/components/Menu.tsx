"use client";
import Image from "next/image";
import Link from "next/link";
import AdminMenuDropdown from "./AdminMenuDropdown";
import { useAudio } from "./MusicProvider";


export default function Menu() {
  const { isMuted, toggleMute } = useAudio();

  return (
    <nav className="absolute top-0 left-0 w-full flex items-center justify-between py-4 sm:py-6 z-20 px-4 sm:px-6">
      {/* Left side controls */}
      <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
        <Link href="/" className="relative flex flex-col items-center group -mt-1" aria-label="Return to Home" title="Return to Home">
          <Image
            src="/FCMierda-team-logo.png"
            alt="FC Mierda Logo"
            width={40}
            height={40}
            className="rounded-full shadow-md transition-transform duration-200 group-hover:scale-105"
            style={{ width: 50, height: 50 }}
            priority
          />
          <span className="absolute -bottom-4 text-[10px] sm:text-xs font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] opacity-90 group-hover:text-green-400 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none">
            Home
          </span>
        </Link>
        <button
          onClick={toggleMute}
          className="text-white text-xl sm:text-2xl hover:text-green-400 transition-colors focus:outline-none"
          aria-label={isMuted ? "Unmute background music" : "Mute background music"}
          title={isMuted ? "Unmute music" : "Mute music"}
        >
          {isMuted ? "🔇" : "🔊"}
        </button>
      </div>

      {/* Admin login icon on the very right */}
      <ul className="flex flex-nowrap sm:flex-wrap justify-center items-center gap-1 sm:gap-12 bg-white/40 backdrop-blur-md px-3 sm:px-10 py-1.5 sm:py-4 rounded-full sm:rounded-2xl shadow-lg overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] mx-2">
        <li>
          <Link href="/fixtures" className="block text-gray-900 font-semibold text-[11px] sm:text-lg hover:text-green-600 transition-colors px-1.5 sm:px-4 whitespace-nowrap">Fixtures</Link>
        </li>
        <li>
          <Link href="/results" className="block text-gray-900 font-semibold text-[11px] sm:text-lg hover:text-green-600 transition-colors px-1.5 sm:px-4 whitespace-nowrap">Results</Link>
        </li>
        <li>
          <Link href="/team" className="block text-gray-900 font-semibold text-[11px] sm:text-lg hover:text-green-600 transition-colors px-1.5 sm:px-4 whitespace-nowrap">
            Team
          </Link>
        </li>
        <li>
          <Link href="/statistics" className="block text-gray-900 font-semibold text-[11px] sm:text-lg hover:text-green-600 transition-colors px-1.5 sm:px-4 whitespace-nowrap">Statistics</Link>
        </li>
      </ul>

      {/* Right side controls */}
      <div className="flex items-center flex-shrink-0">
        <AdminMenuDropdown />
      </div>
    </nav>
  );
}