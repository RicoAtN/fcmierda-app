import { NextResponse } from "next/server";
import { neon, neonConfig } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 500 });

    neonConfig.fetchConnectionCache = true;
    const sql = neon(dbUrl);

    const raw = await sql`
      SELECT team_id, team_name
      FROM opponents
      ORDER BY team_name ASC;
    `;
    const rows = raw as { team_id: string; team_name: string }[];

    return NextResponse.json({ data: rows }, { status: 200 });
  } catch (err) {
    console.error("[/api/opponents] Error:", err);
    const message = err instanceof Error ? err.message : "Failed to load opponents";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}