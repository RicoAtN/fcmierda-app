"use client";
import React, { useState } from "react";
import { addPlayerAction } from "./actions";

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
    <div id="add-new-player" className="max-w-4xl w-full rounded-2xl p-6 sm:p-10 text-white bg-gray-900 shadow-xl mx-auto scroll-mt-24 transition-all duration-300">
      <div 
        className={`flex cursor-pointer select-none ${isExpanded ? 'justify-between items-center' : 'justify-center items-center flex-col py-6'}`} 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {!isExpanded ? (
          <div className="flex flex-col items-center gap-4 group text-center">
            <div className="bg-green-700 group-hover:bg-green-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-4xl shadow-lg transition-all transform group-hover:scale-105">
              +
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white group-hover:text-green-400 transition-colors">Add New Player</h2>
              <p className="text-gray-400 text-sm mt-2">
                Click here to open the form and add a new team member to the squad.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Add New Player</h2>
              <p className="text-gray-400 text-sm mt-1">
                Click to collapse the form.
              </p>
            </div>
            <div className="text-green-500 hover:text-green-400 font-bold text-4xl transition-colors">
              −
            </div>
          </>
        )}
      </div>

      {isExpanded && (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4 border-t border-gray-700/50 pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
            <div>
              <label className="text-gray-400 block text-xs uppercase tracking-wider mb-1">Player ID *</label>
              <input
                required
                type="number"
                value={formData.player_id}
                onChange={(e) => setFormData({ ...formData, player_id: e.target.value })}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-green-500"
                placeholder="E.g. 1"
              />
            </div>
            <div>
              <label className="text-gray-400 block text-xs uppercase tracking-wider mb-1">Player Name *</label>
              <input
                required
                type="text"
                value={formData.player_name}
                onChange={(e) => setFormData({ ...formData, player_name: e.target.value })}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-green-500"
                placeholder="E.g. John Doe"
              />
            </div>
            <div>
              <label className="text-gray-400 block text-xs uppercase tracking-wider mb-1">Shirt Number # *</label>
              <input
                required
                type="number"
                value={formData.player_number}
                onChange={(e) => setFormData({ ...formData, player_number: e.target.value })}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-green-500"
                placeholder="E.g. 10"
              />
            </div>
            <div>
              <label className="text-gray-400 block text-xs uppercase tracking-wider mb-1">Callsign *</label>
              <input
                required
                type="text"
                value={formData.player_callsign}
                onChange={(e) => setFormData({ ...formData, player_callsign: e.target.value })}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-green-500"
                placeholder="E.g. The Wall"
              />
            </div>
            <div>
              <label className="text-gray-400 block text-xs uppercase tracking-wider mb-1">Position *</label>
              <select
                required
                value={formData.player_position}
                onChange={(e) => setFormData({ ...formData, player_position: e.target.value })}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-green-500"
              >
                <option value="">Select a position...</option>
                {predefinedPositions.map((pos) => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-gray-400 block text-xs uppercase tracking-wider mb-1">Photo Link</label>
              <input
                type="text"
                value={formData.photo_link}
                onChange={(e) => setFormData({ ...formData, photo_link: e.target.value })}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-green-500"
                placeholder="E.g. https://example.com/photo.jpg or filename"
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="add_main_player_check"
                checked={formData.main_player}
                onChange={(e) => setFormData({ ...formData, main_player: e.target.checked })}
                className="w-5 h-5 accent-green-600 bg-gray-800 border-gray-600 rounded focus:ring-green-500 cursor-pointer"
              />
              <label htmlFor="add_main_player_check" className="text-white font-semibold cursor-pointer select-none">
                Main Player
              </label>
            </div>
            <div className="sm:col-span-2 mt-2">
              <label className="text-gray-400 block text-xs uppercase tracking-wider mb-1">Biography Main *</label>
              <textarea
                required
                value={formData.biography_main}
                onChange={(e) => setFormData({ ...formData, biography_main: e.target.value })}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-green-500 min-h-[100px] resize-y"
                placeholder="Enter the main biography text here..."
              />
            </div>
            <div className="sm:col-span-2 mt-2">
              <label className="text-gray-400 block text-xs uppercase tracking-wider mb-1">Biography Detail *</label>
              <textarea
                required
                value={formData.biography_detail}
                onChange={(e) => setFormData({ ...formData, biography_detail: e.target.value })}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-green-500 min-h-[150px] resize-y"
                placeholder="Enter detailed biography information here..."
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded bg-green-700 hover:bg-green-600 text-white font-semibold transition shadow-md disabled:opacity-50"
            >
              {isSaving ? "Adding..." : "Add Player"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}