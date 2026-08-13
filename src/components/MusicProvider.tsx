"use client";

import React, { useState, useEffect, useRef, createContext, useContext } from 'react';

type AudioContextType = {
  isMuted: boolean;
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

  useEffect(() => {
    if (audioRef.current && !isMuted && audioRef.current.paused) {
      audioRef.current.play().catch(error => console.log("Autoplay was prevented:", error));
    }
    localStorage.setItem('fcmierda-music-muted', JSON.stringify(isMuted));
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const toggleMute = () => setIsMuted(prev => !prev);

  return (
    <AudioContext.Provider value={{ isMuted, toggleMute }}>
      {children}
      <audio ref={audioRef} src="/backgroundTrackMierda.mp3" loop autoPlay />
    </AudioContext.Provider>
  );
}