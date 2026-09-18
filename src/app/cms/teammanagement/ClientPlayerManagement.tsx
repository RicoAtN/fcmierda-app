"use client";
import React, { useState } from "react";
import { updatePlayerAction } from "./actions";
import PlayerPhotoUploader from "@/components/PlayerPhotoUploader";
import { Roboto_Slab } from "next/font/google";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700", "900"] });

function ExpandableText({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!text || text === "-") return <span className="font-medium text-gray-400">-</span>;
  
  const isLong = text.length > 50;

  let displayText = text;
  if (!isExpanded && isLong) {
    displayText = text.slice(0, 50) + "...";
  }

  return (
    <div
      className={`font-medium text-gray-200 text-xs sm:text-sm ${isLong ? "cursor-pointer" : ""}`}
      onClick={() => isLong && setIsExpanded(!isExpanded)}
    >
      <div className="whitespace-pre-wrap break-words leading-relaxed">
        {displayText}
      </div>
      {isLong && (
        <div className="text-emerald-400 hover:text-emerald-300 text-[11px] font-bold mt-1 uppercase tracking-wide">
          {isExpanded ? "▲ Minimize" : "▼ Expand"}
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="p-3 rounded-xl bg-black/40 border border-gray-800/80">
      <span className="text-gray-400 block text-[10px] uppercase tracking-wider mb-0.5 font-semibold">{label}</span>
      <span className="font-bold text-white text-xs sm:text-sm break-all">{value}</span>
    </div>
  );
}

function renderValue(val: any, isAvg = false) {
  if (val === null || val === undefined || val === "") return "-";
  if (isAvg && !isNaN(Number(val))) {
    return Number(val).toFixed(2);
  }
  return String(val);
}

type Player = {
  player_name: string;
  main_player: boolean;
  [key: string]: any;
};

export default function ClientPlayerManagement({ players }: { players: Player[] }) {
  const [filterMain, setFilterMain] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Player>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPosition, setFilterPosition] = useState("");

  const predefinedPositions = ["defender", "midfielder", "forward", "goalkeeper", "coach"];

  const displayedPlayers = players.filter((p) => {
    const matchesMain = filterMain ? p.main_player : !p.main_player;
    const matchesSearch = p.player_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const pos = p.player_position || p.role || "";
    const matchesPosition = filterPosition === "" || pos === filterPosition;
    return matchesMain && matchesSearch && matchesPosition;
  });

  const handleSelectPlayer = (player: Player) => {
    setSelectedPlayer(player);
    setIsEditing(false);
    setTimeout(() => {
      const el = document.getElementById("player-details");
      if (el && window.innerWidth < 768) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
  };

  const currentPosition = editForm.player_position || editForm.role || "";

  return (
    <div id="current-players" className="max-w-5xl w-full rounded-2xl p-5 sm:p-8 text-white bg-gray-950/85 border border-gray-800 shadow-2xl backdrop-blur-md mx-auto mb-10 scroll-mt-24">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-800">
        <div>
          <h2 className={`text-lg sm:text-xl font-bold text-white ${robotoSlab.className}`}>
            FC Mierda Squad Directory
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Click on any player card to inspect stats, edit profile details, or upload headshots.</p>
        </div>
        <span className="text-xs text-gray-400 font-semibold">{players.length} total squad members</span>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6 md:h-[750px]">
        {/* Left Side: List */}
        <div className="w-full md:w-1/3 flex flex-col gap-3 h-full">
          <div className="flex flex-row items-center gap-2 p-1 bg-black/40 border border-gray-800 rounded-xl">
            <button 
              onClick={() => setFilterMain(true)}
              className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-xs transition cursor-pointer ${
                filterMain 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Main Squad
            </button>
            <button 
              onClick={() => setFilterMain(false)}
              className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-xs transition cursor-pointer ${
                !filterMain 
                  ? 'bg-gray-700 text-white shadow-sm' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Reserve / Guest
            </button>
          </div>
          
          <div className="flex flex-col gap-2">
            <input
              type="search"
              placeholder="Search by player name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/60 border border-gray-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
              aria-label="Search players"
            />
            <select
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value)}
              className="w-full bg-black/60 border border-gray-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 transition cursor-pointer"
              aria-label="Filter by position"
            >
              <option value="">All positions</option>
              {predefinedPositions.map((pos) => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2 overflow-y-auto pr-1 flex-1 min-h-0 max-h-[480px] md:max-h-none">
          {displayedPlayers.length === 0 ? (
            <p className="text-gray-500 text-xs italic py-6 text-center">No players match the criteria.</p>
          ) : (
            displayedPlayers.map((player, idx) => {
              const isSelected = selectedPlayer?.player_name === player.player_name;
              return (
                <div 
                  key={idx} 
                  onClick={() => handleSelectPlayer(player)}
                  className={`p-3 rounded-xl cursor-pointer flex justify-between items-center transition border ${
                    isSelected 
                      ? 'bg-emerald-950/70 border-emerald-500 text-emerald-100 shadow-md' 
                      : 'bg-gray-900/80 border-gray-800/80 hover:border-gray-700 text-gray-300'
                  }`}
                >
                  <div className="flex flex-col flex-1 min-w-0 pr-2">
                    <span className="text-xs sm:text-sm font-bold truncate text-white">
                      {(player.player_number || player.number) ? `#${String(player.player_number || player.number).replace(/^#/, '')} ` : ''}
                      {player.player_name}
                    </span>
                    <span className="text-[11px] text-gray-400 truncate capitalize mt-0.5">
                      {player.player_position || player.role || "Position unknown"}
                    </span>
                  </div>
                  {player.main_player && (
                    <span className="text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded-full flex-shrink-0">
                      Main
                    </span>
                  )}
                </div>
              );
            })
          )}
          </div>
        </div>

        {/* Right Side: Details View / Form */}
        <div id="player-details" className="w-full md:w-2/3 bg-gray-900/90 p-5 sm:p-6 rounded-2xl border border-gray-800 shadow-inner scroll-mt-24 h-full flex flex-col overflow-y-auto">
          {selectedPlayer ? (
            <div className="flex flex-col gap-6">
              {/* Header Profile */}
              <div className="flex items-center gap-4 border-b border-gray-800 pb-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-black/60 overflow-hidden flex-shrink-0 border border-gray-700 flex items-center justify-center shadow-md">
                  {selectedPlayer.photo_link || selectedPlayer.photo ? (
                    <img src={selectedPlayer.photo_link || selectedPlayer.photo} alt={selectedPlayer.player_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400 font-bold text-2xl sm:text-3xl">{selectedPlayer.player_name?.[0]?.toUpperCase() || "?"}</span>
                  )}
                </div>
                <div className="flex-1 flex justify-between items-start">
                  <div>
                    <h3 className={`text-xl sm:text-2xl font-black text-white ${robotoSlab.className}`}>
                      {selectedPlayer.player_name}
                    </h3>
                    <div className="text-[11px] text-gray-400 font-medium mt-0.5">
                      Last updated: {
                        selectedPlayer.updated_at && !isNaN(new Date(String(selectedPlayer.updated_at)).getTime())
                          ? new Date(String(selectedPlayer.updated_at)).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : "-"
                      }
                    </div>
                    <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
                      Player ID: {renderValue(selectedPlayer.player_id)}
                    </div>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => { setIsEditing(true); setEditForm(selectedPlayer); }}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition cursor-pointer"
                    >
                      ✏️ Edit
                    </button>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                    <h4 className="text-sm font-bold text-emerald-400">Editing Player Information</h4>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="text-xs text-gray-400 hover:text-gray-200"
                    >
                      ✕ Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-black/40 p-4 rounded-xl border border-gray-800">
                    <div>
                      <label className="text-gray-300 block text-xs uppercase tracking-wider mb-1 font-semibold">Player Name</label>
                      <input
                        type="text"
                        value={editForm.player_name || ""}
                        onChange={(e) => setEditForm({ ...editForm, player_name: e.target.value })}
                        className="w-full rounded-xl border border-gray-700 bg-black/60 px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-gray-300 block text-xs uppercase tracking-wider mb-1 font-semibold">Shirt Number #</label>
                      <input
                        type="text"
                        value={editForm.player_number || editForm.number || ""}
                        onChange={(e) => setEditForm({ ...editForm, player_number: e.target.value })}
                        className="w-full rounded-xl border border-gray-700 bg-black/60 px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-gray-300 block text-xs uppercase tracking-wider mb-1 font-semibold">Callsign / Nickname</label>
                      <input
                        type="text"
                        value={editForm.player_callsign || editForm.nickname || ""}
                        onChange={(e) => setEditForm({ ...editForm, player_callsign: e.target.value })}
                        className="w-full rounded-xl border border-gray-700 bg-black/60 px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-gray-300 block text-xs uppercase tracking-wider mb-1 font-semibold">Position</label>
                      <select
                        value={currentPosition}
                        onChange={(e) => setEditForm({ ...editForm, player_position: e.target.value })}
                        className="w-full rounded-xl border border-gray-700 bg-black/60 px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        {!currentPosition && <option value="">Select a position...</option>}
                        {currentPosition && !predefinedPositions.includes(currentPosition) && (
                          <option value={currentPosition}>{currentPosition}</option>
                        )}
                        {predefinedPositions.map((pos) => (
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-gray-300 block text-xs uppercase tracking-wider mb-2 font-semibold">Player Profile Photo</label>
                      <PlayerPhotoUploader
                        currentPhotoUrl={editForm.photo_link || editForm.photo || null}
                        playerName={editForm.player_name || selectedPlayer?.player_name || "player"}
                        onPhotoChange={(newUrl) =>
                          setEditForm({
                            ...editForm,
                            photo_link: newUrl,
                            photo: newUrl,
                          })
                        }
                        disabled={isSaving}
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-center gap-2 mt-1">
                      <input
                        type="checkbox"
                        id="main_player_check"
                        checked={!!editForm.main_player}
                        onChange={(e) => setEditForm({ ...editForm, main_player: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 bg-black border-gray-700 rounded focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                      />
                      <label htmlFor="main_player_check" className="text-white text-xs sm:text-sm font-semibold cursor-pointer select-none">
                        Main Squad Member
                      </label>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-gray-300 block text-xs uppercase tracking-wider mb-1 font-semibold">Biography Main</label>
                      <textarea
                        value={editForm.biography_main || editForm.biography || ""}
                        onChange={(e) => setEditForm({ ...editForm, biography_main: e.target.value })}
                        className="w-full rounded-xl border border-gray-700 bg-black/60 px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 min-h-[90px] resize-y"
                        placeholder="Enter the main biography text..."
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-gray-300 block text-xs uppercase tracking-wider mb-1 font-semibold">Biography Detail</label>
                      <textarea
                        value={editForm.biography_detail || ""}
                        onChange={(e) => setEditForm({ ...editForm, biography_detail: e.target.value })}
                        className="w-full rounded-xl border border-gray-700 bg-black/60 px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 min-h-[120px] resize-y"
                        placeholder="Enter detailed biography information..."
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold text-xs transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={isSaving}
                      onClick={async () => {
                        try {
                          setIsSaving(true);
                          await updatePlayerAction(selectedPlayer.player_id, editForm);
                          setSelectedPlayer({ ...selectedPlayer, ...editForm } as Player);
                          setIsEditing(false);
                        } catch (error) {
                          console.error("Failed to update player:", error);
                          alert("An error occurred while saving the changes.");
                        } finally {
                          setIsSaving(false);
                        }
                      }}
                      className="px-6 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition disabled:opacity-50 cursor-pointer"
                    >
                      {isSaving ? "Saving..." : "💾 Save Changes"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Section 1: Player Information */}
                  <div>
                    <h4 className="text-xs uppercase tracking-wider font-bold text-emerald-400 mb-2">Player Information</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      <DetailItem label="Player Name" value={renderValue(selectedPlayer.player_name)} />
                      <DetailItem label="Shirt Number #" value={renderValue(selectedPlayer.player_number || selectedPlayer.number)} />
                      <DetailItem label="Callsign" value={renderValue(selectedPlayer.player_callsign || selectedPlayer.nickname)} />
                      <DetailItem label="Position" value={renderValue(selectedPlayer.player_position || selectedPlayer.role)} />
                      <DetailItem label="Main Squad" value={selectedPlayer.main_player ? "Yes" : "No"} />
                    </div>
                  </div>

                  {/* Section 2: Player Statistics */}
                  <div>
                    <h4 className="text-xs uppercase tracking-wider font-bold text-emerald-400 mb-2">Performance Metrics</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <DetailItem label="Matches Played" value={renderValue(selectedPlayer.match_played)} />
                      <DetailItem label="Goals" value={renderValue(selectedPlayer.goals)} />
                      <DetailItem label="Assists" value={renderValue(selectedPlayer.assists)} />
                      <DetailItem label="Goal Involvement" value={renderValue(selectedPlayer.goals_involvement)} />
                      <DetailItem label="Clean Sheets" value={renderValue(selectedPlayer.clean_sheets)} />
                      <DetailItem label="Avg Goals/Match" value={renderValue(selectedPlayer.average_goals_per_match, true)} />
                      <DetailItem label="Avg Conceded/Match" value={renderValue(selectedPlayer.average_goals_conceded_per_match, true)} />
                    </div>
                  </div>

                  {/* Section 3: Biography */}
                  <div>
                    <h4 className="text-xs uppercase tracking-wider font-bold text-emerald-400 mb-2">Biography & Lore</h4>
                    <div className="flex flex-col gap-3 text-xs bg-black/40 p-4 rounded-xl border border-gray-800">
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase tracking-wider mb-1 font-semibold">Biography Main</span>
                        <ExpandableText text={selectedPlayer.biography_main || selectedPlayer.biography || "-"} />
                      </div>
                      <div className="pt-2 border-t border-gray-800">
                        <span className="text-gray-400 block text-[10px] uppercase tracking-wider mb-1 font-semibold">Biography Detail</span>
                        <ExpandableText text={selectedPlayer.biography_detail || "-"} />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 min-h-[300px] text-center px-4">
              <span className="text-3xl mb-2">👈</span>
              <p className="text-xs sm:text-sm">Select a squad member from the left directory to inspect details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}