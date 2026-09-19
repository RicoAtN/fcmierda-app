import React from "react";
import { Roboto_Slab, Montserrat } from "next/font/google";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700", "800"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600"] });

interface DatabaseUnavailableNoticeProps {
  title?: string;
  description?: string;
  className?: string;
  compact?: boolean;
}

export default function DatabaseUnavailableNotice({
  title = "Database Unavailable",
  description = "Data is temporarily inaccessible due to database connection or quota restrictions. Automatic circuit breakers are active to conserve resources.",
  className = "",
  compact = false,
}: DatabaseUnavailableNoticeProps) {
  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs shadow-md ${className}`}
        role="alert"
      >
        <span className="shrink-0 text-sm">⚠️</span>
        <span className="font-medium truncate">{description}</span>
      </div>
    );
  }

  return (
    <div
      className={`w-full max-w-xl mx-auto rounded-2xl p-5 sm:p-6 bg-gradient-to-b from-gray-950/95 to-gray-900/90 border border-amber-500/40 shadow-2xl text-center backdrop-blur-md ${className}`}
      role="alert"
    >
      <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-amber-950/90 border border-amber-500/50 text-amber-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        <span>Database Restriction Active</span>
      </div>

      <h3
        className={`text-xl sm:text-2xl font-bold text-white mb-2 ${robotoSlab.className}`}
      >
        {title}
      </h3>

      <p
        className={`text-xs sm:text-sm text-gray-300 leading-relaxed mb-4 max-w-md mx-auto ${montserrat.className}`}
      >
        {description}
      </p>

      <div className="p-3 rounded-xl bg-black/60 border border-gray-800 text-left text-[11px] sm:text-xs text-gray-400 space-y-1.5 font-sans">
        <div className="font-bold text-amber-300 flex items-center gap-1.5">
          <span>🛡️</span>
          <span>System Protection Details</span>
        </div>
        <div className="text-gray-300">
          • Automatic circuit breakers have paused database queries to prevent excess resource consumption and network spikes.
        </div>
        <div className="text-gray-400">
          • Real-time data will automatically restore once database connection is unlocked or the quota cooldown expires.
        </div>
      </div>
    </div>
  );
}
