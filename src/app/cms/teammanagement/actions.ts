"use server";

import { sql } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
import { logCmsActivity } from "@/lib/cms-logger";

export async function updatePlayerAction(playerId: number | string, data: any) {
  if (!playerId) {
    throw new Error("Player ID is missing.");
  }

  // Check if there was an old photo that needs deletion from Vercel Blob
  const oldPhotoRes = await sql`
    SELECT photo_link FROM player_statistics WHERE player_id = ${playerId}
  `;
  const oldPhoto = oldPhotoRes[0]?.photo_link;
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

  await sql`
    UPDATE player_statistics 
    SET 
      player_name = ${data.player_name},
      player_number = ${data.player_number || data.number || null},
      player_callsign = ${data.player_callsign || data.nickname || null},
      player_position = ${data.player_position || data.role || null},
      photo_link = ${newPhoto},
      main_player = ${data.main_player || false},
      biography_main = ${data.biography_main || data.biography || null},
      biography_detail = ${data.biography_detail || null},
      updated_at = NOW()
    WHERE player_id = ${playerId}
  `;

  // Log activity
  await logCmsActivity({
    action_type: "UPDATE",
    module: "player",
    entity_id: playerId,
    entity_title: data.player_name || `Player #${playerId}`,
    details: {
      player_name: data.player_name,
      player_number: data.player_number,
      player_position: data.player_position,
      player_callsign: data.player_callsign,
      main_player: data.main_player,
    },
  });

  // Purge cached pages so changes reflect immediately
  revalidatePath("/cms/teammanagement");
  revalidatePath("/team");
  revalidatePath("/statistics");
  revalidatePath("/fixtures");
  return { success: true };
}

export async function addPlayerAction(data: any) {
  // Check if player_id is unique
  if (data.player_id) {
    const check = await sql`
      SELECT player_id FROM player_statistics WHERE player_id = ${data.player_id}
    `;
    if (check.length > 0) {
      return { success: false, error: "The Player ID already exists. Please pick a unique number." };
    }
  }

  try {
    await sql`
      INSERT INTO player_statistics (
        player_id, player_name, player_number, player_callsign, player_position,
        photo_link, main_player, biography_main, biography_detail,
        match_played, goals, assists, clean_sheets,
        updated_at
      ) VALUES (
        ${data.player_id},
        ${data.player_name},
        ${data.player_number || null},
        ${data.player_callsign || null},
        ${data.player_position || null},
        ${data.photo_link || null},
        ${data.main_player || false},
        ${data.biography_main || null},
        ${data.biography_detail || null},
        0, 0, 0, 0,
        NOW()
      )
    `;

    // Log activity
    await logCmsActivity({
      action_type: "CREATE",
      module: "player",
      entity_id: data.player_id,
      entity_title: data.player_name || `Player #${data.player_id}`,
      details: {
        player_name: data.player_name,
        player_number: data.player_number,
        player_position: data.player_position,
        player_callsign: data.player_callsign,
        main_player: data.main_player,
      },
    });

    // Purge the cached data so the page displays the latest values immediately
    revalidatePath("/cms/teammanagement");
    revalidatePath("/team");
    revalidatePath("/statistics");
    revalidatePath("/fixtures");
    return { success: true };
  } catch (error: any) {
    if (error.code === '23505' || (error.message && error.message.includes("unique"))) {
      return { success: false, error: `Duplicate entry error: ${error.detail || 'A player with this ID or Name already exists.'}` };
    }
    console.error("Database Error:", error);
    return { success: false, error: "Failed to add player to the database." };
  }
}