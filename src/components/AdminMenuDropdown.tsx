"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { logout } from "@/app/cms/actions";

export default function AdminMenuDropdown() {
  const [username, setUsername] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Read the non-httpOnly cookie to get the logged-in username
    const match = document.cookie.match(new RegExp('(^| )admin_username=([^;]+)'));
    if (match) setUsername(decodeURIComponent(match[2]));
  }, []);

  if (!username) {
    return (
      <Link href="/cms/login" className="relative flex flex-col items-center group" aria-label="Admin Login" title="Admin Login">
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

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center gap-1 sm:gap-1.5 md:gap-2 bg-gray-900/85 hover:bg-gray-800 backdrop-blur-md px-2.5 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-full text-white hover:text-emerald-400 transition-colors shadow-md border border-gray-700 focus:outline-none shrink-0"
      >
        <span className="font-semibold text-[11px] sm:text-xs md:text-sm lg:text-base truncate max-w-[80px] sm:max-w-[120px] md:max-w-[180px] lg:max-w-xs">
          <span className="hidden md:inline">Welcome, </span>{username}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 sm:w-44 md:w-48 bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-xl shadow-2xl py-1 z-50 overflow-hidden">
          <Link 
            href="/cms" 
            className="block px-3.5 sm:px-4 py-2 text-xs sm:text-sm text-gray-200 hover:bg-gray-800 hover:text-emerald-400 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Admin Overview
          </Link>
          <Link 
            href="/cms/analytics" 
            className="block px-3.5 sm:px-4 py-2 text-xs sm:text-sm text-gray-200 hover:bg-gray-800 hover:text-emerald-400 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Analytics &amp; Admins
          </Link>
          <form action={logout} className="w-full">
            <button 
              type="submit" 
              className="w-full text-left px-3.5 sm:px-4 py-2 text-xs sm:text-sm text-red-400 hover:bg-gray-800 hover:text-red-300 transition-colors"
            >
              Logout
            </button>
          </form>
        </div>
      )}
    </div>
  );
}