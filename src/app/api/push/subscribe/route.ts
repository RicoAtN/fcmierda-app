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
    const { endpoint, keys } = body || {};

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return NextResponse.json(
        { success: false, error: "Invalid subscription payload" },
        { status: 400 }
      );
    }

    client = await pool.connect();
    await client.query(
      `INSERT INTO push_subscriptions (endpoint, p256dh, auth, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (endpoint) DO UPDATE 
       SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, created_at = NOW()`,
      [endpoint, keys.p256dh, keys.auth]
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
