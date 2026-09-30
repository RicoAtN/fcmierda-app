import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type MainPlayerSummary = {
  player_id: string;
  number: string | null;
  name: string;
  nickname: string | null;
  role: string | null;
  photo: string | null;
  main_player: boolean | null;
};

export type MainPlayerDetail = MainPlayerSummary & {
  match_played: number | null;
  goals: number | null;
  assists: number | null;
  clean_sheets: number | null;
  goals_involvement: number | null;
  average_goals_per_match: number | null;
  average_goals_conceded_per_match: number | null;
  fcmierda_man_of_the_match_awards: number | null;
  biography_main: string | null;
  biography_detail: string | null;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get("id") || searchParams.get("playerId");
    const detailed = searchParams.get("detailed") === "true";

    // 1. Fetch single player full details on demand (when clicked/selected)
    if (playerId) {
      const rows = await sql`
        SELECT
          ps.player_id::text AS player_id,
          ps.player_number::text AS number,
          ps.player_name AS name,
          ps.player_callsign AS nickname,
          ps.player_position AS role,
          CASE
            WHEN ps.photo_link IS NULL OR TRIM(ps.photo_link) = '' THEN NULL
            WHEN ps.photo_link ~ '^[a-z]+://' THEN ps.photo_link
            WHEN LEFT(ps.photo_link, 5) = 'data:' THEN ps.photo_link
            WHEN LEFT(ps.photo_link, 1) = '/' THEN ps.photo_link
            ELSE '/' || ps.photo_link
          END AS photo,
          ps.match_played,
          ps.goals,
          ps.assists,
          ps.clean_sheets,
          ps.goals_involvement,
          ps.average_goals_per_match,
          ps.average_goals_conceded_per_match,
          ps.fcmierda_man_of_the_match_awards,
          ps.biography_main,
          ps.biography_detail,
          ps.main_player
        FROM player_statistics ps
        WHERE ps.player_id::text = ${playerId}
        LIMIT 1;
      `;

      return NextResponse.json(
        { data: rows[0] || null },
        {
          status: 200,
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          },
        }
      );
    }

    // 2. Fetch full squad details if explicitly requested with detailed=true
    if (detailed) {
      const rows = await sql`
        SELECT
          ps.player_id::text AS player_id,
          ps.player_number::text AS number,
          ps.player_name AS name,
          ps.player_callsign AS nickname,
          ps.player_position AS role,
          CASE
            WHEN ps.photo_link IS NULL OR TRIM(ps.photo_link) = '' THEN NULL
            WHEN ps.photo_link ~ '^[a-z]+://' THEN ps.photo_link
            WHEN LEFT(ps.photo_link, 5) = 'data:' THEN ps.photo_link
            WHEN LEFT(ps.photo_link, 1) = '/' THEN ps.photo_link
            ELSE '/' || ps.photo_link
          END AS photo,
          ps.match_played,
          ps.goals,
          ps.assists,
          ps.clean_sheets,
          ps.goals_involvement,
          ps.average_goals_per_match,
          ps.average_goals_conceded_per_match,
          ps.fcmierda_man_of_the_match_awards,
          ps.biography_main,
          ps.biography_detail,
          ps.main_player
        FROM player_statistics ps
        WHERE ps.main_player IS TRUE
          AND ps.player_name IS NOT NULL
          AND TRIM(ps.player_name) != ''
        ORDER BY
          ps.player_name NULLS LAST,
          ps.player_id;
      `;

      return NextResponse.json(
        { data: rows as MainPlayerDetail[] },
        {
          status: 200,
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          },
        }
      );
    }

    // 3. Lightweight squad list for frontend: only names, photos, numbers, roles, and call signs
    const rows = await sql`
      SELECT
        ps.player_id::text AS player_id,
        ps.player_number::text AS number,
        ps.player_name AS name,
        ps.player_callsign AS nickname,
        ps.player_position AS role,
        CASE
          WHEN ps.photo_link IS NULL OR TRIM(ps.photo_link) = '' THEN NULL
          WHEN ps.photo_link ~ '^[a-z]+://' THEN ps.photo_link
          WHEN LEFT(ps.photo_link, 5) = 'data:' THEN ps.photo_link
          WHEN LEFT(ps.photo_link, 1) = '/' THEN ps.photo_link
          ELSE '/' || ps.photo_link
        END AS photo,
        ps.main_player
      FROM player_statistics ps
      WHERE ps.main_player IS TRUE
        AND ps.player_name IS NOT NULL
        AND TRIM(ps.player_name) != ''
      ORDER BY
        ps.player_name NULLS LAST,
        ps.player_id;
    `;

    return NextResponse.json(
      { data: rows as MainPlayerSummary[] },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("Failed to load main players:", msg);
    return NextResponse.json({ data: [], error: msg }, { status: 200 });
  }
}