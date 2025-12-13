"use client";
import { useEffect, useState } from "react";
import { Roboto_Slab, Montserrat } from "next/font/google";
import Menu from "@/components/Menu";
import Footer from "@/components/Footer"; // Add this import at the top
import { useRouter } from "next/navigation";

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
  "#00 Frank",
  "#00 Boudewijn",
  "#63 Hans",
  "#5 Tim",
];

// parse into objects: { raw, number, name, key } — key is normalized name (no number)
const playersData = players.map((raw) => {
  const m = raw.match(/^(#\d+)\s*(.*)$/);
  const number = m ? m[1] : "";
  const name = m ? m[2] : raw;
  const key = name.trim();
  return { raw, number, name, key };
});

type CompetitionRow = { competition_id: string; competition_name: string; opponents: string[] };

export default function NextGameDetailsPage() {
  const [latestCompetition, setLatestCompetition] = useState<CompetitionRow | null>(null);
  const [form, setForm] = useState({
    opponent: "",
    competition: "",
    location: "",
    date: "",
    kickoff: "",
    note: "",
  });
  const [status, setStatus] = useState("");
  // attendance keyed by normalized name (playersData[].key)
  const [attendance, setAttendance] = useState<Record<string, string>>(
    Object.fromEntries(playersData.map((p) => [p.key, "unknown"]))
  );
  const [extraPlayers, setExtraPlayers] = useState<{ name: string; status: string }[]>([{ name: "", status: "unknown" }]);
  // const [showClearInfo, setShowClearInfo] = useState(false);

  const router = useRouter();

  useEffect(() => {
    fetch("/api/next-game")
      .then((res) => res.json())
      .then((data) => {
        setForm({
          date: data.date || "",
          kickoff: data.kickoff || "",
          opponent: data.opponent || "",
          location: "Alexandria 66 Rotterdam",
          competition: data.competition || "",
          note: data.note || "",
        });

        const incoming = data.attendance || {};

        // Map known players by normalized key (fallback to legacy raw key if present)
        setAttendance(
          Object.fromEntries(
            playersData.map((p) => [
              p.key,
              incoming[p.key] ?? incoming[p.raw] ?? "unknown",
            ])
          )
        );

        // Unknown names in attendance -> extra players (substitutes)
        const knownKeys = new Set<string>([
          ...playersData.map((p) => p.key),
          ...playersData.map((p) => p.raw),
        ]);

        const extra = Object.entries(incoming)
          .filter(([name]) => !knownKeys.has(name))
          .map(([name, status]) => ({ name, status: String(status) }));

        setExtraPlayers(
          extra.length > 0
            ? [...extra, { name: "", status: "unknown" }]
            : [{ name: "", status: "unknown" }]
        );
      });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/competition", { cache: "no-store" });
        const json = await res.json();
        if (res.ok && json.data) {
          const c = json.data as CompetitionRow;
          setLatestCompetition(c);
          setForm(prev => ({
            ...prev,
            competition: c.competition_name,
            location: prev.location || "Alexandria 66 Rotterdam",
          }));
        } else {
          console.error("Failed to load competition:", json?.error);
        }
      } catch (e) {
        console.error("Load latest competition failed:", e);
      }
    })();
  }, []);

  const currentOpponents = latestCompetition?.opponents ?? [];

  // Fix: strongly type change events (inputs, textarea, selects)
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Fix: strongly type form submit event
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("Saving...");

    const extraAttendance = Object.fromEntries(
      extraPlayers
        .filter((p) => p.name.trim() !== "")
        .map((p) => [p.name.trim(), p.status])
    );
    const fullAttendance = { ...attendance, ...extraAttendance };

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

    try {
      const res = await fetch("/api/next-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, attendance: fullAttendance, timestamp }),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      setStatus("Saved! The fixtures page now shows your update.");
      setTimeout(() => router.push("/fixtures#next-game"), 1200);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to save. Try again.";
      setStatus(message);
    }
  };

  // clear all fields and reset attendance to "unknown"
  function handleClear() {
    setForm({ date: "", kickoff: "", opponent: "", location: "", competition: "", note: "" });
    setAttendance(Object.fromEntries(playersData.map((p) => [p.key, "unknown"])));
    setExtraPlayers([{ name: "", status: "unknown" }]);
    setStatus("");
  }

  // helper to render number in yellow and name after it
  function renderPlayerNameObj(p: { number: string; name: string }) {
    return p.number ? (
      <>
        <span className="font-bold text-yellow-400">{p.number} </span>
        {p.name}
      </>
    ) : (
      p.name
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center bg-gray-900">
      <Menu />
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
            Next Game Details
          </h1>
          <p
            className={`text-lg sm:text-xl text-white font-medium mb-8 drop-shadow-lg ${montserrat.className}`}
            style={{ maxWidth: 600 }}
          >
            Update the next game details and attendance below. This information will be shown on the Fixtures page.
          </p>
          <button
            type="button"
            onClick={() => router.push("/cms")}
            className="bg-gray-700 hover:bg-gray-800 text-white px-6 py-3 rounded-md font-bold text-lg shadow transition-all duration-150 border border-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 mt-4"
          >
            Back to CMS
          </button>
        </div>
      </section>
      <section className="w-full flex flex-col items-center gap-12 py-12 px-4 bg-gray-800">
        <div className="max-w-2xl w-full rounded-2xl p-6 sm:p-10 text-white text-center bg-gray-900 shadow-xl mx-auto">
          <h2 className={`text-xl sm:text-2xl font-bold mb-4 ${robotoSlab.className}`}>
            Next Game Details
          </h2>
          <div className="mb-4 flex flex-col items-center">
            <div>
              <button
                type="button"
                onClick={handleClear}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-semibold text-sm shadow transition-all duration-150 border border-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                Clear all fields
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-300 max-w-xl text-center">
              Click "Clear all fields" to reset the form when you want to add a completely new next game. This will empty all inputs and reset player attendance to "unknown". After clearing, fill in the new match details and press "Save Next Game".
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="block font-semibold mb-1">Date</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white"
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Kick-off</label>
              <select
                name="kickoff"
                value={form.kickoff}
                onChange={handleChange}
                className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white"
                required
              >
                <option value="">Select a time</option>
                <option value="18:30">18:30</option>
                <option value="19:30">19:30</option>
                <option value="20:30">20:30</option>
                <option value="21:30">21:30</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Opponent</label>
              <select
                name="opponent"
                value={form.opponent}
                onChange={handleChange}
                className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white"
                required
                disabled={!latestCompetition}
              >
                <option value="">{latestCompetition ? "Select opponent" : "Competition unavailable"}</option>
                {currentOpponents.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Location</label>
              <input
                type="text"
                name="location"
                value={form.location}
                readOnly
                disabled
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Competition</label>
              <input
                type="text"
                name="competition"
                value={form.competition}
                readOnly
                disabled
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Note</label>
              <textarea
                name="note"
                value={form.note}
                onChange={handleChange}
                className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white"
                placeholder="e.g. Get ready for the next challenge! FC Mierda faces FC Rotterdam United in what promises to be an exciting match. Come support us and don&apos;t miss the action!"
                rows={3}
              />
            </div>
            <div id="player-availability">
              <label className="block font-semibold mb-1">Player Attendance</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {playersData.map((p) => (
                  <div
                    key={p.raw}
                    className="flex items-center justify-between gap-2 bg-gray-800 rounded px-2 py-1"
                  >
                    <span className="font-medium text-white w-24 sm:w-32 truncate">
                      {renderPlayerNameObj(p)}
                    </span>
                    <select
                      value={attendance[p.key] ?? "unknown"}
                      onChange={(e) =>
                        setAttendance({ ...attendance, [p.key]: e.target.value })
                      }
                      className="p-1 rounded bg-gray-900 border border-gray-600 text-white min-w-[90px] sm:min-w-[120px]"
                    >
                      <option value="unknown">⚪ Unknown</option>
                      <option value="absent">🔴 Absent</option>
                      <option value="present">🟢 Present</option>
                      <option value="not sure">🟠 Not sure</option>
                      <option value="supporter">🔵 Supporter</option>
                      <option value="coach">🔵 Coach</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <label className="block font-semibold mb-1">Add Additional Players (reserves)</label>
              {extraPlayers.map((player, idx) => (
                <div key={idx} className="flex items-center gap-2 mb-2">
                  {extraPlayers.length > 1 && idx < extraPlayers.length - 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const filtered = extraPlayers.filter((_, i) => i !== idx);
                        setExtraPlayers(
                          filtered.length === 0
                            ? [{ name: "", status: "absent" }]
                            : filtered
                        );
                      }}
                      className="text-red-400 hover:text-red-600 font-extrabold text-2xl flex items-center justify-center px-2"
                      title="Remove this player"
                      style={{ lineHeight: 1 }}
                    >
                      &times;
                    </button>
                  )}
                  <input
                    type="text"
                    placeholder="Add player name"
                    value={player.name}
                    onChange={e => {
                      const updated = [...extraPlayers];
                      updated[idx].name = e.target.value;
                      setExtraPlayers(updated);

                      if (idx === extraPlayers.length - 1 && e.target.value.trim() !== "") {
                        setExtraPlayers([...updated, { name: "", status: "absent" }]);
                      }
                    }}
                    className="p-1 rounded bg-gray-800 border border-gray-600 text-white flex-1"
                  />
                  <select
                    value={player.status}
                    onChange={e => {
                      const updated = [...extraPlayers];
                      updated[idx].status = e.target.value;
                      setExtraPlayers(updated);
                    }}
                    className="p-1 rounded bg-gray-900 border border-gray-600 text-white min-w-[90px] sm:min-w-[120px]"
                  >
                    <option value="absent">🔴 Absent</option>
                    <option value="present">🟢 Present</option>
                    <option value="not sure">🟠 Not sure</option>
                    <option value="supporter">🔵 Supporter</option>
                    <option value="coach">🔵 Coach</option>
                  </select>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() =>
                  setForm(prev => ({
                    ...prev,
                    opponent: "",
                    // keep read-only fields intact
                    competition: prev.competition,
                    location: prev.location,
                    date: "",
                    kickoff: "",
                    note: "",
                  }))
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 active:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 transition-shadow shadow-md"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Reset</span>
              </button>

              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 transition-shadow shadow-lg shadow-blue-600/30"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                <span>Save</span>
              </button>
            </div>
            <div className="mt-2 text-green-400">{status}</div>
          </form>
        </div>
      </section>
      {/* Footer */}
      <Footer />
    </div>
  );
}