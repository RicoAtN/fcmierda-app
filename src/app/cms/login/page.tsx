"use client";

import { login } from "../actions";
import { useActionState } from "react";
import Menu from "@/components/Menu";

const initialState = {
  error: "",
};

export default function LoginPage() {
  const [state, formAction] = useActionState(login, initialState);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4 sm:p-24 bg-gray-900">
      <Menu />
      <div className="w-full max-w-sm rounded-lg border border-gray-600 p-6 shadow-md bg-white/10 backdrop-blur-sm text-white">
        <h1 className="mb-4 text-2xl font-bold text-center">Admin Login</h1>
        <p className="mb-6 text-center text-sm text-gray-300">
          Login to access FC Mierda app features to update matches and player details. Contact Rico if you require access.
        </p>
        <form action={formAction} className="flex flex-col gap-4">
          <div>
            <label htmlFor="username" className="mb-2 block text-sm font-medium">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              required
              className="w-full rounded-md border p-2 text-black"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              className="w-full rounded-md border p-2 text-black"
            />
          </div>
          {state?.error && (
            <div className="mt-2 text-sm text-red-400 bg-red-900/50 border border-red-600 rounded p-2 text-center">
              {state.error}
            </div>
          )}
          <button
            type="submit"
            className="mt-6 w-full rounded-md bg-emerald-600 p-2 text-white hover:bg-emerald-500 font-bold transition-colors"
          >
            Log In
          </button>
        </form>
      </div>
    </div>
  );
}
