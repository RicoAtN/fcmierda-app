"use client";
import { useState, useEffect } from "react";
import { Roboto_Slab, Montserrat } from "next/font/google";
import Menu from "@/components/Menu";
import { useRouter } from "next/navigation";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "600"] });

export default function PostMatchResultPage() {
  const router = useRouter();

  // State for last match info
  const [lastMatch, setLastMatch] = useState({
    date: "",
    opponent: "",
    location: "",
    competition: "",
    attendance: [] as string[],
    supportCoach: [] as string[],
  });

  // State for match result form
  const [goalsFCMierda, setGoalsFCMierda] = useState(0);
  const [goalsOpponent, setGoalsOpponent] = useState(0);
  const [gameResult, setGameResult] = useState(""); // NEW FIELD
  const [goalScorers, setGoalScorers] = useState<
    { scorer: string; assist: string; goalNumber: string }[]
  >([{ scorer: "", assist: "", goalNumber: "" }]);
  const [status, setStatus] = useState("");

  // Fetch last match info from next-game DB
  useEffect(() => {
    fetch("/api/next-game")
      .then((res) => res.json())
      .then((data) => {
        // Separate present and supporter/coach
        const present = Object.entries(data.attendance || {})
          .filter(([_, status]) => status === "present")
          .map(([name]) => name);
        const supportCoach = Object.entries(data.attendance || {})
          .filter(([_, status]) => status === "supporter" || status === "coach")
          .map(([name]) => name);

        setLastMatch({
          date: data.date || "",
          opponent: data.opponent || "",
          location: data.location || "Alexandria 66 voetbalclub, Rotterdam",
          competition: data.competition || "",
          attendance: present,
          supportCoach: supportCoach,
        });
      });
  }, []);

  // Handle dynamic goal scorer fields
  const handleGoalScorerChange = (
    idx: number,
    field: "scorer" | "assist" | "goalNumber",
    value: string
  ) => {
    const updated = [...goalScorers];
    updated[idx][field] = value;
    setGoalScorers(updated);

    // Add new empty field if last is filled
    if (
      idx === goalScorers.length - 1 &&
      updated[idx].scorer.trim() !== ""
    ) {
      setGoalScorers([...updated, { scorer: "", assist: "", goalNumber: "" }]);
    }
  };

  // Remove goal scorer field
  const removeGoalScorer = (idx: number) => {
    setGoalScorers(goalScorers.filter((_, i) => i !== idx));
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Saving...");

    // Only save filled goal scorers
    const filteredGoalScorers = goalScorers.filter(
      (g) => g.scorer.trim() !== ""
    );

    // Get timestamp in GMT+1 (Europe/Amsterdam) in format HH:MM DAY DATE
    const now = new Date();
    const amsTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Amsterdam" }));
    const hour = amsTime.getHours().toString().padStart(2, "0");
    const minute = amsTime.getMinutes().toString().padStart(2, "0");
    const day = amsTime.toLocaleString("en-US", { weekday: "short", timeZone: "Europe/Amsterdam" }); // e.g. Mon, Tue
    const date = amsTime.getDate().toString().padStart(2, "0");
    const month = (amsTime.getMonth() + 1).toString().padStart(2, "0");
    const year = amsTime.getFullYear();
    const timestamp = `${hour}:${minute} ${day} ${date}-${month}-${year}`;

    await fetch("/api/match-result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: lastMatch.date,
        opponent: lastMatch.opponent,
        location: lastMatch.location,
        competition: lastMatch.competition,
        attendance: lastMatch.attendance,
        supportCoach: lastMatch.supportCoach,
        goalsFCMierda,
        goalsOpponent,
        gameResult,
        goalScorers: filteredGoalScorers,
        timestamp, // <-- add timestamp to payload
      }),
    });

    setStatus("Saved! The match result is now stored.");
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center bg-gray-900">
      <Menu />
      <section
        className="w-full flex justify-center items-center py-8 px-2 sm:px-4 bg-gray-900"
        style={{
          background: "linear-gradient(135deg, #232526 0%, #414345 100%)",
        }}
      >
        <div className="max-w-2xl w-full flex flex-col items-center text-center mt-10 sm:mt-20">
          <h1
            className={`text-2xl sm:text-4xl font-extrabold mb-3 sm:mb-4 ${robotoSlab.className}`}
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
            Post Match Result
          </h1>
          <p
            className={`text-base sm:text-lg text-white font-medium mb-6 drop-shadow-lg ${montserrat.className}`}
            style={{ maxWidth: 600 }}
          >
            Here you can post the result of the last game, including the score,
            who scored the goals, and who provided the assists. Fill in all
            relevant match information below to keep track of team performance
            and statistics.
          </p>
          <button
            type="button"
            onClick={() => router.push("/cms")}
            className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-md font-bold text-base sm:text-lg shadow transition-all duration-150 border border-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 mt-2 sm:mt-4"
          >
            Back to CMS
          </button>
        </div>
      </section>
      <section className="w-full flex flex-col items-center gap-8 py-8 px-2 sm:px-4 bg-gray-800">
        <div className="max-w-2xl w-full rounded-2xl p-4 sm:p-8 text-white text-left bg-gray-900 shadow-xl mx-auto">
          <h2
            className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 ${robotoSlab.className}`}
          >
            Last Match Details
          </h2>
          <div className="mb-6 space-y-2">
            <div>
              <strong>Date:</strong> {lastMatch.date}
            </div>
            <div>
              <strong>Opponent:</strong> {lastMatch.opponent}
            </div>
            <div>
              <strong>Location:</strong> {lastMatch.location}
            </div>
            <div>
              <strong>Competition:</strong> {lastMatch.competition}
            </div>
            <div>
              <strong>Attendance:</strong>{" "}
              {lastMatch.attendance.length > 0 ? (
                <>
                  <span className="font-semibold text-green-400">
                    {lastMatch.attendance.length}
                  </span>{" "}
                  <span className="text-gray-300">players</span>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-x-2 gap-y-1">
                    {lastMatch.attendance.map((name, idx) => (
                      <span
                        key={idx}
                        className="bg-gray-800 rounded px-2 py-1 text-white text-xs break-words"
                        style={{ wordBreak: "break-word" }}
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                "No attendance data"
              )}
            </div>
            <div>
              <strong>Support/Coach:</strong>{" "}
              {lastMatch.supportCoach.length > 0 ? (
                <ul className="mt-2 ml-2 sm:ml-4 list-disc text-blue-300 text-sm flex flex-wrap gap-x-2 gap-y-1">
                  {lastMatch.supportCoach.map((name, idx) => (
                    <li key={idx} className="mb-1 break-words max-w-[140px] sm:max-w-none">{name}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-gray-400">None</span>
              )}
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Game Result selection - move this above the scores */}
            <div>
              <label className="block font-semibold mb-1">Game Result</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setGameResult("win")}
                  className={`px-4 py-2 rounded font-bold border transition-all duration-150 ${
                    gameResult === "win"
                      ? "bg-green-600 text-white border-green-700"
                      : "bg-gray-800 text-green-400 border-green-700"
                  }`}
                >
                  Win
                </button>
                <button
                  type="button"
                  onClick={() => setGameResult("draw")}
                  className={`px-4 py-2 rounded font-bold border transition-all duration-150 ${
                    gameResult === "draw"
                      ? "bg-amber-500 text-white border-amber-600"
                      : "bg-gray-800 text-amber-400 border-amber-600"
                  }`}
                >
                  Draw
                </button>
                <button
                  type="button"
                  onClick={() => setGameResult("lost")}
                  className={`px-4 py-2 rounded font-bold border transition-all duration-150 ${
                    gameResult === "lost"
                      ? "bg-red-600 text-white border-red-700"
                      : "bg-gray-800 text-red-400 border-red-700"
                  }`}
                >
                  Lost
                </button>
              </div>
            </div>
            {/* Scores section */}
            <div className="flex gap-2 sm:gap-4 items-end justify-between w-full">
              <div className="flex flex-col items-center flex-1">
                <label className="block font-semibold mb-1 text-center">
                  FC Mierda
                </label>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    aria-label="Decrease FC Mierda goals"
                    onClick={() => setGoalsFCMierda((prev) => Math.max(0, prev - 1))}
                    className="bg-gray-700 text-white px-2 py-1 rounded-full text-lg font-bold"
                  >
                    -
                  </button>
                  <span className="text-2xl font-bold w-10 text-center">{goalsFCMierda}</span>
                  <button
                    type="button"
                    aria-label="Increase FC Mierda goals"
                    onClick={() => setGoalsFCMierda((prev) => prev + 1)}
                    className="bg-gray-700 text-white px-2 py-1 rounded-full text-lg font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-center flex-1">
                <label className="block font-semibold mb-1 text-center">
                  {lastMatch.opponent || "Opponent"}
                </label>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    aria-label="Decrease opponent goals"
                    onClick={() => setGoalsOpponent((prev) => Math.max(0, prev - 1))}
                    className="bg-gray-700 text-white px-2 py-1 rounded-full text-lg font-bold"
                  >
                    -
                  </button>
                  <span className="text-2xl font-bold w-10 text-center">{goalsOpponent}</span>
                  <button
                    type="button"
                    aria-label="Increase opponent goals"
                    onClick={() => setGoalsOpponent((prev) => prev + 1)}
                    className="bg-gray-700 text-white px-2 py-1 rounded-full text-lg font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-1">
                FC Mierda Goal Scorers & Assists
              </label>
              {goalScorers.map((g, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row gap-2 mb-2 items-center w-full"
                >
                  <input
                    type="text"
                    placeholder="Goal scorer"
                    value={g.scorer}
                    onChange={(e) =>
                      handleGoalScorerChange(idx, "scorer", e.target.value)
                    }
                    className="p-1 rounded bg-gray-800 border border-gray-600 text-white w-full sm:w-1/3"
                  />
                  <input
                    type="text"
                    placeholder="Assist (optional)"
                    value={g.assist}
                    onChange={(e) =>
                      handleGoalScorerChange(idx, "assist", e.target.value)
                    }
                    className="p-1 rounded bg-gray-800 border border-gray-600 text-white w-full sm:w-1/3"
                  />
                  <input
                    type="text"
                    placeholder="Goal 1-0, 2-0, 1-1, etc."
                    value={g.goalNumber}
                    onChange={(e) =>
                      handleGoalScorerChange(idx, "goalNumber", e.target.value)
                    }
                    className="p-1 rounded bg-gray-800 border border-gray-600 text-white w-full sm:w-1/3"
                  />
                  {goalScorers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeGoalScorer(idx)}
                      className="text-red-400 hover:text-red-600 font-extrabold text-2xl px-2"
                      title="Remove this goal"
                      style={{ lineHeight: 1 }}
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-semibold text-base shadow transition-all duration-150 border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[150px] sm:min-w-[200px] w-full sm:w-auto"
            >
              Save Match Result
            </button>
            <div className="mt-2 text-green-400">{status}</div>
          </form>
        </div>
      </section>
    </div>
  );
}
