import { Roboto_Slab, Montserrat } from "next/font/google";
import Menu from "@/components/Menu";
import Footer from "@/components/Footer";
import { sql } from "@/lib/db";
import Link from "next/link";
import ClientPlayerManagement from "./ClientPlayerManagement";
import ClientAddPlayer from "./ClientAddPlayer";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700", "900"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const dynamic = "force-dynamic";

async function getAllPlayers() {
  try {
    const rows = await sql`
      SELECT * FROM player_statistics ORDER BY player_name ASC
    `;
    return rows || [];
  } catch (err) {
    console.error("Failed to load players in team management:", err);
    return [];
  }
}

export default async function TeamManagementPage() {
  const players = await getAllPlayers();

  return (
    <div className={`relative min-h-screen flex flex-col items-center bg-gray-900 text-white overflow-x-hidden ${montserrat.className}`}>
      <Menu />

      <main className="w-full flex-1 flex flex-col items-center pt-24 sm:pt-36 pb-20 px-3.5 sm:px-6">
        {/* Navigation Breadcrumb */}
        <div className="max-w-5xl w-full mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/cms"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gray-900/90 hover:bg-gray-800 border border-gray-700 text-xs sm:text-sm font-semibold text-gray-200 hover:text-emerald-300 transition-all shadow-sm"
          >
            <span>←</span>
            <span>Back to CMS</span>
          </Link>

          <div className="flex items-center gap-2">
            <a
              href="#current-players"
              className="px-3.5 py-1.5 rounded-full bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 font-semibold text-xs transition-all shadow-sm"
            >
              👥 Squad Overview
            </a>
            <a
              href="#add-new-player"
              className="px-3.5 py-1.5 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 font-semibold text-xs transition-all shadow-sm"
            >
              ➕ Add Player
            </a>
          </div>
        </div>

        {/* Hero Header */}
        <div className="max-w-2xl w-full text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-2xl mb-3 shadow-inner">
            ⚡
          </div>
          <h1 className={`text-2xl sm:text-4xl font-black tracking-tight text-white mb-2 ${robotoSlab.className}`}>
            Team Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 font-medium max-w-lg mx-auto">
            Manage player rosters, update shirt numbers & positions, edit biography cards, and upload profile photos.
          </p>
        </div>

        {/* Current Players Section */}
        <ClientPlayerManagement players={players} />

        {/* Add New Player Section */}
        <ClientAddPlayer />
      </main>

      <Footer />
    </div>
  );
}