import { NextResponse } from "next/server";
import { Pool } from "pg";
import { PushStatsResponse } from "@/types/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  let client;
  try {
    client = await pool.connect();

    // Ensure columns exist in case table was created earlier without them
    await client.query(`
      ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS device_type VARCHAR(50);
      ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS user_agent TEXT;
    `);

    const result = await client.query(
      "SELECT id, endpoint, device_type, user_agent FROM push_subscriptions"
    );
    const rows = result.rows || [];

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
        "Cache-Control": "no-store, max-age=0",
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
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
