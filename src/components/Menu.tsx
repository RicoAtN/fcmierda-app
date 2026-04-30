import Image from "next/image";
import Link from "next/link";
import AdminMenuDropdown from "./AdminMenuDropdown";


export default function Menu() {
  return (
    <nav className="absolute top-0 left-0 w-full flex justify-center py-4 sm:py-6 z-20">
      {/* FC Mierda Logo on the top left */}
      <div className="absolute left-4 sm:left-12 top-1/2 -translate-y-1/2 mt-1 sm:mt-1.5 flex items-center">
        <Link href="/" className="relative flex flex-col items-center group" aria-label="Return to Home" title="Return to Home">
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
      </div>

      {/* Admin login icon on the very right (no white circle background) */}
      <div className="absolute right-4 sm:right-12 top-1/2 -translate-y-1/2 mt-1 sm:mt-1.5 flex items-center">
        <AdminMenuDropdown />
      </div>

      <ul className="translate-y-1 sm:translate-y-1.5 flex flex-nowrap sm:flex-wrap justify-center items-center gap-1 sm:gap-12 bg-white/40 backdrop-blur-md px-3 sm:px-10 py-1.5 sm:py-4 rounded-full sm:rounded-2xl max-w-[calc(100vw-145px)] sm:max-w-[98vw] shadow-lg overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
    </nav>
  );
}