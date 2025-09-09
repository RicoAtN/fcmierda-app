import Image from "next/image";
import Link from "next/link";
import { Roboto_Slab, Montserrat } from "next/font/google";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "600"] });

export default function KanaalPlusPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center bg-gray-900">
      {/* Navigation Bar */}
      <nav className="absolute top-0 left-0 w-full flex justify-center py-4 sm:py-6 z-20">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center">
          <Link href="/">
            <Image
              src="/FCMierda-team-logo.png"
              alt="FC Mierda Logo"
              width={40}
              height={40}
              className="rounded-full shadow-md"
              style={{ width: 40, height: 40 }}
              priority
            />
          </Link>
        </div>
        <ul className="flex flex-wrap justify-center gap-3 sm:gap-12 bg-white/40 backdrop-blur-md px-2 sm:px-10 py-2 sm:py-4 rounded-2xl max-w-[98vw] shadow-lg">
          <li>
            <Link href="/" className="text-gray-900 font-semibold text-xs sm:text-lg hover:text-green-600 transition-colors px-2 sm:px-4">Home</Link>
          </li>
          <li>
            <Link href="/team" className="text-gray-900 font-semibold text-xs sm:text-lg hover:text-green-600 transition-colors px-2 sm:px-4">
              Team
            </Link>
          </li>
          <li>
            <Link href="/kanaalplus" className="text-gray-900 font-semibold text-xs sm:text-lg hover:text-green-600 transition-colors px-2 sm:px-4">Kanaal+</Link>
          </li>
          <li>
            <Link href="#contact" className="text-gray-900 font-semibold text-xs sm:text-lg hover:text-green-600 transition-colors px-2 sm:px-4">Contact</Link>
          </li>
        </ul>
      </nav>
      {/* Kanaal+ Intro Section */}
      <section
        className="w-full flex justify-center items-center py-10 px-4 bg-gray-900"
        style={{
          background: "linear-gradient(135deg, #232526 0%, #414345 100%)",
        }}
      >
        <div className="max-w-2xl w-full flex flex-col items-center text-center mt-16 sm:mt-32">
          <h1
            className={`text-3xl sm:text-5xl font-extrabold mb-4 ${robotoSlab.className}`}
            style={{
              letterSpacing: "0.07em",
              textShadow: `
                0 0 4px #0b3d1a,
                0 2px 0 #0b3d1a,
                0 1px 0 #fff
              `,
              color: "#fff",
              textTransform: "uppercase",
            }}
          >
            Kanaal+
          </h1>
          <p
            className={`text-lg sm:text-xl text-white font-medium mb-8 drop-shadow-lg ${montserrat.className}`}
            style={{ maxWidth: 600 }}
          >
            On this page you can watch back all of our game summaries of FC Mierda. Don&apos;t miss any match—watch every great goal, epic save, and legendary moment right here. Great goals, great playbacks, and all the action!
          </p>
        </div>
      </section>
      {/* Video Sections */}
      <section className="w-full flex flex-col items-center gap-12 py-12 px-4 bg-gray-800">
        {/* 1 */}
        <div className="max-w-2xl w-full rounded-2xl p-6 sm:p-10 text-white text-center bg-gray-900 shadow-xl mx-auto">
          <h2 className={`text-xl sm:text-2xl font-bold mb-4 ${robotoSlab.className}`}>
            FC Mierda are the champions!
          </h2>
          <div className="aspect-w-16 aspect-h-9 w-full max-w-xl mx-auto mb-4">
            <iframe
              className="rounded-lg"
              width="100%"
              height="315"
              src="https://www.youtube.com/embed/_thpt0BDXC0"
              title="FC Mierda are the champions!"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
          <div className="mb-2 text-left text-sm sm:text-base">
            <div><span className="font-semibold text-green-300">Date:</span> 27th of August 2025</div>
            <div><span className="font-semibold text-green-300">Result:</span> 6-3 win</div>
            <div><span className="font-semibold text-green-300">Opponent:</span> FC Anatolia</div>
            <div><span className="font-semibold text-green-300">Competition:</span> Power League Summer division 2</div>
          </div>
          <p className={`text-base sm:text-lg ${montserrat.className}`}>
            Watch our epic championship match with all the goals, saves, and celebrations that made history. FC Mierda doesn't catch fever, but they catch trophies.
          </p>
        </div>
        {/* 2 */}
        <div className="max-w-2xl w-full rounded-2xl p-6 sm:p-10 text-white text-center bg-gray-900 shadow-xl mx-auto">
          <h2 className={`text-xl sm:text-2xl font-bold mb-4 ${robotoSlab.className}`}>
            FC Mierda doesn't disappoint and extends its lead
          </h2>
          <div className="aspect-w-16 aspect-h-9 w-full max-w-xl mx-auto mb-4">
            <iframe
              className="rounded-lg"
              width="100%"
              height="315"
              src="https://www.youtube.com/embed/Bdt85nvwW2Y"
              title="Spring Showdown Highlights"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
          <div className="mb-2 text-left text-sm sm:text-base">
            <div><span className="font-semibold text-green-300">Date:</span> 13th of August 2025</div>
            <div><span className="font-semibold text-green-300">Result:</span> 6-1 win</div>
            <div><span className="font-semibold text-green-300">Opponent:</span> Go Ahead Weilers</div>
            <div><span className="font-semibold text-green-300">Competition:</span> Power League Summer division 2</div>
          </div>
          <p className={`text-base sm:text-lg ${montserrat.className}`}>
            FC Mierda plays a strong match and extends its lead position. A huge step towards the championship.
          </p>
        </div>
        {/* 3 */}
        <div className="max-w-2xl w-full rounded-2xl p-6 sm:p-10 text-white text-center bg-gray-900 shadow-xl mx-auto">
          <h2 className={`text-xl sm:text-2xl font-bold mb-4 ${robotoSlab.className}`}>
            Defensive Masterclass and goal scoring fest
          </h2>
          <div className="aspect-w-16 aspect-h-9 w-full max-w-xl mx-auto mb-4">
            {/* Paste your YouTube embed link here */}
            <div className="flex items-center justify-center w-full h-full bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg text-gray-400">
              Paste your YouTube embed link here!
            </div>
          </div>
          <div className="mb-2 text-left text-sm sm:text-base">
            <div><span className="font-semibold text-green-300">Date:</span> --</div>
            <div><span className="font-semibold text-green-300">Result:</span> --</div>
            <div><span className="font-semibold text-green-300">Opponent:</span> --</div>
            <div><span className="font-semibold text-green-300">Competition:</span> --</div>
          </div>
          <p className={`text-base sm:text-lg ${montserrat.className}`}>
            A game where our defense stood strong. See the tackles, blocks, and keeper heroics!
          </p>
        </div>
        {/* 4 */}
        <div className="max-w-2xl w-full rounded-2xl p-6 sm:p-10 text-white text-center bg-gray-900 shadow-xl mx-auto">
          <h2 className={`text-xl sm:text-2xl font-bold mb-4 ${robotoSlab.className}`}>
            Goal Fest Recap
          </h2>
          <div className="aspect-w-16 aspect-h-9 w-full max-w-xl mx-auto mb-4">
            {/* Paste your YouTube embed link here */}
            <div className="flex items-center justify-center w-full h-full bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg text-gray-400">
              Paste your YouTube embed link here!
            </div>
          </div>
          <div className="mb-2 text-left text-sm sm:text-base">
            <div><span className="font-semibold text-green-300">Date:</span> --</div>
            <div><span className="font-semibold text-green-300">Result:</span> --</div>
            <div><span className="font-semibold text-green-300">Opponent:</span> --</div>
            <div><span className="font-semibold text-green-300">Competition:</span> --</div>
          </div>
          <p className={`text-base sm:text-lg ${montserrat.className}`}>
            A match full of goals and attacking flair. Enjoy the best finishes and assists.
          </p>
        </div>
        {/* 5 */}
        <div className="max-w-2xl w-full rounded-2xl p-6 sm:p-10 text-white text-center bg-gray-900 shadow-xl mx-auto">
          <h2 className={`text-xl sm:text-2xl font-bold mb-4 ${robotoSlab.className}`}>
            Legendary Comeback
          </h2>
          <div className="aspect-w-16 aspect-h-9 w-full max-w-xl mx-auto mb-4">
            {/* Paste your YouTube embed link here */}
            <div className="flex items-center justify-center w-full h-full bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg text-gray-400">
              Paste your YouTube embed link here!
            </div>
          </div>
          <div className="mb-2 text-left text-sm sm:text-base">
            <div><span className="font-semibold text-green-300">Date:</span> --</div>
            <div><span className="font-semibold text-green-300">Result:</span> --</div>
            <div><span className="font-semibold text-green-300">Opponent:</span> --</div>
            <div><span className="font-semibold text-green-300">Competition:</span> --</div>
          </div>
          <p className={`text-base sm:text-lg ${montserrat.className}`}>
            Down but never out—watch how FC Mierda turned the game around in style.
          </p>
        </div>
      </section>
    </div>
  );
}