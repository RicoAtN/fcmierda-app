import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "edge";

type MainPlayerRow = {
  player_id: string;
  number: string | null;
  name: string;
  nickname: string | null;
  role: string | null;
  photo: string | null;
  match_played: number | null;
  goals: number | null;
  assists: number | null;
  clean_sheets: number | null;
  goals_involvement: number | null;
  average_goals_per_match: number | null;
  average_goals_conceded_per_match: number | null;
  biography_main: string | null;
  biography_detail: string | null;
  main_player: boolean | null;
};

export async function GET() {
  try {
    const DATABASE_URL = process.env.DATABASE_URL;
    if (!DATABASE_URL) {
      return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 500 });
    }

    const sql = neon(DATABASE_URL);

    const rows = await sql`
      SELECT
        ps.player_id::text AS player_id,
        ps.player_number::text AS number,
        COALESCE(ps.player_name, CONCAT('Player ', ps.player_id)) AS name,
        ps.player_callsign AS nickname,
        ps.player_position AS role,
        CASE
          WHEN ps.photo_link IS NULL THEN NULL
          WHEN ps.photo_link ~ '^[a-z]+://' THEN ps.photo_link
          WHEN LEFT(ps.photo_link, 1) = '/' THEN ps.photo_link
          ELSE '/' || ps.photo_link
        END AS photo,
        ps.match_played,
        ps.goals,
        ps.assists,
        ps.clean_sheets,
        ps.goals_involvement,
        ps.average_goals_per_match,
        ps.average_goals_conceded_per_match,
        ps.biography_main,
        ps.biography_detail,
        ps.main_player
      FROM player_statistics ps
      WHERE ps.main_player IS TRUE
      ORDER BY
        COALESCE(ps.player_name, CONCAT('Player ', ps.player_id)) NULLS LAST,
        ps.player_id;
    `;

    const data = rows as MainPlayerRow[];
    return NextResponse.json({ data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("Failed to load main players:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}