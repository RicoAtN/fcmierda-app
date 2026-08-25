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
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState(currentPhotoUrl || "");
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
      setManualUrl(data.url);
    } catch (err: any) {
      console.error("Photo upload error:", err);
      setError(err?.message || "Could not upload image. Please try again.");
    } finally {
      setUploading(false);
      // Reset input value so same file can be re-uploaded if desired
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemovePhoto = () => {
    if (confirm("Are you sure you want to remove this player's photo?")) {
      onPhotoChange(null);
      setManualUrl("");
      setError(null);
    }
  };

  const handleManualUrlBlur = () => {
    const trimmed = manualUrl.trim();
    onPhotoChange(trimmed ? trimmed : null);
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-gray-800/80 p-3.5 rounded-xl border border-gray-700">
        {/* Photo Thumbnail / Avatar */}
        <div className="relative w-20 h-20 rounded-full bg-gray-900 border-2 border-gray-600 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-inner group">
          {currentPhotoUrl ? (
            <img
              src={currentPhotoUrl}
              alt={playerName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-500 text-xs">
              <span className="text-2xl mb-0.5">👤</span>
              <span>No photo</span>
            </div>
          )}

          {uploading && (
            <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-white text-xs">
              <svg
                className="animate-spin h-5 w-5 text-green-400 mb-1"
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
              <span>Uploading</span>
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

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-lg bg-green-700 hover:bg-green-600 active:bg-green-800 text-white text-xs sm:text-sm font-semibold transition border border-green-600 shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <span>📷</span>
              <span>{currentPhotoUrl ? "Change Photo" : "Upload Photo"}</span>
            </button>

            {currentPhotoUrl && (
              <button
                type="button"
                disabled={disabled || uploading}
                onClick={handleRemovePhoto}
                className="px-3 py-1.5 rounded-lg bg-red-900/40 hover:bg-red-800/60 active:bg-red-900 text-red-300 text-xs sm:text-sm font-semibold transition border border-red-700/60 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <span>🗑️</span>
                <span>Remove</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-xs text-gray-400 hover:text-gray-200 underline ml-auto transition"
            >
              {showUrlInput ? "Hide URL input" : "Paste URL instead"}
            </button>
          </div>

          <p className="text-[11px] text-gray-400 leading-tight">
            Supports PNG, JPG, WebP up to 5MB. Photo will be automatically optimized and hosted on cloud storage.
          </p>

          {showUrlInput && (
            <div className="mt-1 flex items-center gap-2">
              <input
                type="text"
                placeholder="https://... or /players/..."
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                onBlur={handleManualUrlBlur}
                className="w-full bg-gray-900 border border-gray-600 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-green-500 font-mono"
              />
              <button
                type="button"
                onClick={handleManualUrlBlur}
                className="px-2.5 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded font-medium"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-500/60 text-red-300 text-xs flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
