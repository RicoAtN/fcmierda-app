import TeamClient, { DBPlayerWithStats } from "./TeamClient";
import { sql } from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meet the Team | FC Mierda",
  description: "Get to know the players of FC Mierda. Detailed player profiles, squad numbers, call signs, match statistics, and biographies.",
};

async function getMainPlayers(): Promise<{ players: DBPlayerWithStats[]; isDbError: boolean }> {
  try {
    const rows = await sql`
      SELECT
        ps.player_id::text AS player_id,
        ps.player_number::text AS number,
        ps.player_name AS name,
        ps.player_callsign AS nickname,
        ps.player_position AS role,
        CASE
          WHEN ps.photo_link IS NULL OR TRIM(ps.photo_link) = '' THEN NULL
          WHEN LEFT(ps.photo_link, 5) = 'data:' THEN '/api/player-photo?id=' || ps.player_id::text
          WHEN ps.photo_link ~ '^[a-z]+://' AND LENGTH(ps.photo_link) < 1024 THEN ps.photo_link
          WHEN LEFT(ps.photo_link, 1) = '/' AND LENGTH(ps.photo_link) < 1024 THEN ps.photo_link
          WHEN LENGTH(ps.photo_link) < 1024 THEN '/' || ps.photo_link
          ELSE '/api/player-photo?id=' || ps.player_id::text
        END AS photo,
        ps.match_played,
        ps.goals,
        ps.assists,
        ps.clean_sheets,
        ps.goals_involvement,
        ps.average_goals_per_match,
        ps.average_goals_conceded_per_match,
        ps.fcmierda_man_of_the_match_awards,
        ps.biography_main,
        ps.biography_detail,
        ps.main_player
      FROM player_statistics ps
      WHERE ps.main_player IS TRUE
        AND ps.player_name IS NOT NULL
        AND TRIM(ps.player_name) != ''
      ORDER BY
        ps.player_name NULLS LAST,
        ps.player_id;
    `;
    const filtered = (rows as DBPlayerWithStats[]).filter(
      (p) => !p.name.toLowerCase().startsWith("invaller") && !p.name.toLowerCase().startsWith("own")
    );
    return { players: filtered, isDbError: false };
  } catch (err) {
    console.error("[TeamPage] Failed to fetch players on server:", err);
    return { players: [], isDbError: true };
  }
}

export default async function TeamPage() {
  const { players, isDbError } = await getMainPlayers();
  return (
    <TeamClient
      initialPlayers={players}
      initialDbError={isDbError ? "Squad data could not be retrieved from the server." : null}
    />
  );
}