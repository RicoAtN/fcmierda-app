"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { logout } from "@/app/cms/actions";

interface NavItem {
  href: string;
  label: string;
  description: string;
  icon: string;
  badge: string;
}

const CMS_NAV_ITEMS: NavItem[] = [
  {
    href: "/cms",
    label: "Management Hub",
    description: "CMS Overview & Modules",
    icon: "🎛️",
    badge: "Hub",
  },
  {
    href: "/cms/nextgamedetails",
    label: "Next Match & Fixtures",
    description: "Schedule & Push Broadcasts",
    icon: "📅",
    badge: "Fixtures",
  },
  {
    href: "/cms/nextgameplayeravailability",
    label: "Player Availability",
    description: "Squad Attendance Tracker",
    icon: "📋",
    badge: "Lineup",
  },
  {
    href: "/cms/postmatchresult",
    label: "Match Results & Recaps",
    description: "Scores, Scorers & MOTM",
    icon: "⚽",
    badge: "Results",
  },
  {
    href: "/cms/competition",
    label: "Competitions & Standings",
    description: "Seasons, Opponents & Links",
    icon: "🏆",
    badge: "Leagues",
  },
  {
    href: "/cms/teammanagement",
    label: "Squad & Player Profiles",
    description: "Roster, Photos & Numbers",
    icon: "👥",
    badge: "Squad",
  },
];

export default function AdminMenuDropdown() {
  const [username, setUsername] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Read the non-httpOnly cookie to get the logged-in username
    const match = document.cookie.match(new RegExp("(^| )admin_username=([^;]+)"));
    if (match) setUsername(decodeURIComponent(match[2]));
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  if (!username) {
    return (
      <Link
        href="/cms/login"
        className="relative flex flex-col items-center group"
        aria-label="Admin Login"
        title="Admin Login"
      >
        <div className="relative w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12">
          <Image
            src="/admin-logo.png"
            alt="Admin"
            fill
            className="object-contain transition-transform duration-200 group-hover:scale-105"
            sizes="(max-width: 640px) 32px, (max-width: 768px) 40px, 48px"
            priority
          />
        </div>
      </Link>
    );
  }

  const initial = (username || "A").charAt(0).toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex items-center gap-1.5 sm:gap-2 bg-gray-900/90 hover:bg-gray-800 backdrop-blur-xl px-2.5 py-1 sm:px-3.5 sm:py-1.5 md:px-4 md:py-2 rounded-full text-white hover:text-emerald-400 transition-all shadow-lg border border-gray-700/80 hover:border-emerald-500/50 focus:outline-none shrink-0 cursor-pointer group"
      >
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 flex items-center justify-center text-[10px] sm:text-xs font-black shadow-inner">
          {initial}
        </div>
        <span className="font-bold text-[11px] sm:text-xs md:text-sm truncate max-w-[85px] sm:max-w-[130px] md:max-w-[180px]">
          <span className="hidden md:inline text-gray-300 font-medium">Welcome, </span>
          <span className="text-white group-hover:text-emerald-300">{username}</span>
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-gray-400 group-hover:text-emerald-300 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 md:w-84 max-h-[85vh] overflow-y-auto custom-scrollbar bg-gray-950/95 backdrop-blur-2xl border border-gray-700/80 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.85)] z-50 animate-in fade-in slide-in-from-top-2 duration-150 p-2 space-y-1">
          {/* User Profile Header Card */}
          <div className="p-3 mb-1.5 rounded-xl bg-gradient-to-r from-gray-900 via-gray-900/90 to-gray-950 border border-gray-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center text-sm font-black shrink-0 shadow-md">
                {initial}
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold text-white truncate">
                  {username}
                </div>
                <span className="text-[10px] text-emerald-400 font-medium block">
                  Club Administrator
                </span>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-bold text-emerald-300 shrink-0">
              CMS Access
            </span>
          </div>

          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Admin Navigation ({CMS_NAV_ITEMS.length} Pages)
          </div>

          {/* CMS Module Links Grid */}
          <div className="space-y-0.5">
            {CMS_NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`group flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs transition-all ${
                    isActive
                      ? "bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 shadow-sm"
                      : "hover:bg-gray-800/80 text-gray-200 hover:text-white border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base shrink-0 p-1 rounded-lg bg-black/40 border border-gray-800">
                      {item.icon}
                    </span>
                    <div className="min-w-0">
                      <div className={`font-semibold truncate text-[12px] sm:text-xs ${isActive ? "text-emerald-300 font-bold" : "text-gray-100 group-hover:text-white"}`}>
                        {item.label}
                      </div>
                      <div className="text-[10px] text-gray-400 group-hover:text-gray-300 truncate">
                        {item.description}
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${
                    isActive
                      ? "bg-emerald-900/80 text-emerald-300 border border-emerald-600/60 font-bold"
                      : "bg-gray-900 text-gray-400 group-hover:text-gray-200 border border-gray-800"
                  }`}>
                    {item.badge}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-1.5 border-t border-gray-800/80" />

          {/* Logout Action */}
          <form action={logout} className="w-full">
            <button
              type="submit"
              className="w-full flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/60 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span>🚪</span>
                <span>Sign Out of CMS</span>
              </div>
              <span className="text-[10px] text-rose-400/80">Logout →</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}