import Image from "next/image";
import { Roboto_Slab, Montserrat } from "next/font/google";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "600"] });

export default function Home() {
  return (
    <div
      className="relative min-h-screen flex flex-col items-center"
      style={{
        backgroundImage: "url('/football-bg.gif')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Navigation Bar */}
      <nav className="absolute top-0 left-0 w-full flex justify-center py-4 sm:py-6 z-20">
        <ul className="flex flex-wrap justify-center gap-3 sm:gap-12 bg-white/40 backdrop-blur-md px-2 sm:px-10 py-2 sm:py-4 rounded-2xl max-w-[98vw] shadow-lg">
          <li>
            <a href="#" className="text-gray-900 font-semibold text-xs sm:text-lg hover:text-green-600 transition-colors px-2 sm:px-4">Home</a>
          </li>
          <li>
            <a href="#team" className="text-gray-900 font-semibold text-xs sm:text-lg hover:text-green-600 transition-colors px-2 sm:px-4">Team</a>
          </li>
          <li>
            <a href="#recaps" className="text-gray-900 font-semibold text-xs sm:text-lg hover:text-green-600 transition-colors px-2 sm:px-4">Recaps</a>
          </li>
          <li>
            <a href="#contact" className="text-gray-900 font-semibold text-xs sm:text-lg hover:text-green-600 transition-colors px-2 sm:px-4">Contact</a>
          </li>
        </ul>
      </nav>
      {/* Restored upper section layout */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center px-4 w-full min-h-screen">
        <div className="flex flex-col items-center justify-center mt-16 sm:mt-[60px] mb-110">
          <h2
            className={`text-3xl sm:text-4xl font-semibold text-white drop-shadow-lg mb-2 ${montserrat.className}`}
            style={{ letterSpacing: "0.15em", textTransform: "uppercase" }}
          >
            Welcome to
          </h2>
          <h1
            className={`text-6xl sm:text-8xl font-extrabold mb-4 ${robotoSlab.className}`}
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
            FC Mierda
          </h1>
          <p
            className={`text-xl sm:text-2xl text-white font-medium mb-8 drop-shadow-lg ${montserrat.className}`}
            style={{ maxWidth: 500 }}
          >
            Your favorite below average football team from Rotterdam.
          </p>
          <Image
            src="/FCMierda-team-logo.png"
            alt="FC Mierda Logo"
            width={360}
            height={360}
            className="mb-8"
            style={{ maxWidth: "440px", height: "auto" }}
          />
        </div>
      </main>
      {/* Lower scrollable section remains */}
      <section
        className="w-full flex justify-center items-center py-16 px-4"
        style={{
          background: "linear-gradient(135deg, #232526 0%, #414345 100%)",
        }}
      >
        <div className="max-w-2xl w-full rounded-2xl shadow-xl p-8 sm:p-12 text-white text-center">
          <h2 className={`text-2xl sm:text-3xl font-bold mb-4 ${robotoSlab.className}`}>
            Who we are and what we do
          </h2>
          <p className={`text-base sm:text-lg ${montserrat.className}`}>
            FC Mierda is a true Rotterdam football team, playing 7vs7 since 2017 with a loyal group of lads, dudes, and guys. 
            <br /><br />
            We’re not just about the results—we’re about the laughs, the teamwork, and the post-match stories. Every week, we bring energy and friendship to the pitch, making memories together in the heart of Rotterdam.
          </p>
        </div>
      </section>
    </div>
  );
}
