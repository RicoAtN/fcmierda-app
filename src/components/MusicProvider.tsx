"use client";

import React, { useState, useEffect, useRef, createContext, useContext } from 'react';

type AudioContextType = {
  isMuted: boolean;
  isPlaying: boolean;
  toggleMute: () => void;
};

export const AudioContext = createContext<AudioContextType | null>(null);

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

export default function MusicProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedMuteState = localStorage.getItem('fcmierda-music-muted');
      return savedMuteState ? JSON.parse(savedMuteState) : false;
    }
    return false;
  });
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Sync isPlaying state with audio element events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      if (!audio.muted) {
        setIsPlaying(true);
      }
    };
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('playing', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handlePause);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('playing', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handlePause);
    };
  }, []);

  // Handle mute changes and audio playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!isMuted) {
      audio.muted = false;
      if (audio.paused) {
        audio.play().then(() => {
          setIsPlaying(true);
        }).catch(error => {
          console.log("Autoplay was prevented:", error);
          setIsPlaying(false);
        });
      } else {
        setIsPlaying(true);
      }
    } else {
      audio.muted = true;
      setIsPlaying(false);
    }
    localStorage.setItem('fcmierda-music-muted', JSON.stringify(isMuted));
  }, [isMuted]);

  // First interaction fallback for browsers that block immediate autoplay
  useEffect(() => {
    if (isMuted) return;

    const handleFirstInteraction = () => {
      const audio = audioRef.current;
      if (audio && !isMuted && audio.paused) {
        audio.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {});
      }
    };

    window.addEventListener('click', handleFirstInteraction, { once: true });
    window.addEventListener('touchstart', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [isMuted]);

  const toggleMute = () => {
    setIsMuted(prev => {
      const next = !prev;
      if (next) {
        setIsPlaying(false);
      }
      return next;
    });
  };

  return (
    <AudioContext.Provider value={{ isMuted, isPlaying: !isMuted && isPlaying, toggleMute }}>
      {children}
      <audio ref={audioRef} src="/backgroundTrackMierda.mp3" loop autoPlay />
    </AudioContext.Provider>
  );
}