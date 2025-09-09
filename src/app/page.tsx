import Image from "next/image";
import Link from "next/link";
import { Roboto_Slab, Montserrat } from "next/font/google";

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
      <nav className="absolute top-0 left-0 w-full flex justify-center py-4 sm:py-6 z-20">
        {/* FC Mierda Logo on the top left */}
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
      {/* Restored upper section layout */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center px-4 w-full min-h-screen">
        <div className="flex flex-col items-center justify-center mt-16 sm:mt-[60px] mb-90">
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
            We play 7-a-side on a half pitch because a full field for us is just asking for trouble. On the pitch, we’re smart and efficient; off the pitch, we’re absolute legends in the third half.
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
            <span className="text-yellow-300 font-semibold">🏆 2025 Summer Champions</span><br />
            <span className="text-yellow-300 font-semibold">🏆 2025 Most goals</span><br />
            <span className="text-yellow-300 font-semibold">🏆 2024 Spring Champions</span><br />
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
            Watch every great goal, epic save, and legendary moment right here.
            <br /><br />
            FC Mierda plays a strong match and extends it&apos;s lead position. Championship becomes closer to reality.
            <br /><br />
            Every player brings their own style, skills, and stories—on and off the pitch. Together, we are FC Mierda!
          </p>
        </div>
      </section>
    </div>
  );
}


