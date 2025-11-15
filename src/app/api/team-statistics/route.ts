import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 500 });
    }
    const sql = neon(dbUrl);

    type TeamStatsRow = {
      match_played: number;
      clean_sheets: number;
      total_wins: number;
      total_losses: number;
      total_draws: number;
      goals_scored: number;
      average_goals_per_match: number;
      goals_conceded: number;
      average_goals_conceded_per_match: number;
    };

    const rows = (await sql`
      SELECT
        match_played,
        clean_sheets,
        total_wins,
        total_losses,
        total_draws,
        goals_scored,
        COALESCE(
          average_goals_per_match,
          CASE WHEN match_played > 0 THEN goals_scored::float8 / NULLIF(match_played, 0) ELSE 0 END
        )::float8 AS average_goals_per_match,
        goals_conceded,
        COALESCE(
          average_goals_conceded_per_match,
          CASE WHEN match_played > 0 THEN goals_conceded::float8 / NULLIF(match_played, 0) ELSE 0 END
        )::float8 AS average_goals_conceded_per_match
      FROM public.team_statistics
      LIMIT 1;
    `) as TeamStatsRow[];

    const data =
      rows?.[0] ?? {
        match_played: 0,
        clean_sheets: 0,
        total_wins: 0,
        total_losses: 0,
        total_draws: 0,
        goals_scored: 0,
        average_goals_per_match: 0,
        goals_conceded: 0,
        average_goals_conceded_per_match: 0,
      };

    return NextResponse.json({ data }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load team statistics";
    console.error("Team statistics API error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}