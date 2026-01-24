import Image from "next/image";
import Link from "next/link";
import { Roboto_Slab, Montserrat } from "next/font/google";
import Menu from "@/components/Menu"; // <-- Import your Menu component
import Footer from "@/components/Footer";
import TeamForm from "@/components/TeamForm";


const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "600"] });

export default function Home() {
  return (
    <div
      className="relative min-h-screen flex flex-col items-center"
      style={{
        backgroundImage: "url('/fcmierda-background.gif')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        height: "100vh",
      }}
    >
      {/* Navigation Bar */}
      <Menu />
      {/* Restored upper section layout */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center px-4 w-full min-h-screen">
        <div className="flex flex-col items-center justify-center mt-16 sm:mt-[60px] mb-70">
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
            style={{ maxWidth: "300px", height: "auto" }}
          />
          <TeamForm teamId={1} className="mt-6" />
        </div>
      </main>
      {/* Lower scrollable section remains */}
      <section
        className="w-full flex justify-center items-center py-16 px-4"
        style={{
          background: "linear-gradient(135deg, #232526 0%, #414345 100%)",
        }}
      >
        <div className="max-w-2xl w-full rounded-2xl p-8 sm:p-12 text-white text-center">
          <h2 className={`text-3xl sm:text-5xl font-bold mb-6 ${robotoSlab.className}`}>
            Who we are
          </h2>
          <p className={`text-base sm:text-lg ${montserrat.className}`}>
            A few lads in Rotterdam met, looked at each other, and thought... “Why not play football… poorly, but with style?” And just like that, FC Mierda was born in 2017.
            <br /><br />
            We play 7-a-side on a half pitch because a full field for us is just asking for trouble. On the pitch, we&rsquo;re smart and efficient; off the pitch, we&rsquo;re absolute legends in the third half.
            <br /><br />
            On this app you can follow us for fixtures, results, and recaps.
            Witness FC Mierda proving that legends never really fade.
          </p>
        </div>
      </section>
      {/* Trophy Section */}
      <section
        className="w-full flex justify-center items-center py-16 px-4"
        style={{
          backgroundImage: "url('/fcmierda-celebration.gif')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundColor: "rgba(35, 37, 38, 0.35)"
        }}
      >
        <div
          className="max-w-2xl w-full rounded-2xl shadow-xl p-8 sm:p-12 text-white text-center"
          style={{ backgroundColor: "rgba(35, 37, 38, 0.35)" }}
        >
          <h2 className={`text-3xl sm:text-5xl font-bold mb-6 ${robotoSlab.className}`}>
            The Trophy Cabinet
          </h2>
          <p className={`text-base sm:text-lg ${montserrat.className}`}>
            <span className="font-bold text-white">
              Others catch the fever, but FC Mierda catches trophies.
            </span>
            <br /><br />
            <span className="text-yellow-300 font-semibold">🏆 Powerleague 2025 Summer Champions</span><br />
            <span className="text-yellow-300 font-semibold">🏆 Powerleague 2024 Summer Champions</span><br />
            <span className="text-yellow-300 font-semibold">🏆 Powerleague 2023 Winter Champions</span><br />
            <span className="text-yellow-300 font-semibold">🏆 Footy 2022 Summer Champions</span><br />
            <span className="text-yellow-300 font-semibold">🏆 Footy 2022 Spring Champions</span><br />
            <span className="font-bold text-white">
              ...and many more!
            </span>
          </p>
        </div>
      </section>
      {/* New Section: Don&apos;t Miss Any Match */}
      <section
        className="w-full flex justify-center items-center py-16 px-4"
        style={{
          background: "linear-gradient(135deg, #414345 0%, #232526 100%)",
        }}
      >
        <div className="max-w-2xl w-full rounded-2xl p-8 sm:p-12 text-white text-center">
          <h2 className={`text-3xl sm:text-5xl font-bold mb-6 ${robotoSlab.className}`}>
            Don&apos;t Miss Any Match
          </h2>
          <p className={`text-base sm:text-lg ${montserrat.className}`}>
            Want to relive every goal, epic save, and legendary moment from FC Mierda?
            On our <span className="text-green-400 font-semibold">Results</span> page you can watch all the highlights, match recaps, and unforgettable plays.<br /><br />
            Be a true fan and never miss a single moment of FC Mierda magic!
          </p>
          <Link
            href="/results"
            className="inline-block mt-8 bg-green-500 hover:bg-green-600 text-white font-extrabold text-xl px-10 py-4 rounded-full shadow-lg transition-all duration-200"
          >
            Watch our match recaps here!
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}


