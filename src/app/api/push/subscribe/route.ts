import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

export const runtime = "nodejs";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(req: NextRequest) {
  let client;
  try {
    const body = await req.json();
    const { endpoint, keys, deviceType, userAgent } = body || {};

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return NextResponse.json(
        { success: false, error: "Invalid subscription payload" },
        { status: 400 }
      );
    }

    const headerUa = req.headers.get("user-agent") || "";
    const effectiveUa = userAgent || headerUa;
    const uaLower = effectiveUa.toLowerCase();

    let resolvedDeviceType = deviceType;
    if (!resolvedDeviceType) {
      if (/iphone|ipad|ipod/.test(uaLower)) {
        resolvedDeviceType = "ios";
      } else if (/android/.test(uaLower)) {
        resolvedDeviceType = "android";
      } else {
        resolvedDeviceType = "desktop";
      }
    }

    client = await pool.connect();

    // Ensure columns exist
    await client.query(`
      ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS device_type VARCHAR(50);
      ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS user_agent TEXT;
    `);

    await client.query(
      `INSERT INTO push_subscriptions (endpoint, p256dh, auth, device_type, user_agent, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (endpoint) DO UPDATE 
       SET p256dh = EXCLUDED.p256dh,
           auth = EXCLUDED.auth,
           device_type = COALESCE(EXCLUDED.device_type, push_subscriptions.device_type),
           user_agent = COALESCE(EXCLUDED.user_agent, push_subscriptions.user_agent),
           created_at = NOW()`,
      [endpoint, keys.p256dh, keys.auth, resolvedDeviceType, effectiveUa]
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("POST /api/push/subscribe error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to store subscription" },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
