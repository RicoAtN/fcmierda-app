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
];

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
  const [attendance, setAttendance] = useState<Record<string, string>>(
    Object.fromEntries(players.map((name) => [name, "unknown"]))
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
          location: data.location || "Alexandria 66 Rotterdam",
          competition: data.competition || "",
          note: data.note || "",
        });

        setAttendance(
          data.attendance
            ? Object.fromEntries(players.map((name) => [name, data.attendance[name] || "unknown"]))
            : Object.fromEntries(players.map((name) => [name, "unknown"]))
        );
      })
      .catch(() => {
        // ignore fetch errors silently
      });
  }, []);

  // Save attendance only
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
      await fetch("/api/next-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, attendance, timestamp }),
      });
      setStatus("Saved! Your availability has been recorded.");
      setTimeout(() => router.push("/fixtures#next-game"), 900);
    } catch (err) {
      setStatus("Failed to save. Try again.");
    }
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
                {players.map((name) => (
                  <div
                    key={name}
                    className="flex items-center justify-between gap-2 bg-gray-800 rounded px-2 py-1"
                  >
                    <span className="font-medium text-white w-28 sm:w-32 truncate">{renderPlayerName(name)}</span>
                    <select
                      value={attendance[name]}
                      onChange={(e) => setAttendance({ ...attendance, [name]: e.target.value })}
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