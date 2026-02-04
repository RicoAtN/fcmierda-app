"use client";
import Menu from "@/components/Menu";
import Footer from "@/components/Footer";
import PlayerAttendance from "@/components/PlayerAttendance";
import { Roboto_Slab, Montserrat } from "next/font/google";
import { useRouter } from "next/navigation";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "600"] });

export default function NextGameDetailsPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen flex flex-col items-center bg-gray-900">
      <Menu />

      <section
        className="w-full flex justify-center items-center py-10 px-4 bg-gray-900"
        style={{ background: "linear-gradient(135deg, #232526 0%, #414345 100%)" }}
      >
        <div className="max-w-2xl w-full flex flex-col items-center text-center mt-16 sm:mt-32">
          <h1
            className={`text-3xl sm:text-5xl font-extrabold mb-4 ${robotoSlab.className}`}
            style={{
              letterSpacing: "0.07em",
              textShadow: `0 0 4px #0b3d1a, 0 2px 0 #0b3d1a, 0 1px 0 #fff`,
              color: "#fff",
              textTransform: "uppercase",
            }}
          >
            Availability
          </h1>
          <p
            className={`text-lg sm:text-xl text-white font-medium mb-8 drop-shadow-lg ${montserrat.className}`}
            style={{ maxWidth: 700 }}
          >
            Please mark your availability for the upcoming match.
          </p>
          <button
            type="button"
            onClick={() => router.push("/fixtures#next-game")}
            className="bg-gray-700 hover:bg-gray-800 text-white px-6 py-3 rounded-md font-bold text-lg shadow transition-all duration-150 border border-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 mt-4"
          >
            Back to fixtures page
          </button>
        </div>
      </section>

      <section className="w-full flex flex-col items-center gap-12 py-12 px-4 bg-gray-800">
        <div className="max-w-2xl w-full rounded-2xl p-6 sm:p-10 text-white bg-gray-900 shadow-xl mx-auto">
          <h2 className={`text-xl sm:text-2xl font-bold mb-4 text-center ${robotoSlab.className}`}>
            Submit your availability
          </h2>
          <PlayerAttendance />
        </div>
      </section>

      <Footer />
    </div>
  );
}