"use server";

import { Pool } from "pg";
import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function updatePlayerAction(playerId: number | string, data: any) {
  if (!playerId) {
    throw new Error("Player ID is missing.");
  }

  // Check if there was an old photo that needs deletion from Vercel Blob
  const oldPhotoRes = await pool.query(
    "SELECT photo_link FROM player_statistics WHERE player_id = $1",
    [playerId]
  );
  const oldPhoto = oldPhotoRes.rows[0]?.photo_link;
  const newPhoto = data.photo_link ?? null;

  if (
    oldPhoto &&
    oldPhoto !== newPhoto &&
    process.env.BLOB_READ_WRITE_TOKEN
  ) {
    try {
      if (oldPhoto.includes("/api/blob?pathname=")) {
        const urlObj = new URL(oldPhoto, "http://localhost");
        const pathname = urlObj.searchParams.get("pathname");
        if (pathname) await del(pathname);
      } else if (oldPhoto.includes(".blob.vercel-storage.com")) {
        await del(oldPhoto);
      }
    } catch (delErr) {
      console.warn("Notice: could not delete replaced blob:", delErr);
    }
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
    newPhoto,
    data.main_player || false,
    data.biography_main || data.biography || null,
    data.biography_detail || null,
    playerId
  ];

  await pool.query(query, values);

  // Purge cached pages so changes reflect immediately
  revalidatePath("/cms/teammanagement");
  revalidatePath("/team");
  return { success: true };
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
    data.player_number || null,
    data.player_callsign || null,
    data.player_position || null,
    data.photo_link || null,
    data.main_player || false,
    data.biography_main || null,
    data.biography_detail || null
  ];

  try {
    await pool.query(query, values);

    // Purge the cached data so the page displays the latest values immediately
    revalidatePath("/cms/teammanagement");
    revalidatePath("/team");
    return { success: true };
  } catch (error: any) {
    if (error.code === '23505') {
      return { success: false, error: `Duplicate entry error: ${error.detail || 'A player with this ID or Name already exists.'}` };
    }
    console.error("Database Error:", error);
    return { success: false, error: "Failed to add player to the database." };
  }
}