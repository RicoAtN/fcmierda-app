import { Roboto_Slab, Montserrat } from "next/font/google";
import Menu from "@/components/Menu";
import Footer from "@/components/Footer";
import Link from "next/link";
import { sql } from "@/lib/db";
import { getCmsActivityLogs, CmsActivityLog } from "@/lib/cms-logger";
import ClientAnalyticsSections from "./ClientAnalyticsSections";

import DatabaseUnavailableNotice from "@/components/DatabaseUnavailableNotice";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700", "800", "900"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

// Enable ISR Edge Caching (60 seconds) to reduce Vercel compute usage and eliminate continuous re-rendering
export const revalidate = 60;

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

async function getAnalyticsData() {
  try {
    const [
      admins,
      summaryRows,
      recentSubs,
      nextGameRes,
      activityLogs,
    ] = await Promise.all([
      sql<AdminUser[]>`
        SELECT id, user_name 
        FROM admin_overview 
        ORDER BY id ASC;
      `,
      sql<[{
        push_total: number;
        push_desktop: number;
        push_android: number;
        push_ios: number;
        total_matches: number;
        total_players: number;
        main_players: number;
        total_competitions: number;
        total_sponsors: number;
      }]>`
        SELECT 
          (SELECT count(*)::int FROM push_subscriptions) as push_total,
          (SELECT count(*)::int FROM push_subscriptions WHERE LOWER(COALESCE(device_type, '')) = 'desktop') as push_desktop,
          (SELECT count(*)::int FROM push_subscriptions WHERE LOWER(COALESCE(device_type, '')) = 'android') as push_android,
          (SELECT count(*)::int FROM push_subscriptions WHERE LOWER(COALESCE(device_type, '')) = 'ios') as push_ios,
          (SELECT count(*)::int FROM match_result) as total_matches,
          (SELECT count(*)::int FROM player_statistics) as total_players,
          (SELECT count(*)::int FROM player_statistics WHERE main_player = true) as main_players,
          (SELECT count(*)::int FROM competition) as total_competitions,
          (SELECT count(*)::int FROM sponsors) as total_sponsors;
      `,
      sql<PushSubscriber[]>`
        SELECT id, device_type, user_agent, created_at, endpoint 
        FROM push_subscriptions 
        ORDER BY created_at DESC 
        LIMIT 10;
      `,
      sql<{
        opponent: string | null;
        date: string | null;
        kickoff: string | null;
        location: string | null;
        competition: string | null;
      }[]>`
        SELECT opponent, date, kickoff, location, competition 
        FROM next_game 
        ORDER BY id DESC 
        LIMIT 1;
      `,
      getCmsActivityLogs(40),
    ]);

    const summary = summaryRows[0] || {
      push_total: 0,
      push_desktop: 0,
      push_android: 0,
      push_ios: 0,
      total_matches: 0,
      total_players: 0,
      main_players: 0,
      total_competitions: 0,
      total_sponsors: 0,
    };

    const pushTotal = summary.push_total || 0;
    const deviceBreakdown = {
      desktop: summary.push_desktop || 0,
      android: summary.push_android || 0,
      ios: summary.push_ios || 0,
      other: Math.max(0, pushTotal - ((summary.push_desktop || 0) + (summary.push_android || 0) + (summary.push_ios || 0))),
    };

    const metrics: SystemMetrics = {
      totalMatches: summary.total_matches || 0,
      totalPlayers: summary.total_players || 0,
      mainPlayers: summary.main_players || 0,
      totalCompetitions: summary.total_competitions || 0,
      totalSponsors: summary.total_sponsors || 0,
      nextGame: nextGameRes[0] || null,
    };

    return {
      admins,
      pushTotal,
      deviceBreakdown,
      recentSubs,
      metrics,
      activityLogs,
      isDbError: false,
    };
  } catch (error) {
    console.error("Failed to fetch analytics data:", error);
    return {
      admins: [],
      pushTotal: 0,
      deviceBreakdown: { desktop: 0, android: 0, ios: 0, other: 0 },
      recentSubs: [],
      metrics: {
        totalMatches: 0,
        totalPlayers: 0,
        mainPlayers: 0,
        totalCompetitions: 0,
        totalSponsors: 0,
        nextGame: null,
      },
      activityLogs: [],
      isDbError: true,
    };
  }
}

export default async function AnalyticsPage() {
  const { admins, pushTotal, deviceBreakdown, recentSubs, metrics, activityLogs, isDbError } = await getAnalyticsData();

  return (
    <div className={`relative min-h-screen flex flex-col items-center bg-gray-900 text-white overflow-x-hidden ${montserrat.className}`}>
      <Menu />

      <main className="w-full flex-1 flex flex-col items-center pt-24 sm:pt-36 pb-20 px-3.5 sm:px-6">
        {/* Navigation Breadcrumbs & Jump Anchors */}
        <div className="max-w-5xl w-full mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/cms"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gray-900/90 hover:bg-gray-800 border border-gray-700 text-xs sm:text-sm font-semibold text-gray-200 hover:text-emerald-300 transition-all shadow-sm"
          >
            <span>←</span>
            <span>Back to CMS</span>
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold">
            <a
              href="#activity-logs"
              className="px-3.5 py-1.5 rounded-full bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 transition-all shadow-sm"
            >
              📜 Activity Logs
            </a>
            <a
              href="#admins"
              className="px-3.5 py-1.5 rounded-full bg-gray-900/90 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white transition-all shadow-sm"
            >
              👥 Admins &amp; Roles
            </a>
            <a
              href="#push-analytics"
              className="px-3.5 py-1.5 rounded-full bg-gray-900/90 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white transition-all shadow-sm"
            >
              🔔 Push Audience
            </a>
            <a
              href="#platform-metrics"
              className="px-3.5 py-1.5 rounded-full bg-gray-900/90 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white transition-all shadow-sm"
            >
              📊 System Metrics
            </a>
          </div>
        </div>

        {/* Hero Header */}
        <div className="max-w-3xl w-full text-center mb-8 sm:mb-10">
          <h1 className={`text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-3 drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)] ${robotoSlab.className}`}>
            Logging &amp; Analytics
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-200 font-medium max-w-2xl mx-auto leading-relaxed">
            Audit logs of CMS actions, administrator role permissions, web push subscribers, and database system metrics.
          </p>
        </div>

        {isDbError && (
          <div className="max-w-3xl w-full mb-8">
            <DatabaseUnavailableNotice
              title="Telemetry & Logs Database Restricted"
              description="Analytics telemetry and audit logs cannot be queried while database circuit breaker cooldown or quota limits are active."
            />
          </div>
        )}

        {/* Interactive Collapsible Sections Accordion (Collapsed by Default) */}
        <ClientAnalyticsSections
          admins={admins}
          pushTotal={pushTotal}
          deviceBreakdown={deviceBreakdown}
          recentSubs={recentSubs}
          metrics={metrics}
          activityLogs={activityLogs}
        />
      </main>

      <Footer />
    </div>
  );
}
