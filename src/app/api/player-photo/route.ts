import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const name = searchParams.get("name");

    if (!id && !name) {
      return new NextResponse("Player ID or Name required", { status: 400 });
    }

    let rows: { photo_link: string | null }[] = [];
    if (id) {
      rows = await sql`
        SELECT photo_link 
        FROM player_statistics 
        WHERE player_id::text = ${id} 
        LIMIT 1
      `;
    } else if (name) {
      rows = await sql`
        SELECT photo_link 
        FROM player_statistics 
        WHERE LOWER(player_name) = LOWER(${name}) 
        LIMIT 1
      `;
    }

    const photoLink = rows[0]?.photo_link;
    if (!photoLink || !photoLink.trim()) {
      return new NextResponse("Photo not found", { status: 404 });
    }

    // If it's a data URI (e.g. data:image/png;base64,....)
    if (photoLink.startsWith("data:")) {
      const match = photoLink.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) {
        return new NextResponse("Invalid data URI", { status: 500 });
      }

      const mimeType = match[1];
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, "base64");

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": mimeType,
          "Content-Length": buffer.length.toString(),
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
      });
    }

    // If it's a normal URL, redirect directly
    if (photoLink.startsWith("http://") || photoLink.startsWith("https://")) {
      return NextResponse.redirect(photoLink, { status: 302 });
    }

    // If relative path
    const target = photoLink.startsWith("/") ? photoLink : `/${photoLink}`;
    return NextResponse.redirect(new URL(target, req.url), { status: 302 });
  } catch (err) {
    console.error("[api/player-photo] Error:", err);
    return new NextResponse("Error fetching player photo", { status: 500 });
  }
}
