import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export type PlayerStats = {
  player_id: number;
  match_played: number;
  goals: number;
  assists: number;
  clean_sheets: number;
  goals_involvement?: number;
  average_goals_per_match?: number; // <- added
};

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error("DATABASE_URL is not set");
      return NextResponse.json({ data: [] }, { status: 500 });
    }

    const sql = neon(dbUrl);
    const rows = (await sql`
      SELECT
        player_id,
        match_played,
        goals,
        assists,
        clean_sheets,
        goals_involvement,
        -- cast to double precision so it comes back as a number, not a string
        average_goals_per_match::double precision AS average_goals_per_match
      FROM player_statistics
      ORDER BY player_id;
    `) as PlayerStats[];

    return NextResponse.json({ data: rows }, { status: 200 });
  } catch (err) {
    console.error("Failed to load player statistics", err);
    return NextResponse.json({ data: [] }, { status: 500 });
  }
}