"use client";
import { useState, useEffect } from "react";
import { Roboto_Slab, Montserrat } from "next/font/google";
import Menu from "@/components/Menu";
import Footer from "@/components/Footer";
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
  "#2 Jochem",
  "#30 Sami",
  "#15 Flavio",
];

// parse into objects: { raw, number, name, key }
// key is the internal identifier (name-only) used for attendance state and API payload
const playersData = players.map((raw) => {
  const m = raw.match(/^(#\d+)\s*(.*)$/);
  const number = m ? m[1] : "";
  const name = m ? m[2] : raw;
  // key normalised to name (keeps punctuation/emoji) but trimmed
  const key = name.trim();
  return { raw, number, name, key };
});

// Add a small type for substitutes
type Substitute = { name: string; status: string };

export default function NextGameDetailsPage() {
  const [form, setForm] = useState({
    date: "",
    kickoff: "",
    opponent: "",
    location: "Alexandria 66 Rotterdam",
    competition: "",
    note: "",
  });
  const [status, setStatus] = useState("");
  // attendance keyed by cleaned name (playersData[].key) — numbers removed from keys
  const [attendance, setAttendance] = useState<Record<string, string>>(
    Object.fromEntries(playersData.map((p) => [p.key, "unknown"]))
  );
  const router = useRouter();

  // substitutes (at least one empty row)
  const [subs, setSubs] = useState<Substitute[]>([{ name: "", status: "unknown" }]);

  useEffect(() => {
    fetch("/api/next-game")
      .then((res) => res.json())
      .then((data) => {
        setForm({
          date: data.date || "",
          kickoff: data.kickoff || "",
          opponent: data.opponent || "",
          location: data.location || "Alexandria 66 Rotterdam",
          competition: data.competition || "",
          note: data.note || "",
        });

        // support both old keyed-by-raw and new keyed-by-name attendance payloads
        const incoming = data.attendance || {};
        setAttendance(
          Object.fromEntries(
            playersData.map((p) => [
              p.key,
              // prefer name-keyed payload, fall back to raw-keyed legacy payload
              incoming[p.key] ?? incoming[p.raw] ?? "unknown",
            ])
          )
        );

        // derive substitutes = any keys not belonging to known players
        const knownKeys = new Set<string>([
          ...playersData.map((p) => p.key),
          ...playersData.map((p) => p.raw),
        ]);
        const incomingSubs: Substitute[] = Object.entries(incoming)
          .filter(([k]) => !knownKeys.has(k))
          .map(([name, status]) => ({ name, status: String(status || "unknown") }));

        // ensure an extra empty row if the last loaded one is filled
        const initialSubs =
          incomingSubs.length ? incomingSubs : [{ name: "", status: "unknown" }];
        setSubs(ensureTrailingEmptyRow([...initialSubs]));
      })
      .catch(() => {
        // ignore fetch errors silently
      });
  }, []);

  // ensure there is always an empty row at the end when last row is filled
  function ensureTrailingEmptyRow(next: Substitute[]) {
    const last = next[next.length - 1];
    const lastFilled =
      (last?.name?.trim()?.length ?? 0) > 0 ||
      (last?.status && last.status !== "unknown");
    if (lastFilled) next.push({ name: "", status: "unknown" });
    return next;
  }

  function updateSub(i: number, patch: Partial<Substitute>) {
    setSubs((prev) => {
      const next = prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s));
      return ensureTrailingEmptyRow([...next]);
    });
  }

  function removeSub(i: number) {
    setSubs((prev) => {
      const next = prev.filter((_, idx) => idx !== i);
      const ensured = next.length ? ensureTrailingEmptyRow([...next]) : [{ name: "", status: "unknown" }];
      return ensured;
    });
  }

  // Save attendance (players + substitutes merged)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Saving...");

    // Get timestamp in Europe/Amsterdam
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
      // keep only rows that have a name or a non-unknown status
      const cleanedSubs = subs
        .filter(
          (s) =>
            (s.name?.trim()?.length ?? 0) > 0 ||
            (s.status && s.status !== "unknown")
        )
        .map((s) => ({ name: s.name.trim(), status: s.status || "unknown" }));

      const mergedAttendance: Record<string, string> = { ...attendance };
      for (const s of cleanedSubs) {
        if (s.name) mergedAttendance[s.name] = s.status;
      }

      await fetch("/api/next-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, attendance: mergedAttendance, timestamp }),
      });
      setStatus("Saved! Your availability has been recorded.");
      setTimeout(() => router.push("/fixtures#next-game"), 900);
    } catch {
      setStatus("Failed to save. Try again.");
    }
  };

  function renderPlayerNameObj(p: { number: string; name: string; raw: string }) {
    if (p.number) {
      return (
        <>
          <span className="font-bold text-yellow-400">{p.number} </span>
          {p.name}
        </>
      );
    }
    return p.name;
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
              textShadow: `0 0 4px #0b3d1a, 0 2px 0 #0b3d1a, 0 1px 0 #fff`,
              color: "#fff",
              textTransform: "uppercase",
            }}
          >
            Availability
          </h1>
          <p
            className={`text-lg sm:text-xl text-white font-medium mb-8 drop-shadow-lg ${montserrat.className}`}
            style={{ maxWidth: 700 }}
          >
            Please mark your availability for the upcoming match. 
          </p>
          <button
            type="button"
            onClick={() => router.push("/fixtures#next-game")}
            className="bg-gray-700 hover:bg-gray-800 text-white px-6 py-3 rounded-md font-bold text-lg shadow transition-all duration-150 border border-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 mt-4"
          >
            Back to fixtures page
          </button>
        </div>
      </section>

      <section className="w-full flex flex-col items-center gap-12 py-12 px-4 bg-gray-800">
        <div className="max-w-2xl w-full rounded-2xl p-6 sm:p-10 text-white bg-gray-900 shadow-xl mx-auto" id="player-availability">
          <h2 className={`text-xl sm:text-2xl font-bold mb-4 text-center ${robotoSlab.className}`}>
            Submit your availability
          </h2>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-400">Date</div>
              <div className="mt-1 p-3 rounded bg-gray-800 border border-gray-700 text-white font-medium text-center">
                {form.date || "-"}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-400">Kick-off</div>
              <div className="mt-1 p-3 rounded bg-gray-800 border border-gray-700 text-white font-medium text-center">
                {form.kickoff || "-"}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-400">Opponent</div>
              <div className="mt-1 p-3 rounded bg-gray-800 border border-gray-700 text-white font-medium text-center truncate">
                {form.opponent || "-"}
              </div>
            </div>
          </div>

          <h3 className="text-lg font-semibold mb-3">Player Attendance (editable)</h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div id="player-availability">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {playersData.map((p) => (
                  <div
                    key={p.raw}
                    className="flex items-center justify-between gap-2 bg-gray-800 rounded px-2 py-1"
                  >
                    <span className="font-medium text-white w-28 sm:w-32 truncate">
                      {renderPlayerNameObj(p)}
                    </span>
                    <select
                      value={attendance[p.key] ?? "unknown"}
                      onChange={(e) => setAttendance({ ...attendance, [p.key]: e.target.value })}
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

            {/* Substitutes section */}
            <div className="pt-6 border-t border-gray-700">
              <h3 className="text-lg font-semibold mb-3">Substitutes</h3>
              <div className="space-y-2">
                {subs.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-800 rounded px-2 py-2">
                    <input
                      type="text"
                      value={s.name}
                      onChange={(e) => updateSub(i, { name: e.target.value })}
                      placeholder="Substitute name"
                      className="flex-1 p-2 rounded bg-gray-900 border border-gray-600 text-white"
                    />
                    <select
                      value={s.status ?? "unknown"}
                      onChange={(e) => updateSub(i, { status: e.target.value })}
                      className="p-2 rounded bg-gray-900 border border-gray-600 text-white min-w-[140px]"
                    >
                      <option value="unknown">⚪ Unknown</option>
                      <option value="present">🟢 Present</option>
                      <option value="absent">🔴 Absent</option>
                      <option value="not sure">🟠 Not sure</option>
                      <option value="supporter">🔵 Supporter</option>
                    </select>
                    {subs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSub(i)}
                        className="px-2 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white"
                        aria-label="Remove substitute"
                        title="Remove"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-700 flex items-center gap-3">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-semibold text-base shadow transition-all duration-150 border border-green-700 focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                Save my availability
              </button>
              <div className="text-green-400">{status}</div>
            </div>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
}