import Image from "next/image";
import Link from "next/link";

export default function Menu() {
  return (
    <nav className="absolute top-0 left-0 w-full flex justify-center py-4 sm:py-6 z-20">
      {/* FC Mierda Logo on the top left */}
      <div className="absolute left-4 sm:left-12s top-1/2 -translate-y-1/2 flex items-center">
        <Link href="/">
          <Image
            src="/FCMierda-team-logo.png"
            alt="FC Mierda Logo"
            width={40}
            height={40}
            className="rounded-full shadow-md"
            style={{ width: 50, height: 50 }}
            priority
          />
        </Link>
      </div>
      <ul className="flex flex-wrap justify-center gap-3 sm:gap-12 bg-white/40 backdrop-blur-md px-2 sm:px-10 py-2 sm:py-4 rounded-2xl max-w-[98vw] shadow-lg">
        <li>
          <Link href="/" className="text-gray-900 font-semibold text-xs sm:text-lg hover:text-green-600 transition-colors px-2 sm:px-4">Home</Link>
        </li>
        <li>
          <Link href="/fixtures" className="text-gray-900 font-semibold text-xs sm:text-lg hover:text-green-600 transition-colors px-2 sm:px-4">Fixtures</Link>
        </li>
        <li>
          <Link href="/kanaalplus" className="text-gray-900 font-semibold text-xs sm:text-lg hover:text-green-600 transition-colors px-2 sm:px-4">Kanaal+</Link>
        </li>
        <li>
          <Link href="/team" className="text-gray-900 font-semibold text-xs sm:text-lg hover:text-green-600 transition-colors px-2 sm:px-4">
            Team
          </Link>
        </li>
      </ul>
    </nav>
  );
}