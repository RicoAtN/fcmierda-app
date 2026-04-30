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
        <Image
          src="/admin-logo.png"
          alt="Admin"
          width={65}
          height={65}
          className="object-contain transition-transform duration-200 group-hover:scale-105"
          style={{ width: 65, height: 65 }}
          priority
        />
      </Link>
    );
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center gap-1 sm:gap-2 bg-gray-800/80 backdrop-blur-md px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-white hover:text-emerald-400 transition-colors shadow-md border border-gray-600 focus:outline-none"
      >
        <span className="font-semibold text-[11px] sm:text-base truncate max-w-[70px] sm:max-w-xs">
          <span className="hidden sm:inline">Welcome, </span>{username}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 sm:mt-3 w-36 sm:w-48 bg-gray-800 border border-gray-700 rounded-md shadow-xl py-1 z-50">
          <Link 
            href="/cms" 
            className="block px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-200 hover:bg-gray-700 hover:text-emerald-400 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Admin Overview
          </Link>
          <form action={logout} className="w-full">
            <button 
              type="submit" 
              className="w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors"
            >
              Logout
            </button>
          </form>
        </div>
      )}
    </div>
  );
}