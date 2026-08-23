import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET: Fetch latest match result or all results if ?all=true
export async function GET(req: NextRequest) {
  let client;
  try {
    client = await pool.connect();
    const { searchParams } = new URL(req.url);
    if (searchParams.get("all") === "true") {
      // Return all match results, newest first
      const res = await client.query("SELECT * FROM match_result ORDER BY id DESC");
      return NextResponse.json(res.rows || []);
    } else {
      // Return only the latest match result
      const res = await client.query("SELECT * FROM match_result ORDER BY id DESC LIMIT 1");
      return NextResponse.json(res.rows[0] || {});
    }
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
        (date, opponent, location, competition, attendance, support_coach, goals_fcmierda, goals_opponent, game_result, goal_scorers, timestamp, youtube, fcmierda_man_of_the_match, match_summary)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        body.date || "",
        body.opponent || "",
        body.location || "",
        body.competition || "",
        JSON.stringify(body.attendance || []),
        JSON.stringify(body.supportCoach || body.support_coach || []),
        body.goalsFCMierda ?? body.goals_fcmierda ?? 0,
        body.goalsOpponent ?? body.goals_opponent ?? 0,
        body.gameResult || body.game_result || "",
        JSON.stringify(body.goalScorers || body.goal_scorers || []),
        body.timestamp || "",
        body.youtube || "",
        body.fcmierda_man_of_the_match || body.fcmierdaManOfTheMatch || "",
        body.match_summary || body.matchSummary || "",
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

// PUT: Update existing match result
export async function PUT(req: NextRequest) {
  let client;
  try {
    const body = await req.json();
    client = await pool.connect();
    await client.query(
      `UPDATE match_result SET
        date = $1,
        opponent = $2,
        location = $3,
        competition = $4,
        attendance = $5,
        support_coach = $6,
        goals_fcmierda = $7,
        goals_opponent = $8,
        game_result = $9,
        goal_scorers = $10,
        lastEdited = $11,
        fcmierda_man_of_the_match = $12,
        youtube = $13,
        match_summary = $14
      WHERE id = $15`,
      [
        body.date || "",
        body.opponent || "",
        body.location || "",
        body.competition || "",
        JSON.stringify(body.attendance || []),
        JSON.stringify(body.support_coach || body.supportCoach || []),
        body.goals_fcmierda ?? body.goalsFCMierda ?? 0,
        body.goals_opponent ?? body.goalsOpponent ?? 0,
        body.gameResult || body.game_result || "",
        JSON.stringify(body.goal_scorers || body.goalScorers || []),
        body.lastEdited || "",
        body.fcmierda_man_of_the_match || body.fcmierdaManOfTheMatch || "",
        body.youtube || "",
        body.match_summary || body.matchSummary || "",
        body.id,
      ]
    );
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) });
  } finally {
    if (client) client.release();
  }
}