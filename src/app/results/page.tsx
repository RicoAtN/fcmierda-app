import { Roboto_Slab, Montserrat } from "next/font/google";
import Menu from "@/components/Menu";
import { Pool } from "pg";
import Image from "next/image";
import Footer from "@/components/Footer";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "600"] });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Fetch the latest match result from Neon DB
async function getLatestResult() {
  let client;
  try {
    client = await pool.connect();
    const res = await client.query(
      "SELECT * FROM match_result ORDER BY date DESC, id DESC LIMIT 1"
    );
    return res.rows[0] || null;
  } catch {
    return null;
  } finally {
    if (client) client.release();
  }
}

// Fetch all match results from Neon DB
async function getAllResults() {
  let client;
  try {
    client = await pool.connect();
    const res = await client.query(
      "SELECT * FROM match_result ORDER BY date DESC, id DESC"
    );
    return res.rows;
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

function formatShortDate(dateString: string) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

function getYoutubeEmbedUrl(url: string) {
  if (!url) return "";
  if (url.includes("embed")) return url;
  const match = url.match(/(?:v=|\/embed\/|\.be\/)([A-Za-z0-9_-]{11})/);
  const videoId = match ? match[1] : "";
  return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
}

type GoalScorer = {
  goalNumber?: number | string;
  scorer?: string;
  assist?: string;
};

type MatchResult = {
  id: number;
  date: string;
  opponent: string;
  game_result?: string;
  goals_fcmierda?: number | string;
  goals_opponent?: number | string;
  youtube?: string;
};

export default async function ResultsPage() {
  const latestResult = await getLatestResult();
  const allResults = await getAllResults();

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
            Here you can find the latest result of FC Mierda. Relive the match, check the score, and watch the video summary if available.
          </p>
        </div>
      </section>

      {/* All Results Table Section */} 
      <section className="w-full flex flex-col items-center py-8 px-2 bg-gray-900">
        <div className="max-w-4xl w-full mx-auto mb-8">
          <h2 className={`text-xl sm:text-2xl font-bold mb-6 text-center ${robotoSlab.className}`}>
            All Match Results
          </h2>
          <div className="overflow-x-auto rounded-lg shadow">
            <table className="min-w-full text-sm sm:text-base border-separate border-spacing-y-2">
              <thead>
                <tr className="bg-gray-800">
                  <th className="px-2 py-2 text-left text-green-300 font-semibold whitespace-nowrap">Date</th>
                  <th className="px-2 py-2 text-left text-green-300 font-semibold whitespace-nowrap">Opponent</th>
                  <th className="px-2 py-2 text-left text-green-300 font-semibold whitespace-nowrap">Result</th>
                  <th className="px-2 py-2 text-center text-green-300 font-semibold whitespace-nowrap">Score</th>
                  <th className="px-2 py-2 text-center text-green-300 font-semibold whitespace-nowrap">Video</th>
                </tr>
              </thead>
              <tbody>
                {allResults.map((result: MatchResult) => (
                  <tr key={result.id} className="bg-gray-900 rounded hover:bg-green-950/40 transition">
                    <td className="px-2 py-2 whitespace-nowrap">
                      {result.date
                        ? formatShortDate(result.date)
                        : "-"}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">{result.opponent}</td>
                    <td className="px-2 py-2 capitalize whitespace-nowrap">
                      {result.game_result === "win" && <span className="px-2 py-1 rounded bg-green-600 text-white font-bold">Win</span>}
                      {result.game_result === "draw" && <span className="px-2 py-1 rounded bg-amber-500 text-white font-bold">Draw</span>}
                      {result.game_result === "loss" && <span className="px-2 py-1 rounded bg-red-600 text-white font-bold">Loss</span>}
                      {!["win", "draw", "loss"].includes(result.game_result || "") && (
                        <span className="px-2 py-1 rounded bg-gray-700 text-white font-bold">{result.game_result}</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-center whitespace-nowrap">
                      {(result.goals_fcmierda ?? "-") + " - " + (result.goals_opponent ?? "-")}
                    </td>
                    <td className="px-2 py-2 text-center whitespace-nowrap">
                      {result.youtube ? (
                        <span className="px-2 py-1 rounded bg-green-600 text-white font-bold">Yes</span>
                      ) : (
                        <span className="px-2 py-1 rounded bg-gray-700 text-white font-bold">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}