"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Roboto_Slab, Montserrat } from "next/font/google";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "600"] });

export interface Sponsor {
  id: number | string;
  name: string;
  badge?: string;
  logo: string;
  url: string;
  tagline?: string;
  description?: string;
  button_label?: string;
  highlight_color?: string;
  display_order?: number;
}

// Fallback seed sponsors while loading or if DB empty
const defaultSponsors: Sponsor[] = [
  {
    id: "momo",
    name: "Momo Barbershop",
    badge: "Official Barbershop",
    logo: "/momoLogo.jpg",
    url: "https://www.momobarbershop.com/",
    tagline: "FC Mierda's favorite barbershop",
    description:
      "Keeping the squad fresh, styled, and razor-sharp on and off the pitch. Momo is far more than a barbershop—it's a premium haircut experience where you can enjoy a coffee, catch up on good conversation, and treat yourself to the house specialty: a legendary Calippo ice cream.",
    button_label: "Visit momobarbershop.com",
    highlight_color: "emerald",
  },
  {
    id: "secondlove",
    name: "Second Love",
    badge: "Club Sponsor",
    logo: "/SecondloveLogo.jpg",
    url: "https://www.secondlove.nl/",
    tagline: "Discreet & exciting adventures",
    description:
      "Sure, football will always be your first love—but the ball doesn't cuddle back! Second Love gives you the chance to find love right next to football. Completely discreet, exciting, and with zero VAR checking your moves.",
    button_label: "Visit secondlove.nl",
    highlight_color: "rose",
  },
];

function SponsorCard({ sponsor, isSecond }: { sponsor: Sponsor; isSecond?: boolean }) {
  return (
    <div
      className={`relative flex flex-col justify-between p-6 sm:p-7 rounded-2xl transition-all duration-300 text-left bg-gray-850/90 border border-gray-700/80 shadow-xl hover:border-emerald-500/60 hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.25)] ${
        !isSecond ? "border-emerald-500/40" : ""
      }`}
    >
      <div>
        {/* Category Badge */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-emerald-950/70 border-emerald-500/40 text-emerald-300">
            {sponsor.badge || "Club Sponsor"}
          </span>

          <span className="text-xs text-gray-400 font-medium">
            Official Partner
          </span>
        </div>

        {/* Logo Container */}
        <div className="w-full h-36 sm:h-44 rounded-xl bg-gray-950/90 border border-gray-800 flex items-center justify-center p-4 mb-5 overflow-hidden group">
          {sponsor.logo ? (
            <Image
              src={sponsor.logo}
              alt={`${sponsor.name} logo`}
              width={320}
              height={180}
              unoptimized
              className="max-h-full max-w-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <span className="text-sm text-gray-500 font-medium">Logo</span>
          )}
        </div>

        {/* Sponsor Name & Tagline */}
        <h3 className={`text-xl sm:text-2xl font-bold text-white mb-1.5 ${robotoSlab.className}`}>
          {sponsor.name}
        </h3>

        {sponsor.tagline && (
          <p className="text-sm font-semibold text-emerald-400 mb-2">
            {sponsor.tagline}
          </p>
        )}

        {/* Description */}
        {sponsor.description && (
          <p className={`text-xs sm:text-sm text-gray-300 leading-relaxed mb-6 ${montserrat.className}`}>
            {sponsor.description}
          </p>
        )}
      </div>

      {/* Call to Action Button */}
      <a
        href={sponsor.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 cursor-pointer"
      >
        <span>{sponsor.button_label || "Visit website"}</span>
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </a>
    </div>
  );
}

export default function Sponsors() {
  const [sponsors, setSponsors] = useState<Sponsor[]>(defaultSponsors);
  const [displayedIndex, setDisplayedIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Animation state machine: "idle" -> "exiting" -> "entering" -> "idle"
  const [animStage, setAnimStage] = useState<"idle" | "exiting" | "entering">("idle");
  const [animDirection, setAnimDirection] = useState<"forward" | "backward">("forward");
  const [enterActive, setEnterActive] = useState(false);

  // Touch gesture coordinates
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  // Fetch dynamic sponsors from API
  useEffect(() => {
    let isMounted = true;
    async function loadSponsors() {
      try {
        const res = await fetch(`/api/sponsors?_t=${Date.now()}`);
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.sponsors) && data.sponsors.length > 0) {
          setSponsors(data.sponsors);
        }
      } catch (err) {
        console.warn("Could not load dynamic sponsors, using fallback:", err);
      }
    }
    loadSponsors();
    return () => {
      isMounted = false;
    };
  }, []);

  // Responsive screen size detection
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  const total = sponsors.length;

  // Transition engine:
  // 1. Exits out to left (forward) or right (backward)
  // 2. Swaps index while out of screen
  // 3. Animates in from right (forward) or left (backward)
  const triggerTransition = useCallback(
    (targetIndex: number, direction: "forward" | "backward") => {
      if (animStage !== "idle") return;
      setAnimDirection(direction);
      setAnimStage("exiting");

      // Phase 1: Card slides out of screen
      setTimeout(() => {
        setDisplayedIndex(targetIndex);
        setAnimStage("entering");
        setEnterActive(false);

        // Phase 2: Card enters smoothly on next paint
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setEnterActive(true);
          });
        });
      }, 260);
    },
    [animStage]
  );

  // Complete enter transition back to idle
  useEffect(() => {
    if (animStage === "entering" && enterActive) {
      const timer = setTimeout(() => {
        setAnimStage("idle");
        setEnterActive(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [animStage, enterActive]);

  const nextSlide = useCallback(() => {
    if (animStage !== "idle" || total <= 1) return;
    const nextIdx = (displayedIndex + 1) % total;
    triggerTransition(nextIdx, "forward");
  }, [animStage, displayedIndex, total, triggerTransition]);

  const prevSlide = useCallback(() => {
    if (animStage !== "idle" || total <= 1) return;
    const prevIdx = (displayedIndex - 1 + total) % total;
    triggerTransition(prevIdx, "backward");
  }, [animStage, displayedIndex, total, triggerTransition]);

  const goToSlide = (targetIndex: number) => {
    if (targetIndex === displayedIndex || animStage !== "idle") return;
    const direction = targetIndex > displayedIndex ? "forward" : "backward";
    triggerTransition(targetIndex, direction);
  };

  // Auto-rotation timer (pauses on hover)
  useEffect(() => {
    // If desktop and 2 or fewer sponsors, no rotation needed
    if (!isMobile && total <= 2) return;
    if (isPaused || total <= 1 || animStage !== "idle") return;

    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [isMobile, total, isPaused, animStage, nextSlide]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartXRef.current = e.targetTouches[0].clientX;
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (touchStartXRef.current === null || touchEndXRef.current === null) return;
    const diff = touchStartXRef.current - touchEndXRef.current;
    const minSwipeDistance = 40;

    if (diff > minSwipeDistance) {
      // Swiped left -> animate out to left, in from right
      nextSlide();
    } else if (diff < -minSwipeDistance) {
      // Swiped right -> animate out to right, in from left
      prevSlide();
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  // Compute visible sponsors:
  // On mobile: 1 sponsor (displayedIndex)
  // On desktop:
  //   - If total <= 2: show both side-by-side
  //   - If total >= 3: show pair (displayedIndex and (displayedIndex + 1) % total)
  const visibleSponsors: Sponsor[] = isMobile
    ? [sponsors[displayedIndex % total]]
    : total <= 2
    ? sponsors
    : [
        sponsors[displayedIndex % total],
        sponsors[(displayedIndex + 1) % total],
      ];

  const showControls = isMobile ? total > 1 : total > 2;

  // Compute horizontal slide animation styles
  let transformStyle = "translateX(0)";
  let opacityStyle = 1;
  let transitionStyle = "none";

  if (animStage === "exiting") {
    // Current block animates out to the left (forward) or right (backward)
    transformStyle = animDirection === "forward" ? "translateX(-110%)" : "translateX(110%)";
    opacityStyle = 0;
    transitionStyle = "transform 260ms cubic-bezier(0.4, 0, 1, 1), opacity 260ms ease-in";
  } else if (animStage === "entering") {
    if (!enterActive) {
      // Prepared outside view on the opposite side
      transformStyle = animDirection === "forward" ? "translateX(110%)" : "translateX(-110%)";
      opacityStyle = 0;
      transitionStyle = "none";
    } else {
      // Slides into center view from right (forward) or left (backward)
      transformStyle = "translateX(0)";
      opacityStyle = 1;
      transitionStyle = "transform 300ms cubic-bezier(0.16, 1, 0.3, 1), opacity 300ms ease-out";
    }
  }

  return (
    <section
      id="sponsors"
      className="w-full flex justify-center items-center pt-6 sm:pt-8 pb-10 sm:pb-12 px-4 bg-gradient-to-b from-gray-900 via-gray-850 to-gray-900 border-t border-b border-gray-800 relative overflow-hidden select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Subtle ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-72 bg-gradient-to-r from-emerald-500/10 via-amber-500/5 to-rose-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-5xl w-full flex flex-col items-center text-center">
        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2 shadow-sm">
          <span>🤝</span>
          <span>FC Mierda is proudly supported by</span>
        </div>

        {/* Section Heading */}
        <h2
          className={`text-3xl sm:text-5xl font-extrabold text-white mb-2 tracking-tight ${robotoSlab.className}`}
        >
          Our Sponsors &amp; Partners
        </h2>
        <p
          className={`text-sm sm:text-base text-gray-300 mb-4 sm:mb-5 max-w-xl ${montserrat.className}`}
        >
          A huge shout-out to the sponsors who power FC Mierda on the pitch and in the third half.
        </p>

        {/* Carousel Container with Touch Gestures */}
        <div
          className="relative w-full overflow-hidden py-1 px-1"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Animated Sliding Track */}
          <div
            style={{
              transform: transformStyle,
              opacity: opacityStyle,
              transition: transitionStyle,
              willChange: "transform, opacity",
            }}
            className={`w-full grid gap-6 sm:gap-8 ${
              isMobile || visibleSponsors.length === 1
                ? "grid-cols-1 max-w-md mx-auto"
                : "grid-cols-1 md:grid-cols-2"
            }`}
          >
            {visibleSponsors.map((sponsor, idx) => (
              <SponsorCard
                key={`${sponsor.id}-${idx}`}
                sponsor={sponsor}
                isSecond={!isMobile && idx === 1}
              />
            ))}
          </div>

          {/* Navigation Arrows */}
          {showControls && (
            <div className="flex items-center justify-between w-full absolute top-1/2 -translate-y-1/2 pointer-events-none left-0 right-0 px-1 sm:px-2 z-20">
              <button
                type="button"
                onClick={prevSlide}
                disabled={animStage !== "idle"}
                aria-label="Previous sponsor"
                className="pointer-events-auto w-10 h-10 rounded-full bg-gray-900/90 border border-gray-700 hover:border-emerald-500 text-white flex items-center justify-center shadow-xl hover:bg-gray-800 transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                type="button"
                onClick={nextSlide}
                disabled={animStage !== "idle"}
                aria-label="Next sponsor"
                className="pointer-events-auto w-10 h-10 rounded-full bg-gray-900/90 border border-gray-700 hover:border-emerald-500 text-white flex items-center justify-center shadow-xl hover:bg-gray-800 transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Swipe Hint + Pagination Dots */}
        {showControls && (
          <div className="flex flex-col items-center gap-2 mt-6">
            {isMobile && (
              <span className="text-[11px] text-gray-400 font-medium">
                ← Swipe left or right to explore →
              </span>
            )}

            <div className="flex items-center gap-2">
              {sponsors.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goToSlide(i)}
                  disabled={animStage !== "idle"}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    displayedIndex % total === i
                      ? "w-7 bg-emerald-400"
                      : "w-2 bg-gray-700 hover:bg-gray-600"
                  }`}
                  aria-label={`Switch to sponsor ${i + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
