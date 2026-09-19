import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { PushStatsResponse } from "@/types/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = (await sql`
      SELECT id, endpoint, device_type, user_agent FROM push_subscriptions
    `) as { id: number; endpoint?: string; device_type?: string; user_agent?: string }[];

    const breakdown = {
      desktop: 0,
      android: 0,
      ios: 0,
      other: 0,
    };

    for (const row of rows) {
      const devType = (row.device_type || "").toLowerCase().trim();
      const ua = (row.user_agent || "").toLowerCase();
      const endpoint = (row.endpoint || "").toLowerCase();

      if (devType === "ios" || devType === "iphone" || devType === "ipad") {
        breakdown.ios++;
      } else if (devType === "android") {
        breakdown.android++;
      } else if (devType === "desktop") {
        breakdown.desktop++;
      } else if (/iphone|ipad|ipod/.test(ua)) {
        breakdown.ios++;
      } else if (/android/.test(ua)) {
        breakdown.android++;
      } else if (/windows|macintosh|linux|cros/.test(ua)) {
        breakdown.desktop++;
      } else if (endpoint.includes("apple.com")) {
        breakdown.ios++;
      } else if (endpoint.includes("wns.windows.com")) {
        breakdown.desktop++;
      } else {
        // Unclassified legacy records created before device tracking
        breakdown.other++;
      }
    }

    const response: PushStatsResponse = {
      success: true,
      total: rows.length,
      breakdown,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      },
    });
  } catch (err: unknown) {
    console.error("GET /api/push/stats error:", err);
    return NextResponse.json(
      {
        success: false,
        total: 0,
        breakdown: { desktop: 0, android: 0, ios: 0, other: 0 },
        error: "Failed to retrieve push subscriber statistics",
      },
      { status: 200 }
    );
  }
}
