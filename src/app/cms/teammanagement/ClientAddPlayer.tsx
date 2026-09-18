"use client";
import React, { useState } from "react";
import { Roboto_Slab } from "next/font/google";
import { addPlayerAction } from "./actions";
import PlayerPhotoUploader from "@/components/PlayerPhotoUploader";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700", "900"] });

export default function ClientAddPlayer() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    player_id: "",
    player_name: "",
    player_number: "",
    player_callsign: "",
    player_position: "",
    photo_link: "",
    main_player: false,
    biography_main: "",
    biography_detail: ""
  });

  const predefinedPositions = ["defender", "midfielder", "forward", "goalkeeper", "coach"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const result = await addPlayerAction(formData);
      if (result && result.success === false) {
        alert(result.error);
        return;
      }
      setFormData({
        player_id: "",
        player_name: "",
        player_number: "",
        player_callsign: "",
        player_position: "",
        photo_link: "",
        main_player: false,
        biography_main: "",
        biography_detail: ""
      });
      setIsExpanded(false);
    } catch (error) {
      console.error("Failed to add player:", error);
      alert("An error occurred while adding the player.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      id="add-new-player"
      className="max-w-4xl w-full rounded-2xl p-5 sm:p-8 text-white bg-gray-950/85 border border-gray-800 shadow-2xl backdrop-blur-md mx-auto mb-8 scroll-mt-24 transition-all duration-300"
    >
      <div 
        className={`flex cursor-pointer select-none transition-all ${
          isExpanded ? "justify-between items-center pb-4 border-b border-gray-800" : "justify-center items-center flex-col py-6"
        }`} 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {!isExpanded ? (
          <div className="flex flex-col items-center gap-4 group text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center text-3xl font-bold shadow-lg shadow-emerald-950/40 transition-all duration-200 group-hover:scale-105">
              +
            </div>
            <div>
              <h2 className={`text-xl sm:text-2xl font-bold text-white group-hover:text-emerald-300 transition-colors ${robotoSlab.className}`}>
                Add New Player
              </h2>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">
                Click here to open the registration form and add a new player to the squad.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                Squad Registration
              </div>
              <h2 className={`text-xl sm:text-2xl font-bold text-white ${robotoSlab.className}`}>
                Add New Player
              </h2>
              <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
                Fill in the player details below. Click anywhere on this header to collapse.
              </p>
            </div>
            <button
              type="button"
              className="w-10 h-10 rounded-xl bg-gray-900 border border-gray-700 text-gray-300 hover:text-emerald-400 hover:border-emerald-500/40 flex items-center justify-center text-2xl font-bold transition-colors"
              title="Collapse form"
            >
              −
            </button>
          </>
        )}
      </div>

      {isExpanded && (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-900/40 p-4 sm:p-6 rounded-xl border border-gray-800/80">
            <div>
              <label className="text-gray-300 block text-xs font-semibold uppercase tracking-wider mb-1.5">
                Player ID <span className="text-emerald-400">*</span>
              </label>
              <input
                required
                type="number"
                value={formData.player_id}
                onChange={(e) => setFormData({ ...formData, player_id: e.target.value })}
                className="w-full rounded-xl border border-gray-700 bg-black/60 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition-all"
                placeholder="E.g. 1"
              />
            </div>
            <div>
              <label className="text-gray-300 block text-xs font-semibold uppercase tracking-wider mb-1.5">
                Player Name <span className="text-emerald-400">*</span>
              </label>
              <input
                required
                type="text"
                value={formData.player_name}
                onChange={(e) => setFormData({ ...formData, player_name: e.target.value })}
                className="w-full rounded-xl border border-gray-700 bg-black/60 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition-all"
                placeholder="E.g. John Doe"
              />
            </div>
            <div>
              <label className="text-gray-300 block text-xs font-semibold uppercase tracking-wider mb-1.5">
                Shirt Number # <span className="text-emerald-400">*</span>
              </label>
              <input
                required
                type="number"
                value={formData.player_number}
                onChange={(e) => setFormData({ ...formData, player_number: e.target.value })}
                className="w-full rounded-xl border border-gray-700 bg-black/60 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition-all"
                placeholder="E.g. 10"
              />
            </div>
            <div>
              <label className="text-gray-300 block text-xs font-semibold uppercase tracking-wider mb-1.5">
                Callsign <span className="text-emerald-400">*</span>
              </label>
              <input
                required
                type="text"
                value={formData.player_callsign}
                onChange={(e) => setFormData({ ...formData, player_callsign: e.target.value })}
                className="w-full rounded-xl border border-gray-700 bg-black/60 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition-all"
                placeholder="E.g. The Wall"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-gray-300 block text-xs font-semibold uppercase tracking-wider mb-1.5">
                Position <span className="text-emerald-400">*</span>
              </label>
              <select
                required
                value={formData.player_position}
                onChange={(e) => setFormData({ ...formData, player_position: e.target.value })}
                className="w-full rounded-xl border border-gray-700 bg-black/60 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition-all capitalize"
              >
                <option value="" className="bg-gray-950 text-gray-400">Select a position...</option>
                {predefinedPositions.map((pos) => (
                  <option key={pos} value={pos} className="bg-gray-950 text-white capitalize">
                    {pos}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-gray-300 block text-xs font-semibold uppercase tracking-wider mb-2">
                Player Profile Photo
              </label>
              <PlayerPhotoUploader
                currentPhotoUrl={formData.photo_link || null}
                playerName={formData.player_name || "new-player"}
                onPhotoChange={(newUrl) =>
                  setFormData({ ...formData, photo_link: newUrl || "" })
                }
                disabled={isSaving}
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-gray-800">
              <input
                type="checkbox"
                id="add_main_player_check"
                checked={formData.main_player}
                onChange={(e) => setFormData({ ...formData, main_player: e.target.checked })}
                className="w-5 h-5 accent-emerald-500 bg-gray-900 border-gray-600 rounded focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="add_main_player_check" className="text-sm font-semibold text-gray-200 cursor-pointer select-none">
                Main Player <span className="text-xs font-normal text-gray-400 ml-1.5">(Featured in core roster views)</span>
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className="text-gray-300 block text-xs font-semibold uppercase tracking-wider mb-1.5">
                Biography Main <span className="text-emerald-400">*</span>
              </label>
              <textarea
                required
                value={formData.biography_main}
                onChange={(e) => setFormData({ ...formData, biography_main: e.target.value })}
                className="w-full rounded-xl border border-gray-700 bg-black/60 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition-all min-h-[90px] resize-y"
                placeholder="Enter the main biography summary..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-gray-300 block text-xs font-semibold uppercase tracking-wider mb-1.5">
                Biography Detail <span className="text-emerald-400">*</span>
              </label>
              <textarea
                required
                value={formData.biography_detail}
                onChange={(e) => setFormData({ ...formData, biography_detail: e.target.value })}
                className="w-full rounded-xl border border-gray-700 bg-black/60 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition-all min-h-[140px] resize-y"
                placeholder="Enter detailed background lore, history, or playing style..."
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="px-5 py-2.5 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs sm:text-sm font-semibold border border-gray-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 transition disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? "Adding..." : "Add Player"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}