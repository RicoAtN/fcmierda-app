import { Roboto_Slab, Montserrat } from "next/font/google";
import Menu from "@/components/Menu";
import { Pool } from "pg";
import Image from "next/image";
import Footer from "@/components/Footer"; // Add this import at the top

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "600"] });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Fetch all match results from Neon DB, newest first
async function getAllResults() {
  let client;
  try {
    client = await pool.connect();
    const res = await client.query(
      "SELECT * FROM match_result ORDER BY date DESC, id DESC"
    );
    return res.rows || [];
  } catch {
    return [];
  } finally {
    if (client) client.release();
  }
}

// Add above your component
async function getLatestMatchResults(limit = 3) {
  let client;
  try {
    client = await pool.connect();
    const res = await client.query(
      "SELECT * FROM match_result ORDER BY id DESC LIMIT $1",
      [limit]
    );
    return res.rows || [];
  } catch {
    return [];
  } finally {
    if (client) client.release();
  }
}

function formatLongDate(dateString: string) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getYoutubeEmbedUrl(url: string) {
  if (!url) return "";
  // If already embed format, return as is
  if (url.includes("embed")) return url;
  // Extract video ID from watch?v=VIDEO_ID
  const match = url.match(/(?:v=|\/embed\/|\.be\/)([A-Za-z0-9_-]{11})/);
  const videoId = match ? match[1] : "";
  return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
}

export default async function ResultsPage() {
  const latestResults = await getLatestMatchResults(3);

  // Prepare 3 slots, fill with results or placeholders
  const resultSlots = [0, 1, 2].map((i) => latestResults[i] || null);

  return (
    <div className="relative min-h-screen flex flex-col items-center bg-gray-900">
      <Menu />

      {/* Results Intro Section */}
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
            Team Results
          </h1>
          <p
            className={`text-lg sm:text-xl text-white font-medium mb-8 drop-shadow-lg ${montserrat.className}`}
            style={{ maxWidth: 600 }}
          >
            Here you can find all past results of FC Mierda. Relive every match, check the scores, and watch video summaries if available.
          </p>
        </div>
      </section>

      {/* Latest Game Results Section */}
      <section id="latest-result" className="w-full flex flex-col items-center py-8 px-4 bg-gray-900">
        {resultSlots.map((latestResult, idx) => {
          if (!latestResult) {
            return (
              <div
                key={`placeholder-${idx}`}
                className="max-w-2xl w-full rounded-2xl p-6 sm:p-10 text-gray-400 bg-gray-800 shadow-xl mx-auto mb-8 flex flex-col items-center justify-center min-h-[300px]"
              >
                <h2 className={`text-xl sm:text-2xl font-bold mb-6 text-center ${robotoSlab.className}`}>
                  Awaiting Match Result
                </h2>
                <p className="text-lg text-center">
                  We're waiting for the next FC Mierda game to be played.<br />
                  As soon as the result is in, you'll find all the details right here.<br />
                  Stay tuned and check back soon!
                </p>
              </div>
            );
          }

          const safeResult = {
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
            attendance: latestResult.attendance,
            support_coach: latestResult.support_coach,
            location: latestResult.location || "-",
            competition: latestResult.competition || "-",
            youtube: latestResult.youtube || "", // Add this line
          };

          return (
            <div key={latestResult.id || idx} className="max-w-2xl w-full rounded-2xl p-6 sm:p-10 text-white bg-gray-800 shadow-xl mx-auto mb-8">
              {/* Show formatted date as title */}
              <h2 className={`text-xl sm:text-2xl font-bold mb-6 text-center ${robotoSlab.className}`}>
                {formatLongDate(safeResult.date)}
              </h2>
              {/* Score and Opponent */}
              <div className="mb-6 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  <span className="text-green-400">FC Mierda</span> vs <br />
                  <span className="text-red-400">{safeResult.opponent}</span>
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-green-300">
                  {safeResult.goalsFCMierda}
                  <span className="mx-3 text-white font-normal">-</span>
                  <span className="text-red-400">{safeResult.goalsOpponent}</span>
                </div>
              </div>
              <div className="mb-4 text-center">
                {safeResult.gameResult === "win" && (
                  <span className="px-4 py-2 rounded bg-green-600 text-white font-bold">Win</span>
                )}
                {safeResult.gameResult === "draw" && (
                  <span className="px-4 py-2 rounded bg-amber-500 text-white font-bold">Draw</span>
                )}
                {safeResult.gameResult === "loss" && (
                  <span className="px-4 py-2 rounded bg-red-600 text-white font-bold">Loss</span>
                )}
                {!["win", "draw", "loss"].includes(safeResult.gameResult) && (
                  <span className="px-4 py-2 rounded bg-gray-700 text-white font-bold">{safeResult.gameResult}</span>
                )}
              </div>

              {/* Goals & Assists */}
              <div className="mb-6">
                {safeResult.goalScorers && safeResult.goalScorers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border-separate border-spacing-y-2">
                      <thead>
                        <tr>
                          <th className="text-left text-gray-400 font-semibold px-2">Goal</th>
                          <th className="text-left text-gray-400 font-semibold px-2">Scorer</th>
                          <th className="text-left text-gray-400 font-semibold px-2">Assist</th>
                        </tr>
                      </thead>
                      <tbody>
                        {safeResult.goalScorers.map((g: GoalScorer, idx: number) => (
                          <tr key={idx} className="bg-gray-900 rounded">
                            <td className="px-2 py-1 text-green-400 font-semibold">{g.goalNumber || "-"}</td>
                            <td className="px-2 py-1 text-white font-bold">{g.scorer || "-"}</td>
                            <td className="px-2 py-1 text-blue-300">{g.assist || <span className="text-gray-500">-</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-gray-400 text-left">No goal details available.</div>
                )}
              </div>

              {/* Youtube Video */}
              <div className="mb-6 flex flex-col items-center">
                {safeResult.youtube ? (
                  <div className="w-full aspect-video max-w-xl mb-2">
                    <iframe
                      className="rounded-lg"
                      width="100%"
                      height="315"
                      src={getYoutubeEmbedUrl(safeResult.youtube)}
                      title="Match Video"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                ) : (
                  <div className="text-gray-400 text-center text-base py-6">
                    No video summary available yet.<br />
                  </div>
                )}
              </div>

              {/* Extra Info: Location, Competition, Attendance & Supporter/Coach */}
              <div className="mb-6 flex flex-col gap-2">
                <div className="flex flex-row items-center gap-2">
                  <span className="font-semibold text-green-300 min-w-[110px]">Location:</span>
                  <span className="text-white">{safeResult.location}</span>
                </div>
                <div className="flex flex-row items-center gap-2">
                  <span className="font-semibold text-green-300 min-w-[110px]">Competition:</span>
                  <span className="text-white">{safeResult.competition}</span>
                </div>
                <div className="flex flex-row items-center gap-2">
                  <span className="font-semibold text-green-300 min-w-[110px]">Attendance:</span>
                  <span className="text-white font-bold">
                    {Array.isArray(safeResult.attendance)
                      ? safeResult.attendance.length
                      : safeResult.attendance
                      ? JSON.parse(safeResult.attendance).length
                      : 0}
                  </span>
                </div>
                {/* Attendance Names */}
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {(Array.isArray(safeResult.attendance)
                    ? safeResult.attendance
                    : safeResult.attendance
                    ? JSON.parse(safeResult.attendance)
                    : []
                  ).map((name: string, idx) => (
                    <span key={idx} className="bg-gray-900 rounded px-2 py-1 text-white text-xs w-full text-center">{name}</span>
                  ))}
                </div>
                <div className="flex flex-row items-center gap-2 mt-2">
                  <span className="font-semibold text-blue-300 min-w-[110px]">Supporter/Coach:</span>
                  <span className="text-white font-bold">
                    {Array.isArray(safeResult.support_coach)
                      ? safeResult.support_coach.length
                      : safeResult.support_coach
                      ? JSON.parse(safeResult.support_coach).length
                      : 0}
                  </span>
                </div>
                {/* Supporter/Coach Names */}
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {(Array.isArray(safeResult.support_coach)
                    ? safeResult.support_coach
                    : safeResult.support_coach
                    ? JSON.parse(safeResult.support_coach)
                    : []
                  ).map((name: string, idx) => (
                    <span key={idx} className="bg-gray-900 rounded px-2 py-1 text-white text-xs">{name}</span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}