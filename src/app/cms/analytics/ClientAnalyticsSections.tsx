"use client";

import React, { useState } from "react";
import { Roboto_Slab } from "next/font/google";
import Link from "next/link";
import ClientActivityLogs from "./ClientActivityLogs";
import { CmsActivityLog } from "@/lib/cms-logger";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700", "800", "900"] });

type AdminUser = {
  id: number;
  user_name: string;
};

type PushSubscriber = {
  id: number;
  device_type: string | null;
  user_agent: string | null;
  created_at: string | Date | null;
  endpoint: string;
};

type SystemMetrics = {
  totalMatches: number;
  totalPlayers: number;
  mainPlayers: number;
  totalCompetitions: number;
  totalSponsors: number;
  nextGame: {
    opponent?: string | null;
    date?: string | null;
    kickoff?: string | null;
    location?: string | null;
    competition?: string | null;
  } | null;
};

interface AdminRoleConfig {
  roleTitle: string;
  roleBadge: string;
  badgeStyle: string;
  cardAccent: string;
  avatarStyle: string;
  accessLevel: string;
  focusTags: string[];
  isSuperAdmin?: boolean;
}

const ADMIN_ROLES_DATA: Record<string, AdminRoleConfig> = {
  rico: {
    roleTitle: "Club Owner & Lead Developer",
    roleBadge: "Super Admin",
    badgeStyle: "bg-amber-500/15 border-amber-500/40 text-amber-300",
    cardAccent: "border-amber-500/40 bg-gradient-to-br from-amber-950/20 via-gray-900/80 to-black/60",
    avatarStyle: "bg-amber-500/20 border-amber-500/40 text-amber-300 ring-2 ring-amber-500/20",
    accessLevel: "Full Access & Platform Owner",
    focusTags: ["Platform Architecture", "Database & Security", "Push Broadcasts", "Full CMS Control"],
    isSuperAdmin: true,
  },
  jordy: {
    roleTitle: "Team Captain & Competition Liaison",
    roleBadge: "Captain & Liaison",
    badgeStyle: "bg-cyan-500/15 border-cyan-500/30 text-cyan-300",
    cardAccent: "border-gray-800 hover:border-cyan-500/40",
    avatarStyle: "bg-cyan-500/15 border-cyan-500/30 text-cyan-300 ring-2 ring-cyan-500/20",
    accessLevel: "Captaincy & Organiser Relations",
    focusTags: ["Team Captain", "Competition Organiser Liaison", "League Relations", "Squad Leadership"],
  },
  victor: {
    roleTitle: "Coach & Logistics Coordinator",
    roleBadge: "Coach & Supplier",
    badgeStyle: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
    cardAccent: "border-gray-800 hover:border-emerald-500/40",
    avatarStyle: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 ring-2 ring-emerald-500/20",
    accessLevel: "Coaching & Logistics Management",
    focusTags: ["Team Coach", "Logistics Supplier", "Matchday Coordinator", "Kit & Equipment"],
  },
  alon: {
    roleTitle: "All-Round Team & Admin Support",
    roleBadge: "All-Round Support",
    badgeStyle: "bg-purple-500/15 border-purple-500/30 text-purple-300",
    cardAccent: "border-gray-800 hover:border-purple-500/40",
    avatarStyle: "bg-purple-500/15 border-purple-500/30 text-purple-300 ring-2 ring-purple-500/20",
    accessLevel: "General Team & Admin Assistance",
    focusTags: ["General Team Assistance", "Matchday Help", "Squad Support", "Admin Backup"],
  },
};

function getAdminConfig(userName: string): AdminRoleConfig {
  const normalized = (userName || "").trim().toLowerCase();
  if (ADMIN_ROLES_DATA[normalized]) {
    return ADMIN_ROLES_DATA[normalized];
  }
  return {
    roleTitle: "Club Administrator",
    roleBadge: "Administrator",
    badgeStyle: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
    cardAccent: "border-gray-800 hover:border-emerald-500/40",
    avatarStyle: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 ring-2 ring-emerald-500/20",
    accessLevel: "Standard CMS Operations",
    focusTags: ["Matchday Management", "Squad Roster", "Match Results", "Competitions"],
  };
}

function formatDate(dateValue: string | Date | null) {
  if (!dateValue) return "-";
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return String(dateValue);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatEndpointService(endpoint: string) {
  if (!endpoint) return "WebPush";
  if (endpoint.includes("fcm.googleapis.com")) return "Google FCM (Chrome/Android)";
  if (endpoint.includes("web.push.apple.com")) return "Apple APNs (iOS/Safari)";
  if (endpoint.includes("mozilla.com")) return "Mozilla AutoPush (Firefox)";
  if (endpoint.includes("microsoft.com")) return "Microsoft WNS (Edge)";
  return "Standard W3C WebPush";
}

interface ClientAnalyticsSectionsProps {
  admins: AdminUser[];
  pushTotal: number;
  deviceBreakdown: { desktop: number; android: number; ios: number; other: number };
  recentSubs: PushSubscriber[];
  metrics: SystemMetrics;
  activityLogs: CmsActivityLog[];
}

export default function ClientAnalyticsSections({
  admins,
  pushTotal,
  deviceBreakdown,
  recentSubs,
  metrics,
  activityLogs,
}: ClientAnalyticsSectionsProps) {
  // All sections are COLLAPSED BY DEFAULT as requested
  const [openSections, setOpenSections] = useState<{
    activityLogs: boolean;
    admins: boolean;
    push: boolean;
    metrics: boolean;
  }>({
    activityLogs: false,
    admins: false,
    push: false,
    metrics: false,
  });

  const toggleSection = (key: "activityLogs" | "admins" | "push" | "metrics") => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const expandAll = () => {
    setOpenSections({
      activityLogs: true,
      admins: true,
      push: true,
      metrics: true,
    });
  };

  const collapseAll = () => {
    setOpenSections({
      activityLogs: false,
      admins: false,
      push: false,
      metrics: false,
    });
  };

  const anyOpen = Object.values(openSections).some(Boolean);

  return (
    <div className="w-full max-w-5xl flex flex-col gap-5">
      {/* Master Expand / Collapse Control Bar */}
      <div className="flex items-center justify-between px-2 py-1 text-xs">
        <div className="text-gray-400 text-xs">
          <span>Click any section below to expand or collapse details.</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={expandAll}
            className="px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-semibold transition border border-gray-700 cursor-pointer text-xs"
          >
            Expand All Sections
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-semibold transition border border-gray-700 cursor-pointer text-xs"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* SECTION 1: ACTIVITY & AUDIT LOGS */}
      <section id="activity-logs" className="scroll-mt-24 w-full">
        <div
          className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
            openSections.activityLogs
              ? "bg-gray-950/90 border-emerald-500/40 shadow-2xl"
              : "bg-gray-950/70 hover:bg-gray-900/80 border-gray-800 hover:border-gray-700 shadow-lg"
          }`}
        >
          {/* Collapsible Header */}
          <div
            onClick={() => toggleSection("activityLogs")}
            className="p-5 sm:p-6 cursor-pointer select-none flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-2xl shrink-0 shadow-sm">
                📜
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                    Live Audit Trail
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-black/60 border border-gray-700 text-gray-300">
                    {activityLogs.length} events logged
                  </span>
                </div>
                <h2 className={`text-lg sm:text-xl font-bold text-white tracking-tight ${robotoSlab.className}`}>
                  CMS Activity &amp; Audit Logs
                </h2>
                <p className="text-xs sm:text-sm text-gray-300 mt-0.5 leading-relaxed">
                  Tracks who creates or edits matches, squad players, competitions, sponsors, and sends push broadcasts.
                </p>
              </div>
            </div>

            {/* Quick Status / Toggle */}
            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-800/80">
              <span className="text-xs font-semibold text-emerald-400">
                {openSections.activityLogs ? "Click to collapse" : "Click to view logs"}
              </span>
              <div
                className={`w-8 h-8 rounded-xl bg-gray-900 border border-gray-700 flex items-center justify-center text-xs text-gray-300 transition-transform duration-200 ${
                  openSections.activityLogs ? "rotate-180 text-emerald-400 border-emerald-500/40" : ""
                }`}
              >
                ▼
              </div>
            </div>
          </div>

          {/* Collapsible Content */}
          {openSections.activityLogs && (
            <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-gray-800/80 animate-fade-in">
              <ClientActivityLogs logs={activityLogs} />
            </div>
          )}
        </div>
      </section>

      {/* SECTION 2: ADMINISTRATORS & ROLES OVERVIEW */}
      <section id="admins" className="scroll-mt-24 w-full">
        <div
          className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
            openSections.admins
              ? "bg-gray-950/90 border-emerald-500/40 shadow-2xl"
              : "bg-gray-950/70 hover:bg-gray-900/80 border-gray-800 hover:border-gray-700 shadow-lg"
          }`}
        >
          {/* Collapsible Header */}
          <div
            onClick={() => toggleSection("admins")}
            className="p-5 sm:p-6 cursor-pointer select-none flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-2xl shrink-0 shadow-sm">
                👥
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase tracking-wider">
                    Access Control
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-black/60 border border-gray-700 text-gray-300">
                    {admins.length} active admins
                  </span>
                </div>
                <h2 className={`text-lg sm:text-xl font-bold text-white tracking-tight ${robotoSlab.className}`}>
                  Administrator Accounts &amp; Roles
                </h2>
                <p className="text-xs sm:text-sm text-gray-300 mt-0.5 leading-relaxed">
                  Overview of all registered admin accounts (Rico, Victor, Jordy, Alon), team roles, and contact procedures.
                </p>
              </div>
            </div>

            {/* Quick Status / Toggle */}
            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-800/80">
              <span className="text-xs font-semibold text-cyan-400">
                {openSections.admins ? "Click to collapse" : "Click to view accounts"}
              </span>
              <div
                className={`w-8 h-8 rounded-xl bg-gray-900 border border-gray-700 flex items-center justify-center text-xs text-gray-300 transition-transform duration-200 ${
                  openSections.admins ? "rotate-180 text-cyan-400 border-cyan-500/40" : ""
                }`}
              >
                ▼
              </div>
            </div>
          </div>

          {/* Collapsible Content */}
          {openSections.admins && (
            <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-gray-800/80 animate-fade-in">
              {/* Rich Admin Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-4">
                {admins.map((admin) => {
                  const config = getAdminConfig(admin.user_name);
                  const initial = (admin.user_name || "A").charAt(0).toUpperCase();

                  return (
                    <div
                      key={admin.id}
                      className={`rounded-2xl p-5 bg-gray-900/60 border ${config.cardAccent} shadow-xl hover:shadow-[0_0_20px_rgba(16,185,129,0.12)] transition-all duration-200 flex flex-col justify-between`}
                    >
                      <div>
                        {/* Top Bar: Avatar + Name + Role Badge */}
                        <div className="flex items-start justify-between gap-3 mb-3.5">
                          <div className="flex items-center gap-3.5">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black shadow-md border ${config.avatarStyle}`}>
                              {initial}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className={`text-base sm:text-lg font-bold text-white ${robotoSlab.className}`}>
                                  {admin.user_name}
                                </h3>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/60 border border-gray-700 text-gray-400 font-semibold">
                                  #{admin.id}
                                </span>
                              </div>
                              <span className="text-xs font-semibold text-emerald-400 block mt-0.5">
                                {config.roleTitle}
                              </span>
                            </div>
                          </div>

                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0 ${config.badgeStyle}`}>
                            {config.roleBadge}
                          </span>
                        </div>

                        {/* Operational Focus Tags */}
                        <div className="my-3.5">
                          <div className="flex flex-wrap gap-1.5">
                            {config.focusTags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 rounded-lg bg-black/50 border border-gray-800 text-[11px] font-medium text-gray-300"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Meta Strip */}
                      <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between text-[11px] text-gray-400">
                        <span className="truncate pr-2">
                          <strong className="text-gray-300 font-semibold">Scope:</strong> {config.accessLevel}
                        </span>
                        <span className="inline-flex items-center gap-1.5 shrink-0 text-emerald-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>Active</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Role Management Contact Box */}
              <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-gray-900/70 to-black/60 border border-emerald-500/30 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xl shrink-0">
                    🔐
                  </div>
                  <div>
                    <h4 className={`text-sm sm:text-base font-bold text-white ${robotoSlab.className}`}>
                      Admin Role &amp; Account Management
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-300 mt-0.5 leading-relaxed">
                      If you wish to add a new admin account or edit admin roles, please contact <strong>Rico</strong> directly.
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 border border-emerald-500/40 transition-all">
                    <span>👤</span>
                    <span>Contact: Rico</span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 3: WEB PUSH NOTIFICATION SUBSCRIBERS */}
      <section id="push-analytics" className="scroll-mt-24 w-full">
        <div
          className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
            openSections.push
              ? "bg-gray-950/90 border-emerald-500/40 shadow-2xl"
              : "bg-gray-950/70 hover:bg-gray-900/80 border-gray-800 hover:border-gray-700 shadow-lg"
          }`}
        >
          {/* Collapsible Header */}
          <div
            onClick={() => toggleSection("push")}
            className="p-5 sm:p-6 cursor-pointer select-none flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl shrink-0 shadow-sm">
                🔔
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                    Audience Reach
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-black/60 border border-gray-700 text-gray-300">
                    {pushTotal} subscribers ({deviceBreakdown.desktop} Desktop · {deviceBreakdown.android} Android · {deviceBreakdown.ios} iOS)
                  </span>
                </div>
                <h2 className={`text-lg sm:text-xl font-bold text-white tracking-tight ${robotoSlab.className}`}>
                  Web Push Notification Subscribers
                </h2>
                <p className="text-xs sm:text-sm text-gray-300 mt-0.5 leading-relaxed">
                  Live subscription telemetry and delivery endpoint status for matchday broadcasts.
                </p>
              </div>
            </div>

            {/* Quick Status / Toggle */}
            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-800/80">
              <span className="text-xs font-semibold text-amber-400">
                {openSections.push ? "Click to collapse" : "Click to view subscribers"}
              </span>
              <div
                className={`w-8 h-8 rounded-xl bg-gray-900 border border-gray-700 flex items-center justify-center text-xs text-gray-300 transition-transform duration-200 ${
                  openSections.push ? "rotate-180 text-amber-400 border-amber-500/40" : ""
                }`}
              >
                ▼
              </div>
            </div>
          </div>

          {/* Collapsible Content */}
          {openSections.push && (
            <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-gray-800/80 animate-fade-in">
              <div className="flex items-center justify-end mb-4">
                <Link
                  href="/cms/nextgamedetails"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all"
                >
                  <span>📢</span>
                  <span>Send Matchday Broadcast →</span>
                </Link>
              </div>

              {/* Audience Breakdown Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 flex flex-col justify-between">
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total Audience</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl sm:text-3xl font-black text-emerald-400">{pushTotal}</span>
                    <span className="text-[11px] text-gray-400 font-medium">Subscribers</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 flex flex-col justify-between">
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <span>💻</span> Desktop
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl sm:text-3xl font-black text-white">{deviceBreakdown.desktop}</span>
                    <span className="text-[11px] text-gray-400 font-medium">Browsers</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 flex flex-col justify-between">
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <span>🤖</span> Android
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl sm:text-3xl font-black text-white">{deviceBreakdown.android}</span>
                    <span className="text-[11px] text-gray-400 font-medium">Devices</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 flex flex-col justify-between">
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <span>🍎</span> Apple iOS
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl sm:text-3xl font-black text-white">{deviceBreakdown.ios}</span>
                    <span className="text-[11px] text-gray-400 font-medium">PWA WebPush</span>
                  </div>
                </div>
              </div>

              {/* Recent Subscriber Logs Table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-sm sm:text-base font-bold text-white ${robotoSlab.className}`}>
                    Recent Subscriber Registrations Log
                  </h3>
                  <span className="text-xs text-gray-400 font-mono">
                    Showing latest {recentSubs.length} entries
                  </span>
                </div>

                {recentSubs.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-xs bg-gray-900/40 rounded-xl border border-gray-800">
                    No push notification subscriptions registered yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-800">
                    <table className="w-full text-left text-xs text-gray-300">
                      <thead className="bg-gray-900/90 text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
                        <tr>
                          <th className="px-3.5 py-3">Device Platform</th>
                          <th className="px-3.5 py-3">Subscribed At</th>
                          <th className="px-3.5 py-3">Gateway Service</th>
                          <th className="px-3.5 py-3">User-Agent Signature</th>
                          <th className="px-3.5 py-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/60 bg-gray-950/40 font-medium">
                        {recentSubs.map((sub) => {
                          const device = (sub.device_type || "desktop").toLowerCase();
                          const icon = device === "android" ? "🤖" : device === "ios" ? "🍎" : "💻";

                          return (
                            <tr key={sub.id} className="hover:bg-gray-900/50 transition-colors">
                              <td className="px-3.5 py-3 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 border border-gray-700 text-white font-semibold text-[11px] capitalize">
                                  <span>{icon}</span>
                                  <span>{sub.device_type || "Desktop"}</span>
                                </span>
                              </td>
                              <td className="px-3.5 py-3 whitespace-nowrap text-gray-300">
                                {formatDate(sub.created_at)}
                              </td>
                              <td className="px-3.5 py-3 whitespace-nowrap text-gray-400 font-mono text-[11px]">
                                {formatEndpointService(sub.endpoint)}
                              </td>
                              <td className="px-3.5 py-3 text-gray-400 max-w-xs truncate text-[11px]" title={sub.user_agent || ""}>
                                {sub.user_agent || "Standard Browser"}
                              </td>
                              <td className="px-3.5 py-3 text-right whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                  <span>Active</span>
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 4: PLATFORM CONTENT & SYSTEM HEALTH */}
      <section id="platform-metrics" className="scroll-mt-24 w-full">
        <div
          className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
            openSections.metrics
              ? "bg-gray-950/90 border-emerald-500/40 shadow-2xl"
              : "bg-gray-950/70 hover:bg-gray-900/80 border-gray-800 hover:border-gray-700 shadow-lg"
          }`}
        >
          {/* Collapsible Header */}
          <div
            onClick={() => toggleSection("metrics")}
            className="p-5 sm:p-6 cursor-pointer select-none flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-2xl shrink-0 shadow-sm">
                📊
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold uppercase tracking-wider">
                    Database Health
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-black/60 border border-gray-700 text-gray-300">
                    {metrics.totalMatches} matches · {metrics.totalPlayers} players · {metrics.totalCompetitions} comps · {metrics.totalSponsors} sponsors
                  </span>
                </div>
                <h2 className={`text-lg sm:text-xl font-bold text-white tracking-tight ${robotoSlab.className}`}>
                  Platform Content &amp; System Health
                </h2>
                <p className="text-xs sm:text-sm text-gray-300 mt-0.5 leading-relaxed">
                  Real-time counts of recorded matches, player profiles, active competitions, sponsors, and database services.
                </p>
              </div>
            </div>

            {/* Quick Status / Toggle */}
            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-800/80">
              <span className="text-xs font-semibold text-purple-400">
                {openSections.metrics ? "Click to collapse" : "Click to view metrics"}
              </span>
              <div
                className={`w-8 h-8 rounded-xl bg-gray-900 border border-gray-700 flex items-center justify-center text-xs text-gray-300 transition-transform duration-200 ${
                  openSections.metrics ? "rotate-180 text-purple-400 border-purple-500/40" : ""
                }`}
              >
                ▼
              </div>
            </div>
          </div>

          {/* Collapsible Content */}
          {openSections.metrics && (
            <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-gray-800/80 animate-fade-in">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 my-4">
                <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 flex flex-col justify-between">
                  <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">⚽ Match Recaps</span>
                  <div className="mt-2">
                    <span className="text-2xl sm:text-3xl font-black text-white">{metrics.totalMatches}</span>
                    <span className="text-[11px] text-gray-400 block mt-0.5">Recorded matches</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 flex flex-col justify-between">
                  <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">👥 Squad Roster</span>
                  <div className="mt-2">
                    <span className="text-2xl sm:text-3xl font-black text-white">{metrics.totalPlayers}</span>
                    <span className="text-[11px] text-gray-400 block mt-0.5">{metrics.mainPlayers} core players</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 flex flex-col justify-between">
                  <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">🏆 Competitions</span>
                  <div className="mt-2">
                    <span className="text-2xl sm:text-3xl font-black text-white">{metrics.totalCompetitions}</span>
                    <span className="text-[11px] text-gray-400 block mt-0.5">Active &amp; past leagues</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 flex flex-col justify-between">
                  <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">🤝 Club Sponsors</span>
                  <div className="mt-2">
                    <span className="text-2xl sm:text-3xl font-black text-white">{metrics.totalSponsors}</span>
                    <span className="text-[11px] text-gray-400 block mt-0.5">Verified partners</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 flex flex-col justify-between col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">⚡ Next Fixture</span>
                  <div className="mt-2">
                    <span className="text-base sm:text-lg font-bold text-emerald-400 truncate block">
                      {metrics.nextGame?.opponent || "Configured"}
                    </span>
                    <span className="text-[11px] text-gray-400 block mt-0.5">
                      {metrics.nextGame?.date || "Schedule ready"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cloud & Database Health Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-gray-800/80 text-xs">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-black/40 border border-gray-800 text-gray-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span><strong>PostgreSQL DB:</strong> Neon Serverless Connected</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-black/40 border border-gray-800 text-gray-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span><strong>Cloud Storage:</strong> Vercel Blob Active</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-black/40 border border-gray-800 text-gray-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span><strong>Push Gateway:</strong> VAPID Keys Operational</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
