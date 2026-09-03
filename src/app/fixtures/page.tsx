import { Roboto_Slab, Montserrat } from "next/font/google";
import Menu from "@/components/Menu";
import Footer from "@/components/Footer"; // Add this import at the top
import { Pool } from "pg";
import TeamForm from "@/components/TeamForm"; // NEW: import
import Sponsors from "@/components/Sponsors";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "600"] });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const dynamic = "force-dynamic";

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

// Fetch the latest game from Neon
async function getNextGameDirect() {
  let client;
  try {
    client = await pool.connect();
    const res = await client.query(
      "SELECT * FROM next_game ORDER BY id DESC LIMIT 1"
    );
    return res.rows[0] || null;
  } catch {
    return null;
  } finally {
    if (client) client.release();
  }
}

// Fetch the latest match result from Neon
async function getLatestMatchResult() {
  let client;
  try {
    client = await pool.connect();
    const res = await client.query(
      "SELECT * FROM match_result ORDER BY id DESC LIMIT 1"
    );
    return res.rows[0] || null;
  } catch {
    return null;
  } finally {
    if (client) client.release();
  }
}

type GoalScorer = {
  goalNumber?: string;
  scorer: string;
  assist?: string;
};

export default async function FixturesPage() {
  const nextGame = await getNextGameDirect();
  const latestResult = await getLatestMatchResult();

  if (!nextGame) {
    return <div>Could not load fixture data.</div>;
  }

  // Defensive: fallback for missing fields
  const safeGame = {
    date: nextGame.date || "-",
    kickoff: nextGame.kickoff || "-",
    opponent: nextGame.opponent || "-",
    location: nextGame.location || "-",
    competition: nextGame.competition || "-",
    note: nextGame.note || "-",
  };

  // Defensive: fallback for missing fields in match result
  const safeResult = latestResult
    ? {
        date: latestResult.date || "-",
        opponent: latestResult.opponent || "-",
        goalsFCMierda: latestResult.goals_fcmierda ?? "-",
        goalsOpponent: latestResult.goals_opponent ?? "-",
        gameResult: latestResult.game_result || "-",
        goalScorers: Array.isArray(latestResult.goal_scorers)
          ? latestResult.goal_scorers
          : latestResult.goal_scorers
          ? JSON.parse(latestResult.goal_scorers)
          : [],
      }
    : null;

  // Attendance processing
  const attendance = nextGame.attendance || {};
  const present = Object.entries(attendance)
    .filter(([_, status]) => status === "present")
    .map(([name]) => name);
  const notSure = Object.entries(attendance)
    .filter(([_, status]) => status === "not sure")
    .map(([name]) => name);
  const absent = Object.entries(attendance)
    .filter(([_, status]) => status === "absent")
    .map(([name]) => name);
  const supporters = Object.entries(attendance)
    .filter(
      ([_, status]) => status === "supporter" || status === "coach"
    )
    .map(([name]) => name);

  return (
    <div className="relative min-h-screen flex flex-col items-center bg-gray-900">
      {/* Navigation Bar */}
      <Menu />

      {/* Next Game Section */}
      <section id="next-game" className="w-full flex flex-col items-center gap-6 pt-24 sm:pt-32 pb-12 px-4 bg-gray-800">
        {/* Intro Description */}
        <div className="max-w-2xl w-full text-center">
          <p className={`text-base sm:text-lg text-gray-200 font-medium max-w-xl mx-auto ${montserrat.className}`}>
            Here you can find all information about FC Mierda&apos;s next game, including kickoff details, location, and squad attendance.
          </p>
        </div>

        <div className="max-w-2xl w-full rounded-2xl p-6 sm:p-10 text-white text-center bg-gray-900 shadow-xl mx-auto">

          {/* Team recent form — above the header */}
          <TeamForm teamId={1} className="mb-6" />

          <h2
            className={`text-xl sm:text-2xl font-bold mb-4 ${robotoSlab.className}`}
          >
            Next Game vs
            {safeGame.opponent && (
              <>
                <br />
                <span
                  className="font-extrabold text-green-300 text-2xl sm:text-3xl tracking-wide"
                  style={{ fontFamily: "monospace" }}
                >
                  {safeGame.opponent}
                </span>
              </>
            )}
          </h2>

          <p className={`text-base sm:text-lg ${montserrat.className}`}>
          <span className="font-semibold text-green-300"></span>{" "}
              {safeGame.note}
          </p>
          <br />
          <div className="mb-4 text-left text-sm sm:text-base">
            <div>
              <span className="font-semibold text-green-300">Date:</span>{" "}
              {safeGame.date}
            </div>
            <div>
              <span className="font-semibold text-green-300">
                Gathering time:
              </span>{" "}
              {getGatheringTime(safeGame.kickoff)}
            </div>
            <div>
              <span className="font-semibold text-green-300">Kick-off time:</span>{" "}
              {safeGame.kickoff}
            </div>
            <div>
              <span className="font-semibold text-green-300">Opponent:</span>{" "}
              {safeGame.opponent}
            </div>
            <div>
              <span className="font-semibold text-green-300">Location:</span>{" "}
              {safeGame.location}
            </div>
            <div>
              <span className="font-semibold text-green-300">Competition:</span>{" "}
              {safeGame.competition}
            </div>
          </div>

          {/* Player Attendance Section */}
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Player Attendance</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <h3 className="font-bold text-green-400 mb-2">Present ({present.length})</h3>
                {present.length > 0 ? present.map((name) => (
                  <div key={name}>{name}</div>
                )) : <div className="text-gray-400">None</div>}
              </div>
              <div>
                <h3 className="font-bold text-yellow-400 mb-2">Not Sure ({notSure.length})</h3>
                {notSure.length > 0 ? notSure.map((name) => (
                  <div key={name}>{name}</div>
                )) : <div className="text-gray-400">None</div>}
              </div>
              <div>
                <h3 className="font-bold text-red-400 mb-2">Absent ({absent.length})</h3>
                {absent.length > 0 ? absent.map((name) => (
                  <div key={name}>{name}</div>
                )) : <div className="text-gray-400">None</div>}
              </div>
            </div>
            <div className="mt-6">
              <h3 className="font-bold text-blue-400 mb-2">Supporter / Coach</h3>
              {supporters.length > 0 ? supporters.map((name) => (
                <div key={name}>{name}</div>
              )) : <div className="text-gray-400">None</div>}
            </div>
            {/* Action Button */}
            <div className="mt-8 flex justify-center">
              <a
                href="/cms/nextgameplayeravailability#player-availability"
                className="px-6 py-3 rounded-lg bg-green-700 text-white font-semibold shadow border border-green-800 hover:bg-green-800 transition"
                style={{ letterSpacing: "0.03em" }}
              >
                Submit your availability
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Club Sponsors Section */}
      <Sponsors />

      {/* Footer */}
      <Footer />
    </div>
  );
}
