"use client";

import React, { useState, useMemo, useTransition, useEffect } from "react";
import { Roboto_Slab } from "next/font/google";
import { CmsActivityLog } from "@/lib/cms-logger";
import { refreshAnalyticsAction } from "./actions";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700", "800"] });

interface ClientActivityLogsProps {
  initialLogs?: CmsActivityLog[];
  logs?: CmsActivityLog[];
}

const ADMIN_COLOR_MAP: Record<string, { badge: string; avatar: string }> = {
  rico: {
    badge: "bg-amber-500/15 border-amber-500/40 text-amber-300",
    avatar: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  },
  victor: {
    badge: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
    avatar: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
  jordy: {
    badge: "bg-cyan-500/15 border-cyan-500/30 text-cyan-300",
    avatar: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  },
  alon: {
    badge: "bg-purple-500/15 border-purple-500/30 text-purple-300",
    avatar: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  },
};

const ACTION_CONFIG: Record<string, { label: string; badge: string; icon: string }> = {
  CREATE: {
    label: "Created",
    badge: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
    icon: "➕",
  },
  UPDATE: {
    label: "Updated",
    badge: "bg-blue-500/15 border-blue-500/30 text-blue-400",
    icon: "✏️",
  },
  DELETE: {
    label: "Deleted",
    badge: "bg-red-500/15 border-red-500/30 text-red-400",
    icon: "🗑️",
  },
  BROADCAST: {
    label: "Broadcast",
    badge: "bg-amber-500/15 border-amber-500/30 text-amber-400",
    icon: "📢",
  },
};

const MODULE_CONFIG: Record<string, { label: string; icon: string }> = {
  next_game: { label: "Next Match", icon: "📅" },
  match_result: { label: "Match Result", icon: "⚽" },
  player: { label: "Squad Member", icon: "👥" },
  competition: { label: "Competition", icon: "🏆" },
  sponsor: { label: "Club Sponsor", icon: "🤝" },
  attendance: { label: "Availability", icon: "📋" },
  push_broadcast: { label: "Push Alert", icon: "📢" },
};

function formatRelativeTime(dateInput: string | Date): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return String(dateInput);

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFullTimestamp(dateInput: string | Date): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return String(dateInput);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function ClientActivityLogs({ initialLogs, logs: propLogs }: ClientActivityLogsProps) {
  const [logs, setLogs] = useState<CmsActivityLog[]>(propLogs || initialLogs || []);
  const [selectedAdmin, setSelectedAdmin] = useState<string>("ALL");
  const [selectedModule, setSelectedModule] = useState<string>("ALL");
  const [selectedAction, setSelectedAction] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedLogIds, setExpandedLogIds] = useState<Record<number, boolean>>({});
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (propLogs) setLogs(propLogs);
  }, [propLogs]);

  const handleRefresh = () => {
    startTransition(async () => {
      await refreshAnalyticsAction();
    });
  };

  const toggleExpand = (id: number) => {
    setExpandedLogIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const all: Record<number, boolean> = {};
    filteredLogs.forEach((l) => (all[l.id] = true));
    setExpandedLogIds(all);
  };

  const collapseAll = () => {
    setExpandedLogIds({});
  };

  // Distinct admins present in logs
  const adminOptions = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      if (l.admin_username) set.add(l.admin_username);
    });
    return Array.from(set);
  }, [logs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (selectedAdmin !== "ALL" && log.admin_username.toLowerCase() !== selectedAdmin.toLowerCase()) {
        return false;
      }
      if (selectedModule !== "ALL" && log.module !== selectedModule) {
        return false;
      }
      if (selectedAction !== "ALL" && log.action_type !== selectedAction) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (log.entity_title || "").toLowerCase().includes(q);
        const adminMatch = (log.admin_username || "").toLowerCase().includes(q);
        const moduleMatch = (log.module || "").toLowerCase().includes(q);
        const detailsMatch = JSON.stringify(log.details || {}).toLowerCase().includes(q);
        if (!titleMatch && !adminMatch && !moduleMatch && !detailsMatch) {
          return false;
        }
      }
      return true;
    });
  }, [logs, selectedAdmin, selectedModule, selectedAction, searchQuery]);

  return (
    <div className="w-full">
      {/* Search & Filter Controls */}
      <div className="p-4 sm:p-5 rounded-xl bg-gray-900/60 border border-gray-800 mb-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit logs by admin, title, keyword or details..."
              className="w-full rounded-xl border border-gray-700 bg-black/60 pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Expand/Collapse & Refresh toggles */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={handleRefresh}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 hover:text-white text-xs font-semibold transition border border-emerald-700/60 cursor-pointer disabled:opacity-50"
              title="Refresh logs from database on-demand"
            >
              <span className={`inline-block ${isPending ? "animate-spin" : ""}`}>🔄</span>
              <span>{isPending ? "Refreshing..." : "Refresh"}</span>
            </button>
            <button
              onClick={expandAll}
              className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-semibold transition border border-gray-700 cursor-pointer"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-semibold transition border border-gray-700 cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Filter Pills / Selectors */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-800/80 text-xs">
          {/* Admin Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400 font-semibold text-[11px] uppercase tracking-wider">Admin:</span>
            <select
              value={selectedAdmin}
              onChange={(e) => setSelectedAdmin(e.target.value)}
              className="rounded-lg border border-gray-700 bg-black/70 px-2.5 py-1 text-xs text-white focus:border-emerald-500 outline-none"
            >
              <option value="ALL">All Admins ({logs.length})</option>
              {adminOptions.map((admin) => (
                <option key={admin} value={admin}>
                  {admin}
                </option>
              ))}
            </select>
          </div>

          {/* Module Filter */}
          <div className="flex items-center gap-1.5 ml-0 sm:ml-2">
            <span className="text-gray-400 font-semibold text-[11px] uppercase tracking-wider">Module:</span>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="rounded-lg border border-gray-700 bg-black/70 px-2.5 py-1 text-xs text-white focus:border-emerald-500 outline-none"
            >
              <option value="ALL">All Modules</option>
              <option value="next_game">📅 Next Match</option>
              <option value="match_result">⚽ Match Results</option>
              <option value="player">👥 Players &amp; Squad</option>
              <option value="competition">🏆 Competitions</option>
              <option value="sponsor">🤝 Sponsors</option>
              <option value="attendance">📋 Player Availability</option>
              <option value="push_broadcast">📢 Push Broadcasts</option>
            </select>
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-1.5 ml-0 sm:ml-2">
            <span className="text-gray-400 font-semibold text-[11px] uppercase tracking-wider">Action:</span>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="rounded-lg border border-gray-700 bg-black/70 px-2.5 py-1 text-xs text-white focus:border-emerald-500 outline-none"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATE">➕ Created</option>
              <option value="UPDATE">✏️ Updated</option>
              <option value="DELETE">🗑️ Deleted</option>
              <option value="BROADCAST">📢 Broadcasted</option>
            </select>
          </div>

          {/* Result Count */}
          <div className="ml-auto text-gray-400 text-[11px] font-mono">
            Showing {filteredLogs.length} of {logs.length} events
          </div>
        </div>
      </div>

      {/* Activity Logs List / Cards */}
      {filteredLogs.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-2xl bg-gray-900/40 border border-gray-800 text-gray-400 text-sm">
          <span className="text-3xl block mb-2">📜</span>
          <p className="font-semibold text-gray-300">No activity logs match your filter criteria.</p>
          <p className="text-xs text-gray-500 mt-1">Try selecting &quot;All Modules&quot; or clearing your search query.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredLogs.map((log) => {
            const isExpanded = !!expandedLogIds[log.id];
            const adminKey = log.admin_username.toLowerCase();
            const adminColor = ADMIN_COLOR_MAP[adminKey] || {
              badge: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
              avatar: "bg-gray-800 text-gray-300 border-gray-700",
            };
            const actionConf = ACTION_CONFIG[log.action_type] || {
              label: log.action_type,
              badge: "bg-gray-800 border-gray-700 text-gray-300",
              icon: "📝",
            };
            const moduleConf = MODULE_CONFIG[log.module] || {
              label: log.module,
              icon: "📦",
            };
            const initial = (log.admin_username || "A").charAt(0).toUpperCase();

            return (
              <div
                key={log.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isExpanded
                    ? "bg-gray-900/90 border-emerald-500/50 shadow-xl"
                    : "bg-gray-950/70 hover:bg-gray-900/70 border-gray-800/90 hover:border-gray-700 shadow-md"
                }`}
              >
                {/* Header Row / Tap Target */}
                <div
                  onClick={() => toggleExpand(log.id)}
                  className="p-3.5 sm:p-4.5 flex items-start sm:items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    {/* Admin Avatar Circle */}
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm border shrink-0 shadow-sm ${adminColor.avatar}`}
                    >
                      {initial}
                    </div>

                    {/* Main Log Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                        {/* Admin Name Badge */}
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${adminColor.badge}`}
                        >
                          {log.admin_username}
                        </span>

                        {/* Action Badge */}
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1 ${actionConf.badge}`}
                        >
                          <span>{actionConf.icon}</span>
                          <span>{actionConf.label}</span>
                        </span>

                        {/* Module Tag */}
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/60 border border-gray-700 text-gray-300 flex items-center gap-1">
                          <span>{moduleConf.icon}</span>
                          <span>{moduleConf.label}</span>
                        </span>

                        {/* Relative Time (Mobile) */}
                        <span className="sm:hidden ml-auto text-[10px] text-gray-400 font-mono">
                          {formatRelativeTime(log.created_at)}
                        </span>
                      </div>

                      {/* Title / Description */}
                      <p className="text-xs sm:text-sm font-semibold text-white truncate">
                        {log.entity_title || `${actionConf.label} ${moduleConf.label}`}
                      </p>
                    </div>
                  </div>

                  {/* Right Side: Full Timestamp & Expand Chevron */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="hidden sm:inline text-xs text-gray-400 font-mono">
                      {formatRelativeTime(log.created_at)}
                    </span>

                    <button
                      type="button"
                      className={`w-7 h-7 rounded-lg bg-gray-900 border border-gray-700 flex items-center justify-center text-xs text-gray-300 transition-transform duration-200 ${
                        isExpanded ? "rotate-180 text-emerald-400 border-emerald-500/40" : ""
                      }`}
                      title={isExpanded ? "Collapse log details" : "Expand log details"}
                      aria-label="Toggle log details"
                    >
                      ▼
                    </button>
                  </div>
                </div>

                {/* Expanded Detail Panel */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-gray-800/80 bg-black/40 animate-fade-in text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 text-gray-300">
                      <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-gray-900/60 border border-gray-800">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Event Metadata
                        </span>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-400">Timestamp:</span>
                          <span className="font-mono text-white">{formatFullTimestamp(log.created_at)}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-400">Target Entity ID:</span>
                          <span className="font-mono text-white">{log.entity_id || "N/A"}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-400">Performed by:</span>
                          <strong className="text-emerald-400">{log.admin_username}</strong>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-gray-900/60 border border-gray-800">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Summary Overview
                        </span>
                        <p className="text-[11px] text-gray-200 leading-relaxed">
                          <strong>{log.admin_username}</strong> {actionConf.label.toLowerCase()} the {moduleConf.label.toLowerCase()} record: &ldquo;{log.entity_title || "N/A"}&rdquo;.
                        </p>
                      </div>
                    </div>

                    {/* Formatted Payload Details */}
                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="mt-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                          Payload &amp; Modified Fields:
                        </span>

                        {/* Clean key-value badges */}
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {Object.entries(log.details).map(([key, val]) => {
                            if (typeof val === "object" && val !== null) return null;
                            return (
                              <div
                                key={key}
                                className="px-2.5 py-1 rounded-lg bg-gray-900 border border-gray-700/80 text-[11px] flex items-center gap-1.5"
                              >
                                <span className="text-gray-400 font-medium capitalize">{key.replace(/_/g, " ")}:</span>
                                <strong className="text-white">{String(val)}</strong>
                              </div>
                            );
                          })}
                        </div>

                        {/* Raw JSON inspection collapsible/formatted block */}
                        <details className="mt-2 group">
                          <summary className="cursor-pointer text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold select-none">
                            ▶ View Raw JSON Payload
                          </summary>
                          <pre className="mt-2 p-3 rounded-xl bg-black/80 border border-gray-800 text-[11px] font-mono text-gray-300 overflow-x-auto max-h-48">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
