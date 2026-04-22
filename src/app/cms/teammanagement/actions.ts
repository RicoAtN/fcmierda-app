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

export async function addPlayerAction(data: any) {
  // Check if player_id is unique
  if (data.player_id) {
    const check = await pool.query("SELECT player_id FROM player_statistics WHERE player_id = $1", [data.player_id]);
    if (check.rows.length > 0) {
      return { success: false, error: "The Player ID already exists. Please pick a unique number." };
    }
  }

  const query = `
    INSERT INTO player_statistics (
      player_id, player_name, player_number, player_callsign, player_position,
      photo_link, main_player, biography_main, biography_detail,
      match_played, goals, assists, clean_sheets,
      updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9,
      0, 0, 0, 0,
      NOW()
    )
  `;
  
  const values = [
    data.player_id,
    data.player_name,
    data.player_number,
    data.player_callsign,
    data.player_position,
    data.photo_link,
    data.main_player || false,
    data.biography_main,
    data.biography_detail
  ];

  await pool.query(query, values);

  // Purge the cached data so the page displays the latest values immediately
  revalidatePath("/cms/teammanagement");
  return { success: true };
}