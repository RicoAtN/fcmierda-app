import { NextResponse } from "next/server";
import { neon, neonConfig } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CompetitionRow = {
  competition_id: string;
  competition_name: string;
  opponents: string[];
  end_period?: string | null;
  fcmierda_final_rank?: number | null;
  competition_champion?: string | null;
};

function parseOpponents(opponentsValue: unknown): string[] {
  if (Array.isArray(opponentsValue)) {
    return opponentsValue as string[];
  }
  if (typeof opponentsValue === "string") {
    try {
      const parsed = JSON.parse(opponentsValue);
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 500 });
    }
    neonConfig.fetchConnectionCache = true;
    const sql = neon(dbUrl);

    const res = await sql`
      SELECT competition_id, competition_name, opponents, end_period, fcmierda_final_rank, competition_champion
      FROM competition ORDER BY competition_id DESC;
    `;

    if (!Array.isArray(res)) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    const data: CompetitionRow[] = res.map((row) => ({
      competition_id: String(row.competition_id),
      competition_name: row.competition_name,
      opponents: parseOpponents(row.opponents),
      end_period: row.end_period,
      fcmierda_final_rank: row.fcmierda_final_rank,
      competition_champion: row.competition_champion,
    }));

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error("[/api/competition] Error:", err);
    const message = err instanceof Error ? err.message : "Failed to load competition";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}