import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT * FROM next_game ORDER BY id DESC LIMIT 1");
    return NextResponse.json(res.rows[0] || {});
  } finally {
    client.release();
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const client = await pool.connect();
  try {
    // Upsert: delete all and insert new
    await client.query("DELETE FROM next_game");
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
  } finally {
    client.release();
  }
}