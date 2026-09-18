"use client";

import { login } from "../actions";
import { useActionState } from "react";
import Menu from "@/components/Menu";
import { Roboto_Slab, Montserrat } from "next/font/google";

const robotoSlab = Roboto_Slab({
  subsets: ["latin"],
  weight: ["700", "900"],
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const initialState = {
  error: "",
};

export default function LoginPage() {
  const [state, formAction] = useActionState(login, initialState);

  return (
    <div className={`relative flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-gray-900 text-white ${montserrat.className}`}>
      <Menu />

      <div className="w-full max-w-md rounded-2xl border border-gray-800 p-7 sm:p-9 shadow-2xl bg-gray-950/85 backdrop-blur-md text-white mt-12 sm:mt-0">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600/30 to-emerald-400/10 border border-emerald-500/30 flex items-center justify-center text-2xl shadow-inner mb-3">
            🔐
          </div>
          <h1 className={`text-2xl sm:text-3xl font-black tracking-tight text-white ${robotoSlab.className}`}>
            Admin Login
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-gray-400 max-w-xs leading-relaxed">
            Login to access CMS management tools for FC Mierda matchdays, roster & statistics.
          </p>
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          <div>
            <label htmlFor="username" className="mb-1.5 block text-xs font-semibold text-gray-300 uppercase tracking-wider">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              required
              autoComplete="username"
              placeholder="Enter admin username"
              className="w-full rounded-xl border border-gray-700 bg-black/60 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition-all"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-gray-300 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-700 bg-black/60 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition-all"
            />
          </div>

          {state?.error && (
            <div className="text-xs sm:text-sm text-red-300 bg-red-950/70 border border-red-800/80 rounded-xl p-3 text-center flex items-center justify-center gap-2">
              <span>⚠️</span>
              <span>{state.error}</span>
            </div>
          )}

          <button
            type="submit"
            className="mt-4 w-full rounded-full bg-emerald-600 hover:bg-emerald-500 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
          >
            Log In
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] text-gray-500">
          Need access? Contact team management to request credentials.
        </p>
      </div>
    </div>
  );
}
