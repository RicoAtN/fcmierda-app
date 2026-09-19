import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { del } from "@vercel/blob";
import { logCmsActivity } from "@/lib/cms-logger";

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

const defaultSponsors: SponsorRecord[] = [
  {
    id: 1,
    name: "Momo Barbershop",
    badge: "Official Barbershop",
    logo: "/momoLogo.jpg",
    url: "https://www.momobarbershop.com/",
    tagline: "FC Mierda's favorite barbershop",
    description:
      "Keeping the squad fresh, styled, and razor-sharp on and off the pitch. Momo is far more than a barbershop—it's a premium haircut experience where you can enjoy a coffee, catch up on good conversation, and treat yourself to the house specialty: a legendary Calippo ice cream.",
    button_label: "Visit momobarbershop.com",
    highlight_color: "emerald",
    display_order: 1,
  },
  {
    id: 2,
    name: "Second Love",
    badge: "Club Sponsor",
    logo: "/SecondloveLogo.jpg",
    url: "https://www.secondlove.nl/",
    tagline: "Discreet & exciting adventures",
    description:
      "Sure, football will always be your first love—but the ball doesn't cuddle back! Second Love gives you the chance to find love right next to football. Completely discreet, exciting, and with zero VAR checking your moves.",
    button_label: "Visit secondlove.nl",
    highlight_color: "rose",
    display_order: 2,
  },
];

export async function GET() {
  try {
    const rows = (await sql`
      SELECT id, name, badge, logo, url, tagline, description, button_label, highlight_color, display_order, created_at
      FROM sponsors
      ORDER BY display_order ASC, id ASC;
    `) as SponsorRecord[];

    return NextResponse.json(
      { success: true, sponsors: rows.length > 0 ? rows : defaultSponsors },
      {
        headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
      }
    );
  } catch (err: any) {
    console.error("GET /api/sponsors error:", err);
    return NextResponse.json(
      { success: true, sponsors: defaultSponsors, isFallback: true },
      { status: 200 }
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

    const inserted = (await sql`
      INSERT INTO sponsors (name, badge, logo, url, tagline, description, button_label, highlight_color, display_order)
      VALUES (${name}, ${badge}, ${logo}, ${url}, ${tagline}, ${description}, ${button_label}, ${highlight_color}, ${display_order})
      RETURNING *;
    `) as SponsorRecord[];

    const newSponsor = inserted[0];

    // Log Activity
    await logCmsActivity({
      action_type: "CREATE",
      module: "sponsor",
      entity_id: newSponsor.id,
      entity_title: newSponsor.name,
      details: {
        name: newSponsor.name,
        badge: newSponsor.badge,
        url: newSponsor.url,
      },
      req,
    });

    return NextResponse.json({ success: true, sponsor: newSponsor });
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

    const savedSponsor = updated[0];

    // Log Activity
    await logCmsActivity({
      action_type: "UPDATE",
      module: "sponsor",
      entity_id: savedSponsor.id,
      entity_title: savedSponsor.name,
      details: {
        name: savedSponsor.name,
        badge: savedSponsor.badge,
        url: savedSponsor.url,
      },
      req,
    });

    return NextResponse.json({ success: true, sponsor: savedSponsor });
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

    // Get logo url first for blob cleanup and sponsor name for logging
    const existing = (await sql`
      SELECT id, name, logo FROM sponsors WHERE id = ${Number(id)};
    `) as { id: number; name: string; logo: string }[];

    const sponsorName = existing[0]?.name || `Sponsor #${id}`;

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

    // Log Activity
    await logCmsActivity({
      action_type: "DELETE",
      module: "sponsor",
      entity_id: id,
      entity_title: sponsorName,
      details: {
        name: sponsorName,
      },
      req,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/sponsors error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to delete sponsor." },
      { status: 500 }
    );
  }
}
