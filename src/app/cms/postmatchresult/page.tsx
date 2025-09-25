"use client";
import { useState, useEffect } from "react";
import { Roboto_Slab, Montserrat } from "next/font/google";
import Menu from "@/components/Menu";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "600"] });

function safeArray(val: unknown): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === "string" && val.trim().startsWith("[")) {
    try {
      const arr = JSON.parse(val);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }
  return [];
}

type GoalScorer = { scorer: string; assist: string; goalNumber: string };
type MatchResult = {
  id: number;
  date: string;
  opponent: string;
  location: string;
  competition: string;
  attendance: string[] | string;
  support_coach: string[] | string;
  goals_fcmierda?: number;
  goalsFCMierda?: number;
  goals_opponent?: number;
  goalsOpponent?: number;
  gameResult?: string;
  game_result?: string;
  goal_scorers: GoalScorer[];
  lastEdited?: string;
  lastedited?: string;
  youtube?: string; // <-- Add this line
};

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

  // New state for all match results and selected match
  const [allResults, setAllResults] = useState<MatchResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<MatchResult | null>(null);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<MatchResult | null>(null);
  const [editStatus, setEditStatus] = useState("");

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

  // Fetch all match results from Neon on mount
  useEffect(() => {
    fetch("/api/match-result?all=true")
      .then((res) => res.json())
      .then((data) => {
        setAllResults(data || []);
        if (data && data.length > 0) setSelectedResult(data[0]);
      });
  }, []);

  // When selecting a result, reset edit mode and form
  useEffect(() => {
    setEditMode(false);
    setEditForm(selectedResult ? { ...selectedResult } : null);
    setEditStatus("");
  }, [selectedResult]);

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

  // Handle edit form changes
  function handleEditChange(field: keyof MatchResult, value: unknown) {
    setEditForm((prev) => prev ? { ...prev, [field]: value } : prev);
  }

  // Handle edit goal scorers
  function handleEditGoalScorerChange(idx: number, field: keyof GoalScorer, value: string) {
    setEditForm((prev) => {
      if (!prev) return prev;
      const updated = [...(prev.goal_scorers || [])];
      updated[idx][field] = value;
      return { ...prev, goal_scorers: updated };
    });
  }

  // Remove goal scorer row
  function removeEditGoalScorer(idx: number) {
    setEditForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        goal_scorers: prev.goal_scorers.filter((_, i) => i !== idx),
      };
    });
  }

  // Save edited match result
  async function handleEditSave() {
    if (!editForm) return;
    setEditStatus("Saving...");
    // Only save filled goal scorers
    const filteredGoalScorers = (editForm.goal_scorers || []).filter(
  (g: GoalScorer) => g.scorer && g.scorer.trim() !== ""
);
    // Get timestamp in GMT+1 (Europe/Amsterdam)
    const now = new Date();
    const amsTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Amsterdam" }));
    const hour = amsTime.getHours().toString().padStart(2, "0");
    const minute = amsTime.getMinutes().toString().padStart(2, "0");
    const day = amsTime.toLocaleString("en-US", { weekday: "short", timeZone: "Europe/Amsterdam" });
    const date = amsTime.getDate().toString().padStart(2, "0");
    const month = (amsTime.getMonth() + 1).toString().padStart(2, "0");
    const year = amsTime.getFullYear();
    const lastEdited = `${hour}:${minute} ${day} ${date}-${month}-${year}`;

    await fetch("/api/match-result", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...editForm,
        goal_scorers: filteredGoalScorers,
        lastEdited,
      }),
    });

    setEditStatus("Saved! The match result has been updated.");
    setEditMode(false);

    // Refresh all results
    fetch("/api/match-result?all=true")
      .then((res) => res.json())
      .then((data) => {
        setAllResults(data || []);
        // Find and select the updated result
        const updated = data.find((r: MatchResult) => r.id === editForm.id);
        setSelectedResult(updated || null);
      });
  }

  // Update this function to always ensure an empty row at the end in edit mode
  useEffect(() => {
    if (editMode && editForm && Array.isArray(editForm.goal_scorers)) {
      const last = editForm.goal_scorers[editForm.goal_scorers.length - 1];
      if (!last || (last.scorer && last.scorer.trim() !== "")) {
        setEditForm((prev) => prev ? {
          ...prev,
          goal_scorers: [
            ...(prev.goal_scorers || []),
            { scorer: "", assist: "", goalNumber: "" },
          ],
        } : prev);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode, editForm]);

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
            Manage Match Results
          </h1>
          <p
            className={`text-base sm:text-lg text-white font-medium mb-6 drop-shadow-lg ${montserrat.className}`}
            style={{ maxWidth: 600 }}
          >
            Besides posting new match results, you can also edit past match results here.<br />
            Keep your team’s history up to date by filling in or correcting all relevant match information.
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
      <section className="w-full flex justify-center items-center py-2 px-2 sm:px-4 bg-gray-900">
        <div className="flex gap-4 max-w-2xl w-full justify-center">
          <button
            onClick={() => {
              document.getElementById("fill-last-match")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded font-semibold shadow border border-green-900 transition"
          >
            Fill-in Last Match Result
          </button>
          <button
            onClick={() => {
              document.getElementById("edit-match-results")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded font-semibold shadow border border-blue-900 transition"
          >
            Edit Match Results
          </button>
        </div>
      </section>
      <section
        id="fill-last-match"
        className="w-full flex flex-col items-center gap-8 py-8 px-2 sm:px-4 bg-gray-800"
      >
        <div className="max-w-2xl w-full rounded-2xl p-4 sm:p-8 text-white text-left bg-gray-900 shadow-xl mx-auto">
          <h2
            className={`text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-center ${robotoSlab.className}`}
          >
            Fill-in Last Match Details
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
      {/* Edit Past Match Results Section */}
      <section
        id="edit-match-results"
        className="w-full flex flex-col items-center gap-8 py-8 px-2 sm:px-4 bg-gray-900"
      >
        <div className="max-w-5xl w-full flex flex-col sm:flex-row gap-8 mx-auto">
          {/* List of past results */}
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold mb-2 text-center text-green-400">
              Edit Match Results
            </h2>
            <div className="text-center mb-4 font-bold text-base bg-gray-800/80 py-2 px-4 rounded shadow-sm text-white">
              Pick the match you want to edit
            </div>
            <div
              className="bg-gray-900 rounded-xl shadow-lg border border-gray-800 overflow-y-auto"
              style={{ maxHeight: 340, minHeight: 180 }}
            >
              <table className="min-w-full text-base">
                <thead>
                  <tr className="bg-gray-800">
                    <th className="py-3 px-4 text-left text-green-300 font-semibold border-b border-gray-800">Date</th>
                    <th className="py-3 px-4 text-left text-green-300 font-semibold border-b border-gray-800">Opponent</th>
                    <th className="py-3 px-4 text-left text-green-300 font-semibold border-b border-gray-800">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {allResults.map((result, idx) => (
                    <tr
                      key={result.id || idx}
                      className={`cursor-pointer transition ${
                        selectedResult && selectedResult.id === result.id
                          ? "bg-green-950/80 text-green-200 font-semibold"
                          : "hover:bg-gray-800 text-white"
                      }`}
                      onClick={() => setSelectedResult(result)}
                    >
                      <td className="py-2 px-4 border-b border-gray-800">{result.date}</td>
                      <td className="py-2 px-4 border-b border-gray-800">{result.opponent}</td>
                      <td className="py-2 px-4 border-b border-gray-800 capitalize">
                        {result.gameResult || result.game_result || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Details of selected match */}
          <div className="flex-1">
            {selectedResult ? (
              <div className="bg-gray-900 rounded-2xl shadow-xl p-6 text-white">
                <h3 className="text-lg sm:text-xl font-bold mb-4 text-center">
                  Edit Match Details
                </h3>
                {!editMode ? (
                  <>
                    <div className="mb-2">
                      <strong>Date:</strong> <span className="text-green-300">{selectedResult.date}</span>
                    </div>
                    <div className="mb-2">
                      <strong>Opponent:</strong> <span className="text-red-300">{selectedResult.opponent}</span>
                    </div>
                    <div className="mb-2">
                      <strong>Location:</strong> <span className="text-white">{selectedResult.location}</span>
                    </div>
                    <div className="mb-2">
                      <strong>Competition:</strong> <span className="text-white">{selectedResult.competition}</span>
                    </div>
                    <div className="mb-2">
                      <strong>Game Result:</strong>{" "}
                      {["win"].includes(selectedResult.gameResult || selectedResult.game_result || "") && (
                        <span className="px-2 py-1 rounded bg-green-600 text-white font-bold">Win</span>
                      )}
                      {["draw"].includes(selectedResult.gameResult || selectedResult.game_result || "") && (
                        <span className="px-2 py-1 rounded bg-amber-500 text-white font-bold">Draw</span>
                      )}
                      {["loss", "lost"].includes(selectedResult.gameResult || selectedResult.game_result || "") && (
                        <span className="px-2 py-1 rounded bg-red-600 text-white font-bold">Loss</span>
                      )}
                      {!["win", "draw", "loss", "lost"].includes(selectedResult.gameResult || selectedResult.game_result || "") && (
                        <span className="px-2 py-1 rounded bg-gray-700 text-white font-bold">
                          {selectedResult.gameResult || selectedResult.game_result || "-"}
                        </span>
                      )}
                    </div>
                    <div className="mb-2">
                      <strong>Score:</strong>{" "}
                      <span className="text-green-400 font-bold">{selectedResult.goals_fcmierda ?? selectedResult.goalsFCMierda ?? "-"}</span>
                      {" - "}
                      <span className="text-red-400 font-bold">{selectedResult.goals_opponent ?? selectedResult.goalsOpponent ?? "-"}</span>
                    </div>
                    <div className="mb-2">
                      <strong>Attendance:</strong>{" "}
                      <span className="text-green-300">{safeArray(selectedResult.attendance).length}</span>
                      <div className="mt-1 grid grid-cols-2 sm:grid-cols-3 gap-x-2 gap-y-1">
                        {safeArray(selectedResult.attendance).map((name: string, idx: number) => (
                          <span
                            key={idx}
                            className="bg-gray-800 rounded px-2 py-1 text-white text-xs break-words"
                            style={{ wordBreak: "break-word" }}
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mb-2">
                      <strong>Support/Coach:</strong>{" "}
                      <span className="text-blue-300">{safeArray(selectedResult.support_coach).length}</span>
                      <div className="mt-1 grid grid-cols-2 sm:grid-cols-3 gap-x-2 gap-y-1">
                        {safeArray(selectedResult.support_coach).map((name: string, idx: number) => (
                          <span
                            key={idx}
                            className="bg-gray-800 rounded px-2 py-1 text-white text-xs break-words"
                            style={{ wordBreak: "break-word" }}
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mb-2">
                      <strong>Goals & Assists:</strong>
                      {selectedResult.goal_scorers && selectedResult.goal_scorers.length > 0 ? (
                        <div className="overflow-x-auto mt-2">
                          <table className="min-w-full text-sm border-separate border-spacing-y-2">
                            <thead>
                              <tr>
                                <th className="text-left text-gray-400 font-semibold px-2">Goal</th>
                                <th className="text-left text-gray-400 font-semibold px-2">Scorer</th>
                                <th className="text-left text-gray-400 font-semibold px-2">Assist</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedResult.goal_scorers.map((g: GoalScorer, idx: number) => (
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
                        <div className="text-gray-400 text-left mt-2">No goal details available.</div>
                      )}
                    </div>
                    <div className="mb-2">
                      <strong>Video:</strong>{" "}
                      {selectedResult.youtube ? (
                        <span className="text-green-400 break-all">{selectedResult.youtube}</span>
                      ) : (
                        <span className="text-gray-400">No video link</span>
                      )}
                    </div>
                    <div className="mb-2">
                      <strong>Last Edited:</strong> <span className="text-gray-300">{selectedResult.lastedited || selectedResult.lastEdited || "-"}</span>
                    </div>
                    {/* Move the Edit button below all details */}
                    <div className="mt-6 flex justify-center">
                      <button
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-semibold text-base shadow transition-all duration-150 border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        onClick={() => {
                          setEditMode(true);
                          setEditForm({ ...selectedResult });
                        }}
                      >
                        Edit here
                      </button>
                    </div>
                  </>
                ) : (
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      handleEditSave();
                    }}
                    className="space-y-3"
                  >
                    <div>
                      <label className="block font-semibold mb-1">Date</label>
                      <input
                        type="date"
                        value={editForm?.date || ""}
                        onChange={e => handleEditChange("date", e.target.value)}
                        className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Opponent</label>
                      <input
                        type="text"
                        value={editForm?.opponent || ""}
                        onChange={e => handleEditChange("opponent", e.target.value)}
                        className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Location</label>
                      <input
                        type="text"
                        value={editForm?.location || ""}
                        onChange={e => handleEditChange("location", e.target.value)}
                        className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Competition</label>
                      <input
                        type="text"
                        value={editForm?.competition || ""}
                        onChange={e => handleEditChange("competition", e.target.value)}
                        className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Game Result</label>
                      <select
                        value={editForm?.gameResult || editForm?.game_result || ""}
                        onChange={e => handleEditChange("gameResult", e.target.value)}
                        className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white"
                        required
                      >
                        <option value="">Select result</option>
                        <option value="win" className="text-green-600">Win</option>
                        <option value="draw" className="text-amber-500">Draw</option>
                        <option value="loss" className="text-red-600">Loss</option>
                      </select>
                    </div>
                    <div className="flex gap-2 sm:gap-4 items-end justify-between w-full">
                      <div className="flex flex-col items-center flex-1">
                        <label className="block font-semibold mb-1 text-center">
                          FC Mierda
                        </label>
                        <input
                          type="number"
                          value={editForm?.goals_fcmierda ?? editForm?.goalsFCMierda ?? 0}
                          onChange={e => handleEditChange("goals_fcmierda", Number(e.target.value))}
                          className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white text-center"
                        />
                      </div>
                      <div className="flex flex-col items-center flex-1">
                        <label className="block font-semibold mb-1 text-center">
                          {editForm?.opponent || "Opponent"}
                        </label>
                        <input
                          type="number"
                          value={editForm?.goals_opponent ?? editForm?.goalsOpponent ?? 0}
                          onChange={e => handleEditChange("goals_opponent", Number(e.target.value))}
                          className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white text-center"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">
                        FC Mierda Goal Scorers & Assists
                      </label>
                      {(editForm?.goal_scorers || [{ scorer: "", assist: "", goalNumber: "" }]).map((g, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col sm:flex-row gap-2 mb-2 items-center w-full"
                        >
                          <input
                            type="text"
                            placeholder="Goal scorer"
                            value={g.scorer}
                            onChange={e =>
                              handleEditGoalScorerChange(idx, "scorer", e.target.value)
                            }
                            className="p-1 rounded bg-gray-800 border border-gray-600 text-white w-full sm:w-1/3"
                          />
                          <input
                            type="text"
                            placeholder="Assist (optional)"
                            value={g.assist}
                            onChange={e =>
                              handleEditGoalScorerChange(idx, "assist", e.target.value)
                            }
                            className="p-1 rounded bg-gray-800 border border-gray-600 text-white w-full sm:w-1/3"
                          />
                          <input
                            type="text"
                            placeholder="Goal 1-0, 2-0, 1-1, etc."
                            value={g.goalNumber}
                            onChange={e =>
                              handleEditGoalScorerChange(idx, "goalNumber", e.target.value)
                            }
                            className="p-1 rounded bg-gray-800 border border-gray-600 text-white w-full sm:w-1/3"
                          />
                          {(editForm?.goal_scorers?.length ?? 0) > 1 && (
                            <button
                              type="button"
                              onClick={() => removeEditGoalScorer(idx)}
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
                    <div>
                      <label className="block font-semibold mb-1">Video Link (YouTube)</label>
                      <input
                        type="text"
                        value={editForm?.youtube || ""}
                        onChange={e => handleEditChange("youtube", e.target.value)}
                        className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white"
                        placeholder="Paste YouTube link here"
                      />
                      <span className="text-gray-400 text-xs">Paste the full YouTube URL for the match video.</span>
                    </div>
                    <button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-semibold text-base shadow transition-all duration-150 border border-green-700 focus:outline-none focus:ring-2 focus:ring-green-400"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="ml-4 bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md font-semibold text-base shadow transition-all duration-150 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
                      onClick={() => setEditMode(false)}
                    >
                      Cancel
                    </button>
                    <div className="mt-2 text-green-400">{editStatus}</div>
                  </form>
                )}
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg shadow-xl p-6 text-gray-400 text-center">
                Select a match result to view details.
              </div>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
