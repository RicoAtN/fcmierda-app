"use client";
import React, { useState } from "react";

function ExpandableText({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!text || text === "-") return <span className="font-semibold text-white">-</span>;
  
  const isLong = text.length > 50;

  let displayText = text;
  if (!isExpanded && isLong) {
    displayText = text.slice(0, 50) + "...";
  }

  return (
    <div
      className={`font-semibold text-white ${isLong ? "cursor-pointer" : ""}`}
      onClick={() => isLong && setIsExpanded(!isExpanded)}
    >
      <div className="whitespace-pre-wrap break-words">
        {displayText}
      </div>
      {isLong && (
        <div className="text-green-400 hover:text-green-300 text-xs font-bold mt-1 uppercase tracking-wide">
          {isExpanded ? "Minimize" : "Expand"}
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span className="text-gray-400 block text-xs uppercase tracking-wider mb-1">{label}</span>
      <span className="font-semibold text-white break-all">{value}</span>
    </div>
  );
}

function renderValue(val: any) {
  return val !== null && val !== undefined && val !== "" ? String(val) : "-";
}

type Player = {
  player_name: string;
  main_player: boolean;
  [key: string]: any;
};

export default function ClientPlayerManagement({ players }: { players: Player[] }) {
  const [filterMain, setFilterMain] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const displayedPlayers = filterMain 
    ? players.filter((p) => p.main_player) 
    : players;

  const handleSelectPlayer = (player: Player) => {
    setSelectedPlayer(player);
    setTimeout(() => {
      const el = document.getElementById("player-details");
      if (el && window.innerWidth < 768) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
  };

  return (
    <div id="current-players" className="max-w-5xl w-full rounded-2xl p-6 sm:p-10 text-white bg-gray-900 shadow-xl mx-auto scroll-mt-24">
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-2">FC Mierda players overview</h2>
        <p className="text-sm text-gray-400">Click on a player to view or edit players information.</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Side: List */}
        <div className="w-full md:w-1/3 flex flex-col gap-4">
          <div className="flex flex-col xl:flex-row gap-2">
            <button 
              onClick={() => setFilterMain(true)}
              className={`flex-1 py-2 px-2 rounded-lg font-semibold text-sm transition border shadow-sm ${
                filterMain 
                  ? 'bg-green-700 border-green-600 text-white' 
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
              }`}
            >
              Show only main players
            </button>
            <button 
              onClick={() => setFilterMain(false)}
              className={`flex-1 py-2 px-2 rounded-lg font-semibold text-sm transition border shadow-sm ${
                !filterMain 
                  ? 'bg-green-700 border-green-600 text-white' 
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
              }`}
            >
              Show all players
            </button>
          </div>
          
          <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
          {displayedPlayers.length === 0 ? (
            <p className="text-gray-400">No players found.</p>
          ) : (
            displayedPlayers.map((player, idx) => (
              <div 
                key={idx} 
                onClick={() => handleSelectPlayer(player)}
                className={`p-4 rounded-xl shadow cursor-pointer flex justify-between items-center transition border-2 ${
                  selectedPlayer?.player_name === player.player_name 
                    ? 'bg-green-900/40 border-green-500' 
                    : 'bg-gray-800 border-transparent hover:border-gray-600'
                }`}
              >
                <span className="text-lg font-semibold">{player.player_name}</span>
                {player.main_player && (
                  <span className="text-xs font-bold bg-green-800 text-green-200 px-2.5 py-1 rounded-full">
                    Main
                  </span>
                )}
              </div>
            ))
          )}
          </div>
        </div>

        {/* Right Side: Details */}
        <div id="player-details" className="w-full md:w-2/3 bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg h-fit scroll-mt-24">
          {selectedPlayer ? (
            <div className="flex flex-col gap-8">
              {/* Header Profile */}
              <div className="flex items-center gap-4 border-b border-gray-700 pb-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-700 overflow-hidden flex-shrink-0 border-2 border-gray-600 flex items-center justify-center">
                  {selectedPlayer.photo_link || selectedPlayer.photo ? (
                    <img src={selectedPlayer.photo_link || selectedPlayer.photo} alt={selectedPlayer.player_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400 font-bold text-2xl sm:text-3xl">{selectedPlayer.player_name?.[0]?.toUpperCase() || "?"}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-green-400 mb-1">
                    {selectedPlayer.player_name}
                  </h3>
                  <div className="text-xs text-gray-400 font-medium">
                    Last updated: {
                      selectedPlayer.updated_at && !isNaN(new Date(String(selectedPlayer.updated_at)).getTime())
                        ? new Date(String(selectedPlayer.updated_at)).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : "-"
                    }
                  </div>
                  <div className="text-xs text-gray-400 font-medium mt-1">
                    Player ID: {renderValue(selectedPlayer.player_id)}
                  </div>
                </div>
              </div>

              {/* Section 1: Player Information */}
              <div>
                <h4 className="text-lg font-bold text-white mb-3 border-b border-gray-700/50 pb-2">Player Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm sm:text-base bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                  <DetailItem label="Player Name" value={renderValue(selectedPlayer.player_name)} />
                  <DetailItem label="Shirt Number #" value={renderValue(selectedPlayer.player_number || selectedPlayer.number)} />
                  <DetailItem label="Callsign" value={renderValue(selectedPlayer.player_callsign || selectedPlayer.nickname)} />
                  <DetailItem label="Position" value={renderValue(selectedPlayer.player_position || selectedPlayer.role)} />
                  <DetailItem label="Main Player" value={selectedPlayer.main_player ? "Yes" : "No"} />
                  <DetailItem label="Photo Link" value={renderValue(selectedPlayer.photo_link || selectedPlayer.photo)} />
                </div>
              </div>

              {/* Section 2: Player Statistics */}
              <div>
                <h4 className="text-lg font-bold text-white mb-3 border-b border-gray-700/50 pb-2">Player Statistics</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-sm sm:text-base bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                  <DetailItem label="Matches Played" value={renderValue(selectedPlayer.match_played)} />
                  <DetailItem label="Goals" value={renderValue(selectedPlayer.goals)} />
                  <DetailItem label="Assists" value={renderValue(selectedPlayer.assists)} />
                  <DetailItem label="Goals Involvement" value={renderValue(selectedPlayer.goals_involvement)} />
                  <DetailItem label="Clean Sheets" value={renderValue(selectedPlayer.clean_sheets)} />
                  <DetailItem label="Avg Goals/Match" value={renderValue(selectedPlayer.average_goals_per_match)} />
                  <DetailItem label="Avg Conceded/Match" value={renderValue(selectedPlayer.average_goals_conceded_per_match)} />
                </div>
              </div>

              {/* Section 3: Biography */}
              <div>
                <h4 className="text-lg font-bold text-white mb-3 border-b border-gray-700/50 pb-2">Biography</h4>
                <div className="flex flex-col gap-6 text-sm sm:text-base bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                  <div>
                    <span className="text-gray-400 block text-xs uppercase tracking-wider mb-1">Biography Main</span>
                    <ExpandableText text={selectedPlayer.biography_main || selectedPlayer.biography || "-"} />
                  </div>
                  <div>
                    <span className="text-gray-400 block text-xs uppercase tracking-wider mb-1">Biography Detail</span>
                    <ExpandableText text={selectedPlayer.biography_detail || "-"} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 min-h-[300px] text-center px-4">
              <p className="text-lg">Select a player from the list to view details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}