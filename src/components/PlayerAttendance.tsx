"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type UiPlayer = { key: string; name: string; number?: string };
type Substitute = { name: string; status: string };

export default function PlayerAttendance() {
  const router = useRouter();

  const [form, setForm] = useState({
    date: "",
    kickoff: "",
    opponent: "",
    location: "Alexandria 66 Rotterdam",
    competition: "",
    note: "",
  });
  const [playersData, setPlayersData] = useState<UiPlayer[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [subs, setSubs] = useState<Substitute[]>([{ name: "", status: "unknown" }]);
  const [status, setStatus] = useState("");

  // normalize keys like "#12 John Doe" => "John Doe"
  function normalizeKey(k: string) {
    return String(k || "").replace(/^#\d+\s*/, "").trim();
  }

  function extractNumber(n?: number | string, name?: string) {
    if (n !== undefined && n !== null && `${n}`.trim() !== "") return `${n}`;
    const m = name?.match(/^\s*#?(\d+)\b/);
    return m ? m[1] : undefined;
  }

  function stripLeadingNumber(name: string) {
    return name.replace(/^\s*#?\d+\.?\s*/, "").trim();
  }

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
      return next.length ? ensureTrailingEmptyRow([...next]) : [{ name: "", status: "unknown" }];
    });
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Players from Neon (main_player = true)
        const resStats = await fetch("/api/player-statistics", { cache: "no-store" });
        const { data } = await resStats.json();
        const mains = (data || []).filter((p: any) => p?.main_player === true);
        console.table(
          mains.map((p: any) => ({
            player_name: p?.player_name,
            player_number: p?.player_number,
          }))
        );
        const fetchedPlayers: UiPlayer[] = mains
          .map((p: any) => {
            const rawName = String(p?.player_name ?? "");
            const name = stripLeadingNumber(rawName);
            const number = extractNumber(p?.player_number, rawName);
            return { key: name, name, number };
          })
          .filter((p: UiPlayer) => p.name.length);

        if (cancelled) return;
        setPlayersData(fetchedPlayers);

        // Hydrate attendance from next-game
        const resNext = await fetch("/api/next-game", { cache: "no-store" });
        const dataNext = await resNext.json();
        if (cancelled) return;

        setForm({
          date: dataNext.date || "",
          kickoff: dataNext.kickoff || "",
          opponent: dataNext.opponent || "",
          location: dataNext.location || "Alexandria 66 Rotterdam",
          competition: dataNext.competition || "",
          note: dataNext.note || "",
        });

        const incoming = (dataNext.attendance || {}) as Record<string, string>;
        const normalizedIncoming: Record<string, string> = Object.fromEntries(
          Object.entries(incoming).map(([k, v]) => [normalizeKey(k), String(v || "unknown")])
        );

        const initialAttendance = Object.fromEntries(
          fetchedPlayers.map((p) => [p.key, normalizedIncoming[p.key] ?? "unknown"])
        );
        setAttendance(initialAttendance);

        const knownNames = new Set(fetchedPlayers.map((p) => p.key));
        const incomingSubs = Object.entries(normalizedIncoming)
          .filter(([k]) => !knownNames.has(k))
          .map(([name, status]) => ({ name, status }));
        const initialSubs = incomingSubs.length ? incomingSubs : [{ name: "", status: "unknown" }];
        setSubs(ensureTrailingEmptyRow([...initialSubs]));
      } catch {
        // ignore fetch errors
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Saving...");

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

    // Europe/Amsterdam timestamp
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
        body: JSON.stringify({ ...form, attendance: mergedAttendance, timestamp }),
      });
      setStatus("Saved! Your availability has been recorded.");
      setTimeout(() => router.push("/fixtures#next-game"), 900);
    } catch {
      setStatus("Failed to save. Try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div>
        <h3 className="text-lg font-semibold mb-3">Players</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {playersData.map((p) => (
            <div
              key={p.key}
              className="flex items-center justify-between gap-2 bg-gray-800 rounded px-2 py-1"
            >
              <span className="font-medium text-white w-28 sm:w-32 truncate">
                {p.number ? (
                  <span className="font-bold text-yellow-400">#{p.number}.</span>
                ) : null}{" "}
                {p.name}
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
  );
}