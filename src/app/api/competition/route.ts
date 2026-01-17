import { NextRequest, NextResponse } from "next/server";
import { neon, neonConfig } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ColumnInfo = { column_name: string; data_type: string };

function parseOpponents(opponentsValue: unknown): string[] {
  if (Array.isArray(opponentsValue)) return opponentsValue as string[];
  if (typeof opponentsValue === "string") {
    try {
      const parsed = JSON.parse(opponentsValue);
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return opponentsValue
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
}

async function getSchema(sql: any) {
  const cols = (await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'competition';
  `) as ColumnInfo[];
  const hasOrganisation = cols.some((c) => c.column_name === "organisation");
  const hasOrganization = cols.some((c) => c.column_name === "organization");

  const opponentsCol = cols.find((c) => c.column_name === "opponents");
  let opponentsType: "jsonb" | "text[]" | "text" | null = null;
  if (opponentsCol) {
    if (opponentsCol.data_type === "jsonb") opponentsType = "jsonb";
    else if (opponentsCol.data_type.includes("ARRAY")) opponentsType = "text[]";
    else opponentsType = "text";
  }
  return { hasOrganisation, hasOrganization, opponentsType };
}

function normalizeNew(payload: any) {
  const out = { ...payload };
  const num = (v: any) =>
    v === "" || v == null ? null : typeof v === "number" ? v : /^\d+$/.test(String(v)) ? Number(v) : null;

  out.organisation =
    typeof out.organisation === "string" && out.organisation.trim().length ? out.organisation.trim() : "Powerleague Rotterdam";
  out.division = num(out.division) ?? 1;
  out.competition_name =
    typeof out.competition_name === "string" && out.competition_name.trim().length
      ? out.competition_name.trim()
      : "Powerleague 7vs7 division 1";
  out.total_teams = num(out.total_teams);
  out.start_period = out.start_period || null;
  out.end_period = out.end_period || null;
  out.football_type =
    typeof out.football_type === "string" && out.football_type.trim().length ? out.football_type.trim() : "7vs7";
  out.fcmierda_final_rank = num(out.fcmierda_final_rank);
  out.competition_champion =
    typeof out.competition_champion === "string" && out.competition_champion.trim().length
      ? out.competition_champion.trim()
      : null;
  out.opponents = Array.isArray(out.opponents)
    ? out.opponents.map((s: any) => String(s).trim()).filter(Boolean)
    : [];
  return out;
}

function validateNew(payload: any) {
  const errors: string[] = [];
  if (!payload || typeof payload !== "object") errors.push("Invalid payload.");
  if (!payload.competition_name || typeof payload.competition_name !== "string") {
    errors.push("competition_name is required.");
  }
  if (payload.division != null && typeof payload.division !== "number") {
    errors.push("division must be a number.");
  }
  if (payload.total_teams != null && typeof payload.total_teams !== "number") {
    errors.push("total_teams must be a number or null.");
  }
  if (payload.fcmierda_final_rank != null && typeof payload.fcmierda_final_rank !== "number") {
    errors.push("fcmierda_final_rank must be a number or null.");
  }
  if (payload.opponents != null && !Array.isArray(payload.opponents)) {
    errors.push("opponents must be an array of strings.");
  }
  return errors;
}

export async function GET(_req: NextRequest) {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 500 });
    neonConfig.fetchConnectionCache = true;
    const sql = neon(dbUrl);

    const schema = await getSchema(sql);
    const rows = (await sql`
      SELECT
        competition_id,
        ${schema.hasOrganisation
          ? sql`organisation AS organisation`
          : schema.hasOrganization
          ? sql`organization AS organisation`
          : sql`NULL::text AS organisation`},
        division,
        competition_name,
        total_teams,
        start_period,
        end_period,
        football_type,
        fcmierda_final_rank,
        competition_champion,
        opponents
      FROM competition
      ORDER BY end_period DESC NULLS LAST, competition_id DESC;
    `) as any[];

    const data = rows.map((r: any) => ({
      id: String(r.competition_id),
      organisation: r.organisation ?? null,
      division: r.division ?? null,
      competition_name: r.competition_name as string,
      total_teams: r.total_teams ?? null,
      start_period: r.start_period ?? null,
      end_period: r.end_period ?? null,
      football_type: r.football_type ?? null,
      fcmierda_final_rank: r.fcmierda_final_rank ?? null,
      competition_champion:
        typeof r.competition_champion === "string" && r.competition_champion.trim().length
          ? r.competition_champion.trim()
          : null,
      opponents: parseOpponents(r.opponents ?? []),
    }));

    return NextResponse.json({ data }, { status: 200 });
  } catch (err: any) {
    console.error("[/api/competition GET] Error:", err);
    return NextResponse.json({ error: err?.message || "Failed to load competitions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 500 });
    neonConfig.fetchConnectionCache = true;
    const sql = neon(dbUrl);

    const raw = await req.json();
    const payload = normalizeNew(raw);
    const errors = validateNew(payload);
    if (errors.length) return NextResponse.json({ error: errors.join(" ") }, { status: 400 });

    const schema = await getSchema(sql);
    const orgCol = schema.hasOrganisation ? "organisation" : schema.hasOrganization ? "organization" : null;

    const opponentsArr: string[] = payload.opponents;
    const arrayLiteral =
      opponentsArr.length === 0 ? "{}" : `{"${opponentsArr.map((v) => v.replace(/"/g, '\\"')).join('","')}"}`;

    // Insert (use explicit column names; avoid dynamic sql())
    if (orgCol === "organisation") {
      if (schema.opponentsType === "jsonb") {
        await sql`
          INSERT INTO competition (organisation, division, competition_name, total_teams, start_period, end_period, football_type, fcmierda_final_rank, competition_champion, opponents)
          VALUES (${payload.organisation}, ${payload.division}, ${payload.competition_name}, ${payload.total_teams}, ${payload.start_period}, ${payload.end_period}, ${payload.football_type}, ${payload.fcmierda_final_rank}, ${payload.competition_champion}, ${JSON.stringify(opponentsArr)}::jsonb)
        `;
      } else if (schema.opponentsType === "text[]") {
        await sql`
          INSERT INTO competition (organisation, division, competition_name, total_teams, start_period, end_period, football_type, fcmierda_final_rank, competition_champion, opponents)
          VALUES (${payload.organisation}, ${payload.division}, ${payload.competition_name}, ${payload.total_teams}, ${payload.start_period}, ${payload.end_period}, ${payload.football_type}, ${payload.fcmierda_final_rank}, ${payload.competition_champion}, ${arrayLiteral}::text[])
        `;
      } else {
        await sql`
          INSERT INTO competition (organisation, division, competition_name, total_teams, start_period, end_period, football_type, fcmierda_final_rank, competition_champion, opponents)
          VALUES (${payload.organisation}, ${payload.division}, ${payload.competition_name}, ${payload.total_teams}, ${payload.start_period}, ${payload.end_period}, ${payload.football_type}, ${payload.fcmierda_final_rank}, ${payload.competition_champion}, ${JSON.stringify(opponentsArr)})
        `;
      }
    } else if (orgCol === "organization") {
      if (schema.opponentsType === "jsonb") {
        await sql`
          INSERT INTO competition (organization, division, competition_name, total_teams, start_period, end_period, football_type, fcmierda_final_rank, competition_champion, opponents)
          VALUES (${payload.organisation}, ${payload.division}, ${payload.competition_name}, ${payload.total_teams}, ${payload.start_period}, ${payload.end_period}, ${payload.football_type}, ${payload.fcmierda_final_rank}, ${payload.competition_champion}, ${JSON.stringify(opponentsArr)}::jsonb)
        `;
      } else if (schema.opponentsType === "text[]") {
        await sql`
          INSERT INTO competition (organization, division, competition_name, total_teams, start_period, end_period, football_type, fcmierda_final_rank, competition_champion, opponents)
          VALUES (${payload.organisation}, ${payload.division}, ${payload.competition_name}, ${payload.total_teams}, ${payload.start_period}, ${payload.end_period}, ${payload.football_type}, ${payload.fcmierda_final_rank}, ${payload.competition_champion}, ${arrayLiteral}::text[])
        `;
      } else {
        await sql`
          INSERT INTO competition (organization, division, competition_name, total_teams, start_period, end_period, football_type, fcmierda_final_rank, competition_champion, opponents)
          VALUES (${payload.organisation}, ${payload.division}, ${payload.competition_name}, ${payload.total_teams}, ${payload.start_period}, ${payload.end_period}, ${payload.football_type}, ${payload.fcmierda_final_rank}, ${payload.competition_champion}, ${JSON.stringify(opponentsArr)})
        `;
      }
    } else {
      if (schema.opponentsType === "jsonb") {
        await sql`
          INSERT INTO competition (division, competition_name, total_teams, start_period, end_period, football_type, fcmierda_final_rank, competition_champion, opponents)
          VALUES (${payload.division}, ${payload.competition_name}, ${payload.total_teams}, ${payload.start_period}, ${payload.end_period}, ${payload.football_type}, ${payload.fcmierda_final_rank}, ${payload.competition_champion}, ${JSON.stringify(opponentsArr)}::jsonb)
        `;
      } else if (schema.opponentsType === "text[]") {
        await sql`
          INSERT INTO competition (division, competition_name, total_teams, start_period, end_period, football_type, fcmierda_final_rank, competition_champion, opponents)
          VALUES (${payload.division}, ${payload.competition_name}, ${payload.total_teams}, ${payload.start_period}, ${payload.end_period}, ${payload.football_type}, ${payload.fcmierda_final_rank}, ${payload.competition_champion}, ${arrayLiteral}::text[])
        `;
      } else {
        await sql`
          INSERT INTO competition (division, competition_name, total_teams, start_period, end_period, football_type, fcmierda_final_rank, competition_champion, opponents)
          VALUES (${payload.division}, ${payload.competition_name}, ${payload.total_teams}, ${payload.start_period}, ${payload.end_period}, ${payload.football_type}, ${payload.fcmierda_final_rank}, ${payload.competition_champion}, ${JSON.stringify(opponentsArr)})
        `;
      }
    }

    const rows = (await sql`
      SELECT competition_id,
             ${schema.hasOrganisation
               ? sql`organisation AS organisation`
               : schema.hasOrganization
               ? sql`organization AS organisation`
               : sql`NULL::text AS organisation`},
             division, competition_name, total_teams,
             start_period, end_period, football_type, fcmierda_final_rank,
             competition_champion, opponents
      FROM competition
      WHERE TRIM(competition_name) = TRIM(${payload.competition_name})
      ORDER BY competition_id DESC
      LIMIT 1;
    `) as any[];

    const r = rows[0];
    const data = {
      id: String(r.competition_id),
      organisation: r.organisation ?? null,
      division: r.division ?? null,
      competition_name: r.competition_name as string,
      total_teams: r.total_teams ?? null,
      start_period: r.start_period ?? null,
      end_period: r.end_period ?? null,
      football_type: r.football_type ?? null,
      fcmierda_final_rank: r.fcmierda_final_rank ?? null,
      competition_champion:
        typeof r.competition_champion === "string" && r.competition_champion.trim().length
          ? r.competition_champion.trim()
          : null,
      opponents: parseOpponents(r.opponents ?? []),
    };

    return NextResponse.json({ data }, { status: 201 });
  } catch (err: any) {
    console.error("[/api/competition POST] Error:", {
      message: err?.message,
      code: err?.code,
      detail: err?.detail,
      position: err?.position,
    });
    return NextResponse.json({ error: err?.message || "Failed to create competition" }, { status: 500 });
  }
}