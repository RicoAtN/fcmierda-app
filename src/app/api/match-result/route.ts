import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET: Fetch latest match result
export async function GET() {
  let client;
  try {
    client = await pool.connect();
    const res = await client.query("SELECT * FROM match_result ORDER BY id DESC LIMIT 1");
    return NextResponse.json(res.rows[0] || {});
  } catch (e) {
    return NextResponse.json({});
  } finally {
    if (client) client.release();
  }
}

// POST: Save new match result
export async function POST(req: NextRequest) {
  let client;
  try {
    const body = await req.json();
    client = await pool.connect();
    await client.query(
      `INSERT INTO match_result 
        (date, opponent, location, competition, attendance, support_coach, goals_fcmierda, goals_opponent, game_result, goal_scorers, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        body.date || "",
        body.opponent || "",
        body.location || "",
        body.competition || "",
        JSON.stringify(body.attendance || []),
        JSON.stringify(body.supportCoach || []),
        body.goalsFCMierda ?? 0,
        body.goalsOpponent ?? 0,
        body.gameResult || "",
        JSON.stringify(body.goalScorers || []),
        body.timestamp || "",
      ]
    );
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("POST /api/match-result error:", e);
    return NextResponse.json({ success: false, error: String(e) });
  } finally {
    if (client) client.release();
  }
}