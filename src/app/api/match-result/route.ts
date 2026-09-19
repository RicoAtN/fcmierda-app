import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { logCmsActivity } from "@/lib/cms-logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET: Fetch latest match result or all results if ?all=true
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get("all") === "true") {
      // Return all match results, newest first
      const rows = await sql`SELECT * FROM match_result ORDER BY id DESC`;
      return NextResponse.json(rows || [], {
        headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" },
      });
    } else {
      // Return only the latest match result
      const rows = await sql`SELECT * FROM match_result ORDER BY id DESC LIMIT 1`;
      return NextResponse.json(rows[0] || {}, {
        headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" },
      });
    }
  } catch (e) {
    console.error("GET /api/match-result error:", e);
    return NextResponse.json(req.nextUrl.searchParams.get("all") === "true" ? [] : {});
  }
}

// POST: Save new match result
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rows = await sql`
      INSERT INTO match_result 
        (date, opponent, location, competition, attendance, support_coach, goals_fcmierda, goals_opponent, game_result, goal_scorers, timestamp, youtube, fcmierda_man_of_the_match, match_summary)
      VALUES (
        ${body.date || ""},
        ${body.opponent || ""},
        ${body.location || ""},
        ${body.competition || ""},
        ${JSON.stringify(body.attendance || [])}::jsonb,
        ${JSON.stringify(body.supportCoach || body.support_coach || [])}::jsonb,
        ${body.goalsFCMierda ?? body.goals_fcmierda ?? 0},
        ${body.goalsOpponent ?? body.goals_opponent ?? 0},
        ${body.gameResult || body.game_result || ""},
        ${JSON.stringify(body.goalScorers || body.goal_scorers || [])}::jsonb,
        ${body.timestamp || ""},
        ${body.youtube || ""},
        ${body.fcmierda_man_of_the_match || body.fcmierdaManOfTheMatch || ""},
        ${body.match_summary || body.matchSummary || ""}
      )
      RETURNING id
    `;
    const newId = rows[0]?.id;

    // Log Activity
    const goalsFc = body.goalsFCMierda ?? body.goals_fcmierda ?? 0;
    const goalsOpp = body.goalsOpponent ?? body.goals_opponent ?? 0;
    const opponentName = body.opponent || "Opponent";
    await logCmsActivity({
      action_type: "CREATE",
      module: "match_result",
      entity_id: newId,
      entity_title: `Match Result vs ${opponentName} (${goalsFc}-${goalsOpp})`,
      details: {
        date: body.date,
        opponent: opponentName,
        score: `${goalsFc} - ${goalsOpp}`,
        motm: body.fcmierda_man_of_the_match || body.fcmierdaManOfTheMatch,
        competition: body.competition,
      },
      req,
    });

    try {
      const { revalidatePath } = await import("next/cache");
      revalidatePath("/results");
      revalidatePath("/fixtures");
      revalidatePath("/");
      revalidatePath("/statistics");
      revalidatePath("/team");
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true, id: newId });
  } catch (e) {
    console.error("POST /api/match-result error:", e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}

// PUT: Update existing match result
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    await sql`
      UPDATE match_result SET
        date = ${body.date || ""},
        opponent = ${body.opponent || ""},
        location = ${body.location || ""},
        competition = ${body.competition || ""},
        attendance = ${JSON.stringify(body.attendance || [])}::jsonb,
        support_coach = ${JSON.stringify(body.support_coach || body.supportCoach || [])}::jsonb,
        goals_fcmierda = ${body.goals_fcmierda ?? body.goalsFCMierda ?? 0},
        goals_opponent = ${body.goals_opponent ?? body.goalsOpponent ?? 0},
        game_result = ${body.gameResult || body.game_result || ""},
        goal_scorers = ${JSON.stringify(body.goal_scorers || body.goalScorers || [])}::jsonb,
        lastEdited = ${body.lastEdited || ""},
        fcmierda_man_of_the_match = ${body.fcmierda_man_of_the_match || body.fcmierdaManOfTheMatch || ""},
        youtube = ${body.youtube || ""},
        match_summary = ${body.match_summary || body.matchSummary || ""}
      WHERE id = ${body.id}
    `;

    // Log Activity
    const goalsFc = body.goals_fcmierda ?? body.goalsFCMierda ?? 0;
    const goalsOpp = body.goals_opponent ?? body.goalsOpponent ?? 0;
    const opponentName = body.opponent || "Opponent";
    await logCmsActivity({
      action_type: "UPDATE",
      module: "match_result",
      entity_id: body.id,
      entity_title: `Edited Match Result vs ${opponentName} (${goalsFc}-${goalsOpp})`,
      details: {
        date: body.date,
        opponent: opponentName,
        score: `${goalsFc} - ${goalsOpp}`,
        motm: body.fcmierda_man_of_the_match || body.fcmierdaManOfTheMatch,
        competition: body.competition,
      },
      req,
    });

    try {
      const { revalidatePath } = await import("next/cache");
      revalidatePath("/results");
      revalidatePath("/fixtures");
      revalidatePath("/");
      revalidatePath("/statistics");
      revalidatePath("/team");
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("PUT /api/match-result error:", e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}