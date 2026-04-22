import { Roboto_Slab, Montserrat } from "next/font/google";
import Menu from "@/components/Menu";
import Footer from "@/components/Footer";
import { Pool } from "pg";
import ClientPlayerManagement from "./ClientPlayerManagement";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "600"] });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const dynamic = "force-dynamic";

async function getAllPlayers() {
  const { rows } = await pool.query(
    `SELECT * FROM player_statistics ORDER BY player_name ASC`
  );
  return rows;
}

export default async function TeamManagementPage() {
  const players = await getAllPlayers();

  return (
    <div className="relative min-h-screen flex flex-col items-center bg-gray-900">
      <Menu />
      
      {/* Header Section */}
      <section
        className="w-full flex justify-center items-center py-10 px-4 bg-gray-900"
        style={{
          background: "linear-gradient(135deg, #232526 0%, #414345 100%)",
        }}
      >
        <div className="max-w-2xl w-full flex flex-col items-center text-center mt-16 sm:mt-32">
          <h1
            className={`text-3xl sm:text-5xl font-extrabold mb-4 ${robotoSlab.className}`}
            style={{
              letterSpacing: "0.07em",
              textShadow: `
                0 0 4px #0b3d1a,
                0 2px 0 #0b3d1a,
                0 1px 0 #fff
              `,
              color: "#fff",
              textTransform: "uppercase",
            }}
          >
            Team Management
          </h1>
          <p
            className={`text-lg sm:text-xl text-white font-medium mb-8 drop-shadow-lg ${montserrat.className}`}
            style={{ maxWidth: 600 }}
          >
            Manage the team members here.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <a
              href="#current-players"
              className="px-6 py-3 rounded-lg bg-gray-800 text-gray-100 font-semibold shadow border border-gray-600 hover:bg-gray-700 hover:text-green-300 transition"
              aria-label="View or edit current players"
              style={{ letterSpacing: "0.03em" }}
            >
              View or edit current players
            </a>
            <a
              href="#add-new-player"
              className="px-6 py-3 rounded-lg bg-gray-800 text-gray-100 font-semibold shadow border border-gray-600 hover:bg-gray-700 hover:text-purple-300 transition"
              aria-label="Add new player"
              style={{ letterSpacing: "0.03em" }}
            >
              Add new player
            </a>
          </div>
          <a
            href="/cms"
            className="bg-gray-700 hover:bg-gray-800 text-white px-6 py-3 rounded-md font-bold text-lg shadow transition-all duration-150 border border-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 mt-8 inline-block"
          >
            Back to CMS
          </a>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="w-full flex flex-col items-center gap-12 py-12 px-4 bg-gray-800 flex-grow">
        {/* Current Players Section */}
        <ClientPlayerManagement players={players} />

        {/* Add New Player Section */}
        <div id="add-new-player" className="max-w-4xl w-full rounded-2xl p-6 sm:p-10 text-white bg-gray-900 shadow-xl mx-auto scroll-mt-24">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Add New Player</h2>
          <p className="text-gray-400">Form to add a new player will go here.</p>
          {/* Placeholder for form */}
        </div>
      </section>

      <Footer />
    </div>
  );
}