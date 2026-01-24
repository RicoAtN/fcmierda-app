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

    const rows = (await sql`
      SELECT
        CASE LOWER(TRIM(COALESCE(game_result, '')))
          WHEN 'w' THEN 'W'
          WHEN 'win' THEN 'W'
          WHEN 'victory' THEN 'W'
          WHEN 'd' THEN 'D'
          WHEN 'draw' THEN 'D'
          WHEN 'tie' THEN 'D'
          WHEN 'l' THEN 'L'
          WHEN 'loss' THEN 'L'
          WHEN 'lose' THEN 'L'
          ELSE '' -- unknown -> blank
        END AS game_result
      FROM match_result
      ORDER BY id DESC
      LIMIT 5
    `) as { game_result: "" | "W" | "D" | "L" }[];

    return NextResponse.json({ data: { results: rows.map(r => r.game_result) } }, { status: 200 });
  } catch (err) {
    console.error("Team form API error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}