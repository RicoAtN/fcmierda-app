"use client";
import { Roboto_Slab, Montserrat } from "next/font/google";
import Menu from "@/components/Menu";
import Footer from "@/components/Footer"; // Add this import at the top
import { useRouter } from "next/navigation";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "600"] });

export default function CMSPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen flex flex-col items-center bg-gray-900">
      <Menu />
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
            Schedule & Results CMS
          </h1>
          <p
            className={`text-lg sm:text-xl text-white font-medium mb-8 drop-shadow-lg ${montserrat.className}`}
            style={{ maxWidth: 600 }}
          >
            Choose what you want to do below: <br />
            <br />
            <span className="font-semibold">
              Update the next game details with attendance or post the result of a played match with relevant match details.
            </span>
            <br />
            <br />
            <span className="font-semibold">
              Create or edit a competition to add opponent teams or update final standings.
            </span>
          </p>
          <div className="w-full max-w-md flex flex-col gap-3 mt-6">
            <button
              type="button"
              onClick={() => router.push("/cms/nextgamedetails")}
              className="inline-flex w-full justify-center items-center gap-2.5 px-6 py-3 rounded-lg bg-gray-800 text-gray-100 font-semibold shadow border border-gray-600 hover:bg-gray-700 hover:text-green-300 transition min-h-[44px]"
            >
              Create or edit next game
            </button>

            <button
              type="button"
              onClick={() => router.push("/cms/postmatchresult")}
              className="inline-flex w-full justify-center items-center gap-2.5 px-6 py-3 rounded-lg bg-gray-800 text-gray-100 font-semibold shadow border border-gray-600 hover:bg-gray-700 hover:text-blue-300 transition min-h-[44px]"
            >
              Create or edit match result
            </button>

            <button
              type="button"
              onClick={() => router.push("/cms/competition")}
              className="inline-flex w-full justify-center items-center gap-2.5 px-6 py-3 rounded-lg bg-gray-800 text-gray-100 font-semibold shadow border border-gray-600 hover:bg-gray-700 hover:text-yellow-300 transition min-h-[44px]"
            >
              Create or edit competition
            </button>
          </div>
        </div>
      </section>
      {/* Footer */}
      <Footer />
    </div>
  );
}
