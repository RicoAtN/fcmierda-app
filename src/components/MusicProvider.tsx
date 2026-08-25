"use client";

import React, {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
  useCallback,
} from "react";

type AudioContextType = {
  isMuted: boolean;
  isPlaying: boolean;
  toggleMute: () => void;
};

export const AudioContext = createContext<AudioContextType | null>(null);

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
};

const STORAGE_KEY = "fcmierda-music-muted";

export default function MusicProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize from localStorage if available (client-side), default to false (unmuted) for new users
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved !== null) {
          return JSON.parse(saved) === true;
        }
      } catch {}
    }
    return false;
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const userInteracted = useRef<boolean>(false);

  // Sync state with localStorage on initial mount & handle initial play
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const shouldMute = JSON.parse(saved) === true;
        setIsMuted(shouldMute);
        audio.muted = shouldMute;
        if (shouldMute) {
          audio.pause();
          setIsPlaying(false);
          return;
        }
      }
    } catch (e) {
      console.warn("Could not read music preference:", e);
    }

    // New user (or unmuted returning user): attempt autoplay
    audio.muted = false;
    audio
      .play()
      .then(() => {
        setIsPlaying(true);
      })
      .catch(() => {
        // Autoplay policy prevented immediate playback; interaction listeners will trigger it
        setIsPlaying(false);
      });
  }, []);

  // Listen for native audio events to keep isPlaying in sync
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      if (!audio.muted) {
        setIsPlaying(true);
      }
    };
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("playing", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handlePause);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("playing", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handlePause);
    };
  }, []);

  // First interaction fallback for browsers that block immediate autoplay (only for unmuted users)
  useEffect(() => {
    if (isMuted) return;

    const handleFirstInteraction = () => {
      userInteracted.current = true;
      const audio = audioRef.current;
      if (!audio) return;

      // Double check localStorage before starting playback on interaction
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved !== null && JSON.parse(saved) === true) {
          return;
        }
      } catch {}

      if (!audio.muted && audio.paused) {
        audio
          .play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(() => {});
      }
    };

    window.addEventListener("click", handleFirstInteraction, { once: true });
    window.addEventListener("touchstart", handleFirstInteraction, { once: true });
    window.addEventListener("keydown", handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };
  }, [isMuted]);

  // Toggle Mute handler
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      const audio = audioRef.current;

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}

      if (audio) {
        if (next) {
          // Muting
          audio.muted = true;
          audio.pause();
          setIsPlaying(false);
        } else {
          // Unmuting
          audio.muted = false;
          audio
            .play()
            .then(() => {
              setIsPlaying(true);
            })
            .catch(() => {
              setIsPlaying(false);
            });
        }
      }

      return next;
    });
  }, []);

  return (
    <AudioContext.Provider
      value={{
        isMuted,
        isPlaying: !isMuted && isPlaying,
        toggleMute,
      }}
    >
      {children}
      <audio
        ref={audioRef}
        src="/backgroundTrackMierda.mp3"
        loop
        muted={isMuted}
        preload="auto"
      />
    </AudioContext.Provider>
  );
}