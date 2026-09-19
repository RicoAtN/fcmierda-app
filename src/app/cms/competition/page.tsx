"use client";
import Menu from "@/components/Menu";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import { Roboto_Slab, Montserrat } from "next/font/google";
import Link from "next/link";
import DatabaseUnavailableNotice from "@/components/DatabaseUnavailableNotice";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700", "900"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

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
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
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
        <span className="text-gray-200 font-medium">{val}</span>
        {isExactFcMierda && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold"
            title="FC Mierda crowned champion"
            aria-label="Champion"
          >
            🏆 CHAMPION
          </span>
        )}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 text-[10px] font-bold">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      ONGOING
    </span>
  );
}

export default function CompetitionCMSPage() {
  const [rows, setRows] = useState<CompetitionOverviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // Selection + form state
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [form, setForm] = useState<CompetitionOverviewRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Create competition state
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

  // Delete competition state
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
        if (res.ok && Array.isArray(json.data) && !json.error) {
          setRows(json.data);
          setDbError(null);
        } else {
          setDbError(json?.error || "Database temporarily unavailable");
        }
      } catch (e: any) {
        setDbError(e?.message || "Failed to fetch competitions");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
        organisation: src.organisation,
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
              : null,
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
                organisation: canonical.organisation,
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
          fcmierda_final_rank: null,
          competition_champion: null,
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
    <div className={`relative min-h-screen flex flex-col items-center bg-gray-900 text-white overflow-x-hidden ${montserrat.className}`}>
      <Menu />

      <main className="w-full flex-1 flex flex-col items-center pt-24 sm:pt-36 pb-20 px-3.5 sm:px-6">
        {/* Navigation Breadcrumb */}
        <div className="max-w-4xl w-full mb-6 flex items-center justify-between">
          <Link
            href="/cms"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gray-900/90 hover:bg-gray-800 border border-gray-700 text-xs sm:text-sm font-semibold text-gray-200 hover:text-emerald-300 transition-all shadow-sm"
          >
            <span>←</span>
            <span>Back to CMS</span>
          </Link>
          <span className="text-xs text-gray-400 font-medium hidden sm:inline-block">
            Competition Rounds & Tables
          </span>
        </div>

        {/* Hero Header */}
        <div className="max-w-2xl w-full text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-2xl mb-3 shadow-inner">
            🏟️
          </div>
          <h1 className={`text-2xl sm:text-4xl font-black tracking-tight text-white mb-2 ${robotoSlab.className}`}>
            Competitions Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 font-medium max-w-lg mx-auto">
            Manage league seasons, registered opponents, final team rankings, champions, and organiser portal links.
          </p>
        </div>

        {/* Competitions Overview Table Card */}
        <div className="max-w-4xl w-full rounded-2xl p-5 sm:p-8 text-white bg-gray-950/85 border border-gray-800 shadow-2xl backdrop-blur-md mx-auto mb-10">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-800">
            <div>
              <h2 className={`text-lg sm:text-xl font-bold text-white ${robotoSlab.className}`}>
                Competitions Archive & Status
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Click any row below to load into the details editor.</p>
            </div>
            <span className="text-xs text-gray-400 font-semibold">{rows.length} records</span>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900/60 overflow-hidden shadow-inner max-h-[320px] overflow-y-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-black/50 border-b border-gray-800 sticky top-0">
                <tr>
                  <th className="py-2.5 px-3.5 text-left text-gray-400 font-semibold">Competition</th>
                  <th className="py-2.5 px-3 text-left text-gray-400 font-semibold">End Period</th>
                  <th className="py-2.5 px-3 text-center text-gray-400 font-semibold">FC Mierda Rank</th>
                  <th className="py-2.5 px-3.5 text-right text-gray-400 font-semibold">Champion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {loading ? (
                  <tr>
                    <td className="py-8 text-center text-gray-500 italic text-xs" colSpan={4}>
                      Loading competitions...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td className="py-8 text-center text-gray-500 italic text-xs" colSpan={4}>
                      No competitions found. Create one below!
                    </td>
                  </tr>
                ) : (
                  rows.map((r, idx) => {
                    const highlight = isFcMierdaChampion(r.competition_champion);
                    const isSelected = form && ((form.id && r.id && String(form.id) === String(r.id)) || form.competition_name === r.competition_name);
                    const compLabel = removeFirstWords(r.competition_name);
                    return (
                      <tr
                        key={r.id ?? idx}
                        onClick={() => handleSelect(r)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-emerald-950/70 text-emerald-200"
                            : highlight
                            ? "bg-amber-950/30 text-amber-200 hover:bg-amber-950/50"
                            : "hover:bg-gray-800/70 text-gray-300"
                        }`}
                        title="Click to edit competition details"
                      >
                        <td className="py-2.5 px-3.5 font-medium">
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-[200px] sm:max-w-[320px] text-white">
                              {compLabel}
                            </span>
                            {r.league_link && (
                              <a
                                href={r.league_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="px-1.5 py-0.5 rounded bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold inline-flex items-center gap-1 shadow-sm"
                                title={`Open league link: ${r.league_link}`}
                              >
                                🔗 Link
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-gray-400">
                          {formatMonthYear(r.end_period)}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold">
                          {r.fcmierda_final_rank != null ? (
                            <span className="px-2 py-0.5 rounded bg-black/60 border border-gray-700 text-emerald-300">
                              #{r.fcmierda_final_rank}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5 text-right">
                          <ChampionCell champion={r.competition_champion} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Record Editor Card */}
        <div className="max-w-4xl w-full rounded-2xl p-5 sm:p-8 text-white bg-gray-950/85 border border-gray-800 shadow-2xl backdrop-blur-md mx-auto mb-10">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-800">
            <div>
              <h2 className={`text-lg sm:text-xl font-bold text-white ${robotoSlab.className}`}>
                {form ? `Edit: ${form.competition_name}` : "Selected Competition"}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {form ? "Update competition metadata, opponents, and official portal link." : "Select a row from the archive table above to edit."}
              </p>
            </div>
            {form && (
              <button
                type="button"
                onClick={() => setForm(null)}
                className="text-xs text-gray-400 hover:text-gray-200"
              >
                ✕ Deselect
              </button>
            )}
          </div>

          {loadingDetails && <p className="text-xs text-gray-400 py-4 text-center">Loading record details...</p>}

          {!form && !loadingDetails && (
            <div className="text-center py-6 text-gray-500 text-xs sm:text-sm">
              👆 Click any competition from the table above to view and modify its fields.
            </div>
          )}

          {form && (
            <div className="space-y-5">
              {saveSuccess && (
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-600 text-emerald-200 text-xs sm:text-sm font-semibold shadow">
                  <span>✓</span>
                  <div>
                    <p className="font-bold">{saveSuccess}</p>
                    {form.league_link && (
                      <p className="text-[11px] text-emerald-300/80 font-normal">
                        Active League Link: <span className="font-mono underline">{form.league_link}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Organisation
                  </label>
                  <input
                    className="w-full rounded-xl border border-gray-700 bg-black/60 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none"
                    value={form.organisation ?? ""}
                    onChange={(e) => setForm({ ...form, organisation: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Division
                  </label>
                  <input
                    className="w-full rounded-xl border border-gray-700 bg-black/60 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none"
                    value={form.division ?? ""}
                    onChange={(e) => setForm({ ...form, division: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Competition Name
                  </label>
                  <input
                    className="w-full rounded-xl border border-gray-700 bg-black/60 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none"
                    value={form.competition_name}
                    onChange={(e) => setForm({ ...form, competition_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Total Teams
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-gray-700 bg-black/60 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none"
                    value={form.total_teams ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, total_teams: e.target.value ? Number(e.target.value) : null })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Football Type
                  </label>
                  <input
                    className="w-full rounded-xl border border-gray-700 bg-black/60 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none"
                    value={form.football_type ?? ""}
                    onChange={(e) => setForm({ ...form, football_type: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Start Period
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-gray-700 bg-black/60 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none"
                    value={(form.start_period ?? "").slice(0, 10)}
                    onChange={(e) => setForm({ ...form, start_period: e.target.value || null })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    End Period
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-gray-700 bg-black/60 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none"
                    value={(form.end_period ?? "").slice(0, 10)}
                    onChange={(e) => setForm({ ...form, end_period: e.target.value || null })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    FC Mierda Final Rank
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 1, 2, 3..."
                    className="w-full rounded-xl border border-gray-700 bg-black/60 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none"
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
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Competition Champion
                  </label>
                  <input
                    className="w-full rounded-xl border border-gray-700 bg-black/60 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none"
                    placeholder="e.g. FC Mierda"
                    value={form.competition_champion ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, competition_champion: e.target.value || null })
                    }
                  />
                </div>

                {/* League Link Box */}
                <div className="sm:col-span-2 p-4 rounded-xl bg-gradient-to-b from-gray-900/90 to-gray-950 border border-emerald-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-emerald-300 uppercase tracking-wider">
                      🔗 Official Organiser League Portal Link
                    </label>
                    {form.league_link ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Configured
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-500">Not configured</span>
                    )}
                  </div>
                  <div className="flex gap-2 items-center">
                    <input
                      type="url"
                      className="flex-1 rounded-xl bg-black/80 border border-gray-700 px-3.5 py-2 text-white font-mono text-xs sm:text-sm focus:border-emerald-500 outline-none"
                      placeholder="https://www.powerleague.com/..."
                      value={form.league_link ?? ""}
                      onChange={(e) => setForm({ ...form, league_link: e.target.value || null })}
                    />
                    {form.league_link && (
                      <a
                        href={form.league_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all shadow flex items-center gap-1"
                      >
                        <span>Test</span>
                        <span>↗</span>
                      </a>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400">
                    This link is linked on the Fixtures & Match Results pages so players and supporters can inspect live standings.
                  </p>
                </div>

                {/* Opponents List */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                    Opponent Teams in Division
                  </label>
                  <div className="space-y-2">
                    {(Array.isArray(form.opponents) ? [...form.opponents] : []).concat("").map((val, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          className="flex-1 rounded-xl border border-gray-700 bg-black/60 px-3.5 py-2 text-xs sm:text-sm text-white focus:border-emerald-500 outline-none"
                          placeholder="Type team name..."
                          value={val}
                          onChange={(e) => handleOpponentChange(idx, e.target.value)}
                        />
                        {idx < (form.opponents?.length ?? 0) && (
                          <button
                            type="button"
                            className="px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-bold transition-all cursor-pointer"
                            onClick={() => handleOpponentRemove(idx)}
                            aria-label="Remove opponent"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <p className="text-[11px] text-gray-500">
                      Type into the empty row at the bottom to register a new opponent.
                    </p>
                  </div>
                </div>
              </div>

              {saveError && (
                <div className="p-3 bg-rose-950/70 border border-rose-800 rounded-xl text-rose-300 text-xs font-semibold">
                  {saveError}
                </div>
              )}

              <div className="flex flex-wrap gap-3 items-center pt-2">
                <button
                  className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 font-bold text-xs sm:text-sm text-white shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "💾 Save Changes"}
                </button>
                <button
                  className="px-4 py-2.5 rounded-full bg-gray-800 hover:bg-gray-700 font-semibold text-xs sm:text-sm text-gray-300 transition-all cursor-pointer"
                  onClick={() => setForm(null)}
                >
                  Close
                </button>

                <button
                  className="ml-auto px-4 py-2 rounded-full bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 font-semibold text-xs text-rose-300 transition-all cursor-pointer"
                  onClick={() => setDeleteOpen((v) => !v)}
                >
                  🗑️ Delete Competition
                </button>
              </div>

              {deleteOpen && (
                <div className="mt-3 rounded-2xl border border-rose-800/80 bg-rose-950/30 p-4 sm:p-5 space-y-3">
                  <p className="text-xs text-rose-200">
                    Type the admin password to authorize permanent deletion of this competition round.
                  </p>
                  <div className="flex gap-2 items-center">
                    <input
                      type="password"
                      className="flex-1 rounded-xl bg-black/80 border border-rose-700 px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none"
                      placeholder="Enter admin password"
                      value={deletePw}
                      onChange={(e) => setDeletePw(e.target.value)}
                    />
                    <button
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white disabled:opacity-50 cursor-pointer"
                      disabled={!pwOk || deleting}
                      onClick={handleDeleteConfirm}
                    >
                      {deleting ? "Deleting..." : "Confirm Delete"}
                    </button>
                  </div>
                  {deleteError && <p className="text-xs text-rose-400">{deleteError}</p>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Create New Competition Card */}
        <div className="max-w-4xl w-full rounded-2xl p-5 sm:p-8 text-white bg-gray-950/85 border border-gray-800 shadow-2xl backdrop-blur-md mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-lg sm:text-xl font-bold text-white ${robotoSlab.className}`}>
                Create New Competition Round
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Initialize a new tournament season or division.</p>
            </div>
            <button
              className="px-4 py-1.5 rounded-full bg-gray-900 hover:bg-gray-800 border border-gray-700 text-xs font-semibold text-gray-200 cursor-pointer"
              onClick={() => setNewOpen((v) => !v)}
            >
              {newOpen ? "▲ Collapse" : "➕ Open Creator"}
            </button>
          </div>

          {newOpen && (
            <div className="space-y-5 pt-6 mt-4 border-t border-gray-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Organisation
                  </label>
                  <input
                    className="w-full rounded-xl border border-gray-700 bg-black/60 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-emerald-500 outline-none"
                    value={newForm.organisation ?? ""}
                    onChange={(e) =>
                      setNewForm({ ...newForm, organisation: e.target.value || null })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Division (1–10)
                  </label>
                  <select
                    className="w-full rounded-xl border border-gray-700 bg-black/60 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-emerald-500 outline-none cursor-pointer"
                    value={newForm.division ?? ""}
                    onChange={(e) =>
                      setDivision(e.target.value ? Number(e.target.value) : null)
                    }
                  >
                    <option value="">Select division</option>
                    {[...Array(10)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Division {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Competition Name
                  </label>
                  <input
                    className="w-full rounded-xl border border-gray-700 bg-black/60 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-emerald-500 outline-none"
                    value={newForm.competition_name}
                    onChange={(e) => {
                      setNewNameTouched(true);
                      setNewForm({ ...newForm, competition_name: e.target.value });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Start Period
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-gray-700 bg-black/60 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-emerald-500 outline-none"
                    value={(newForm.start_period ?? "").slice(0, 10)}
                    onChange={(e) => setStartPeriod(e.target.value || null)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    End Period
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-gray-700 bg-black/60 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-emerald-500 outline-none"
                    value={(newForm.end_period ?? "").slice(0, 10)}
                    onChange={(e) => setNewForm({ ...newForm, end_period: e.target.value || null })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Football Type
                  </label>
                  <input
                    className="w-full rounded-xl border border-gray-700 bg-black/60 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-emerald-500 outline-none"
                    value={newForm.football_type ?? ""}
                    onChange={(e) =>
                      setNewForm({ ...newForm, football_type: e.target.value || null })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Total Teams
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-gray-700 bg-black/60 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-emerald-500 outline-none"
                    value={newForm.total_teams ?? ""}
                    onChange={(e) =>
                      setNewForm({
                        ...newForm,
                        total_teams: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                </div>

                <div className="sm:col-span-2 p-4 rounded-xl bg-gradient-to-b from-gray-900/90 to-gray-950 border border-emerald-800/40 space-y-2">
                  <label className="block text-xs font-bold text-emerald-300 uppercase tracking-wider">
                    Official Organiser League Portal Link (Optional)
                  </label>
                  <input
                    type="url"
                    className="w-full rounded-xl bg-black/80 border border-gray-700 px-3.5 py-2 text-white font-mono text-xs sm:text-sm focus:border-emerald-500 outline-none"
                    placeholder="https://www.powerleague.com/..."
                    value={newForm.league_link ?? ""}
                    onChange={(e) =>
                      setNewForm({
                        ...newForm,
                        league_link: e.target.value || null,
                      })
                    }
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                    Opponents in Division
                  </label>
                  <div className="space-y-2">
                    {(Array.isArray(newForm.opponents) ? [...newForm.opponents] : []).concat("").map((val, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          className="flex-1 rounded-xl border border-gray-700 bg-black/60 px-3.5 py-2 text-xs sm:text-sm text-white focus:border-emerald-500 outline-none"
                          placeholder="Type team name..."
                          value={val}
                          onChange={(e) => handleNewOpponentChange(idx, e.target.value)}
                        />
                        {idx < (newForm.opponents?.length ?? 0) && (
                          <button
                            type="button"
                            className="px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-bold transition-all cursor-pointer"
                            onClick={() => handleNewOpponentRemove(idx)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {createError && (
                <div className="p-3 bg-rose-950/70 border border-rose-800 rounded-xl text-rose-300 text-xs font-semibold">
                  {createError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 font-bold text-xs sm:text-sm text-white shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2"
                  onClick={handleCreate}
                  disabled={creating}
                >
                  {creating ? "Creating..." : "✨ Create Competition"}
                </button>
                <button
                  className="px-4 py-2.5 rounded-full bg-gray-800 hover:bg-gray-700 font-semibold text-xs sm:text-sm text-gray-300 transition-all cursor-pointer"
                  onClick={() => setNewOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}