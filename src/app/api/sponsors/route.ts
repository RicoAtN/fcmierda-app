import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { del } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type SponsorRecord = {
  id: number;
  name: string;
  badge: string;
  logo: string;
  url: string;
  tagline: string;
  description: string;
  button_label: string;
  highlight_color: string;
  display_order: number;
  created_at?: string;
};

async function getSql() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL environment variable is not configured.");
  return neon(dbUrl);
}

async function ensureTableAndSeed(sql: any) {
  await sql`
    CREATE TABLE IF NOT EXISTS sponsors (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      badge VARCHAR(100) DEFAULT 'Club Sponsor',
      logo TEXT NOT NULL,
      url TEXT NOT NULL,
      tagline TEXT DEFAULT '',
      description TEXT DEFAULT '',
      button_label VARCHAR(100) DEFAULT 'Visit website',
      highlight_color VARCHAR(50) DEFAULT 'emerald',
      display_order INT DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Check if empty, seed default sponsors
  const countRes = (await sql`SELECT count(*)::int as count FROM sponsors;`) as { count: number }[];
  if (countRes[0]?.count === 0) {
    await sql`
      INSERT INTO sponsors (name, badge, logo, url, tagline, description, button_label, highlight_color, display_order)
      VALUES 
      (
        'Momo Barbershop',
        'Official Barbershop',
        '/momoLogo.jpg',
        'https://www.momobarbershop.com/',
        'FC Mierda''s favorite barbershop',
        'Keeping the squad fresh, styled, and razor-sharp on and off the pitch. Momo is far more than a barbershop—it''s a premium haircut experience where you can enjoy a coffee, catch up on good conversation, and treat yourself to the house specialty: a legendary Calippo ice cream.',
        'Visit momobarbershop.com',
        'emerald',
        1
      ),
      (
        'Second Love',
        'Club Sponsor',
        '/SecondloveLogo.jpg',
        'https://www.secondlove.nl/',
        'Discreet & exciting adventures',
        'Sure, football will always be your first love—but the ball doesn''t cuddle back! Second Love gives you the chance to find love right next to football. Completely discreet, exciting, and with zero VAR checking your moves.',
        'Visit secondlove.nl',
        'rose',
        2
      );
    `;
  }
}

export async function GET() {
  try {
    const sql = await getSql();
    await ensureTableAndSeed(sql);

    const rows = (await sql`
      SELECT id, name, badge, logo, url, tagline, description, button_label, highlight_color, display_order, created_at
      FROM sponsors
      ORDER BY display_order ASC, id ASC;
    `) as SponsorRecord[];

    return NextResponse.json({ success: true, sponsors: rows });
  } catch (err: any) {
    console.error("GET /api/sponsors error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to load sponsors." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      badge = "Club Sponsor",
      logo,
      url,
      tagline = "",
      description = "",
      button_label = "Visit website",
      highlight_color = "emerald",
      display_order = 0,
    } = body;

    if (!name || !logo || !url) {
      return NextResponse.json(
        { success: false, error: "Name, logo, and website URL are required." },
        { status: 400 }
      );
    }

    const sql = await getSql();
    await ensureTableAndSeed(sql);

    const inserted = (await sql`
      INSERT INTO sponsors (name, badge, logo, url, tagline, description, button_label, highlight_color, display_order)
      VALUES (${name}, ${badge}, ${logo}, ${url}, ${tagline}, ${description}, ${button_label}, ${highlight_color}, ${display_order})
      RETURNING *;
    `) as SponsorRecord[];

    return NextResponse.json({ success: true, sponsor: inserted[0] });
  } catch (err: any) {
    console.error("POST /api/sponsors error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to create sponsor." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      name,
      badge = "Club Sponsor",
      logo,
      url,
      tagline = "",
      description = "",
      button_label = "Visit website",
      highlight_color = "emerald",
      display_order = 0,
    } = body;

    if (!id || !name || !logo || !url) {
      return NextResponse.json(
        { success: false, error: "ID, name, logo, and website URL are required." },
        { status: 400 }
      );
    }

    const sql = await getSql();
    await ensureTableAndSeed(sql);

    const updated = (await sql`
      UPDATE sponsors
      SET 
        name = ${name},
        badge = ${badge},
        logo = ${logo},
        url = ${url},
        tagline = ${tagline},
        description = ${description},
        button_label = ${button_label},
        highlight_color = ${highlight_color},
        display_order = ${display_order}
      WHERE id = ${id}
      RETURNING *;
    `) as SponsorRecord[];

    if (!updated.length) {
      return NextResponse.json(
        { success: false, error: "Sponsor not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, sponsor: updated[0] });
  } catch (err: any) {
    console.error("PUT /api/sponsors error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to update sponsor." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Sponsor ID is required." },
        { status: 400 }
      );
    }

    const sql = await getSql();
    await ensureTableAndSeed(sql);

    // Get logo url first for blob cleanup
    const existing = (await sql`
      SELECT logo FROM sponsors WHERE id = ${Number(id)};
    `) as { logo: string }[];

    if (existing[0]?.logo) {
      const logoUrl = existing[0].logo;
      if (
        (logoUrl.includes(".blob.vercel-storage.com") || logoUrl.includes("/api/blob?pathname=")) &&
        process.env.BLOB_READ_WRITE_TOKEN
      ) {
        try {
          if (logoUrl.includes("/api/blob?pathname=")) {
            const urlObj = new URL(logoUrl, "http://localhost");
            const pathname = urlObj.searchParams.get("pathname");
            if (pathname) await del(pathname);
          } else {
            await del(logoUrl);
          }
        } catch (delErr) {
          console.warn("Notice: could not delete blob on sponsor removal:", delErr);
        }
      }
    }

    await sql`DELETE FROM sponsors WHERE id = ${Number(id)};`;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/sponsors error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to delete sponsor." },
      { status: 500 }
    );
  }
}
