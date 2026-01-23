import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 500 });
    }
    const sql = neon(dbUrl);

    type PlayerStatsRow = {
      player_id: number;
      match_played: number;
      goals: number;
      assists: number;
      clean_sheets: number;
      goals_involvement: number;
      average_goals_per_match: number;
      average_goals_conceded_per_match: number;
      biography_main: string | null;
      biography_detail: string | null;
    };

    const rows = (await sql`
      SELECT
        ps.player_id,
        ps.match_played,
        ps.goals,
        ps.assists,
        ps.clean_sheets,
        (ps.goals + ps.assists) AS goals_involvement,
        COALESCE(ps.average_goals_per_match, CASE WHEN ps.match_played > 0 THEN ps.goals::float8 / NULLIF(ps.match_played, 0) ELSE 0 END)::float8 AS average_goals_per_match,
        COALESCE(ps.average_goals_conceded_per_match, 0)::float8 AS average_goals_conceded_per_match,
        ps.biography_main,
        ps.biography_detail
      FROM player_statistics ps
      ORDER BY ps.player_id;
    `) as PlayerStatsRow[];

    return NextResponse.json({ data: rows }, { status: 200 });
  } catch (err) {
    console.error("Player statistics API error:", err);
    return NextResponse.json({ error: "Failed to load player statistics" }, { status: 500 });
  }
}