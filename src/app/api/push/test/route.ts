import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import webpush from "web-push";

export const runtime = "nodejs";

const DEFAULT_VAPID_SUBJECT = "mailto:fcmierdaofficial@gmail.com";
const DEFAULT_VAPID_PUBLIC_KEY =
  "BFX4DWhXbZcIGVG_AzLcljZcTGydrXgIGBpSNRDjoNFIH5rKdHsbDkYrxXQshLD_y6sKwBh1d5N6m1z4LiG_Wk0";
const DEFAULT_VAPID_PRIVATE_KEY =
  "2C2Ia-kuJiI3AimqTusRYpvKTwNVGhVfVhIQSlEcY9Q";

function ensureVapidConfigured() {
  const subject = process.env.VAPID_SUBJECT || DEFAULT_VAPID_SUBJECT;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY || DEFAULT_VAPID_PRIVATE_KEY;

  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
  } catch (err) {
    console.error("Error setting VAPID details in test route:", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    ensureVapidConfigured();
    const body = await req.json();
    const { endpoint, keys } = body || {};

    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: "Endpoint is required" },
        { status: 400 }
      );
    }

    // 1. Look up subscription keys from DB or use provided keys
    let p256dh = keys?.p256dh;
    let auth = keys?.auth;

    if (!p256dh || !auth) {
      const rows = await sql`
        SELECT p256dh, auth 
        FROM push_subscriptions 
        WHERE endpoint = ${endpoint} 
        LIMIT 1
      `;
      if (rows && rows.length > 0) {
        p256dh = rows[0].p256dh;
        auth = rows[0].auth;
      }
    }

    if (!p256dh || !auth) {
      return NextResponse.json(
        {
          success: false,
          error: "Subscription not found in database. Please click Re-sync Notifications first.",
        },
        { status: 404 }
      );
    }

    const testPayload = JSON.stringify({
      title: "FC Mierda Test Melding ⚽",
      body: "Test geslaagd! Je ontvangt nu alle wedstrijdupdates en uitslagen.",
      icon: "/FCMierda-team-logo.png",
      badge: "/FCMierda-team-logo.png",
      url: "/fixtures#next-game",
    });

    const pushSubscription = {
      endpoint,
      keys: {
        p256dh,
        auth,
      },
    };

    // Use urgency: high and TTL: 300 to ensure instant delivery on Android
    await webpush.sendNotification(pushSubscription, testPayload, {
      TTL: 300,
      urgency: "high",
      topic: "fcmierda-test",
    });

    return NextResponse.json({
      success: true,
      message: "Test notification dispatched successfully!",
    });
  } catch (err: any) {
    console.error("POST /api/push/test error:", err);
    const statusCode = err?.statusCode;
    if (statusCode === 404 || statusCode === 410) {
      return NextResponse.json(
        {
          success: false,
          error: "This subscription endpoint has expired on the push service. Please click Re-sync to generate a fresh token.",
        },
        { status: 410 }
      );
    }
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to dispatch test notification" },
      { status: 500 }
    );
  }
}
