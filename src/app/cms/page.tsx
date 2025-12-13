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
            Team Management page
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
          </p>
          {/* Make buttons equal size */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 w-full">
            <button
              type="button"
              onClick={() => router.push("/cms/nextgamedetails")}
              className="inline-flex w-full justify-center items-center gap-2.5 px-6 py-3 rounded-2xl bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-500 active:bg-blue-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 transition duration-200 ease-out hover:-translate-y-0.5 min-h-[44px]"
            >
              <svg className="h-5 w-5 flex-shrink-0 opacity-90" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M5 4h1a1 1 0 011 1v1h10V5a1 1 0 011-1h1v4H5V4zm0 6h14v10a1 1 0 01-1 1H6a1 1 0 01-1-1V10zm4 3a1 1 0 100 2h6a1 1 0 100-2H9z" />
              </svg>
              <span className="whitespace-nowrap">Update Next Game</span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/cms/postmatchresult")}
              className="inline-flex w-full justify-center items-center gap-2.5 px-6 py-3 rounded-2xl bg-slate-700 text-white font-semibold shadow-sm hover:bg-slate-600 active:bg-slate-800 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 transition duration-200 ease-out hover:-translate-y-0.5 min-h-[44px]"
            >
              <svg className="h-5 w-5 flex-shrink-0 opacity-90" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M7 4h10a1 1 0 011 1v9a4 4 0 11-8 0H7a1 1 0 01-1-1V5a1 1 0 011-1zm6 10a2 2 0 104 0 2 2 0 00-4 0z" />
              </svg>
              <span className="whitespace-nowrap">Post/Edit Results</span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/cms/competition")}
              className="inline-flex w-full justify-center items-center gap-2.5 px-6 py-3 rounded-2xl bg-teal-600 text-white font-semibold shadow-sm hover:bg-teal-500 active:bg-teal-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 transition duration-200 ease-out hover:-translate-y-0.5 min-h-[44px]"
            >
              {/* Icon: add + edit */}
              <svg className="h-6 w-6 flex-shrink-0 opacity-90" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
                <path d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25z" />
                <path d="M20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
              </svg>
              <span className="whitespace-nowrap">Add/Edit Competition</span>
            </button>
          </div>
        </div>
      </section>
      {/* Footer */}
      <Footer />
    </div>
  );
}
