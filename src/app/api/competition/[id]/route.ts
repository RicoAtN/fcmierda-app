import { NextRequest, NextResponse } from "next/server";
import { neon, neonConfig } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_ORGANISATION = "Powerleague Rotterdam";
function ensureOrganisation(val: unknown): string {
  const s = typeof val === "string" ? val : val == null ? "" : String(val);
  const t = s.trim();
  return t.length ? t : DEFAULT_ORGANISATION;
}

function parseOpponents(opponentsValue: unknown): string[] {
  if (Array.isArray(opponentsValue)) return opponentsValue as string[];
  if (typeof opponentsValue === "string") {
    const s = opponentsValue.trim();
    if (s.startsWith("{") && s.endsWith("}")) {
      const inner = s.slice(1, -1);
      const items: string[] = [];
      let buf = "";
      let inQuotes = false;
      for (let i = 0; i < inner.length; i++) {
        const ch = inner[i];
        if (ch === '"' && inner[i - 1] !== "\\") {
          inQuotes = !inQuotes;
        } else if (ch === "," && !inQuotes) {
          items.push(buf.replace(/\\"/g, '"').replace(/\\,/g, ",").trim());
          buf = "";
        } else {
          buf += ch;
        }
      }
      if (buf.length) items.push(buf.replace(/\\"/g, '"').replace(/\\,/g, ",").trim());
      return items.filter(Boolean);
    }
    try {
      const parsed = JSON.parse(s);
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return s.split(",").map((x) => x.trim()).filter(Boolean);
    }
  }
  return [];
}

type CompetitionDetailsRow = {
  competition_id: string | number;
  organisation: string | null;
  division: string | null;
  competition_name: string;
  total_teams: number | null;
  start_period: string | null;
  end_period: string | null;
  football_type: string | null;
  fcmierda_final_rank: number | null;
  competition_champion: string | null;
  opponents: string[] | string | null;
};

function isNumericId(s: string) {
  return /^\d+$/.test(s);
}

async function getCompetitionSchema(sql: any) {
  const cols = (await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'competition';
  `) as { column_name: string; data_type: string }[];

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

function validatePayload(payload: any) {
  const errors: string[] = [];
  if (!payload || typeof payload !== "object") errors.push("Invalid payload.");
  if (!payload.competition_name || typeof payload.competition_name !== "string") {
    errors.push("competition_name is required and must be a string.");
  }
  if (payload.total_teams != null && typeof payload.total_teams !== "number") {
    errors.push("total_teams must be a number or null.");
  }
  if (payload.fcmierda_final_rank != null && typeof payload.fcmierda_final_rank !== "number") {
    errors.push("fcmierda_final_rank must be a number or null.");
  }
  if (payload.opponents != null && !Array.isArray(payload.opponents)) {
    errors.push("opponents must be an array of strings or omitted.");
  }
  return errors;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params; // await the Promise-based params in Next 16
    const key = decodeURIComponent(id);

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 500 });
    neonConfig.fetchConnectionCache = true;
    const sql = neon(dbUrl);

    const byId = isNumericId(key);
    const schema = await getCompetitionSchema(sql);

    const orgSelect =
      schema.hasOrganisation
        ? sql`organisation AS organisation`
        : schema.hasOrganization
        ? sql`organization AS organisation`
        : sql`NULL::text AS organisation`;

    let rows: any[] = [];
    if (byId) {
      rows = (await sql`
        SELECT competition_id,
               ${orgSelect},
               division, competition_name, total_teams,
               start_period, end_period, football_type, fcmierda_final_rank,
               competition_champion, opponents
        FROM competition
        WHERE competition_id = ${Number(key)}
        LIMIT 1;
      `) as any[];
    } else {
      rows = (await sql`
        SELECT competition_id,
               ${orgSelect},
               division, competition_name, total_teams,
               start_period, end_period, football_type, fcmierda_final_rank,
               competition_champion, opponents
        FROM competition
        WHERE TRIM(competition_name) = TRIM(${key})
        LIMIT 1;
      `) as any[];
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const row = rows[0] as CompetitionDetailsRow;
    const data = {
      id: String(row.competition_id),
      organisation: ensureOrganisation(row.organisation),
      division: row.division,
      competition_name: row.competition_name,
      total_teams: row.total_teams,
      start_period: row.start_period,
      end_period: row.end_period,
      football_type: row.football_type,
      fcmierda_final_rank: row.fcmierda_final_rank,
      competition_champion: row.competition_champion,
      opponents: parseOpponents(row.opponents ?? []),
    };

    return NextResponse.json({ data }, { status: 200 });
  } catch (err: any) {
    console.error("[/api/competition/[id] GET] Error:", {
      message: err?.message,
      code: err?.code,
      detail: err?.detail,
      position: err?.position,
      stack: err?.stack,
    });
    return NextResponse.json({ error: err?.message || "Failed to load competition" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params; // await the Promise-based params in Next 16
    const whereKey = (await req.json())?.id ?? decodeURIComponent(id);
    // Re-parse payload again below if needed; or read it once and store in a variable.
    const payload = typeof whereKey === "object" ? whereKey : await req.json();

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 500 });
    neonConfig.fetchConnectionCache = true;
    const sql = neon(dbUrl);

    const validationErrors = validatePayload(payload);
    if (validationErrors.length) {
      return NextResponse.json({ error: validationErrors.join(" ") }, { status: 400 });
    }

    const byId = /^\d+$/.test(whereKey);
    const schema = await getCompetitionSchema(sql);

    // Resolve competition_id
    const idRow = byId
      ? ((await sql`SELECT competition_id FROM competition WHERE competition_id = ${Number(whereKey)} LIMIT 1;`) as any[])
      : ((await sql`
          SELECT competition_id
          FROM competition
          WHERE TRIM(competition_name) = TRIM(${whereKey})
          LIMIT 1;
        `) as any[]);
    if (!idRow.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const compId = Number(idRow[0].competition_id);

    // Load current values (so we can keep organisation if payload omits/blank)
    const currentRows = (await sql`
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
      WHERE competition_id = ${compId}
      LIMIT 1;
    `) as any[];
    const current = currentRows[0];

    const keepStr = (incoming: any, existing: string | null) => {
      if (incoming === undefined) return existing;
      if (incoming === null) return null;
      const s = String(incoming).trim();
      return s.length ? s : existing;
    };
    const keepNum = (incoming: any, existing: number | null) => {
      if (incoming === undefined) return existing;
      if (incoming === null) return null;
      return typeof incoming === "number" ? incoming : existing;
    };

    const newOrganisation = keepStr(payload.organisation, current.organisation);
    const finalOrganisation = ensureOrganisation(newOrganisation);
    const newDivision = keepStr(payload.division, current.division);
    const newName = keepStr(payload.competition_name, current.competition_name);
    const newTeams = keepNum(payload.total_teams, current.total_teams);
    const newStart = keepStr(payload.start_period, current.start_period);
    const newEnd = keepStr(payload.end_period, current.end_period);
    const newType = keepStr(payload.football_type, current.football_type);
    const newRank = keepNum(payload.fcmierda_final_rank, current.fcmierda_final_rank);
    const newChampion = keepStr(payload.competition_champion, current.competition_champion);

    if (schema.hasOrganisation) {
      await sql`
        UPDATE competition
        SET organisation = ${finalOrganisation},
            division = ${newDivision},
            competition_name = ${newName},
            total_teams = ${newTeams},
            start_period = ${newStart},
            end_period = ${newEnd},
            football_type = ${newType},
            fcmierda_final_rank = ${newRank},
            competition_champion = ${newChampion}
        WHERE competition_id = ${compId};
      `;
    } else if (schema.hasOrganization) {
      await sql`
        UPDATE competition
        SET organization = ${finalOrganisation},
            division = ${newDivision},
            competition_name = ${newName},
            total_teams = ${newTeams},
            start_period = ${newStart},
            end_period = ${newEnd},
            football_type = ${newType},
            fcmierda_final_rank = ${newRank},
            competition_champion = ${newChampion}
        WHERE competition_id = ${compId};
      `;
    } else {
      await sql`
        UPDATE competition
        SET division = ${newDivision},
            competition_name = ${newName},
            total_teams = ${newTeams},
            start_period = ${newStart},
            end_period = ${newEnd},
            football_type = ${newType},
            fcmierda_final_rank = ${newRank},
            competition_champion = ${newChampion}
        WHERE competition_id = ${compId};
      `;
    }

    // Opponents update (only if provided)
    if (Object.prototype.hasOwnProperty.call(payload, "opponents")) {
      const opponentsArr: string[] = Array.isArray(payload.opponents)
        ? payload.opponents.map((s: string) => String(s).trim()).filter(Boolean)
        : [];
      const opponentsJson = JSON.stringify(opponentsArr);
      if (schema.opponentsType === "jsonb") {
        await sql`UPDATE competition SET opponents = ${opponentsJson}::jsonb WHERE competition_id = ${compId};`;
      } else if (schema.opponentsType === "text[]") {
        const delim = "|";
        const opponentsPipe = opponentsArr.join(delim);
        await sql`
          UPDATE competition
          SET opponents = CASE
            WHEN ${opponentsPipe} = '' THEN ARRAY[]::text[]
            ELSE string_to_array(${opponentsPipe}, ${delim})::text[]
          END
          WHERE competition_id = ${compId};
        `;
      } else {
        await sql`UPDATE competition SET opponents = ${opponentsJson} WHERE competition_id = ${compId};`;
      }
    }

    // Return updated
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
      WHERE competition_id = ${compId}
      LIMIT 1;
    `) as any[];

    const row = rows[0] as CompetitionDetailsRow;
    const data = {
      id: String(row.competition_id),
      organisation: ensureOrganisation(row.organisation),
      division: row.division ?? null,
      competition_name: row.competition_name,
      total_teams: row.total_teams ?? null,
      start_period: row.start_period ?? null,
      end_period: row.end_period ?? null,
      football_type: row.football_type ?? null,
      fcmierda_final_rank: row.fcmierda_final_rank ?? null,
      competition_champion: row.competition_champion ?? null,
      opponents: parseOpponents(row.opponents ?? []),
    };

    return NextResponse.json({ data }, { status: 200 });
  } catch (err: any) {
    console.error("[/api/competition/[id] PUT] Error:", {
      message: err?.message,
      code: err?.code,
      detail: err?.detail,
      position: err?.position,
      stack: err?.stack,
    });
    return NextResponse.json({ error: err?.message || "Failed to save competition" }, { status: 500 });
  }
}