"use client";

import { useEffect, useState, useCallback } from "react";
import { PushStatsResponse } from "@/types/notifications";

interface SubscriberStatsBadgeProps {
  theme?: "green" | "blue";
  onStatsUpdate?: (total: number) => void;
}

export default function SubscriberStatsBadge({
  theme = "green",
  onStatsUpdate,
}: SubscriberStatsBadgeProps) {
  const [stats, setStats] = useState<PushStatsResponse>({
    success: true,
    total: 0,
    breakdown: { desktop: 0, android: 0, ios: 0, other: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const res = await fetch(`/api/push/stats?_t=${Date.now()}`, {
        cache: "no-store",
      });
      const data: PushStatsResponse = await res.json();
      if (data && data.success) {
        setStats(data);
        if (onStatsUpdate) {
          onStatsUpdate(data.total);
        }
      }
    } catch (err) {
      console.error("Failed to load subscriber stats:", err);
    } finally {
      setLoading(false);
      if (manual) {
        setTimeout(() => setIsRefreshing(false), 400);
      }
    }
  }, [onStatsUpdate]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const borderColor =
    theme === "green" ? "border-green-700/50" : "border-blue-700/50";
  const badgeTextColor =
    theme === "green" ? "text-green-400" : "text-blue-400";
  const indicatorColor =
    theme === "green" ? "bg-green-500" : "bg-blue-500";

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          className={`inline-flex items-center gap-2 bg-gray-900/90 border ${borderColor} rounded-lg px-2.5 py-1 text-xs text-gray-200 shadow-sm`}
        >
          <span
            className={`inline-block w-2 h-2 rounded-full ${indicatorColor} ${
              loading ? "opacity-40" : "animate-pulse"
            }`}
          />
          <span className="font-semibold text-gray-300">Audience:</span>
          <span className={`font-bold ${badgeTextColor}`}>
            {loading ? "..." : `${stats.total} ${stats.total === 1 ? "Subscriber" : "Subscribers"}`}
          </span>
          <button
            type="button"
            onClick={() => fetchStats(true)}
            title="Refresh subscriber count"
            className="text-gray-400 hover:text-white transition-colors p-0.5 ml-0.5 rounded hover:bg-gray-800 focus:outline-none"
            aria-label="Refresh subscriber count"
          >
            <svg
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        {/* Device breakdown pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs text-gray-300">
          <div className="inline-flex items-center gap-1 bg-gray-900/90 px-2 py-0.5 rounded border border-gray-700 text-gray-300">
            <span>💻</span>
            <span>Desktop:</span>
            <strong className="text-white font-mono">
              {loading ? "-" : stats.breakdown.desktop}
            </strong>
          </div>

          <div className="inline-flex items-center gap-1 bg-gray-900/90 px-2 py-0.5 rounded border border-gray-700 text-gray-300">
            <span>🤖</span>
            <span>Android:</span>
            <strong className="text-white font-mono">
              {loading ? "-" : stats.breakdown.android}
            </strong>
          </div>

          <div className="inline-flex items-center gap-1 bg-gray-900/90 px-2 py-0.5 rounded border border-gray-700 text-gray-300">
            <span>🍎</span>
            <span>iOS:</span>
            <strong className="text-white font-mono">
              {loading ? "-" : stats.breakdown.ios}
            </strong>
          </div>

          {stats.breakdown.other > 0 && (
            <div
              className="inline-flex items-center gap-1 bg-gray-900/90 px-2 py-0.5 rounded border border-amber-600/40 text-amber-300"
              title="Legacy subscriptions without device info. Updates automatically when visitors open the webapp."
            >
              <span>📱</span>
              <span>Pending Sync:</span>
              <strong className="text-white font-mono">
                {loading ? "-" : stats.breakdown.other}
              </strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
