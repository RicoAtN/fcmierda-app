"use client";
import Menu from "@/components/Menu";
import Footer from "@/components/Footer";

export default function CompetitionCMSPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center bg-gray-900">
      <Menu />

      {/* Intro section */}
      <section className="w-full flex justify-center items-center py-12 px-4 bg-gray-900">
        <div className="max-w-2xl w-full flex flex-col items-center text-center mt-16 sm:mt-28">
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-4 text-white uppercase tracking-wider">
            Competitions
          </h1>
          <p className="text-white/80 text-lg sm:text-xl">
            Manage competition rounds: overview and creation.
          </p>
        </div>
      </section>

      {/* Main content */}
      <section className="w-full flex flex-col items-center gap-12 py-12 px-4 bg-gray-800">
        {/* Competitions overview */}
        <div className="max-w-4xl w-full rounded-2xl p-6 sm:p-10 text-white bg-gray-900 shadow-xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Competitions overview</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-700 rounded-lg text-left">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-2 border-b border-gray-700">ID</th>
                  <th className="px-4 py-2 border-b border-gray-700">Name</th>
                  <th className="px-4 py-2 border-b border-gray-700">Opponents</th>
                </tr>
              </thead>
              <tbody>
                {/* Placeholder rows; populate when wiring data */}
                <tr>
                  <td className="px-4 py-2 border-b border-gray-800 text-white/60">—</td>
                  <td className="px-4 py-2 border-b border-gray-800 text-white/60">—</td>
                  <td className="px-4 py-2 border-b border-gray-800 text-white/60">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Create new competition */}
        <div className="max-w-2xl w-full rounded-2xl p-6 sm:p-10 text-white bg-gray-900 shadow-xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Create new competition</h2>
          <form className="space-y-4 text-left">
            <div>
              <label className="block font-semibold mb-1">Competition name</label>
              <input
                type="text"
                className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white"
                placeholder="e.g. Powerleague First Division Rotterdam 7vs7 - October 2025"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Opponents (comma-separated)</label>
              <textarea
                className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white"
                placeholder="e.g. Peenvogels, ABC-Positief, FC Multiplein, FC Degradatiekandidaten, Ramnous Rotterdam"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-700 text-white font-semibold shadow-sm hover:bg-slate-600 active:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reset
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-teal-600 text-white font-semibold shadow-sm hover:bg-teal-500 active:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                Create
              </button>
            </div>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
}