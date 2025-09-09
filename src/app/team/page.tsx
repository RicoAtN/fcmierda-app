import Image from "next/image";
import Link from "next/link";
import { Roboto_Slab, Montserrat } from "next/font/google";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "600"] });

export default function TeamPage() {
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
      {/* Meet the Team Section */}
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
            Meet the Team
          </h1>
          <p
            className={`text-lg sm:text-xl text-white font-medium mb-8 drop-shadow-lg ${montserrat.className}`}
            style={{ maxWidth: 600 }}
          >
            FC Mierda plays 7-a-side football in Rotterdam, usually lining up in a classic 2-3-1 formation—solid at the back, creative in the middle, and always ready to surprise up front!
          </p>
        </div>
      </section>
      {/* Squad Members Section */}
      <section className="w-full flex justify-center items-center py-16 px-4 bg-gray-800">
        <div className="max-w-2xl w-full rounded-2xl p-8 sm:p-12 text-white text-center bg-gray-800 shadow-xl">
          <h2 className={`text-2xl sm:text-3xl font-bold mb-6 ${robotoSlab.className}`}>
            Squad Members
          </h2>
          <div className="text-lg sm:text-xl space-y-6 text-left mx-auto max-w-xl">
            {/* Management Section */}
            <div>
              <h3 className="font-bold text-green-300 mb-2">Management</h3>
              <ul className="ml-4 list-disc">
                <li><span className="font-bold">Hans:</span> Meastro &amp; Pirlo – Head Coach</li>
                <li><span className="font-bold">Victor:</span> Turbokwek – Assistant Coach</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-green-300 mb-2">Goalkeepers</h3>
              <ul className="ml-4 list-disc">
                <li><span className="font-bold">Alon:</span> Alon d'Or #1</li>
                <li><span className="font-bold">Victor:</span> turbokwek #12</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-green-300 mb-2">Defenders</h3>
              <ul className="ml-4 list-disc">
                <li><span className="font-bold">Rico:</span> Grey Wall #88</li>
                <li><span className="font-bold">Pim 🥸:</span> Snorremans #26</li>
                <li><span className="font-bold">Kevin:</span> Oyabun #32</li>
                <li><span className="font-bold">Mitchell:</span> Satoshi #69</li>
                <li><span className="font-bold">Marten:</span> Kraaij #4</li>
                <li><span className="font-bold">Bouwhuis:</span> Senderos #6</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-green-300 mb-2">Midfielders</h3>
              <ul className="ml-4 list-disc">
                <li><span className="font-bold">Mart:</span> WingWizard #57</li>
                <li><span className="font-bold">Niek:</span> Bearzerker #14</li>
                <li><span className="font-bold">Jordy:</span> Kapiteni #10 (CAPTAIN)</li>
                <li><span className="font-bold">Lennert:</span> Len #19</li>
                <li><span className="font-bold">Ka:</span> Jake #22</li>
                <li><span className="font-bold">Daan:</span> Koetje #7</li>
                <li><span className="font-bold">Sud:</span> Zilveren Vos #20</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-green-300 mb-2">Attackers</h3>
              <ul className="ml-4 list-disc">
                <li><span className="font-bold">Sven:</span> Zuenna #23</li>
                <li><span className="font-bold">Pim:</span> Inzaghi #9</li>
              </ul>
            </div>
          </div>
          <p className="text-gray-300 text-center mt-8">
            Don&apos;t miss any match—watch every great goal, epic save, and legendary moment right here.
            FC Mierda plays a strong match and extends it&apos;s lead position. Championship becomes closer to reality.
            Every player brings their own style, skills, and stories—on and off the pitch. Together, we are FC Mierda!
          </p>
        </div>
      </section>
    </div>
  );
}