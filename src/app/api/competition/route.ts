import { NextResponse } from "next/server";
import { neon, neonConfig } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CompetitionRow = {
  competition_id: string;
  competition_name: string;
  opponents: string[];
};

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 500 });
    }
    neonConfig.fetchConnectionCache = true;
    const sql = neon(dbUrl);

    // Query without generic; cast after
    const res = await sql`
      SELECT competition_id, competition_name, opponents
      FROM competition
      ORDER BY competition_id DESC
      LIMIT 1;
    `;

    if (!Array.isArray(res) || res.length === 0) {
      return NextResponse.json({ data: null }, { status: 200 });
    }

    const r = res[0] as {
      competition_id: string | number;
      competition_name: string;
      opponents: unknown;
    };

    let opponents: string[] = [];
    if (Array.isArray(r.opponents)) {
      opponents = r.opponents as string[];
    } else if (typeof r.opponents === "string") {
      try {
        const parsed = JSON.parse(r.opponents);
        opponents = Array.isArray(parsed) ? (parsed as string[]) : [];
      } catch {
        opponents = [];
      }
    }

    const data: CompetitionRow = {
      competition_id: String(r.competition_id),
      competition_name: r.competition_name,
      opponents,
    };

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error("[/api/competition] Error:", err);
    const message = err instanceof Error ? err.message : "Failed to load competition";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}