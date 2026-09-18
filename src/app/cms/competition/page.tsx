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
  league_link: string | null;
  opponents: string[] | null;
};

type NewCompetition = {
  organisation: string | null;
  division: number | null;
  competition_name: string;
  total_teams: number | null;
  start_period: string | null;
  end_period: string | null;
  football_type: string | null;
  fcmierda_final_rank: number | null;
  competition_champion: string | null;
  league_link: string | null;
  opponents: string[];
};
// Helper to compute default competition name
function monthName(d: Date) {
  return d.toLocaleString("en", { month: "long" });
}
function computeDefaultName(division: number | null, startIso: string | null) {
  const d = startIso ? new Date(startIso) : new Date();
  const div = division ?? 1;
  return `Powerleague 7vs7 division ${div} ${monthName(d)} ${d.getFullYear()}`;
}

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

// Champion cell: show value if present; add icon when equals "FC Mierda"; else show ongoing status
function ChampionCell({ champion }: { champion: string | null }) {
  const val = (champion ?? "").trim();
  if (val.length) {
    const isExactFcMierda = val.toLowerCase() === "fc mierda";
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="value-text">{val}</span>
        {isExactFcMierda && (
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-yellow-600/20 text-yellow-300 border border-yellow-500/40 text-[10px]"
            title="FC Mierda crowned champion"
            aria-label="Champion"
          >
            {/* Trophy icon */}
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M6 4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v2h2a1 1 0 0 1 1 1c0 3.866-3.134 7-7 7h-4c-3.866 0-7-3.134-7-7a1 1 0 0 1 1-1h2V4zm14 3h-2c0 3.314-2.686 6-6 6s-6-2.686-6-6H4c.264 2.997 2.58 5.39 5.55 5.91A5.002 5.002 0 0 0 9 15h6a5.002 5.002 0 0 0-.55-2.09C17.42 12.39 19.736 9.997 20 7zM9 17h6v2a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-2z" />
            </svg>
            CHAMPION
          </span>
        )}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-600/20 text-teal-300 border border-teal-500/40 text-[11px] font-semibold">
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <circle cx="12" cy="12" r="8" />
      </svg>
      ONGOING COMPETITION
    </span>
  );
}

export default function CompetitionCMSPage() {
  const [rows, setRows] = useState<CompetitionOverviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  // NEW: selection + form state
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [form, setForm] = useState<CompetitionOverviewRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // NEW: create competition state
  const [newOpen, setNewOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [newNameTouched, setNewNameTouched] = useState(false);
  const [newForm, setNewForm] = useState<NewCompetition>({
    organisation: "Powerleague Rotterdam",
    division: 1,
    competition_name: computeDefaultName(1, null),
    total_teams: null,
    start_period: null,
    end_period: null,
    football_type: "7vs7",
    fcmierda_final_rank: null,
    competition_champion: null,
    league_link: null,
    opponents: [],
  });

  // NEW: delete competition state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePw, setDeletePw] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const pwOk = deletePw.trim().toLowerCase() === "calippo";

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

  // NEW: load details from selected row
  async function handleSelect(row: CompetitionOverviewRow) {
    setLoadingDetails(true);
    setSaveError(null);
    setSaveSuccess(null);
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
        league_link: src.league_link ?? null,
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
    setSaveSuccess(null);
    try {
      const key = form.id ?? encodeURIComponent(form.competition_name);
      const res = await fetch(`/api/competition/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          total_teams: form.total_teams ?? null,
          fcmierda_final_rank: form.fcmierda_final_rank ?? null,
          competition_champion:
            form.competition_champion && form.competition_champion.trim().length
              ? form.competition_champion.trim()
              : null, // send null when empty
          league_link:
            form.league_link && form.league_link.trim().length
              ? form.league_link.trim()
              : null,
          opponents: form.opponents ?? [],
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.data) throw new Error(json?.error || "Save failed");

      const canonical: CompetitionOverviewRow = json.data;

      setForm({
        ...canonical,
        opponents: Array.isArray(canonical.opponents) ? canonical.opponents : [],
      });

      setRows((prev) =>
        prev.map((r) =>
          (r.id && canonical.id ? String(r.id) === String(canonical.id) : r.competition_name === canonical.competition_name)
            ? {
                ...r,
                organisation: canonical.organisation, // keep in sync
                division: canonical.division,
                competition_name: canonical.competition_name,
                total_teams: canonical.total_teams,
                start_period: canonical.start_period,
                end_period: canonical.end_period,
                football_type: canonical.football_type,
                fcmierda_final_rank: canonical.fcmierda_final_rank,
                competition_champion: canonical.competition_champion,
                league_link: canonical.league_link ?? null,
                opponents: canonical.opponents ?? [],
              }
            : r
        )
      );

      setSaveSuccess("Competition details & league link saved successfully!");
      setTimeout(() => {
        setSaveSuccess(null);
      }, 5000);
    } catch (e: any) {
      setSaveError(e.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  // NEW: create competition
  async function handleCreate() {
    setCreating(true);
    setCreateError(null);
    setCreateSuccess(null);
    try {
      const res = await fetch("/api/competition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organisation: newForm.organisation ?? null,
          division: newForm.division ?? null,
          competition_name: newForm.competition_name.trim(),
          total_teams: newForm.total_teams ?? null,
          start_period: newForm.start_period ?? null,
          end_period: newForm.end_period ?? null,
          football_type: newForm.football_type ?? null,
          fcmierda_final_rank: null, // explicitly blank
          competition_champion: null, // explicitly blank
          league_link:
            newForm.league_link && newForm.league_link.trim().length
              ? newForm.league_link.trim()
              : null,
          opponents: newForm.opponents ?? [],
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.data) throw new Error(json?.error || "Create failed");

      const created: CompetitionOverviewRow = json.data;

      // Add to overview and open it in the editor
      setRows((prev) => [created, ...prev]);
      setForm({
        id: created.id,
        organisation: created.organisation,
        division: created.division,
        competition_name: created.competition_name,
        total_teams: created.total_teams,
        start_period: created.start_period,
        end_period: created.end_period,
        football_type: created.football_type,
        fcmierda_final_rank: created.fcmierda_final_rank,
        competition_champion: created.competition_champion,
        league_link: created.league_link ?? null,
        opponents: Array.isArray(created.opponents) ? created.opponents : [],
      });

      // Reset create form and collapse
      setNewForm({
        organisation: "Powerleague Rotterdam",
        division: 1,
        competition_name: computeDefaultName(1, null),
        total_teams: null,
        start_period: null,
        end_period: null,
        football_type: "7vs7",
        fcmierda_final_rank: null,
        competition_champion: null,
        league_link: null,
        opponents: [],
      });
      setNewOpen(false);
      setSaveSuccess("New competition created successfully and loaded for editing!");
      setTimeout(() => {
        setSaveSuccess(null);
      }, 5000);
    } catch (e: any) {
      setCreateError(e.message || String(e));
    } finally {
      setCreating(false);
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

  function handleNewOpponentChange(idx: number, value: string) {
    const current = [...newForm.opponents];
    if (idx < current.length) {
      current[idx] = value;
    } else if (value.trim()) {
      current.push(value.trim());
    }
    const next = current.filter((s) => s !== "");
    setNewForm({ ...newForm, opponents: next });
  }

  function handleNewOpponentRemove(idx: number) {
    const current = [...newForm.opponents];
    current.splice(idx, 1);
    setNewForm({ ...newForm, opponents: current });
  }

  // Update helpers to auto-update name unless user edited it
  const setDivision = (val: number | null) =>
    setNewForm((prev) => {
      const next = { ...prev, division: val };
      if (!newNameTouched) next.competition_name = computeDefaultName(val, prev.start_period);
      return next;
    });
  const setStartPeriod = (iso: string | null) =>
    setNewForm((prev) => {
      const next = { ...prev, start_period: iso };
      if (!newNameTouched) next.competition_name = computeDefaultName(prev.division, iso);
      return next;
    });

  async function handleDeleteConfirm() {
    if (!form) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      const key = form.id ?? encodeURIComponent(form.competition_name);
      const res = await fetch(`/api/competition/${key}`, {
        method: "DELETE",
        headers: { "x-admin-password": deletePw },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Delete failed");

      // Remove from overview and clear selection
      setRows((prev) =>
        prev.filter((r) => (form.id ? r.id !== form.id : r.competition_name !== form.competition_name))
      );
      setForm(null);
      setDeleteOpen(false);
      setDeletePw("");
    } catch (e: any) {
      setDeleteError(e.message || String(e));
    } finally {
      setDeleting(false);
    }
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
                          <div className="flex items-center justify-end sm:justify-start gap-2">
                            <span className="min-w-0 truncate max-w-[16ch] sm:max-w-[34ch]" title={compLabel}>
                              {compLabel}
                            </span>
                            {r.league_link && (
                              <a
                                href={r.league_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="px-1.5 py-0.5 rounded bg-emerald-900/50 hover:bg-emerald-800 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold inline-flex items-center gap-1 shadow-sm"
                                title={`Open league link: ${r.league_link}`}
                              >
                                🔗 Link
                              </a>
                            )}
                          </div>
                        </td>
                        <td data-label="End period" className="px-4 py-2 border-b border-gray-800">
                          {formatMonthYear(r.end_period)}
                        </td>
                        <td data-label="FC Mierda rank" className="px-4 py-2 border-b border-gray-800 text-center">
                          <FinalRankCell rank={r.fcmierda_final_rank} />
                        </td>
                        <td data-label="Champion" className="px-4 py-2 border-b border-gray-800 text-center">
                          <ChampionCell champion={r.competition_champion} />
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
              {/* Visual Success Confirmation Banner */}
              {saveSuccess && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-950/80 border-2 border-emerald-500 text-emerald-200 text-sm font-semibold shadow-lg shadow-emerald-950/50">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center flex-shrink-0 text-emerald-400">
                    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-emerald-100 font-bold">{saveSuccess}</p>
                    {form.league_link && (
                      <p className="text-xs text-emerald-300/80 mt-0.5 font-normal">
                        Active League Link: <span className="font-mono underline">{form.league_link}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

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
                    value={form.competition_champion ?? ""} // show empty when null
                    onChange={(e) =>
                      setForm({ ...form, competition_champion: e.target.value || null }) // store null when blank
                    }
                  />
                </div>
                <div className="sm:col-span-2 p-4 rounded-xl bg-gray-800/80 border border-gray-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-white">
                      League / Organiser Link (Powerleague schedule &amp; standings URL)
                    </label>
                    {form.league_link ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Link Configured
                      </span>
                    ) : (
                      <span className="text-xs text-white/40">No link set</span>
                    )}
                  </div>
                  <div className="flex gap-2 items-center">
                    <input
                      type="url"
                      className="flex-1 rounded-md bg-gray-900 border border-gray-700 px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-teal-500"
                      placeholder="https://www.powerleague.com/..."
                      value={form.league_link ?? ""}
                      onChange={(e) => setForm({ ...form, league_link: e.target.value || null })}
                    />
                    {form.league_link && (
                      <a
                        href={form.league_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-xs font-bold whitespace-nowrap text-white transition-colors shadow flex items-center gap-1.5"
                      >
                        <span>Test Link</span>
                        <span>↗</span>
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-white/60">
                    This link displays the organiser&apos;s division standings and match schedules for this competition on the Fixtures and Match Results pages.
                  </p>
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

              <div className="flex flex-wrap gap-3 items-center pt-2">
                <button
                  className="px-5 py-2.5 rounded-md bg-teal-600 hover:bg-teal-500 font-semibold text-white shadow-md disabled:opacity-50 transition-colors flex items-center gap-2"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving && (
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                  )}
                  <span>{saving ? "Saving changes..." : "Save changes"}</span>
                </button>
                <button
                  className="px-4 py-2.5 rounded-md bg-gray-700 hover:bg-gray-600 font-medium text-white transition-colors"
                  onClick={() => setForm(null)}
                >
                  Close
                </button>

                {/* Delete toggle */}
                <button
                  className="ml-auto px-4 py-2.5 rounded-md bg-red-600/90 hover:bg-red-600 font-medium text-white transition-colors"
                  onClick={() => setDeleteOpen((v) => !v)}
                  title="Delete competition"
                  aria-label="Delete competition"
                >
                  Delete competition
                </button>
              </div>

              {deleteOpen && (
                <div className="mt-2 rounded-md border border-red-700 bg-red-900/20 p-4 space-y-3">
                  <p className="text-sm text-white/80">
                    Type the admin password to enable deletion. This action cannot be undone.
                  </p>
                  <div className="flex gap-3 items-center">
                    <input
                      type="password"
                      className="flex-1 rounded-md bg-gray-800 border border-gray-700 px-3 py-2"
                      placeholder="Password"
                      value={deletePw}
                      onChange={(e) => setDeletePw(e.target.value)}
                    />
                    <button
                      className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 disabled:opacity-50"
                      disabled={!pwOk || deleting}
                      onClick={handleDeleteConfirm}
                    >
                      {deleting ? "Deleting..." : "Confirm delete"}
                    </button>
                  </div>
                  {deleteError && <p className="text-red-400 text-sm">{deleteError}</p>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* NEW: create new competition */}
        <div className="max-w-4xl w-full rounded-2xl p-6 sm:p-10 text-white bg-gray-900 shadow-xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold">Create new competition</h2>
            <button
              className="px-3 py-2 rounded-md bg-gray-700 hover:bg-gray-600"
              onClick={() => setNewOpen((v) => !v)}
            >
              {newOpen ? "Hide" : "Open"}
            </button>
          </div>

          {newOpen && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-1">Organisation</label>
                  <input
                    className="w-full rounded-md bg-gray-800 border border-gray-700 px-3 py-2"
                    // Prefilled value (editable)
                    value={newForm.organisation ?? ""}
                    onChange={(e) =>
                      setNewForm({ ...newForm, organisation: e.target.value || null })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">Division (1–10)</label>
                  <select
                    className="w-full rounded-md bg-gray-800 border border-gray-700 px-3 py-2"
                    value={newForm.division ?? ""}
                    onChange={(e) =>
                      setDivision(e.target.value ? Number(e.target.value) : null)
                    }
                  >
                    <option value="">Select division</option>
                    {[...Array(10)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm text-white/70 mb-1">Competition name</label>
                  <input
                    className="w-full rounded-md bg-gray-800 border border-gray-700 px-3 py-2"
                    // Prefilled and auto-updated; mark as touched when user edits
                    value={newForm.competition_name}
                    onChange={(e) => {
                      setNewNameTouched(true);
                      setNewForm({ ...newForm, competition_name: e.target.value });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">Start period</label>
                  <input
                    type="date"
                    className="w-full rounded-md bg-gray-800 border border-gray-700 px-3 py-2"
                    value={(newForm.start_period ?? "").slice(0, 10)}
                    onChange={(e) => setStartPeriod(e.target.value || null)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">End period</label>
                  <input
                    type="date"
                    className="w-full rounded-md bg-gray-800 border border-gray-700 px-3 py-2"
                    value={(newForm.end_period ?? "").slice(0, 10)}
                    onChange={(e) => setNewForm({ ...newForm, end_period: e.target.value || null })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">Football type</label>
                  <input
                    className="w-full rounded-md bg-gray-800 border border-gray-700 px-3 py-2"
                    value={newForm.football_type ?? ""}
                    onChange={(e) =>
                      setNewForm({ ...newForm, football_type: e.target.value || null })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">FC Mierda final rank</label>
                  <input
                    type="number"
                    className="w-full rounded-md bg-gray-800 border border-gray-700 px-3 py-2"
                    value={newForm.fcmierda_final_rank ?? ""}
                    onChange={(e) =>
                      setNewForm({
                        ...newForm,
                        fcmierda_final_rank: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm text-white/70 mb-1">Competition champion</label>
                  <input
                    className="w-full rounded-md bg-gray-800 border border-gray-700 px-3 py-2"
                    value={newForm.competition_champion ?? ""}
                    onChange={(e) =>
                      setNewForm({
                        ...newForm,
                        competition_champion: e.target.value || null,
                      })
                    }
                  />
                </div>
                <div className="sm:col-span-2 p-4 rounded-xl bg-gray-800/80 border border-gray-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-white">
                      League / Organiser Link (Powerleague schedule &amp; standings URL)
                    </label>
                    {newForm.league_link ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Link Configured
                      </span>
                    ) : (
                      <span className="text-xs text-white/40">Optional</span>
                    )}
                  </div>
                  <div className="flex gap-2 items-center">
                    <input
                      type="url"
                      className="flex-1 rounded-md bg-gray-900 border border-gray-700 px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                      placeholder="https://www.powerleague.com/..."
                      value={newForm.league_link ?? ""}
                      onChange={(e) =>
                        setNewForm({
                          ...newForm,
                          league_link: e.target.value || null,
                        })
                      }
                    />
                    {newForm.league_link && (
                      <a
                        href={newForm.league_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-xs font-bold whitespace-nowrap text-white transition-colors shadow flex items-center gap-1.5"
                      >
                        <span>Test Link</span>
                        <span>↗</span>
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-white/60">
                    Add the organiser&apos;s league schedule or standings page link for this competition.
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm text-white/70 mb-1">Opponents</label>
                  <div className="space-y-2">
                    {(Array.isArray(newForm.opponents) ? [...newForm.opponents] : []).concat("").map((val, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          className="flex-1 rounded-md bg-gray-800 border border-gray-700 px-3 py-2"
                          placeholder="Add opponent..."
                          value={val}
                          onChange={(e) => handleNewOpponentChange(idx, e.target.value)}
                        />
                        {idx < (newForm.opponents?.length ?? 0) && (
                          <button
                            type="button"
                            className="px-2 py-2 rounded-md bg-red-600/80 hover:bg-red-600 text-sm"
                            onClick={() => handleNewOpponentRemove(idx)}
                            aria-label="Remove opponent"
                            title="Remove opponent"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <p className="text-xs text-white/50">
                      Fill the empty field to add a new opponent. You can remove any filled row.
                    </p>
                  </div>
                </div>
              </div>

              {createError && <p className="text-red-400 text-sm">{createError}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  className="px-5 py-2.5 rounded-md bg-blue-600 hover:bg-blue-500 font-semibold text-white shadow-md disabled:opacity-50 transition-colors flex items-center gap-2"
                  onClick={handleCreate}
                  disabled={creating}
                >
                  {creating && (
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                  )}
                  <span>{creating ? "Creating..." : "Create new competition"}</span>
                </button>
                <button
                  className="px-4 py-2.5 rounded-md bg-gray-700 hover:bg-gray-600 font-medium text-white transition-colors"
                  onClick={() => setNewOpen(false)}
                >
                  Cancel
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