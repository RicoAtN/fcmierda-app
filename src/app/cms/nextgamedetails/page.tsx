"use client";
import { useEffect, useState } from "react";
import { Roboto_Slab, Montserrat } from "next/font/google";
import Menu from "@/components/Menu";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";
import PlayerAttendance from "@/components/PlayerAttendance"; // ADD

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

type CompetitionRow = { competition_id: string; competition_name: string; opponents: string[] };

export default function NextGameDetailsPage() {
  const [latestCompetition, setLatestCompetition] = useState<CompetitionRow | null>(null);
  const [competitions, setCompetitions] = useState<CompetitionRow[]>([]);
  const [form, setForm] = useState({
    opponent: "",
    competition: "",
    location: "",
    date: "",
    kickoff: "",
    note: "",
  });
  const [status, setStatus] = useState("");
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

  const currentOpponents = latestCompetition?.opponents ?? [];
  const currentOpponentsUnique = Array.from(
    new Set(currentOpponents.map((n) => n.trim()).filter(Boolean))
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

    try {
      const res = await fetch("/api/next-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Only game details here; PlayerAttendance handles availability separately
        body: JSON.stringify({ ...form, timestamp }),
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

  function handleClear() {
    setForm({ date: "", kickoff: "", opponent: "", location: "", competition: "", note: "" });
    setStatus("");
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center bg-gray-900">
      <Menu />
      <section
        className="w-full flex justify-center items-center py-10 px-4 bg-gray-900"
        style={{ background: "linear-gradient(135deg, #232526 0%, #414345 100%)" }}
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
          <h2 className={`text-xl sm:text-2xl font-bold mb-4 ${robotoSlab.className}`}>Next Game Details</h2>
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
              Click "Clear all fields" to reset the form when you want to add a completely new next game. This will empty all inputs. After clearing, fill in the new match details and press "Save Next Game".
            </p>
          </div>

          {/* Admin form: game meta only */}
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
                {currentOpponentsUnique.map((name, idx) => (
                  <option key={`${name}-${idx}`} value={name}>{name}</option>
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
              <select
                name="competition"
                value={form.competition}
                onChange={handleChange}
                className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white"
                required
              >
                <option value="">{competitions.length > 0 ? "Select competition" : "Loading..."}</option>
                {competitions.map((comp, idx) => (
                  <option key={`${comp.competition_id}-${idx}`} value={comp.competition_name}>
                    {comp.competition_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Note</label>
              <textarea
                name="note"
                value={form.note}
                onChange={handleChange}
                className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white"
                placeholder="e.g. Get ready for the next challenge! FC Mierda faces FC Rotterdam United in what promises to be an exciting match. Come support us and don't miss the action!"
                rows={3}
              />
            </div>

            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-10 py-2 rounded-md font-semibold text-base shadow transition-all duration-150 border border-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 min-w-[200px]"
            >
              Save Next Game
            </button>
            <div className="mt-2 text-green-400">{status}</div>
          </form>

          {/* PlayerAttendance replaces the old player availability UI */}
          <div className="mt-10 text-left">
            <PlayerAttendance />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}