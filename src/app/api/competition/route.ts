import { NextResponse } from "next/server";
import { neon, neonConfig } from "@neondatabase/serverless";

function parseOpponents(opponentsValue: unknown): string[] {
  if (Array.isArray(opponentsValue)) return opponentsValue as string[];
  if (typeof opponentsValue === "string") {
    try {
      const parsed = JSON.parse(opponentsValue);
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return opponentsValue.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 500 });
    neonConfig.fetchConnectionCache = true;
    const sql = neon(dbUrl);

    let rows: any[] = [];
    try {
      rows = (await sql`
        SELECT competition_id,
               organisation,                 -- UK spelling
               division, competition_name, total_teams,
               start_period, end_period, football_type, fcmierda_final_rank,
               competition_champion, opponents
        FROM competition
        ORDER BY end_period NULLS LAST, competition_id DESC;
      `) as any[];
    } catch {
      rows = (await sql`
        SELECT competition_id,
               organization AS organisation, -- US spelling aliased to organisation
               division, competition_name, total_teams,
               start_period, end_period, football_type, fcmierda_final_rank,
               competition_champion, opponents
        FROM competition
        ORDER BY end_period NULLS LAST, competition_id DESC;
      `) as any[];
    }

    const data = rows.map((r) => ({
      id: String(r.competition_id),
      organisation: (r.organisation ?? null) as string | null,
      division: r.division as string | null,
      competition_name: r.competition_name as string,
      total_teams: r.total_teams as number | null,
      start_period: r.start_period as string | null,
      end_period: r.end_period as string | null,
      football_type: r.football_type as string | null,
      fcmierda_final_rank: r.fcmierda_final_rank as number | null,
      competition_champion: r.competition_champion as string | null,
      opponents: parseOpponents(r.opponents ?? []),
    }));

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error("[/api/competition GET] Error:", err);
    const message = err instanceof Error ? err.message : "Failed to load competitions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}