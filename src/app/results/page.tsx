import { Roboto_Slab, Montserrat } from "next/font/google";
import Menu from "@/components/Menu";
import { Pool } from "pg";
import Footer from "@/components/Footer";
import React from "react";
import ClientMatchResults from "./ClientMatchResults";

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
  location?: string;
  competition?: string;
  attendance?: string[] | string;
  support_coach?: string[] | string;
  goal_scorers?: GoalScorer[] | string;
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

      {/* All Results Table Section and Details */}
      <ClientMatchResults allResults={allResults} />

      <Footer />
    </div>
  );
}