"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AvailabilityPushModal from "@/components/AvailabilityPushModal";

type UiPlayer = { key: string; name: string; number?: string };
type Substitute = { name: string; status: string };

interface PlayerAttendanceProps {
  onGameDataLoaded?: (game: { date: string; kickoff: string; opponent: string }) => void;
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

      setStatus("Saved! Availability has been recorded.");

      // Update local session cache with newest attendance
      try {
        sessionStorage.setItem("fcmierda_attendance_cache", JSON.stringify(mergedAttendance));
      } catch {
        // ignore
      }

      const isSubscribed = await checkIsSubscribed();
      if (isSubscribed) {
        setTimeout(() => router.push("/fixtures#next-game"), 350);
      } else {
        // Show push notification call-to-action modal
        setShowPushModal(true);
        setIsSaving(false);
      }
    } catch {
      setStatus("Failed to save. Try again.");
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-semibold">Players</h3>
          <span
            className="text-[10px] sm:text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20"
            title="Exempted from login for now"
          >
            No login required
          </span>
        </div>
        <p className="text-xs text-gray-400 mb-3">
          Please update your own status. Changes are saved for the entire team.
        </p>

        {isLoading && playersData.length === 0 ? (
          /* Sleek Skeleton Loading Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Array.from({ length: 14 }).map((_, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 bg-gray-800/60 rounded px-2 py-2 animate-pulse"
              >
                <div className="h-4 bg-gray-700 rounded w-28 sm:w-32"></div>
                <div className="h-8 bg-gray-700/80 rounded w-[100px] sm:w-[120px]"></div>
              </div>
            ))}
          </div>
        ) : (
          /* Players Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {playersData.map((p) => (
              <div
                key={p.key}
                className="flex items-center justify-between gap-2 bg-gray-800 rounded px-2 py-1.5 transition-colors hover:bg-gray-750"
              >
                <span className="font-medium text-white w-28 sm:w-32 truncate text-sm sm:text-base">
                  {p.number ? (
                    <span className="font-bold text-yellow-400">#{p.number}.</span>
                  ) : null}{" "}
                  {p.name}
                </span>
                <select
                  value={attendance[p.key] ?? "unknown"}
                  onChange={(e) => setAttendance({ ...attendance, [p.key]: e.target.value })}
                  className="p-1.5 rounded bg-gray-900 border border-gray-600 text-white min-w-[100px] sm:min-w-[120px] text-xs sm:text-sm focus:border-green-500 focus:outline-none transition-colors"
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
        )}
      </div>

      <div className="pt-6 border-t border-gray-700">
        <h3 className="text-lg font-semibold mb-3">Substitutes</h3>
        <datalist id="known-subs-list">
          {knownSubs.map((name, idx) => (
            <option key={idx} value={name} />
          ))}
        </datalist>
        <div className="space-y-2">
          {subs.map((s, i) => (
            <div key={i} className="flex items-center gap-2 bg-gray-800 rounded px-2 py-2">
              <input
                type="text"
                list="known-subs-list"
                value={s.name}
                onChange={(e) => updateSub(i, { name: e.target.value })}
                placeholder="Substitute name"
                className="flex-1 p-2 rounded bg-gray-900 border border-gray-600 text-white text-sm focus:border-green-500 focus:outline-none"
              />
              <select
                value={s.status ?? "unknown"}
                onChange={(e) => updateSub(i, { status: e.target.value })}
                className="p-2 rounded bg-gray-900 border border-gray-600 text-white min-w-[120px] sm:min-w-[140px] text-xs sm:text-sm focus:border-green-500 focus:outline-none"
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
                  className="px-2.5 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm transition-colors"
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

      <div className="pt-4 border-t border-gray-700 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-md font-semibold text-base shadow transition-all duration-150 border border-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Saving availability...</span>
            </>
          ) : (
            <span>Save availability</span>
          )}
        </button>
        {status && (
          <div className={`text-sm font-medium ${status.includes("Failed") ? "text-red-400" : "text-green-400"}`}>
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