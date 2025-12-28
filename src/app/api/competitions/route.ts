import { NextResponse } from "next/server";
import { neon, neonConfig } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CompetitionOverviewRow = {
  competition_name: string;
  end_period: string | null;
  fcmierda_final_rank: number | null;
  competition_champion: string | null;
};

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 500 });
    }
    neonConfig.fetchConnectionCache = true;
    const sql = neon(dbUrl);

    const res = await sql`
      SELECT competition_name, end_period, fcmierda_final_rank, competition_champion
      FROM competition
      ORDER BY competition_id DESC;
    `;

    const rows: CompetitionOverviewRow[] = (Array.isArray(res) ? res : []).map((r: any) => ({
      competition_name: String(r.competition_name ?? ""),
      end_period: r.end_period != null ? String(r.end_period) : null,
      fcmierda_final_rank:
        r.fcmierda_final_rank != null ? Number(r.fcmierda_final_rank) : null,
      competition_champion: r.competition_champion != null ? String(r.competition_champion) : null,
    }));

    return NextResponse.json({ data: rows }, { status: 200 });
  } catch (err) {
    console.error("[/api/competitions] Error:", err);
    const message = err instanceof Error ? err.message : "Failed to load competitions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}