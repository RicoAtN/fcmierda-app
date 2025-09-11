import Image from "next/image";
import Link from "next/link";
import { Roboto_Slab, Montserrat } from "next/font/google";
import Menu from "@/components/Menu";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "600"] });

export default function KanaalPlusPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center bg-gray-900">
      {/* Navigation Bar */}
      <Menu />
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
            On this page you can watch back all of our game summaries of FC Mierda. Don&apos;t miss any match. Watch every great goal, epic save, and legendary moment right here.
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
            Watch our epic championship match with all the goals, saves, and celebrations that made history. FC Mierda doesn&apos;t catch fever, but they catch trophies.
          </p>
        </div>
        {/* 2 */}
        <div className="max-w-2xl w-full rounded-2xl p-6 sm:p-10 text-white text-center bg-gray-900 shadow-xl mx-auto">
          <h2 className={`text-xl sm:text-2xl font-bold mb-4 ${robotoSlab.className}`}>
            FC Mierda doesn&apos;t disappoint and extends its lead
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
            FC Mierda plays a strong match and extends its lead position. Championship becomes closer to reality.
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