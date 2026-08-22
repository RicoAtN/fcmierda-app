import React from "react";

interface SoundWaveIconProps {
  className?: string;
  isAnimated?: boolean;
}

export default function SoundWaveIcon({
  className = "w-6 h-6",
  isAnimated = true,
}: SoundWaveIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 26 24"
      fill="none"
      className={`inline-block select-none ${className}`}
      aria-hidden="true"
    >
      {/* Speaker Body / Soundbar */}
      <g className={isAnimated ? "animate-speaker-bass" : ""}>
        {/* Speaker back box & cone */}
        <path
          d="M3 9.5C3 8.67 3.67 8 4.5 8H7.5L13.2 3.44C13.84 2.93 14.8 3.39 14.8 4.21V19.79C14.8 20.61 13.84 21.07 13.2 20.56L7.5 16H4.5C3.67 16 3 15.33 3 14.5V9.5Z"
          fill="currentColor"
        />
      </g>

      {/* Inner Sound Wave */}
      <path
        d="M17.5 9C18.2 9.85 18.6 10.9 18.6 12C18.6 13.1 18.2 14.15 17.5 15"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        className={isAnimated ? "animate-sound-wave-1" : "opacity-80"}
      />

      {/* Middle Sound Wave */}
      <path
        d="M20.2 6.5C21.6 8 22.4 9.9 22.4 12C22.4 14.1 21.6 16 20.2 17.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        className={isAnimated ? "animate-sound-wave-2" : "opacity-60"}
      />

      {/* Outer Sound Wave */}
      <path
        d="M23 4C24.8 6.1 25.8 8.9 25.8 12C25.8 15.1 24.8 17.9 23 20"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        className={isAnimated ? "animate-sound-wave-3" : "opacity-40"}
      />
    </svg>
  );
}
