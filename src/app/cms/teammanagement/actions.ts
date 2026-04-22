"use server";

import { Pool } from "pg";
import { revalidatePath } from "next/cache";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function updatePlayerAction(playerId: number, data: any) {
  if (!playerId) {
    throw new Error("Player ID is missing.");
  }

  const query = `
    UPDATE player_statistics 
    SET 
      player_name = $1,
      player_number = $2,
      player_callsign = $3,
      player_position = $4,
      photo_link = $5,
      main_player = $6,
      biography_main = $7,
      biography_detail = $8,
      updated_at = NOW()
    WHERE player_id = $9
  `;
  
  const values = [
    data.player_name,
    data.player_number || data.number || null,
    data.player_callsign || data.nickname || null,
    data.player_position || data.role || null,
    data.photo_link || data.photo || null,
    data.main_player || false,
    data.biography_main || data.biography || null,
    data.biography_detail || null,
    playerId
  ];

  await pool.query(query, values);

  // Purge the cached data so the page displays the latest values immediately
  revalidatePath("/cms/teammanagement");
}