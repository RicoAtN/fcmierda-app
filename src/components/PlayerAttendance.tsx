"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Roboto_Slab } from "next/font/google";
import AvailabilityPushModal from "@/components/AvailabilityPushModal";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700", "800"] });

type UiPlayer = { key: string; name: string; number?: string };
type Substitute = { name: string; status: string };

interface PlayerAttendanceProps {
  onGameDataLoaded?: (game: { date: string; kickoff: string; opponent: string }) => void;
}

function getStatusSelectBorder(status?: string) {
  switch (status) {
    case "present":
      return "border-emerald-500/60 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.15)]";
    case "not sure":
      return "border-amber-500/60 text-amber-300";
    case "absent":
      return "border-rose-500/60 text-rose-300";
    case "supporter":
    case "coach":
      return "border-blue-500/60 text-blue-300";
    default:
      return "border-gray-700/80 text-gray-300 hover:border-gray-600";
  }
}

export default function PlayerAttendance({ onGameDataLoaded }: PlayerAttendanceProps) {
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
  const [knownSubs, setKnownSubs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [showPushModal, setShowPushModal] = useState(false);

  // Helper to check if user is already subscribed to push notifications (non-blocking)
  async function checkIsSubscribed(): Promise<boolean> {
    if (typeof window === "undefined") return false;

    // 1. Browser Notification permission granted
    if ("Notification" in window && Notification.permission === "granted") {
      return true;
    }

    // 2. Local storage v2 subscription flag
    if (localStorage.getItem("fcmierda_push_v2_subscribed") === "true") {
      return true;
    }

    // 3. Active service worker push subscription (use getRegistration to avoid hanging ready promise)
    if ("serviceWorker" in navigator) {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager?.getSubscription();
        if (sub) {
          localStorage.setItem("fcmierda_push_v2_subscribed", "true");
          return true;
        }
      } catch {
        // ignore
      }
    }

    return false;
  }

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

  // Hydrate from session storage immediately on initial mount (0ms instant render)
  useEffect(() => {
    try {
      const cachedPlayers = sessionStorage.getItem("fcmierda_players_cache");
      const cachedSubs = sessionStorage.getItem("fcmierda_known_subs_cache");
      const cachedNextGame = sessionStorage.getItem("fcmierda_nextgame_cache");
      const cachedAttendance = sessionStorage.getItem("fcmierda_attendance_cache");

      if (cachedPlayers) {
        const parsedPlayers = JSON.parse(cachedPlayers);
        if (Array.isArray(parsedPlayers) && parsedPlayers.length > 0) {
          setPlayersData(parsedPlayers);
          setIsLoading(false);
        }
      }
      if (cachedSubs) {
        const parsedSubs = JSON.parse(cachedSubs);
        if (Array.isArray(parsedSubs)) setKnownSubs(parsedSubs);
      }
      if (cachedNextGame) {
        const parsedNextGame = JSON.parse(cachedNextGame);
        if (parsedNextGame) {
          setForm(parsedNextGame);
          onGameDataLoaded?.({
            date: parsedNextGame.date || "",
            kickoff: parsedNextGame.kickoff || "",
            opponent: parsedNextGame.opponent || "",
          });
        }
      }
      if (cachedAttendance) {
        const parsedAtt = JSON.parse(cachedAttendance);
        if (parsedAtt) setAttendance(parsedAtt);
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch latest players and next game in parallel with stale-while-revalidate
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        // Parallel requests cut load time in half
        const [resStats, resNext] = await Promise.all([
          fetch(`/api/player-statistics?_t=${Date.now()}`, { cache: "no-store" }),
          fetch(`/api/next-game?_t=${Date.now()}`, { cache: "no-store" }),
        ]);

        const { data: rawStats } = await resStats.json();
        const dataNext = await resNext.json();

        if (!isMounted) return;

        // Process Players
        const mains = (rawStats || []).filter((p: any) => p?.main_player === true);
        const nonMains = (rawStats || []).filter((p: any) => p?.main_player !== true);

        const fetchedPlayers: UiPlayer[] = mains
          .map((p: any) => {
            const rawName = String(p?.player_name ?? "");
            const name = stripLeadingNumber(rawName);
            const number = extractNumber(p?.player_number, rawName);
            return { key: name, name, number };
          })
          .filter((p: UiPlayer) => p.name.length);

        setPlayersData(fetchedPlayers);

        const fetchedSubs = nonMains
          .map((p: any) => stripLeadingNumber(String(p?.player_name ?? "")))
          .filter((name: string) => name.length > 0);
        setKnownSubs(fetchedSubs);

        // Process Next Game
        const nextGameData = {
          date: dataNext?.date || "",
          kickoff: dataNext?.kickoff || "",
          opponent: dataNext?.opponent || "",
          location: dataNext?.location || "Alexandria 66 Rotterdam",
          competition: dataNext?.competition || "",
          note: dataNext?.note || "",
        };

        setForm(nextGameData);
        onGameDataLoaded?.({
          date: nextGameData.date,
          kickoff: nextGameData.kickoff,
          opponent: nextGameData.opponent,
        });

        const incoming = (dataNext?.attendance || {}) as Record<string, string>;
        const normalizedIncoming: Record<string, string> = Object.fromEntries(
          Object.entries(incoming).map(([k, v]) => [normalizeKey(k), String(v || "unknown")])
        );

        // Merge fetched players with existing attendance
        const initialAttendance = { ...normalizedIncoming };
        fetchedPlayers.forEach((p) => {
          if (!initialAttendance[p.key]) initialAttendance[p.key] = "unknown";
        });
        setAttendance(initialAttendance);

        // Hydrate substitutes from attendance data for players not in the main squad
        const mainPlayerKeys = new Set(fetchedPlayers.map((p) => p.key));
        const loadedSubs: Substitute[] = Object.entries(normalizedIncoming)
          .filter(([name, status]) => !mainPlayerKeys.has(name) && status !== "unknown")
          .map(([name, status]) => ({ name, status }));

        setSubs(
          ensureTrailingEmptyRow(loadedSubs.length > 0 ? loadedSubs : [{ name: "", status: "unknown" }])
        );

        // Save fresh data into session cache for future instant loads
        try {
          sessionStorage.setItem("fcmierda_players_cache", JSON.stringify(fetchedPlayers));
          sessionStorage.setItem("fcmierda_known_subs_cache", JSON.stringify(fetchedSubs));
          sessionStorage.setItem("fcmierda_nextgame_cache", JSON.stringify(nextGameData));
          sessionStorage.setItem("fcmierda_attendance_cache", JSON.stringify(initialAttendance));
        } catch {
          // ignore
        }
      } catch (e: any) {
        console.error("Failed to load player attendance data", e);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    setStatus("Saving...");

    const cleanedSubs = subs
      .filter(
        (s) =>
          (s.name?.trim()?.length ?? 0) > 0 ||
          (s.status && s.status !== "unknown")
      )
      .map((s) => ({ name: s.name.trim(), status: s.status || "unknown" }));

    const mainPlayerKeys = new Set(playersData.map((p) => p.key));
    const mergedAttendance: Record<string, string> = {};

    for (const [key, val] of Object.entries(attendance)) {
      if (mainPlayerKeys.has(key)) {
        mergedAttendance[key] = val;
      }
    }

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
      const res = await fetch("/api/next-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, attendance: mergedAttendance, timestamp }),
      });

      if (!res.ok) {
        throw new Error("Failed to save availability");
      }

      setStatus("✓ Availability successfully saved!");

      // Update local session cache with newest attendance
      try {
        sessionStorage.setItem("fcmierda_attendance_cache", JSON.stringify(mergedAttendance));
      } catch {
        // ignore
      }

      const isSubscribed = await checkIsSubscribed();
      if (isSubscribed) {
        setTimeout(() => router.push("/fixtures#next-game"), 400);
      } else {
        // Show push notification call-to-action modal
        setShowPushModal(true);
        setIsSaving(false);
      }
    } catch {
      setStatus("Failed to save. Please try again.");
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base sm:text-lg font-bold text-white">Players</h3>
          <span
            className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40"
            title="Exempted from login for now"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            No login required
          </span>
        </div>
        <p className="text-xs text-gray-400 mb-2.5">
          Please update your own status. Changes are saved for the entire team.
        </p>

        {isLoading && playersData.length === 0 ? (
          /* Sleek Skeleton Loading Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
            {Array.from({ length: 14 }).map((_, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 bg-gray-900 border border-gray-800 rounded-lg p-2 animate-pulse"
              >
                <div className="h-4 bg-gray-700/60 rounded w-28 sm:w-32"></div>
                <div className="h-7 bg-gray-700/80 rounded w-[100px] sm:w-[120px]"></div>
              </div>
            ))}
          </div>
        ) : (
          /* Players Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
            {playersData.map((p) => (
              <div
                key={p.key}
                className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  {p.number ? (
                    <span className="font-mono font-bold text-xs text-amber-400 shrink-0">
                      #{p.number}.
                    </span>
                  ) : null}
                  <span className="font-medium text-gray-100 text-xs sm:text-sm truncate">
                    {p.name}
                  </span>
                </div>
                <select
                  value={attendance[p.key] ?? "unknown"}
                  onChange={(e) => setAttendance({ ...attendance, [p.key]: e.target.value })}
                  className={`py-1 px-2 rounded bg-black/80 border text-xs sm:text-sm font-medium outline-none transition-colors cursor-pointer min-w-[105px] sm:min-w-[120px] shrink-0 ${getStatusSelectBorder(
                    attendance[p.key]
                  )}`}
                >
                  <option value="unknown" className="bg-gray-950 text-gray-300">⚪ Unknown</option>
                  <option value="present" className="bg-gray-950 text-emerald-300">🟢 Present</option>
                  <option value="not sure" className="bg-gray-950 text-amber-300">🟠 Not sure</option>
                  <option value="absent" className="bg-gray-950 text-rose-300">🔴 Absent</option>
                  <option value="supporter" className="bg-gray-950 text-blue-300">🔵 Supporter</option>
                  <option value="coach" className="bg-gray-950 text-cyan-300">🧢 Coach</option>
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Substitutes Section */}
      <div className="pt-4 border-t border-gray-800">
        <h3 className="text-sm sm:text-base font-bold text-white mb-1">Substitutes</h3>
        <p className="text-xs text-gray-400 mb-2">
          Add any guest players or substitutes joining for this match.
        </p>

        <datalist id="known-subs-list">
          {knownSubs.map((name, idx) => (
            <option key={idx} value={name} />
          ))}
        </datalist>

        <div className="space-y-1.5 sm:space-y-2">
          {subs.map((s, i) => (
            <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg bg-gray-900 border border-gray-800">
              <input
                type="text"
                list="known-subs-list"
                value={s.name}
                onChange={(e) => updateSub(i, { name: e.target.value })}
                placeholder="Substitute name"
                className="flex-1 py-1 px-2 rounded bg-black/80 border border-gray-700 focus:border-emerald-400 text-white text-xs sm:text-sm outline-none placeholder:text-gray-500"
              />
              <select
                value={s.status ?? "unknown"}
                onChange={(e) => updateSub(i, { status: e.target.value })}
                className={`py-1 px-2 rounded bg-black/80 border text-xs sm:text-sm font-medium outline-none transition-colors cursor-pointer min-w-[105px] sm:min-w-[120px] shrink-0 ${getStatusSelectBorder(
                  s.status
                )}`}
              >
                <option value="unknown" className="bg-gray-950 text-gray-300">⚪ Unknown</option>
                <option value="present" className="bg-gray-950 text-emerald-300">🟢 Present</option>
                <option value="not sure" className="bg-gray-950 text-amber-300">🟠 Not sure</option>
                <option value="absent" className="bg-gray-950 text-rose-300">🔴 Absent</option>
                <option value="supporter" className="bg-gray-950 text-blue-300">🔵 Supporter</option>
              </select>
              {subs.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSub(i)}
                  className="px-2 py-1 rounded bg-rose-950/40 border border-rose-500/30 text-rose-300 hover:bg-rose-900/60 text-xs font-bold shrink-0 transition-colors"
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

      {/* Submit Action Button & Status Bar */}
      <div className="pt-3 border-t border-gray-800 flex flex-col sm:flex-row items-center gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="group inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:translate-y-0 text-white font-bold text-sm px-6 py-2.5 rounded-full shadow-md shadow-emerald-600/20 hover:-translate-y-0.5 transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white shrink-0" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Saving...</span>
            </>
          ) : (
            <span>Save availability</span>
          )}
        </button>

        {status && (
          <div
            className={`text-xs sm:text-sm font-semibold ${
              status.includes("Failed") ? "text-rose-400" : "text-emerald-400"
            }`}
          >
            {status}
          </div>
        )}
      </div>

      <AvailabilityPushModal
        isOpen={showPushModal}
        onClose={() => {
          setShowPushModal(false);
          router.push("/fixtures#next-game");
        }}
      />
    </form>
  );
}