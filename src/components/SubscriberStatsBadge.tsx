"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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

  const onStatsUpdateRef = useRef(onStatsUpdate);
  useEffect(() => {
    onStatsUpdateRef.current = onStatsUpdate;
  }, [onStatsUpdate]);

  const fetchStats = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const res = await fetch(`/api/push/stats?_t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PushStatsResponse = await res.json();
      if (data && data.success) {
        setStats(data);
        if (onStatsUpdateRef.current) {
          onStatsUpdateRef.current(data.total);
        }
      }
    } catch (err) {
      console.warn("Failed to load subscriber stats:", err);
    } finally {
      setLoading(false);
      if (manual) {
        setTimeout(() => setIsRefreshing(false), 400);
      }
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const borderColor =
    theme === "green" ? "border-emerald-500/30" : "border-blue-500/30";
  const badgeTextColor =
    theme === "green" ? "text-emerald-400" : "text-blue-400";
  const indicatorColor =
    theme === "green" ? "bg-emerald-500" : "bg-blue-500";

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          className={`inline-flex items-center gap-2 bg-gray-900/90 border ${borderColor} rounded-full px-3 py-1.5 text-xs text-gray-200 shadow-sm backdrop-blur-md`}
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
            className="text-gray-400 hover:text-white transition-colors p-0.5 ml-0.5 rounded-full hover:bg-gray-800 focus:outline-none cursor-pointer"
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
          <div className="inline-flex items-center gap-1.5 bg-gray-900/90 px-2.5 py-1 rounded-full border border-gray-700/80 text-gray-300 shadow-xs">
            <span>💻</span>
            <span>Desktop:</span>
            <strong className="text-white font-mono">
              {loading ? "-" : stats.breakdown.desktop}
            </strong>
          </div>

          <div className="inline-flex items-center gap-1.5 bg-gray-900/90 px-2.5 py-1 rounded-full border border-gray-700/80 text-gray-300 shadow-xs">
            <span>🤖</span>
            <span>Android:</span>
            <strong className="text-white font-mono">
              {loading ? "-" : stats.breakdown.android}
            </strong>
          </div>

          <div className="inline-flex items-center gap-1.5 bg-gray-900/90 px-2.5 py-1 rounded-full border border-gray-700/80 text-gray-300 shadow-xs">
            <span>🍎</span>
            <span>iOS:</span>
            <strong className="text-white font-mono">
              {loading ? "-" : stats.breakdown.ios}
            </strong>
          </div>

          {stats.breakdown.other > 0 && (
            <div
              className="inline-flex items-center gap-1.5 bg-gray-900/90 px-2.5 py-1 rounded-full border border-amber-500/40 text-amber-300 shadow-xs"
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
