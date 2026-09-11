import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PlayerStatsRow = {
  player_id: number;
  player_name: string | null;
  match_played: number;
  goals: number;
  assists: number;
  clean_sheets: number;
  goals_involvement: number;
  average_goals_per_match: number;
  average_goals_conceded_per_match: number;
  biography_main: string | null;
  biography_detail: string | null;
  main_player: boolean | null;
  player_number: number | string | null;
  fcmierda_man_of_the_match_awards: number | null;
  photo_link?: string | null;
};

function safeParseArray(val: unknown): any[] {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export async function GET(req: NextRequest) {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 500 });
    }
    const sql = neon(dbUrl);

    const { searchParams } = new URL(req.url);
    const competition = searchParams.get("competition")?.trim();

    // Fetch base player records
    const basePlayers = (await sql`
      SELECT
        ps.player_id,
        ps.player_name,
        ps.match_played,
        ps.goals,
        ps.assists,
        ps.clean_sheets,
        ps.goals_involvement,
        COALESCE(ps.average_goals_per_match, CASE WHEN ps.match_played > 0 THEN ps.goals::float8 / NULLIF(ps.match_played, 0) ELSE 0 END)::float8 AS average_goals_per_match,
        COALESCE(ps.average_goals_conceded_per_match, 0)::float8 AS average_goals_conceded_per_match,
        ps.biography_main,
        ps.biography_detail,
        ps.main_player,
        ps.player_number,
        COALESCE(ps.fcmierda_man_of_the_match_awards, 0) AS fcmierda_man_of_the_match_awards,
        ps.photo_link
      FROM player_statistics ps
      ORDER BY ps.player_id;
    `) as PlayerStatsRow[];

    if (competition && competition.toLowerCase() !== "all" && competition !== "") {
      // Calculate dynamic stats for this competition
      const matches = await sql`
        SELECT
          attendance,
          goals_fcmierda,
          goals_opponent,
          goal_scorers,
          fcmierda_man_of_the_match
        FROM match_result
        WHERE TRIM(competition) = TRIM(${competition});
      `;

      // Build name lookup map
      const playerStatMap = new Map<string, {
        match_played: number;
        goals: number;
        assists: number;
        clean_sheets: number;
        goals_conceded: number;
        motm: number;
      }>();

      for (const p of basePlayers) {
        if (p.player_name) {
          playerStatMap.set(p.player_name.trim().toLowerCase(), {
            match_played: 0,
            goals: 0,
            assists: 0,
            clean_sheets: 0,
            goals_conceded: 0,
            motm: 0,
          });
        }
      }

      for (const m of matches) {
        const attendance = safeParseArray(m.attendance);
        const goalScorers = safeParseArray(m.goal_scorers);
        const goalsOpponent = Number(m.goals_opponent) || 0;
        const isCleanSheet = goalsOpponent === 0;
        const motmName = typeof m.fcmierda_man_of_the_match === "string" ? m.fcmierda_man_of_the_match.trim().toLowerCase() : "";

        // Track attendance & defense
        for (const rawName of attendance) {
          if (typeof rawName !== "string") continue;
          const nameKey = rawName.trim().toLowerCase();
          let entry = playerStatMap.get(nameKey);
          if (!entry) {
            // Find fuzzy or partial match if needed
            for (const [key, val] of playerStatMap.entries()) {
              if (key === nameKey || key.includes(nameKey) || nameKey.includes(key)) {
                entry = val;
                break;
              }
            }
          }
          if (entry) {
            entry.match_played++;
            entry.goals_conceded += goalsOpponent;
            if (isCleanSheet) entry.clean_sheets++;
          }
        }

        // Track goals & assists
        for (const g of goalScorers) {
          if (g && typeof g === "object") {
            if (g.scorer && typeof g.scorer === "string") {
              const scorerKey = g.scorer.trim().toLowerCase();
              let entry = playerStatMap.get(scorerKey);
              if (!entry) {
                for (const [key, val] of playerStatMap.entries()) {
                  if (key === scorerKey || key.includes(scorerKey) || scorerKey.includes(key)) {
                    entry = val;
                    break;
                  }
                }
              }
              if (entry) entry.goals++;
            }
            if (g.assist && typeof g.assist === "string") {
              const assistKey = g.assist.trim().toLowerCase();
              let entry = playerStatMap.get(assistKey);
              if (!entry) {
                for (const [key, val] of playerStatMap.entries()) {
                  if (key === assistKey || key.includes(assistKey) || assistKey.includes(key)) {
                    entry = val;
                    break;
                  }
                }
              }
              if (entry) entry.assists++;
            }
          }
        }

        // Track Man of the Match
        if (motmName) {
          let entry = playerStatMap.get(motmName);
          if (!entry) {
            for (const [key, val] of playerStatMap.entries()) {
              if (key === motmName || key.includes(motmName) || motmName.includes(key)) {
                entry = val;
                break;
              }
            }
          }
          if (entry) entry.motm++;
        }
      }

      // Map computed stats back to players
      const computedPlayers: PlayerStatsRow[] = basePlayers.map((p) => {
        const nameKey = (p.player_name || "").trim().toLowerCase();
        const calc = playerStatMap.get(nameKey) || {
          match_played: 0,
          goals: 0,
          assists: 0,
          clean_sheets: 0,
          goals_conceded: 0,
          motm: 0,
        };

        const match_played = calc.match_played;
        const goals = calc.goals;
        const assists = calc.assists;
        const clean_sheets = calc.clean_sheets;
        const goals_involvement = goals + assists;
        const average_goals_per_match = match_played > 0 ? goals / match_played : 0;
        const average_goals_conceded_per_match = match_played > 0 ? calc.goals_conceded / match_played : 0;

        return {
          ...p,
          match_played,
          goals,
          assists,
          clean_sheets,
          goals_involvement,
          average_goals_per_match,
          average_goals_conceded_per_match,
          fcmierda_man_of_the_match_awards: calc.motm,
        };
      });

      return NextResponse.json({ data: computedPlayers }, { status: 200 });
    }

    // Default: All-time player statistics from table
    return NextResponse.json({ data: basePlayers }, { status: 200 });
  } catch (err) {
    console.error("Player statistics API error:", err);
    return NextResponse.json({ error: "Failed to load player statistics" }, { status: 500 });
  }
}