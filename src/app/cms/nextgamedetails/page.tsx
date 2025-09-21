"use client";
import { useState, useEffect } from "react";
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

export default function NextGameDetailsPage() {
  const [form, setForm] = useState({
    date: "",
    kickoff: "",
    opponent: "",
    location: "Alexandria 66 voetbalclub, Rotterdam",
    competition: "",
    note: "",
  });
  const [status, setStatus] = useState("");
  const [attendance, setAttendance] = useState<Record<string, string>>(
    Object.fromEntries(players.map((name) => [name, "unknown"]))
  );
  const [extraPlayers, setExtraPlayers] = useState<{ name: string; status: string }[]>(
    [{ name: "", status: "unknown" }]
  );

  const router = useRouter();

  useEffect(() => {
    fetch("/api/next-game")
      .then((res) => res.json())
      .then((data) => {
        setForm({
          date: data.date || "",
          kickoff: data.kickoff || "",
          opponent: data.opponent || "",
          location: "Alexandria 66 voetbalclub, Rotterdam",
          competition: data.competition || "",
          note: data.note || "",
        });

        setAttendance(
          data.attendance
            ? Object.fromEntries(
                players.map((name) => [name, data.attendance[name] || "unknown"])
              )
            : Object.fromEntries(players.map((name) => [name, "unknown"]))
        );

        if (data.attendance) {
          const extra = Object.entries(data.attendance)
            .filter(([name]) => !players.includes(name))
            .map(([name, status]) => ({ name, status: String(status) }));
          setExtraPlayers(
            extra.length > 0
              ? [...extra, { name: "", status: "unknown" }]
              : [{ name: "", status: "unknown" }]
          );
        } else {
          setExtraPlayers([{ name: "", status: "unknown" }]);
        }
      });
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

    await fetch("/api/next-game", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, attendance: fullAttendance, timestamp }),
    });
    setStatus("Saved! The fixtures page now shows your update.");
  };

  function renderPlayerName(name: string) {
    const match = name.match(/^(#\d+\s+)/);
    if (match) {
      return (
        <>
          <span className="font-bold text-yellow-400">{match[1]}</span>
          {name.slice(match[1].length)}
        </>
      );
    }
    return name;
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
              >
                <option value="">Select opponent</option>
                <option value="ABC-Positief">ABC-Positief</option>
                <option value="Alexandria '66 team Rutjes">Alexandria '66 team Rutjes</option>
                <option value="FC Degradatiekandidaten">FC Degradatiekandidaten</option>
                <option value="Maghreb United">Maghreb United</option>
                <option value="NO GAME">NO GAME</option>
                <option value="Ramnous Rotterdam">Ramnous Rotterdam</option>
                <option value="Spartans">Spartans</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Location</label>
              <div className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white font-semibold">
                Alexandria 66 voetbalclub, Rotterdam
              </div>
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
                <option value="">Select competition</option>
                <option value="Powerleague 7vs7 division 1">Powerleague 7vs7 division 1 - September 2025</option>
                <option value="Powerleague 7vs7 division 2">Powerleague 7vs7 division 2 - July 2025</option>
              </select>
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
                {players.map((name) => (
                  <div
                    key={name}
                    className="flex items-center justify-between gap-2 bg-gray-800 rounded px-2 py-1"
                  >
                    <span className="font-medium text-white w-24 sm:w-32 truncate">{renderPlayerName(name)}</span>
                    <select
                      value={attendance[name]}
                      onChange={(e) =>
                        setAttendance({ ...attendance, [name]: e.target.value })
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
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-10 py-2 rounded-md font-semibold text-base shadow transition-all duration-150 border border-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 min-w-[200px]"
            >
              Save Next Game
            </button>
            <div className="mt-2 text-green-400">{status}</div>
          </form>
        </div>
      </section>
      {/* Footer */}
      <Footer />
    </div>
  );
}