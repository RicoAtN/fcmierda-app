"use client";

import React, { useState, useRef } from "react";

interface PlayerPhotoUploaderProps {
  currentPhotoUrl?: string | null;
  playerName?: string;
  onPhotoChange: (newUrl: string | null) => void;
  disabled?: boolean;
}

export default function PlayerPhotoUploader({
  currentPhotoUrl,
  playerName = "player",
  onPhotoChange,
  disabled = false,
}: PlayerPhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Photo size must be under 5MB.");
      return;
    }

    // Validate type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPEG, PNG, WebP, AVIF).");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("playerName", playerName);
      if (currentPhotoUrl) {
        formData.append("oldPhotoUrl", currentPhotoUrl);
      }

      const res = await fetch("/api/upload/player-photo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload photo.");
      }

      onPhotoChange(data.url);
    } catch (err: any) {
      console.error("Photo upload error:", err);
      setError(err?.message || "Could not upload image. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemovePhoto = () => {
    if (confirm("Are you sure you want to remove this player's photo?")) {
      onPhotoChange(null);
      setError(null);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-gray-900/60 p-3.5 sm:p-4 rounded-xl border border-gray-800/90 shadow-inner">
        {/* Photo Thumbnail / Avatar */}
        <div className="relative w-20 h-20 rounded-2xl bg-black/60 border-2 border-gray-700 group-hover:border-emerald-500/50 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-lg transition-colors">
          {currentPhotoUrl ? (
            <img
              src={currentPhotoUrl}
              alt={playerName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-500 text-xs">
              <span className="text-2xl mb-0.5">👤</span>
              <span className="text-[10px]">No photo</span>
            </div>
          )}

          {uploading && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs">
              <svg
                className="animate-spin h-5 w-5 text-emerald-400 mb-1"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              <span className="text-[10px] text-emerald-300 font-semibold">Uploading</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex-1 flex flex-col gap-2 w-full">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/png, image/jpeg, image/webp, image/avif, image/gif"
            className="hidden"
            disabled={disabled || uploading}
          />

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs sm:text-sm font-semibold transition border border-emerald-500/40 shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <span>📷</span>
              <span>{currentPhotoUrl ? "Change Photo" : "Upload Photo"}</span>
            </button>

            {currentPhotoUrl && (
              <button
                type="button"
                disabled={disabled || uploading}
                onClick={handleRemovePhoto}
                className="px-3.5 py-2 rounded-full bg-red-950/50 hover:bg-red-900/70 active:bg-red-900 text-red-300 text-xs sm:text-sm font-semibold transition border border-red-800/50 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <span>🗑️</span>
                <span>Remove</span>
              </button>
            )}
          </div>

          <p className="text-[11px] text-gray-400 leading-tight">
            Select a photo (PNG, JPG, WebP up to 5MB) to upload directly to Vercel Blob cloud storage.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
