"use client";
import { useState, useEffect } from "react";
import { Roboto_Slab, Montserrat } from "next/font/google";
import Menu from "@/components/Menu";
import Footer from "@/components/Footer";
import SubscriberStatsBadge from "@/components/SubscriberStatsBadge";
import { useRouter } from "next/navigation";
import DatabaseUnavailableNotice from "@/components/DatabaseUnavailableNotice";

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

type GoalScorer = { id?: number; scorer: string; assist: string; goalNumber: string };
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
  fcmierda_man_of_the_match?: string;
  fcmierdaManOfTheMatch?: string;
  match_summary?: string;
  matchSummary?: string;
};

// Helper to format date into "30 August"
function formatDayMonth(dateStr?: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", { day: "numeric", month: "long" });
    }
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString("en-US", { day: "numeric", month: "long" });
  }
  return dateStr;
}

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

  const [dbError, setDbError] = useState(false);

  // State for match result form
  const [goalsFCMierda, setGoalsFCMierda] = useState(0);
  const [goalsOpponent, setGoalsOpponent] = useState(0);
  const [gameResult, setGameResult] = useState(""); // NEW FIELD
  const [fcmierdaManOfTheMatch, setFcmierdaManOfTheMatch] = useState("");
  const [matchSummary, setMatchSummary] = useState("");
  const [notifyUsers, setNotifyUsers] = useState(false);
  const [customNotificationText, setCustomNotificationText] = useState("");
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
  const [editNotifyUsers, setEditNotifyUsers] = useState(false);
  const [editCustomNotificationText, setEditCustomNotificationText] = useState("");

  // attendance add-field state
  const [newAttendanceName, setNewAttendanceName] = useState("");

  // Fetch last match info from next-game DB
  useEffect(() => {
    let isMounted = true;
    fetch(`/api/next-game?_t=${Date.now()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data?.dbUnavailable) {
          setDbError(true);
        }
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
      })
      .catch((e) => {
        if (isMounted) setDbError(true);
        console.error(e);
      });
    return () => { isMounted = false; };
  }, []);

  // Fetch all match results from Neon on mount
  useEffect(() => {
    let isMounted = true;
    fetch(`/api/match-result?all=true&_t=${Date.now()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data?.dbUnavailable) {
          setDbError(true);
        } else if (Array.isArray(data)) {
          setAllResults(data || []);
          if (data && data.length > 0) setSelectedResult(data[0]);
        }
      })
      .catch((e) => {
        if (isMounted) setDbError(true);
        console.error(e);
      });
    return () => { isMounted = false; };
  }, []);

  // When selecting a result, reset edit mode and form and normalize arrays
  useEffect(() => {
    setEditMode(false);
    if (selectedResult) {
      setEditForm({
        ...selectedResult,
        attendance: safeArray(selectedResult.attendance),
        support_coach: safeArray(selectedResult.support_coach),
        goal_scorers: Array.isArray(selectedResult.goal_scorers) ? selectedResult.goal_scorers : [],
      });
    } else {
      setEditForm(null);
    }
    setEditStatus("");
    setNewAttendanceName("");
    setEditNotifyUsers(false);
    setEditCustomNotificationText("");
  }, [selectedResult]);

  // Attendance handlers for edit form
  function handleEditAttendanceChange(idx: number, value: string) {
    setEditForm((prev) => {
      if (!prev) return prev;
      const arr = safeArray(prev.attendance);
      arr[idx] = value;
      return { ...prev, attendance: arr };
    });
  }
  function addEditAttendance(name?: string) {
    setEditForm((prev) => {
      if (!prev) return prev;
      const arr = safeArray(prev.attendance);
      return { ...prev, attendance: [...arr, name ?? ""] };
    });
  }
  function removeEditAttendance(idx: number) {
    setEditForm((prev) => {
      if (!prev) return prev;
      const arr = safeArray(prev.attendance).filter((_, i) => i !== idx);
      return { ...prev, attendance: arr };
    });
  }

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

    const filteredGoalScorers = goalScorers.filter(g => g.scorer.trim() !== "");

    const now = new Date();
    const amsTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Amsterdam" }));
    const hour = amsTime.getHours().toString().padStart(2, "0");
    const minute = amsTime.getMinutes().toString().padStart(2, "0");
    const day = amsTime.toLocaleString("en-US", { weekday: "short", timeZone: "Europe/Amsterdam" });
    const date = amsTime.getDate().toString().padStart(2, "0");
    const month = (amsTime.getMonth() + 1).toString().padStart(2, "0");
    const year = amsTime.getFullYear();
    const timestamp = `${hour}:${minute} ${day} ${date}-${month}-${year}`;

    try {
      const res = await fetch("/api/match-result", {
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
          fcmierda_man_of_the_match: fcmierdaManOfTheMatch,
          fcmierdaManOfTheMatch,
          goalScorers: filteredGoalScorers,
          match_summary: matchSummary,
          matchSummary,
          timestamp
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus(data.error ? `Error: ${data.error}` : `Error: ${res.status}`);
        return;
      }
      
      if (data.success === false) {
        setStatus(data.error ? `Error: ${data.error}` : "Failed to save match result");
        return;
      }

      const newMatchId = data.id;
      const targetUrl = newMatchId ? `/results#match-${newMatchId}` : "/results#match-details";

      if (notifyUsers) {
        setStatus("Saved match result! Sending notifications to subscribers...");
        const formattedDayMonth = formatDayMonth(lastMatch.date);
        const datePrefix = formattedDayMonth ? `${formattedDayMonth}: ` : "";
        const resultWord = gameResult === "win" ? "won" : gameResult === "loss" ? "lost" : gameResult === "draw" ? "drew" : "played";
        const resultTitleWord = gameResult === "win" ? "Win" : gameResult === "loss" ? "Loss" : gameResult === "draw" ? "Draw" : "Result";
        const scoreText = `${goalsFCMierda} - ${goalsOpponent}`;
        const autoTitle = `Match result: ${resultTitleWord} vs ${lastMatch.opponent || "opponent"} ⚽`;
        const resultPrefix = `${datePrefix}FC Mierda ${resultWord} (${scoreText}) against ${lastMatch.opponent || "our opponent"}.`;
        const defaultSuffix = "Check out the goal scorers and match recap!";
        const fullBody = customNotificationText.trim()
          ? `${resultPrefix} ${customNotificationText.trim()}`
          : `${resultPrefix} ${defaultSuffix}`;

        try {
          const notifyRes = await fetch("/api/push/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "match_result",
              title: autoTitle,
              body: fullBody,
              url: targetUrl,
              matchResultData: {
                id: newMatchId,
                opponent: lastMatch.opponent,
                date: lastMatch.date,
                gameResult,
                goalsFCMierda,
                goalsOpponent,
                manOfTheMatch: fcmierdaManOfTheMatch,
              },
            }),
          });
          const notifyData = await notifyRes.json();
          if (notifyData?.sent && notifyData.sent > 0) {
            setStatus(`Saved! Match result notification sent to ${notifyData.sent} subscribers.`);
          }
        } catch (pushErr) {
          console.error("Failed to dispatch match result notification:", pushErr);
        }
      }

      setStatus("Saved! Redirecting...");
      setTimeout(() => router.push(targetUrl), 1200);
    } catch (err) {
      setStatus("Network error while saving.");
      console.error(err);
    }
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
      updated[idx] = { ...updated[idx], [field]: value };
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
    // Only save filled goal scorers, explicitly keeping their ID to prevent the backend from deleting them
    const filteredGoalScorers = (editForm.goal_scorers || []).filter(
      (g: GoalScorer) => g.scorer && g.scorer.trim() !== ""
    ).map((g: GoalScorer) => ({
      id: g.id,
      scorer: g.scorer,
      assist: g.assist,
      goalNumber: g.goalNumber,
    }));
    // normalize attendance/support_coach
    const attendanceArr = safeArray(editForm.attendance).map((s) => (s || "").trim()).filter(Boolean);
    const supportArr = safeArray(editForm.support_coach).map((s) => (s || "").trim()).filter(Boolean);

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

    const payload: any = {
        id: editForm.id,
        date: editForm.date,
        opponent: editForm.opponent,
        location: editForm.location,
        competition: editForm.competition,
        gameResult: editForm.gameResult ?? editForm.game_result ?? "",
        game_result: editForm.gameResult ?? editForm.game_result ?? "",
        goalsFCMierda: editForm.goalsFCMierda ?? editForm.goals_fcmierda ?? 0,
        goals_fcmierda: editForm.goalsFCMierda ?? editForm.goals_fcmierda ?? 0,
        goalsOpponent: editForm.goalsOpponent ?? editForm.goals_opponent ?? 0,
        goals_opponent: editForm.goalsOpponent ?? editForm.goals_opponent ?? 0,
        fcmierda_man_of_the_match: editForm.fcmierda_man_of_the_match ?? editForm.fcmierdaManOfTheMatch ?? "",
        fcmierdaManOfTheMatch: editForm.fcmierda_man_of_the_match ?? editForm.fcmierdaManOfTheMatch ?? "",
        goal_scorers: filteredGoalScorers,
        goalScorers: filteredGoalScorers,
        attendance: attendanceArr,
        support_coach: supportArr,
        supportCoach: supportArr,
        youtube: editForm.youtube ?? "",
        match_summary: editForm.match_summary ?? editForm.matchSummary ?? "",
        matchSummary: editForm.match_summary ?? editForm.matchSummary ?? "",
        lastEdited,
    };

    const res = await fetch("/api/match-result", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setEditStatus(data.error ? `Error: ${data.error}` : `Error: ${res.status}`);
      return;
    }

    if (data.success === false) {
      setEditStatus(data.error ? `Error: ${data.error}` : "Failed to update match result");
      return;
    }

    if (editNotifyUsers) {
      setEditStatus("Saved! Sending notifications to subscribers...");
      const formattedDayMonth = formatDayMonth(editForm.date);
      const datePrefix = formattedDayMonth ? `${formattedDayMonth}: ` : "";
      const currentResult = editForm.gameResult ?? editForm.game_result ?? "";
      const resultWord = currentResult === "win" ? "won" : currentResult === "loss" ? "lost" : currentResult === "draw" ? "drew" : "played";
      const resultTitleWord = currentResult === "win" ? "Win" : currentResult === "loss" ? "Loss" : currentResult === "draw" ? "Draw" : "Result";
      const goalsFC = editForm.goalsFCMierda ?? editForm.goals_fcmierda ?? 0;
      const goalsOpp = editForm.goalsOpponent ?? editForm.goals_opponent ?? 0;
      const scoreText = `${goalsFC} - ${goalsOpp}`;
      const autoTitle = `Match result: ${resultTitleWord} vs ${editForm.opponent || "opponent"} ⚽`;
      const resultPrefix = `${datePrefix}FC Mierda ${resultWord} (${scoreText}) against ${editForm.opponent || "our opponent"}.`;
      const defaultSuffix = "Check out the goal scorers and match recap!";
      const fullBody = editCustomNotificationText.trim()
        ? `${resultPrefix} ${editCustomNotificationText.trim()}`
        : `${resultPrefix} ${defaultSuffix}`;
      const editTargetUrl = editForm.id ? `/results#match-${editForm.id}` : "/results#match-details";

      try {
        const notifyRes = await fetch("/api/push/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "match_result",
            title: autoTitle,
            body: fullBody,
            url: editTargetUrl,
            matchResultData: {
              id: editForm.id,
              opponent: editForm.opponent,
              date: editForm.date,
              gameResult: currentResult,
              goalsFCMierda: goalsFC,
              goalsOpponent: goalsOpp,
              manOfTheMatch: editForm.fcmierda_man_of_the_match ?? editForm.fcmierdaManOfTheMatch ?? "",
            },
          }),
        });
        const notifyData = await notifyRes.json();
        if (notifyData?.sent && notifyData.sent > 0) {
          setEditStatus(`Saved! Match result notification sent to ${notifyData.sent} subscribers.`);
        } else {
          setEditStatus("Saved! The match result has been updated.");
        }
      } catch (pushErr) {
        console.error("Failed to dispatch match result notification:", pushErr);
        setEditStatus("Saved match result! (Push notifications could not be sent).");
      }
    } else {
      setEditStatus("Saved! The match result has been updated.");
    }

    setEditMode(false);
    setEditNotifyUsers(false);
    setEditCustomNotificationText("");

    // Refresh all results
    fetch(`/api/match-result?all=true&_t=${Date.now()}`, { cache: "no-store" })
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
    <div className={`relative min-h-screen flex flex-col items-center bg-gray-900 text-white overflow-x-hidden ${montserrat.className}`}>
      <Menu />

      <main className="w-full flex-1 flex flex-col items-center pt-24 sm:pt-36 pb-20 px-3.5 sm:px-6">
        {/* Top Breadcrumb & Jump Bar */}
        <div className="max-w-5xl w-full mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.push("/cms")}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gray-900/90 hover:bg-gray-800 border border-gray-700 text-xs sm:text-sm font-semibold text-gray-200 hover:text-emerald-300 transition-all shadow-sm cursor-pointer"
          >
            <span>←</span>
            <span>Back to CMS</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                document.getElementById("fill-last-match")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-3.5 py-1.5 rounded-full bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 font-semibold text-xs transition-all cursor-pointer"
            >
              ⚽ Post Latest Result
            </button>
            <button
              type="button"
              onClick={() => {
                document.getElementById("edit-match-results")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-3.5 py-1.5 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 font-semibold text-xs transition-all cursor-pointer"
            >
              📝 Edit Past Matches
            </button>
          </div>
        </div>

        {/* Hero Header */}
        <div className="max-w-2xl w-full text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-2xl mb-3 shadow-inner">
            🏆
          </div>
          <h1 className={`text-2xl sm:text-4xl font-black tracking-tight text-white mb-2 ${robotoSlab.className}`}>
            Manage Match Results
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 font-medium max-w-lg mx-auto">
            Post newly concluded match results, record goal scorers & assists, assign Man of the Match, or update past scorelines.
          </p>
        </div>

        {dbError && (
          <div className="max-w-3xl w-full mx-auto mb-8">
            <DatabaseUnavailableNotice
              title="Match Records Database Restricted"
              description="Database connection is currently restricted or in quota cooldown. Live match history and past scores are temporarily offline. Submitting new results will be available once the database restores."
            />
          </div>
        )}

        {/* Section 1: Fill-in Last Match Result */}
        <div
          id="fill-last-match"
          className="max-w-3xl w-full rounded-2xl p-6 sm:p-10 text-white bg-gray-950/85 border border-gray-800 shadow-2xl backdrop-blur-md mx-auto mb-14"
        >
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-800">
            <div>
              <h2 className={`text-xl sm:text-2xl font-bold text-white ${robotoSlab.className}`}>
                Post Concluded Match Result
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Automatically pre-filled with the latest scheduled matchday data.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-bold">
              Step 1 of 2
            </span>
          </div>

          {/* Match Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gray-900/90 border border-gray-800">
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Date</span>
              <span className="text-xs sm:text-sm font-bold text-white block truncate mt-0.5">{lastMatch.date || "-"}</span>
            </div>
            <div className="p-3 rounded-xl bg-gray-900/90 border border-gray-800">
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Opponent</span>
              <span className="text-xs sm:text-sm font-bold text-white block truncate mt-0.5">{lastMatch.opponent || "-"}</span>
            </div>
            <div className="p-3 rounded-xl bg-gray-900/90 border border-gray-800">
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Competition</span>
              <span className="text-xs sm:text-sm font-bold text-white block truncate mt-0.5">{lastMatch.competition || "-"}</span>
            </div>
            <div className="p-3 rounded-xl bg-gray-900/90 border border-gray-800">
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Location</span>
              <span className="text-xs sm:text-sm font-bold text-white block truncate mt-0.5">{lastMatch.location || "-"}</span>
            </div>
          </div>

          {/* Attendance Preview Badges */}
          <div className="mb-6 p-3.5 rounded-xl bg-gray-900/60 border border-gray-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-300">
                Squad Attendance ({lastMatch.attendance.length} players)
              </span>
              {lastMatch.supportCoach.length > 0 && (
                <span className="text-cyan-400">
                  + {lastMatch.supportCoach.length} Supporters/Coach
                </span>
              )}
            </div>
            {lastMatch.attendance.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {lastMatch.attendance.map((name, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-black/60 border border-gray-800 text-[11px] text-gray-300 font-medium"
                  >
                    {name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No attendance data recorded yet.</p>
            )}
          </div>

          {/* Main Submission Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Match Outcome Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Match Outcome
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setGameResult("win")}
                  className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    gameResult === "win"
                      ? "bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30"
                      : "bg-gray-900/80 text-emerald-400 border-gray-800 hover:border-emerald-800"
                  }`}
                >
                  <span>🏆</span>
                  <span>Win</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGameResult("draw")}
                  className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    gameResult === "draw"
                      ? "bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-600/30"
                      : "bg-gray-900/80 text-amber-400 border-gray-800 hover:border-amber-800"
                  }`}
                >
                  <span>🤝</span>
                  <span>Draw</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGameResult("loss")}
                  className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    gameResult === "loss"
                      ? "bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30"
                      : "bg-gray-900/80 text-rose-400 border-gray-800 hover:border-rose-800"
                  }`}
                >
                  <span>⚠️</span>
                  <span>Loss</span>
                </button>
              </div>
            </div>

            {/* Scoreline Counter */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gray-900/90 border border-gray-800 flex items-center justify-around gap-4">
              {/* FC Mierda Goals */}
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                  FC Mierda
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setGoalsFCMierda((prev) => Math.max(0, prev - 1))}
                    className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-bold text-lg flex items-center justify-center transition-all cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-3xl font-black font-mono w-12 text-center text-white">
                    {goalsFCMierda}
                  </span>
                  <button
                    type="button"
                    onClick={() => setGoalsFCMierda((prev) => prev + 1)}
                    className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-bold text-lg flex items-center justify-center transition-all cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="text-2xl font-black text-gray-600 font-mono">:</div>

              {/* Opponent Goals */}
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-2 truncate max-w-[120px] sm:max-w-[160px]">
                  {lastMatch.opponent || "Opponent"}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setGoalsOpponent((prev) => Math.max(0, prev - 1))}
                    className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-bold text-lg flex items-center justify-center transition-all cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-3xl font-black font-mono w-12 text-center text-white">
                    {goalsOpponent}
                  </span>
                  <button
                    type="button"
                    onClick={() => setGoalsOpponent((prev) => prev + 1)}
                    className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-bold text-lg flex items-center justify-center transition-all cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Man of the Match Selection */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                ⭐ FC Mierda Man of the Match
              </label>
              <select
                value={fcmierdaManOfTheMatch}
                onChange={(e) => setFcmierdaManOfTheMatch(e.target.value)}
                className="w-full rounded-xl border border-gray-700 bg-black/60 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition-all cursor-pointer"
              >
                <option value="">Select player from matchday attendance</option>
                {lastMatch.attendance.map((name, idx) => (
                  <option key={idx} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Goal Scorers & Assists Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  ⚽ Goal Scorers & Assists
                </label>
                <span className="text-[11px] text-gray-400">Add scorers in chronological order</span>
              </div>

              <datalist id="attendees-list">
                {lastMatch.attendance.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>

              <div className="space-y-2">
                {goalScorers.map((g, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row gap-2 items-center p-2.5 rounded-xl bg-gray-900/90 border border-gray-800"
                  >
                    <input
                      type="text"
                      placeholder="Goal Scorer (e.g. Rico)"
                      value={g.scorer}
                      onChange={(e) => handleGoalScorerChange(idx, "scorer", e.target.value)}
                      list="attendees-list"
                      className="w-full sm:w-1/3 rounded-lg border border-gray-700 bg-black/60 px-3 py-2 text-xs sm:text-sm text-white focus:border-emerald-500 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Assist by (optional)"
                      value={g.assist}
                      onChange={(e) => handleGoalScorerChange(idx, "assist", e.target.value)}
                      list="attendees-list"
                      className="w-full sm:w-1/3 rounded-lg border border-gray-700 bg-black/60 px-3 py-2 text-xs sm:text-sm text-white focus:border-emerald-500 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Scoreline (1-0, 2-0, 2-1)"
                      value={g.goalNumber}
                      onChange={(e) => handleGoalScorerChange(idx, "goalNumber", e.target.value)}
                      className="w-full sm:w-1/3 rounded-lg border border-gray-700 bg-black/60 px-3 py-2 text-xs sm:text-sm text-white focus:border-emerald-500 outline-none"
                    />
                    {goalScorers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeGoalScorer(idx)}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-300 hover:text-white text-xs font-bold transition-colors"
                        title="Remove goal"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Match Summary */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Match Recap & Summary (Optional)
              </label>
              <textarea
                rows={3}
                value={matchSummary}
                onChange={(e) => setMatchSummary(e.target.value)}
                placeholder="Write highlights, turning points, great saves or post-match celebration notes..."
                className="w-full rounded-xl border border-gray-700 bg-black/60 px-4 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition-all"
              />
            </div>

            {/* Broadcast Notification Card */}
            <div className="p-4 sm:p-5 bg-gradient-to-b from-gray-900/90 to-gray-950 border border-emerald-800/40 rounded-2xl shadow-lg space-y-3.5">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="notifyMatchResult"
                  checked={notifyUsers}
                  onChange={(e) => setNotifyUsers(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-emerald-600 bg-black border-gray-700 rounded focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                />
                <div className="flex-1">
                  <label htmlFor="notifyMatchResult" className="text-xs sm:text-sm font-bold text-emerald-300 cursor-pointer select-none flex items-center gap-1.5">
                    <span>🔔</span> Broadcast Match Result Push Alert to Subscribers
                  </label>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Broadcasts match scoreline, result status, and direct link to the match recap.
                  </p>
                </div>
              </div>

              <div className="pt-1">
                <SubscriberStatsBadge theme="green" />
              </div>

              {notifyUsers && (
                <div className="mt-3 p-4 bg-black/60 border border-gray-800 rounded-xl space-y-3 text-xs sm:text-sm">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>📲</span> Result Push Notification Preview
                  </div>
                  <div className="p-3.5 bg-gray-900/90 rounded-xl border border-gray-800 space-y-1">
                    <div className="font-bold text-emerald-400 text-xs sm:text-sm">
                      📢 Match result: {gameResult === "win" ? "Win" : gameResult === "loss" ? "Loss" : gameResult === "draw" ? "Draw" : "Result"} vs {lastMatch.opponent || "opponent"} ⚽
                    </div>
                    <div className="text-gray-300 text-xs leading-relaxed">
                      <span className="font-semibold text-emerald-300">
                        {formatDayMonth(lastMatch.date) ? `${formatDayMonth(lastMatch.date)}: ` : ""}FC Mierda {gameResult === "win" ? "won" : gameResult === "loss" ? "lost" : gameResult === "draw" ? "drew" : "played"} ({goalsFCMierda} - {goalsOpponent}) against {lastMatch.opponent || "our opponent"}.
                      </span>{" "}
                      {customNotificationText.trim() || "Check out the goal scorers and match recap!"}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Custom Message Note (Optional)
                    </label>
                    <input
                      type="text"
                      value={customNotificationText}
                      onChange={(e) => setCustomNotificationText(e.target.value)}
                      placeholder="e.g. Phenomenal comeback! Man of the Match awarded to our keeper."
                      className="w-full rounded-xl border border-gray-700 bg-black/80 px-3.5 py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Save & Status Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 font-bold text-sm text-white shadow-lg shadow-emerald-600/25 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
              >
                💾 Save Match Result
              </button>
              {status && (
                <div className="text-xs sm:text-sm font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-3.5 py-2 rounded-xl">
                  {status}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Section 2: Edit Past Match Results */}
        <div
          id="edit-match-results"
          className="max-w-5xl w-full rounded-2xl p-6 sm:p-10 text-white bg-gray-950/85 border border-gray-800 shadow-2xl backdrop-blur-md mx-auto"
        >
          <div className="pb-4 mb-6 border-b border-gray-800">
            <h2 className={`text-xl sm:text-2xl font-bold text-white ${robotoSlab.className}`}>
              Past Match Results History & Editor
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Select any past match from the archive table to edit scorelines, scorers, attendance, or add video links.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* List Table */}
            <div className="lg:col-span-5 flex flex-col">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Matches Archive ({allResults.length})
              </span>
              <div className="rounded-xl border border-gray-800 bg-gray-900/80 overflow-hidden shadow-inner max-h-[480px] overflow-y-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-black/40 border-b border-gray-800 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3 text-left text-gray-400 font-semibold">Date</th>
                      <th className="py-2.5 px-3 text-left text-gray-400 font-semibold">Opponent</th>
                      <th className="py-2.5 px-3 text-right text-gray-400 font-semibold">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {allResults.map((result, idx) => {
                      const isSelected = selectedResult && selectedResult.id === result.id;
                      const res = (result.gameResult || result.game_result || "").toLowerCase();
                      return (
                        <tr
                          key={result.id || idx}
                          onClick={() => setSelectedResult(result)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-emerald-950/60 text-emerald-200 font-semibold"
                              : "hover:bg-gray-800/70 text-gray-300"
                          }`}
                        >
                          <td className="py-2.5 px-3 whitespace-nowrap">{result.date}</td>
                          <td className="py-2.5 px-3 font-medium truncate max-w-[120px] text-white">
                            {result.opponent}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                res === "win"
                                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800/60"
                                  : res === "loss" || res === "lost"
                                  ? "bg-rose-950 text-rose-400 border border-rose-800/60"
                                  : res === "draw"
                                  ? "bg-amber-950 text-amber-400 border border-amber-800/60"
                                  : "bg-gray-800 text-gray-400"
                              }`}
                            >
                              {res || "-"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Selected Match Details / Editor View */}
            <div className="lg:col-span-7">
              {selectedResult ? (
                <div className="rounded-xl border border-gray-800 bg-gray-900/90 p-5 sm:p-6 shadow-xl">
                  {!editMode ? (
                    <div className="space-y-4 text-xs sm:text-sm">
                      <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-white">
                            vs {selectedResult.opponent}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                              (selectedResult.gameResult || selectedResult.game_result) === "win"
                                ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                : (selectedResult.gameResult || selectedResult.game_result) === "loss"
                                ? "bg-rose-950 text-rose-400 border border-rose-800"
                                : "bg-amber-950 text-amber-400 border border-amber-800"
                            }`}
                          >
                            {selectedResult.gameResult || selectedResult.game_result || "-"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditMode(true);
                            setEditForm({ ...selectedResult });
                            setEditNotifyUsers(false);
                            setEditCustomNotificationText("");
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white shadow transition-all cursor-pointer"
                        >
                          ✏️ Edit Match
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-gray-400 block">Date</span>
                          <span className="text-white font-medium">{selectedResult.date}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Score</span>
                          <span className="text-emerald-400 font-black font-mono">
                            {selectedResult.goals_fcmierda ?? selectedResult.goalsFCMierda ?? 0} - {selectedResult.goals_opponent ?? selectedResult.goalsOpponent ?? 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Competition</span>
                          <span className="text-white font-medium">{selectedResult.competition || "-"}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Location</span>
                          <span className="text-white font-medium">{selectedResult.location || "-"}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-400 block">Man of the Match</span>
                          <span className="text-amber-300 font-bold">
                            ⭐ {selectedResult.fcmierda_man_of_the_match || selectedResult.fcmierdaManOfTheMatch || "None assigned"}
                          </span>
                        </div>
                      </div>

                      {/* Goals Table */}
                      <div>
                        <span className="text-gray-400 block font-semibold mb-1">Goals & Assists</span>
                        {selectedResult.goal_scorers && selectedResult.goal_scorers.length > 0 ? (
                          <div className="space-y-1">
                            {selectedResult.goal_scorers.map((g: GoalScorer, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 p-1.5 rounded bg-black/50 text-xs">
                                <span className="font-bold text-emerald-400 w-10">{g.goalNumber || "Goal"}</span>
                                <span className="font-semibold text-white flex-1">{g.scorer}</span>
                                <span className="text-gray-400">{g.assist ? `(Assist: ${g.assist})` : "-"}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500 italic">No goal details logged.</span>
                        )}
                      </div>

                      {/* Match Summary */}
                      {(selectedResult.match_summary || selectedResult.matchSummary) && (
                        <div>
                          <span className="text-gray-400 block font-semibold mb-1">Match Recap</span>
                          <p className="p-3 rounded-lg bg-black/40 border border-gray-800 text-gray-300 text-xs leading-relaxed whitespace-pre-wrap">
                            {selectedResult.match_summary || selectedResult.matchSummary}
                          </p>
                        </div>
                      )}

                      {/* Video Link */}
                      {selectedResult.youtube && (
                        <div className="text-xs">
                          <span className="text-gray-400 block font-semibold mb-1">Video</span>
                          <a
                            href={selectedResult.youtube}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300 underline break-all"
                          >
                            {selectedResult.youtube}
                          </a>
                        </div>
                      )}

                      {editStatus && (
                        <div className="p-3 bg-emerald-950/70 border border-emerald-800/70 rounded-xl text-emerald-300 text-xs font-semibold">
                          {editStatus}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Edit Form */
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleEditSave();
                      }}
                      className="space-y-4 text-xs sm:text-sm"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                        <span className="text-sm font-bold text-emerald-400">Editing Match Details</span>
                        <button
                          type="button"
                          onClick={() => setEditMode(false)}
                          className="text-xs text-gray-400 hover:text-gray-200"
                        >
                          ✕ Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-300 mb-1">Date</label>
                          <input
                            type="date"
                            value={editForm?.date || ""}
                            onChange={(e) => handleEditChange("date", e.target.value)}
                            className="w-full rounded-xl border border-gray-700 bg-black/60 px-3 py-2 text-xs sm:text-sm text-white focus:border-emerald-500 outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-300 mb-1">Opponent</label>
                          <input
                            type="text"
                            value={editForm?.opponent || ""}
                            onChange={(e) => handleEditChange("opponent", e.target.value)}
                            className="w-full rounded-xl border border-gray-700 bg-black/60 px-3 py-2 text-xs sm:text-sm text-white focus:border-emerald-500 outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-300 mb-1">Location</label>
                          <input
                            type="text"
                            value={editForm?.location || ""}
                            onChange={(e) => handleEditChange("location", e.target.value)}
                            className="w-full rounded-xl border border-gray-700 bg-black/60 px-3 py-2 text-xs sm:text-sm text-white focus:border-emerald-500 outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-300 mb-1">Competition</label>
                          <input
                            type="text"
                            value={editForm?.competition || ""}
                            onChange={(e) => handleEditChange("competition", e.target.value)}
                            className="w-full rounded-xl border border-gray-700 bg-black/60 px-3 py-2 text-xs sm:text-sm text-white focus:border-emerald-500 outline-none"
                            required
                          />
                        </div>
                      </div>

                      {/* Result & Score */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-300 mb-1">Game Result</label>
                          <select
                            value={editForm?.gameResult || editForm?.game_result || ""}
                            onChange={(e) => handleEditChange("gameResult", e.target.value)}
                            className="w-full rounded-xl border border-gray-700 bg-black/60 px-3 py-2 text-xs sm:text-sm text-white focus:border-emerald-500 outline-none cursor-pointer"
                            required
                          >
                            <option value="">Select result</option>
                            <option value="win">Win</option>
                            <option value="draw">Draw</option>
                            <option value="loss">Loss</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-emerald-400 mb-1">FC Mierda Goals</label>
                          <input
                            type="number"
                            value={editForm?.goals_fcmierda ?? editForm?.goalsFCMierda ?? 0}
                            onChange={(e) => handleEditChange("goals_fcmierda", Number(e.target.value))}
                            className="w-full rounded-xl border border-gray-700 bg-black/60 px-3 py-2 text-xs sm:text-sm text-white focus:border-emerald-500 outline-none text-center font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-300 mb-1">Opponent Goals</label>
                          <input
                            type="number"
                            value={editForm?.goals_opponent ?? editForm?.goalsOpponent ?? 0}
                            onChange={(e) => handleEditChange("goals_opponent", Number(e.target.value))}
                            className="w-full rounded-xl border border-gray-700 bg-black/60 px-3 py-2 text-xs sm:text-sm text-white focus:border-emerald-500 outline-none text-center font-bold"
                          />
                        </div>
                      </div>

                      {/* Man of the Match */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">⭐ Man of the Match</label>
                        <select
                          value={editForm?.fcmierda_man_of_the_match ?? editForm?.fcmierdaManOfTheMatch ?? ""}
                          onChange={(e) => handleEditChange("fcmierda_man_of_the_match", e.target.value)}
                          className="w-full rounded-xl border border-gray-700 bg-black/60 px-3 py-2 text-xs sm:text-sm text-white focus:border-emerald-500 outline-none cursor-pointer"
                        >
                          <option value="">-- Select Man of the Match --</option>
                          {(safeArray(editForm?.attendance) || []).map((name: string, idx: number) => (
                            <option key={idx} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Goal Scorers Editor */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Goal Scorers</label>
                        <datalist id="edit-attendees-list">
                          {safeArray(editForm?.attendance).map((name: string) => (
                            <option key={name} value={name} />
                          ))}
                        </datalist>
                        <div className="space-y-1.5">
                          {(editForm?.goal_scorers || [{ scorer: "", assist: "", goalNumber: "" }]).map((g, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <input
                                type="text"
                                placeholder="Scorer"
                                value={g.scorer}
                                onChange={(e) => handleEditGoalScorerChange(idx, "scorer", e.target.value)}
                                list="edit-attendees-list"
                                className="w-1/3 rounded-lg border border-gray-700 bg-black/60 px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 outline-none"
                              />
                              <input
                                type="text"
                                placeholder="Assist"
                                value={g.assist}
                                onChange={(e) => handleEditGoalScorerChange(idx, "assist", e.target.value)}
                                list="edit-attendees-list"
                                className="w-1/3 rounded-lg border border-gray-700 bg-black/60 px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 outline-none"
                              />
                              <input
                                type="text"
                                placeholder="Goal #"
                                value={g.goalNumber}
                                onChange={(e) => handleEditGoalScorerChange(idx, "goalNumber", e.target.value)}
                                className="w-1/3 rounded-lg border border-gray-700 bg-black/60 px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 outline-none"
                              />
                              {(editForm?.goal_scorers?.length ?? 0) > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeEditGoalScorer(idx)}
                                  className="px-2 py-1 rounded bg-rose-950/60 border border-rose-800 text-rose-300 hover:text-white text-xs font-bold"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* YouTube Video Link */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">YouTube Video Link</label>
                        <input
                          type="text"
                          value={editForm?.youtube || ""}
                          onChange={(e) => handleEditChange("youtube", e.target.value)}
                          placeholder="https://youtube.com/watch?v=..."
                          className="w-full rounded-xl border border-gray-700 bg-black/60 px-3 py-2 text-xs sm:text-sm text-white focus:border-emerald-500 outline-none"
                        />
                      </div>

                      {/* Match Summary */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Match Recap / Summary</label>
                        <textarea
                          rows={3}
                          value={editForm?.match_summary ?? editForm?.matchSummary ?? ""}
                          onChange={(e) => handleEditChange("match_summary", e.target.value)}
                          className="w-full rounded-xl border border-gray-700 bg-black/60 px-3 py-2 text-xs sm:text-sm text-white focus:border-emerald-500 outline-none"
                          placeholder="Recap notes..."
                        />
                      </div>

                      {/* Notification on Edit */}
                      <div className="p-3.5 rounded-xl bg-black/50 border border-emerald-800/40 space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="editNotifyMatchResult"
                            checked={editNotifyUsers}
                            onChange={(e) => setEditNotifyUsers(e.target.checked)}
                            className="w-4 h-4 text-emerald-600 bg-black border-gray-700 rounded focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                          />
                          <label htmlFor="editNotifyMatchResult" className="text-xs font-bold text-emerald-300 cursor-pointer">
                            🔔 Send updated result notification to subscribers
                          </label>
                        </div>
                        {editNotifyUsers && (
                          <input
                            type="text"
                            value={editCustomNotificationText}
                            onChange={(e) => setEditCustomNotificationText(e.target.value)}
                            placeholder="Optional custom message note"
                            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs text-white focus:border-emerald-500 outline-none"
                          />
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          type="submit"
                          className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 font-bold text-xs sm:text-sm text-white shadow transition-all cursor-pointer"
                        >
                          💾 Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditMode(false);
                            setEditNotifyUsers(false);
                            setEditCustomNotificationText("");
                          }}
                          className="px-5 py-2.5 rounded-full bg-gray-800 hover:bg-gray-700 font-semibold text-xs sm:text-sm text-gray-300 transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>

                      {editStatus && (
                        <div className="p-2.5 bg-emerald-950/70 border border-emerald-800/70 rounded-xl text-emerald-300 text-xs font-semibold">
                          {editStatus}
                        </div>
                      )}
                    </form>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-8 text-gray-500 text-center text-sm">
                  Select any match result from the left table to inspect or edit details.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
