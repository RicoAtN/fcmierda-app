import { NextResponse } from "next/server";
import { neon, neonConfig } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 500 });
    }
    neonConfig.fetchConnectionCache = true;
    const sql = neon(dbUrl);

    const res = await sql`
      SELECT competition_id, competition_name, opponents
      FROM competition
      ORDER BY competition_id DESC
      LIMIT 1;
    `;
    if (!Array.isArray(res) || res.length === 0) {
      return NextResponse.json({ data: null }, { status: 200 });
    }

    const r: any = res[0];
    const opponentsArray =
      Array.isArray(r.opponents) ? (r.opponents as string[]) :
      typeof r.opponents === "string" ? JSON.parse(r.opponents) :
      [];

    const data = {
      competition_id: String(r.competition_id),
      competition_name: String(r.competition_name),
      opponents: opponentsArray,
    };

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error("[/api/competition] Error:", err);
    const message = err instanceof Error ? err.message : "Failed to load competition";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}