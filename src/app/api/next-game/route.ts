import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { logCmsActivity } from "@/lib/cms-logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error("DATABASE_URL is not set");
      return NextResponse.json({}, { status: 500 });
    }

    const sql = neon(dbUrl);
    const rows = await sql`
      SELECT id, date, kickoff, opponent, location, competition, note, attendance, created_at, updated_at
      FROM next_game
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
      LIMIT 1;
    `;
    const row = rows[0];

    const attendance =
      row?.attendance && typeof row.attendance === "string"
        ? JSON.parse(row.attendance)
        : row?.attendance || {};

    return NextResponse.json(
      {
        date: row?.date ?? "",
        kickoff: row?.kickoff ?? "",
        opponent: row?.opponent ?? "",
        location: row?.location ?? "Alexandria 66 Rotterdam",
        competition: row?.competition ?? "",
        note: row?.note ?? "",
        attendance,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=15, stale-while-revalidate=60",
        },
      }
    );
  } catch (err) {
    console.error("GET /api/next-game failed", err);
    return NextResponse.json({}, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error("DATABASE_URL is not set");
      return NextResponse.json({}, { status: 500 });
    }

    const sql = neon(dbUrl);
    const body = await req.json();
    const { date, kickoff, opponent, location, competition, note, attendance } = body || {};

    await sql`
      WITH latest AS (
        SELECT id
        FROM next_game
        ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
        LIMIT 1
      ),
      updated AS (
        UPDATE next_game
        SET
          date = ${date},
          kickoff = ${kickoff},
          opponent = ${opponent},
          location = ${location},
          competition = ${competition},
          note = ${note},
          attendance = ${JSON.stringify(attendance || {})}::jsonb,
          updated_at = NOW()
        WHERE id IN (SELECT id FROM latest)
        RETURNING id
      )
      INSERT INTO next_game (date, kickoff, opponent, location, competition, note, attendance, created_at, updated_at)
      SELECT
        ${date}, ${kickoff}, ${opponent}, ${location}, ${competition}, ${note},
        ${JSON.stringify(attendance || {})}::jsonb,
        NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM updated);
    `;

    // Log CMS Activity
    await logCmsActivity({
      action_type: "UPDATE",
      module: opponent ? "next_game" : "attendance",
      entity_title: opponent ? `Next Match vs ${opponent}` : "Squad Availability Tracker",
      details: {
        date,
        kickoff,
        opponent,
        location,
        competition,
        attendance_count: attendance ? Object.keys(attendance).length : 0,
      },
      req,
    });

    try {
      const { revalidatePath } = await import("next/cache");
      revalidatePath("/fixtures");
      revalidatePath("/");
      revalidatePath("/results");
    } catch {
      // ignore
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("POST /api/next-game failed", err);
    return NextResponse.json({}, { status: 500 });
  }
}