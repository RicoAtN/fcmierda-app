import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { endpoint, keys, deviceType, userAgent, oldEndpoint } = body || {};

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

    // Clean up replaced old endpoint if provided
    if (oldEndpoint && oldEndpoint !== endpoint) {
      await sql`DELETE FROM push_subscriptions WHERE endpoint = ${oldEndpoint}`;
    }

    await sql`
      INSERT INTO push_subscriptions (endpoint, p256dh, auth, device_type, user_agent, created_at)
      VALUES (${endpoint}, ${keys.p256dh}, ${keys.auth}, ${resolvedDeviceType}, ${effectiveUa}, NOW())
      ON CONFLICT (endpoint) DO UPDATE 
      SET p256dh = EXCLUDED.p256dh,
          auth = EXCLUDED.auth,
          device_type = COALESCE(EXCLUDED.device_type, push_subscriptions.device_type),
          user_agent = COALESCE(EXCLUDED.user_agent, push_subscriptions.user_agent),
          created_at = NOW()
    `;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("POST /api/push/subscribe error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to store subscription" },
      { status: 500 }
    );
  }
}
