"use client";
import { useEffect, useState } from "react";
import { Roboto_Slab, Montserrat } from "next/font/google";
import Menu from "@/components/Menu";
import Footer from "@/components/Footer";
import SubscriberStatsBadge from "@/components/SubscriberStatsBadge";
import { useRouter } from "next/navigation";

import DatabaseUnavailableNotice from "@/components/DatabaseUnavailableNotice";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "600"] });

const players = [
  "#1 Alon",
  "#12 Victor",
  "#88 Rico",
  "#32 Kevin",
  "#26 Pim S🥸",
  "#69 Mitchell",
  "#57 Mart",
  "#14 Niek",
  "#10 Jordy",
  "#19 Lennert",
  "#22 Ka",
  "#23 Sven",
  "#9 Pim",
  "#6 Bouwhuis",
  "#7 Daan",
  "#20 Sud",
  "#11Frank",
  "#00 Boudewijn",
  "#63 Hans",
  "#5 Tim",
  "#2 Jochem",
  "#30 Sami",
  "#15 Flavio",
];

// parse into objects: { raw, number, name, key } — key is normalized name (no number)
const playersData = players.map((raw) => {
  const m = raw.match(/^(#\d+)\s*(.*)$/);
  const number = m ? m[1] : "";
  const name = m ? m[2] : raw;
  const key = name.trim();
  return { raw, number, name, key };
});

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

type CompetitionRow = { competition_id: string; competition_name: string; opponents: string[]; league_link?: string | null };

export default function NextGameDetailsPage() {
  const [latestCompetition, setLatestCompetition] = useState<CompetitionRow | null>(null);
  const [competitions, setCompetitions] = useState<CompetitionRow[]>([]);
  const [dbError, setDbError] = useState(false);
  const [form, setForm] = useState({
    opponent: "",
    competition: "",
    location: "",
    date: "",
    kickoff: "",
    note: "",
  });
  const [status, setStatus] = useState("");
  const [currentAttendance, setCurrentAttendance] = useState<Record<string, string>>({});
  const [toBeAnnounced, setToBeAnnounced] = useState(false);
  const [resetAttendance, setResetAttendance] = useState(false);
  const [notifyUsers, setNotifyUsers] = useState(false);
  const [customNotificationText, setCustomNotificationText] = useState("");
  const [locationBeforeEdit, setLocationBeforeEdit] = useState("");
  const [isLocationEditable, setIsLocationEditable] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/next-game")
      .then((res) => res.json())
      .then((data) => {
        if (data?.dbUnavailable) {
          setDbError(true);
        }
        setCurrentAttendance(data.attendance || {});
        setForm({
          date: data.date || "",
          kickoff: data.kickoff || "",
          opponent: data.opponent === "To be announced soon" ? "" : (data.opponent || ""),
          location: data.location || "Alexandria 66 Rotterdam",
          competition: data.competition || "",
          note: data.note || "",
        });
        setToBeAnnounced(data.opponent === "To be announced soon");
      })
      .catch((e) => {
        console.warn("Failed to fetch next game:", e);
        setDbError(true);
      });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/competition", { cache: "no-store" });
        const json = await res.json();
        if (res.ok && Array.isArray(json.data)) {
          setCompetitions(json.data);
        } else {
          console.error("Failed to load competitions:", json?.error);
        }
      } catch (e) {
        console.error("Load all competitions failed:", e);
      }
    })();
  }, []);

  useEffect(() => {
    if (form.competition && competitions.length > 0) {
      const selectedComp = competitions.find(c => c.competition_name === form.competition);
      setLatestCompetition(selectedComp || null);
    } else if (competitions.length > 0) {
      const latest = competitions[0];
      setLatestCompetition(latest);
      setForm(prev => ({ ...prev, competition: latest.competition_name }));
    }
  }, [form.competition, competitions]);

  const currentOpponents: string[] = latestCompetition?.opponents ?? [];
  const currentOpponentsUnique: string[] = Array.from(
    new Set(currentOpponents.map((n: string) => n.trim()).filter(Boolean))
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("Saving...");

    // Timestamp in Europe/Amsterdam
    const now = new Date();
    const amsTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Amsterdam" }));
    const hour = amsTime.getHours().toString().padStart(2, "0");
    const minute = amsTime.getMinutes().toString().padStart(2, "0");
    const day = amsTime.toLocaleString("en-US", { weekday: "short", timeZone: "Europe/Amsterdam" });
    const date = amsTime.getDate().toString().padStart(2, "0");
    const month = (amsTime.getMonth() + 1).toString().padStart(2, "0");
    const year = amsTime.getFullYear();
    const timestamp = `${hour}:${minute} ${day} ${date}-${month}-${year}`;

    let finalAttendance = currentAttendance;
    if (resetAttendance) {
      finalAttendance = Object.fromEntries(playersData.map((p) => [p.key, "unknown"]));
    }

    const finalOpponent = toBeAnnounced ? "To be announced soon" : form.opponent;

    try {
      const res = await fetch("/api/next-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Only game details here; PlayerAttendance handles availability separately
        body: JSON.stringify({ ...form, opponent: finalOpponent, attendance: finalAttendance, timestamp }),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);

      if (notifyUsers) {
        setStatus("Saved match! Sending notifications to subscribers...");
        const formattedDayMonth = formatDayMonth(form.date);
        const autoTitle = `Next match update - against ${finalOpponent}`;
        const schedulePrefix = `${formattedDayMonth ? formattedDayMonth : "Match schedule"}${form.kickoff ? ` at ${form.kickoff}` : ""}.`;
        const defaultSuffix = "Check out the latest match details and player availability!";
        const fullNotificationBody = customNotificationText.trim()
          ? `${schedulePrefix} ${customNotificationText.trim()}`
          : `${schedulePrefix} ${defaultSuffix}`;

        try {
          const notifyRes = await fetch("/api/push/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "next_game",
              title: autoTitle,
              body: fullNotificationBody,
              nextGameData: {
                opponent: finalOpponent,
                date: form.date,
                kickoff: form.kickoff,
                note: form.note,
                competition: form.competition,
              },
            }),
          });
          const notifyData = await notifyRes.json();
          if (notifyData?.sent && notifyData.sent > 0) {
            setStatus(`Saved! Notifications sent to ${notifyData.sent} subscribers.`);
          } else {
            setStatus("Saved! The fixtures page now shows your update.");
          }
        } catch (pushErr) {
          console.error("Failed to dispatch push notifications:", pushErr);
          setStatus("Saved match details! (Push notifications could not be sent).");
        }
      } else {
        setStatus("Saved! The fixtures page now shows your update.");
      }

      setTimeout(() => router.push("/fixtures#next-game"), 1400);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to save. Try again.";
      setStatus(message);
    }
  };

  function handleClear() {
    setForm((prev) => ({
      date: "",
      kickoff: "",
      opponent: "",
      location: prev.location,
      competition: competitions.length > 0 ? competitions[0].competition_name : prev.competition,
      note: "",
    }));
  setToBeAnnounced(false);
    setStatus("");
    setCurrentAttendance({});
    setResetAttendance(true);
  }

  return (
    <div className={`relative min-h-screen flex flex-col items-center bg-gray-900 text-white overflow-x-hidden ${montserrat.className}`}>
      <Menu />

      <main className="w-full flex-1 flex flex-col items-center pt-24 sm:pt-36 pb-16 px-4 sm:px-6">
        <div className="max-w-3xl w-full mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/cms")}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gray-900/90 hover:bg-gray-800 border border-gray-700 text-xs sm:text-sm font-semibold text-gray-200 hover:text-emerald-300 transition-all shadow-sm cursor-pointer"
          >
            <span>←</span>
            <span>Back to CMS</span>
          </button>
          <span className="text-xs text-gray-400 font-medium hidden sm:inline-block">Match Operations & Schedule</span>
        </div>

        <div className="max-w-3xl w-full rounded-2xl p-6 sm:p-10 text-white bg-gray-950/85 border border-gray-800 shadow-2xl backdrop-blur-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-2xl mb-3 shadow-inner">
              📅
            </div>
            <h1 className={`text-2xl sm:text-3xl font-black tracking-tight text-white ${robotoSlab.className}`}>
              Next Game Details
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-gray-400 max-w-lg mx-auto">
              Configure upcoming fixture details, opponent, kickoff time, and push broadcast alerts for supporters.
            </p>
          </div>

          {dbError && (
            <div className="mb-6">
              <DatabaseUnavailableNotice
                title="Fixture Database Restricted"
                description="Database connection is currently restricted or in quota cooldown. Live opponent data and changes cannot be saved until connection is restored."
              />
            </div>
          )}

          {/* Action Tools Header */}
          <div className="mb-6 p-4 rounded-xl bg-gray-900/80 border border-gray-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <p className="text-xs text-gray-300 font-medium text-center sm:text-left">
                Starting a new fixture round? Clear existing fields before filling new match details.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="px-3.5 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-800/80 text-red-300 hover:text-white font-semibold text-xs transition-all cursor-pointer whitespace-nowrap"
            >
              🧹 Clear All Fields
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-700 bg-black/60 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Kick-off Time
                </label>
                <select
                  name="kickoff"
                  value={form.kickoff}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-700 bg-black/60 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition-all cursor-pointer"
                  required
                >
                  <option value="">Select kickoff time</option>
                  <option value="18:30">18:30</option>
                  <option value="19:30">19:30</option>
                  <option value="20:30">20:30</option>
                  <option value="21:30">21:30</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Opponent
              </label>
              <select
                name="opponent"
                value={form.opponent}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-700 bg-black/60 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition-all cursor-pointer"
                required={!toBeAnnounced}
                disabled={!latestCompetition || toBeAnnounced}
              >
                <option value="">
                  {toBeAnnounced
                    ? "To be announced soon"
                    : latestCompetition
                    ? "Select opponent"
                    : "Competition unavailable"}
                </option>
                {currentOpponentsUnique.map((name, idx) => (
                  <option key={`${name}-${idx}`} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Unknown opponent checkbox */}
            <div className="p-3.5 bg-gray-900/60 border border-gray-800 rounded-xl flex items-start gap-3">
              <input
                type="checkbox"
                id="toBeAnnounced"
                checked={toBeAnnounced}
                onChange={(e) => setToBeAnnounced(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-emerald-600 bg-black border-gray-700 rounded focus:ring-emerald-500 cursor-pointer accent-emerald-500"
              />
              <div>
                <label htmlFor="toBeAnnounced" className="text-xs sm:text-sm font-semibold text-gray-200 cursor-pointer select-none">
                  Opponent is not yet scheduled / To Be Announced
                </label>
                <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
                  Check this box if the next matchup is pending official league schedule announcements.
                </p>
              </div>
            </div>

            {/* Location */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="location" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Location
                </label>
                {!isLocationEditable ? (
                  <button
                    type="button"
                    onClick={() => {
                      setLocationBeforeEdit(form.location);
                      setIsLocationEditable(true);
                    }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                  >
                    ✏️ Edit Location
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, location: "Alexandria 66 Rotterdam" }))}
                      className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                    >
                      Reset Default
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, location: locationBeforeEdit }));
                        setIsLocationEditable(false);
                      }}
                      className="text-xs text-gray-400 hover:text-gray-200 font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              <input
                type="text"
                id="location"
                name="location"
                value={form.location}
                onChange={handleChange}
                readOnly={!isLocationEditable}
                disabled={!isLocationEditable}
                className={`w-full rounded-xl border border-gray-700 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition-all ${
                  isLocationEditable ? "bg-black/80" : "bg-gray-900/70 text-gray-300"
                }`}
              />
            </div>

            {/* Competition Selection */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Competition
              </label>
              <select
                name="competition"
                value={form.competition}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-700 bg-black/60 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition-all cursor-pointer"
                required
              >
                <option value="">{competitions.length > 0 ? "Select competition" : "Loading..."}</option>
                {competitions.map((comp, idx) => (
                  <option key={`${comp.competition_id}-${idx}`} value={comp.competition_name}>
                    {comp.competition_name}
                  </option>
                ))}
              </select>
              {latestCompetition?.league_link ? (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 rounded-lg p-2.5">
                  <span className="font-semibold">🔗 Official Portal Link:</span>
                  <a
                    href={latestCompetition.league_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-emerald-300 truncate max-w-sm"
                  >
                    {latestCompetition.league_link}
                  </a>
                </div>
              ) : (
                <p className="mt-1 text-[11px] text-gray-400">
                  No organiser portal link configured for this competition. You can configure one in{" "}
                  <a href="/cms/competition" className="text-emerald-400 underline hover:text-emerald-300">
                    Competitions CMS
                  </a>.
                </p>
              )}
            </div>

            {/* Match Note */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Matchday Note & Motivation
              </label>
              <textarea
                name="note"
                value={form.note}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-700 bg-black/60 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition-all"
                placeholder="e.g. Big showdown! FC Mierda takes the pitch against our local rivals. Arrive early for warmup!"
                rows={3}
              />
            </div>

            {/* Reset Availability Checkbox */}
            <div className="p-3.5 bg-gray-900/60 border border-gray-800 rounded-xl flex items-start gap-3">
              <input
                type="checkbox"
                id="resetAttendance"
                checked={resetAttendance}
                onChange={(e) => setResetAttendance(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-emerald-600 bg-black border-gray-700 rounded focus:ring-emerald-500 cursor-pointer accent-emerald-500"
              />
              <div>
                <label htmlFor="resetAttendance" className="text-xs sm:text-sm font-semibold text-gray-200 cursor-pointer select-none">
                  Reset player availability statuses to "unknown"
                </label>
                <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
                  Select this for a new fixture so players can re-confirm their attendance.
                </p>
              </div>
            </div>

            {/* Push Notification Broadcast Card */}
            <div className="p-4 sm:p-5 bg-gradient-to-b from-gray-900/90 to-gray-950 border border-emerald-800/40 rounded-2xl shadow-lg space-y-3.5">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="notifyUsers"
                  checked={notifyUsers}
                  onChange={(e) => setNotifyUsers(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-emerald-600 bg-black border-gray-700 rounded focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                />
                <div className="flex-1">
                  <label htmlFor="notifyUsers" className="text-xs sm:text-sm font-bold text-emerald-300 cursor-pointer select-none flex items-center gap-1.5">
                    <span>🔔</span> Broadcast Push Notification to Supporters & Squad
                  </label>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Automatically triggers real-time web push notifications across Android, iOS & Desktop devices.
                  </p>
                </div>
              </div>

              {/* Subscriber Audience Count */}
              <div className="pt-1">
                <SubscriberStatsBadge theme="green" />
              </div>

              {notifyUsers && (
                <div className="mt-3 p-4 bg-black/60 border border-gray-800 rounded-xl space-y-3 text-xs sm:text-sm">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>📲</span> Live Push Notification Preview
                  </div>
                  <div className="p-3.5 bg-gray-900/90 rounded-xl border border-gray-800 space-y-1">
                    <div className="font-bold text-emerald-400 text-xs sm:text-sm">
                      📢 Next match update - against {toBeAnnounced ? "To be announced soon" : (form.opponent || "our next opponent")}
                    </div>
                    <div className="text-gray-300 text-xs leading-relaxed">
                      <span className="font-semibold text-emerald-300">
                        {formatDayMonth(form.date) || "Match schedule"}{form.kickoff ? ` at ${form.kickoff}` : ""}.
                      </span>{" "}
                      {customNotificationText.trim() || "Check out the latest match details and player availability!"}
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
                      placeholder="e.g. Bring both green & black kits! Be at the pitch 30 mins before kickoff."
                      className="w-full rounded-xl border border-gray-700 bg-black/80 px-3.5 py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none"
                    />
                    <p className="mt-1 text-[11px] text-gray-400">
                      The match date & time (<span className="text-emerald-300 font-semibold">{formatDayMonth(form.date) || "Date"}{form.kickoff ? ` at ${form.kickoff}` : ""}</span>) is always pinned to the beginning.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Save Button and Status */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 font-bold text-sm text-white shadow-lg shadow-emerald-600/25 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
              >
                💾 Save Next Game
              </button>
              {status && (
                <div className="text-xs sm:text-sm font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-3.5 py-2 rounded-xl">
                  {status}
                </div>
              )}
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}