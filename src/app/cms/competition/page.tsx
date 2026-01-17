"use client";
import Menu from "@/components/Menu";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";

type CompetitionOverviewRow = {
  id: string;
  organisation: string | null;
  division: string | null;
  competition_name: string;
  total_teams: number | null;
  start_period: string | null;
  end_period: string | null;
  football_type: string | null;
  fcmierda_final_rank: number | null;
  competition_champion: string | null;
  opponents: string[] | null;
};

// Remove the first N words from a string (default: 2)
function removeFirstWords(input: string | null, count = 2) {
  if (!input) return "-";
  const words = input.trim().split(/\s+/);
  const result = words.slice(Math.min(count, words.length)).join(" ").trim();
  return result || "-";
}

// Format date string to "Month Year" (e.g., "October 2025")
function formatMonthYear(dateStr: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr; // fallback to raw if not a valid date
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// Status pill for current competition when final rank is missing
function FinalRankCell({ rank }: { rank: number | null }) {
  if (rank == null) {
    return <span className="value-text">-</span>;
  }
  return <span className="value-text">{rank}</span>;
}

// Highlight row when champion contains "FC Mierda"
function isFcMierdaChampion(champion: string | null) {
  return !!champion && champion.toLowerCase().includes("fc mierda");
}

// Champion cell with status badge when FC Mierda is mentioned or ongoing
function ChampionCell({ champion, ongoing }: { champion: string | null; ongoing: boolean }) {
  if (ongoing) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-600/20 text-teal-300 border border-teal-500/40 text-[11px] font-semibold">
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="12" r="8" />
        </svg>
        ONGOING COMPETITION
      </span>
    );
  }

  const isFc = isFcMierdaChampion(champion);
  if (isFc) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-600/20 text-yellow-300 border border-yellow-500/40 text-[11px] font-semibold">
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M5 17h14l-2-7-3 3-3-5-3 5-3-3-2 7z" />
        </svg>
        FC MIERDA
      </span>
    );
  }
  return <span className="value-text">{champion || "-"}</span>;
}

export default function CompetitionCMSPage() {
  const [rows, setRows] = useState<CompetitionOverviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  // NEW: selection + form state
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [form, setForm] = useState<CompetitionOverviewRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/competition", { cache: "no-store" });
        const json = await res.json();
        if (res.ok && Array.isArray(json.data)) {
          setRows(json.data);
        } else {
          console.error("Load competitions failed:", json?.error);
        }
      } catch (e) {
        console.error("Fetch competitions error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // NEW: load details from selected row (no API call)
  async function handleSelect(row: CompetitionOverviewRow) {
    setLoadingDetails(true);
    try {
      const key = row.id ?? encodeURIComponent(row.competition_name);
      const res = await fetch(`/api/competition/${key}`, { cache: "no-store" });
      const json = await res.json();
      const src: CompetitionOverviewRow = res.ok && json?.data ? json.data : row;
      const formData = {
        id: src.id,
        organisation: src.organisation, // canonical from DB
        division: src.division,
        competition_name: src.competition_name,
        total_teams: src.total_teams,
        start_period: src.start_period,
        end_period: src.end_period,
        football_type: src.football_type,
        fcmierda_final_rank: src.fcmierda_final_rank,
        competition_champion: src.competition_champion,
        opponents: Array.isArray(src.opponents) ? src.opponents.filter(Boolean) : [],
      };
      setForm(formData);
    } finally {
      setLoadingDetails(false);
    }
  }

  // NEW: save updates
  async function handleSave() {
    if (!form) return;
    setSaving(true);
    setSaveError(null);
    try {
      const key = form.id ?? encodeURIComponent(form.competition_name);
      const res = await fetch(`/api/competition/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          total_teams: form.total_teams ?? null,
          fcmierda_final_rank: form.fcmierda_final_rank ?? null,
          opponents: form.opponents ?? [],
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.data) throw new Error(json?.error || "Save failed");

      // Refetch canonical record to ensure organisation matches Neon
      const ref = await fetch(`/api/competition/${json.data.id ?? encodeURIComponent(json.data.competition_name)}`, {
        cache: "no-store",
      });
      const refJson = await ref.json();
      const canonical: CompetitionOverviewRow = ref.ok && refJson?.data ? refJson.data : json.data;

      setForm({
        ...canonical,
        opponents: Array.isArray(canonical.opponents) ? canonical.opponents : [],
      });

      setRows((prev) =>
        prev.map((r) =>
          (r.id && canonical.id ? r.id === canonical.id : r.competition_name === canonical.competition_name)
            ? {
                ...r,
                organisation: canonical.organisation, // keep in sync
                competition_name: canonical.competition_name,
                end_period: canonical.end_period,
                fcmierda_final_rank: canonical.fcmierda_final_rank,
                competition_champion: canonical.competition_champion,
              }
            : r
        )
      );
    } catch (e: any) {
      setSaveError(e.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  // Opponents handlers
  function handleOpponentChange(idx: number, value: string) {
    if (!form) return;
    const current = Array.isArray(form.opponents) ? [...form.opponents] : [];
    if (idx < current.length) {
      current[idx] = value;
    } else if (value.trim()) {
      current.push(value.trim());
    }
    const next = current.filter((s) => s !== "");
    setForm({ ...form, opponents: next });
  }

  function handleOpponentRemove(idx: number) {
    if (!form) return;
    const current = Array.isArray(form.opponents) ? [...form.opponents] : [];
    current.splice(idx, 1);
    setForm({ ...form, opponents: current });
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center bg-gray-900">
      <Menu />

      {/* Intro section */}
      <section className="w-full flex justify-center items-center py-12 px-4 bg-gray-900">
        <div className="max-w-2xl w-full flex flex-col items-center text-center mt-16 sm:mt-28">
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-4 text-white uppercase tracking-wider">
            Competitions
          </h1>
          <p className="text-white/80 text-lg sm:text-xl">
            Manage competition rounds: overview and creation.
          </p>
        </div>
      </section>

      {/* Main content */}
      <section className="w-full flex flex-col items-center gap-12 py-12 px-4 bg-gray-800">
        {/* Competitions overview */}
        <div className="max-w-4xl w-full rounded-2xl p-6 sm:p-10 text-white bg-gray-900 shadow-xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Competitions overview</h2>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="responsive-table min-w-full border border-gray-700 rounded-lg">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-2 border-b border-gray-700">Competition</th>
                  <th className="px-4 py-2 border-b border-gray-700">End period</th>
                  <th className="px-4 py-2 border-b border-gray-700 text-center">FC Mierda rank</th>
                  <th className="px-4 py-2 border-b border-gray-700 text-center">Champion</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-4 py-3 text-white/60 text-center" colSpan={4}>
                      Loading...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-3 text-white/60 text-center" colSpan={4}>
                      No competitions found
                    </td>
                  </tr>
                ) : (
                  rows.map((r, idx) => {
                    const highlight = isFcMierdaChampion(r.competition_champion);
                    const compLabel = removeFirstWords(r.competition_name);
                    return (
                      <tr
                        key={r.id ?? idx}
                        onClick={() => handleSelect(r)}
                        className={`transition cursor-pointer ${
                          highlight ? "bg-yellow-900/20 font-bold" : "hover:bg-gray-800/60"
                        }`}
                        title="Click to edit"
                      >
                        <td data-label="Competition" className="px-4 py-2 border-b border-gray-800">
                          <span className="min-w-0 flex-1 truncate text-right sm:text-left max-w-[18ch] sm:max-w-[40ch]" title={compLabel}>
                            {compLabel}
                          </span>
                        </td>
                        <td data-label="End period" className="px-4 py-2 border-b border-gray-800">
                          {formatMonthYear(r.end_period)}
                        </td>
                        <td data-label="FC Mierda rank" className="px-4 py-2 border-b border-gray-800 text-center">
                          <FinalRankCell rank={r.fcmierda_final_rank} />
                        </td>
                        <td data-label="Champion" className="px-4 py-2 border-b border-gray-800 text-center">
                          <ChampionCell champion={r.competition_champion} ongoing={r.fcmierda_final_rank == null} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            <style jsx>{`
              @media (max-width: 639px) {
                .responsive-table {
                  border: none;
                  border-radius: 0;
                  text-align: left;
                }
                .responsive-table thead {
                  display: none;
                }
                .responsive-table tbody,
                .responsive-table tr {
                  display: block;
                  width: 100%;
                }
                .responsive-table tr {
                  border: 1px solid #374151;
                  border-radius: 0.5rem;
                  margin-bottom: 1rem;
                  overflow: hidden;
                }
                .responsive-table tr:last-child {
                  margin-bottom: 0;
                }
                .responsive-table td {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  padding: 0.5rem 1rem;
                }
                .responsive-table td:last-child {
                  border-bottom: 0;
                }
                .responsive-table td::before {
                  font-weight: 700;
                  color: #9CA3AF;
                  text-align: left;
                  white-space: nowrap;
                  font-size: 0.75rem;
                  text-transform: uppercase;
                  flex-shrink: 0;
                  margin-right: 0.75rem;
                  content: attr(data-label) ":";
                }
              }
            `}</style>
          </div>
        </div>

        {/* NEW: selected record editor */}
        <div className="max-w-4xl w-full rounded-2xl p-6 sm:p-10 text-white bg-gray-900 shadow-xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Selected competition</h2>

          {loadingDetails && <p className="text-white/60">Loading details...</p>}

          {!form && !loadingDetails && (
            <p className="text-white/60">Select a row above to edit its details.</p>
          )}

          {form && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-1">Organisation</label>
                  <input
                    className="w-full rounded-md bg-gray-800 border border-gray-700 px-3 py-2"
                    value={form.organisation ?? ""}
                    onChange={(e) => setForm({ ...form, organisation: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">Division</label>
                  <input
                    className="w-full rounded-md bg-gray-800 border border-gray-700 px-3 py-2"
                    value={form.division ?? ""}
                    onChange={(e) => setForm({ ...form, division: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">Competition name</label>
                  <input
                    className="w-full rounded-md bg-gray-800 border border-gray-700 px-3 py-2"
                    value={form.competition_name}
                    onChange={(e) => setForm({ ...form, competition_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">Total teams</label>
                  <input
                    type="number"
                    className="w-full rounded-md bg-gray-800 border border-gray-700 px-3 py-2"
                    value={form.total_teams ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, total_teams: e.target.value ? Number(e.target.value) : null })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">Start period</label>
                  <input
                    type="date"
                    className="w-full rounded-md bg-gray-800 border border-gray-700 px-3 py-2"
                    value={(form.start_period ?? "").slice(0, 10)}
                    onChange={(e) => setForm({ ...form, start_period: e.target.value || null })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">End period</label>
                  <input
                    type="date"
                    className="w-full rounded-md bg-gray-800 border border-gray-700 px-3 py-2"
                    value={(form.end_period ?? "").slice(0, 10)}
                    onChange={(e) => setForm({ ...form, end_period: e.target.value || null })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">Football type</label>
                  <input
                    className="w-full rounded-md bg-gray-800 border border-gray-700 px-3 py-2"
                    value={form.football_type ?? ""}
                    onChange={(e) => setForm({ ...form, football_type: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">FC Mierda final rank</label>
                  <input
                    type="number"
                    className="w-full rounded-md bg-gray-800 border border-gray-700 px-3 py-2"
                    value={form.fcmierda_final_rank ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        fcmierda_final_rank: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">Competition champion</label>
                  <input
                    className="w-full rounded-md bg-gray-800 border border-gray-700 px-3 py-2"
                    value={form.competition_champion ?? ""}
                    onChange={(e) => setForm({ ...form, competition_champion: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm text-white/70 mb-1">Opponents</label>
                  <div className="space-y-2">
                    {(Array.isArray(form.opponents) ? [...form.opponents] : []).concat("").map((val, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          className="flex-1 rounded-md bg-gray-800 border border-gray-700 px-3 py-2"
                          placeholder="Add opponent..."
                          value={val}
                          onChange={(e) => handleOpponentChange(idx, e.target.value)}
                        />
                        {idx < (form.opponents?.length ?? 0) && (
                          <button
                            type="button"
                            className="px-2 py-2 rounded-md bg-red-600/80 hover:bg-red-600 text-sm"
                            onClick={() => handleOpponentRemove(idx)}
                            aria-label="Remove opponent"
                            title="Remove opponent"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <p className="text-xs text-white/50">Fill the empty field to add a new opponent. You can remove any filled row.</p>
                  </div>
                </div>
              </div>

              {saveError && <p className="text-red-400 text-sm">{saveError}</p>}

              <div className="flex gap-3">
                <button
                  className="px-4 py-2 rounded-md bg-teal-600 hover:bg-teal-500 disabled:opacity-50"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
                <button
                  className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600"
                  onClick={() => setForm(null)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}