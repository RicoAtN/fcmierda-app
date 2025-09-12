import { Roboto_Slab, Montserrat } from "next/font/google";
import Menu from "@/components/Menu";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "600"] });

// Helper to calculate gathering time
function getGatheringTime(kickoff: string) {
  if (!kickoff || !/^\d{2}:\d{2}$/.test(kickoff)) return "-";
  const [h, m] = kickoff.split(":").map(Number);
  let gh = h,
    gm = m - 30;
  if (gm < 0) {
    gh = h - 1;
    gm = 60 + gm;
  }
  return `${String(gh).padStart(2, "0")}:${String(gm).padStart(2, "0")}`;
}

export const dynamic = "force-dynamic";

async function getNextGame() {
  const baseUrl =
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/next-game`, { cache: "no-store" });
  return res.json();
}

export default async function FixturesPage() {
  const nextGame = (await getNextGame()) || {};
  const gatheringTime = getGatheringTime(nextGame.kickoff);

  return (
    <div className="relative min-h-screen flex flex-col items-center bg-gray-900">
      {/* Navigation Bar */}
      <Menu />
      {/* Fixtures Intro Section */}
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
            Fixtures
          </h1>
          <p
            className={`text-lg sm:text-xl text-white font-medium mb-8 drop-shadow-lg ${montserrat.className}`}
            style={{ maxWidth: 600 }}
          >
            Here you can find FC Mierda&apos;s latest schedule: where we play,
            when, and against who. Stay up to date and never miss a match!
          </p>
        </div>
      </section>
      {/* Next Game Update Section */}
      <section className="w-full flex flex-col items-center gap-12 py-12 px-4 bg-gray-800">
        <div className="max-w-2xl w-full rounded-2xl p-6 sm:p-10 text-white text-center bg-gray-900 shadow-xl mx-auto">
          <h2
            className={`text-xl sm:text-2xl font-bold mb-4 ${robotoSlab.className}`}
          >
            Next Game vs
            {nextGame.opponent && (
              <>
                <br />
                <span
                  className="font-extrabold text-green-300 text-2xl sm:text-3xl tracking-wide"
                  style={{ fontFamily: "monospace" }}
                >
                  {nextGame.opponent}
                </span>
              </>
            )}
          </h2>
          <div className="mb-4 text-left text-sm sm:text-base">
            <div>
              <span className="font-semibold text-green-300">Date:</span>{" "}
              {nextGame.date}
            </div>
            <div>
              <span className="font-semibold text-green-300">
                Gathering time:
              </span>{" "}
              {gatheringTime}
            </div>
            <div>
              <span className="font-semibold text-green-300">Kick-off time:</span>{" "}
              {nextGame.kickoff}
            </div>
            <div>
              <span className="font-semibold text-green-300">Opponent:</span>{" "}
              {nextGame.opponent}
            </div>
            <div>
              <span className="font-semibold text-green-300">Location:</span>{" "}
              {nextGame.location}
            </div>
            <div>
              <span className="font-semibold text-green-300">Competition:</span>{" "}
              {nextGame.competition}
            </div>
            <div>
              <span className="font-semibold text-green-300">Note:</span>{" "}
              {nextGame.note}
            </div>
          </div>
          <p className={`text-base sm:text-lg ${montserrat.className}`}>
            Get ready for the next challenge! FC Mierda faces {nextGame.opponent}{" "}
            in what promises to be an exciting match. Come support us and don&apos;t
            miss the action!
          </p>
        </div>
        <div className="max-w-4xl w-full rounded-2xl p-6 sm:p-10 text-white text-center bg-gray-900 shadow-xl mx-auto mt-8">
          <h2
            className={`text-xl sm:text-2xl font-bold mb-4 ${robotoSlab.className}`}
          >
            Powerleague Table
          </h2>
          <div className={`mb-2 text-base sm:text-lg ${montserrat.className}`}>
            <span className="font-semibold text-green-300">Division:</span>{" "}
            First Division Rotterdam 7vs7
          </div>
          <div className="flex flex-col items-center gap-6 my-6">
            <img
              src="/currentLeagueTable.jpg"
              alt="Current League Table"
              className="rounded-lg shadow-lg max-w-full h-auto border border-green-700"
              style={{ maxHeight: 500 }}
            />
          </div>
          <p className={`text-base sm:text-lg ${montserrat.className} mt-4`}>
            View the current standings and results for Powerleague First Division
            Rotterdam 7vs7.
          </p>
        </div>
      </section>
    </div>
  );
}
