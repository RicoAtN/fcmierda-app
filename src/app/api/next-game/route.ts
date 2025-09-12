import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const EMPTY_GAME = {
  date: "",
  kickoff: "",
  opponent: "",
  location: "",
  competition: "",
  note: ""
};

export async function GET() {
  let client;
  try {
    client = await pool.connect();
    const res = await client.query("SELECT * FROM next_game ORDER BY id DESC LIMIT 1");
    return NextResponse.json(res.rows[0] || EMPTY_GAME);
  } catch (e) {
    console.error("GET /api/next-game error:", e instanceof Error ? e.message : e);
    return NextResponse.json(EMPTY_GAME);
  } finally {
    if (client) client.release();
  }
}

export async function POST(req: NextRequest) {
  let client;
  try {
    const body = await req.json();
    client = await pool.connect();
    // Only insert, do not delete
    await client.query(
      `INSERT INTO next_game (date, kickoff, opponent, location, competition, note)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        body.date || "",
        body.kickoff || "",
        body.opponent || "",
        body.location || "",
        body.competition || "",
        body.note || "",
      ]
    );
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("POST /api/next-game error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : String(e) });
  } finally {
    if (client) client.release();
  }
}