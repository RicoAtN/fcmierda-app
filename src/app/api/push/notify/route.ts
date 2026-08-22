import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import webpush from "web-push";
import { PushNotificationRequest } from "@/types/notifications";

export const runtime = "nodejs";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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
    console.error("Error setting VAPID details:", err);
  }
}

// Initialize on load
ensureVapidConfigured();

// Helper to format date into "30 August"
function formatDayMonth(dateStr?: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", { day: "numeric", month: "long" });
    }
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString("en-US", { day: "numeric", month: "long" });
  }
  return dateStr;
}

export async function POST(req: NextRequest) {
  let client;
  try {
    ensureVapidConfigured();
    const body: PushNotificationRequest = await req.json();
    const {
      type = "next_game",
      title: customTitle,
      body: customBody,
      url: customUrl,
      nextGameData,
      matchResultData,
      droneVideoData,
    } = body || {};

    let payloadTitle = customTitle || "FC Mierda ⚽";
    let payloadBody = customBody || "New update available on the FC Mierda app!";
    let payloadUrl = customUrl || "/fixtures#next-game";

    if (type === "next_game") {
      const opp = nextGameData?.opponent || "our next opponent";
      payloadTitle = customTitle || `Next match update - against ${opp}`;
      
      const formattedDate = formatDayMonth(nextGameData?.date);
      const parts: string[] = [];
      if (formattedDate) parts.push(formattedDate);
      if (nextGameData?.kickoff) parts.push(`at ${nextGameData.kickoff}`);
      
      const schedulePrefix = parts.length > 0 ? parts.join(" ") : "Upcoming match schedule updated";

      if (customBody) {
        if (customBody.includes(schedulePrefix)) {
          payloadBody = customBody;
        } else {
          payloadBody = `${schedulePrefix}. ${customBody}`;
        }
      } else {
        payloadBody = `${schedulePrefix}. Check out the latest match details and player availability!`;
      }

      payloadUrl = customUrl || "/fixtures#next-game";
    } else if (type === "match_result") {
      const opp = matchResultData?.opponent || "our opponent";
      const resultRaw = (matchResultData?.gameResult || "").toLowerCase();

      let resultWord = "played";
      let resultTitleWord = "Result";
      if (resultRaw === "win" || resultRaw === "won") {
        resultWord = "won";
        resultTitleWord = "Win";
      } else if (resultRaw === "loss" || resultRaw === "lost") {
        resultWord = "lost";
        resultTitleWord = "Loss";
      } else if (resultRaw === "draw" || resultRaw === "drew") {
        resultWord = "drew";
        resultTitleWord = "Draw";
      }

      const scoreText =
        matchResultData?.goalsFCMierda !== undefined && matchResultData?.goalsOpponent !== undefined
          ? `${matchResultData.goalsFCMierda} - ${matchResultData.goalsOpponent}`
          : "";

      const formattedDate = formatDayMonth(matchResultData?.date);
      const datePrefix = formattedDate ? `${formattedDate}: ` : "";
      const resultPrefix = `${datePrefix}FC Mierda ${resultWord}${scoreText ? ` (${scoreText})` : ""} against ${opp}.`;

      payloadTitle = customTitle || `Match result: ${resultTitleWord} vs ${opp} ⚽`;

      if (customBody) {
        if (customBody.includes(opp) || customBody.includes(resultWord)) {
          payloadBody = customBody;
        } else {
          payloadBody = `${resultPrefix} ${customBody}`;
        }
      } else {
        payloadBody = `${resultPrefix} Check out the goal scorers and match recap!`;
      }

      payloadUrl = customUrl || "/results";
    } else if (type === "drone_video") {
      const opp = droneVideoData?.opponent ? ` vs ${droneVideoData.opponent}` : "";
      payloadTitle = customTitle || `New Match Video Summary 🎥`;
      payloadBody =
        customBody ||
        `Watch the match highlight video${opp}! Click to view the summary.`;
      payloadUrl = customUrl || droneVideoData?.youtubeUrl || "/results";
    }

    client = await pool.connect();
    const subsResult = await client.query(
      "SELECT id, endpoint, p256dh, auth FROM push_subscriptions"
    );
    const subscriptions = subsResult.rows || [];

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active push subscriptions found",
        total: 0,
        sent: 0,
        removed: 0,
      });
    }

    const notificationPayload = JSON.stringify({
      title: payloadTitle,
      body: payloadBody,
      icon: "/FCMierda-team-logo.png",
      badge: "/FCMierda-team-logo.png",
      url: payloadUrl,
    });

    let sentCount = 0;
    const expiredIds: number[] = [];

    const sendPromises = subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, notificationPayload);
        sentCount++;
      } catch (error: any) {
        console.error(`Error sending push notification to endpoint ${sub.endpoint}:`, error?.statusCode || error);
        // HTTP 404 (Not Found) or 410 (Gone) indicates the subscription is expired or revoked
        if (error?.statusCode === 404 || error?.statusCode === 410) {
          expiredIds.push(sub.id);
        }
      }
    });

    await Promise.allSettled(sendPromises);

    // Delete expired subscriptions
    if (expiredIds.length > 0) {
      try {
        await client.query(
          "DELETE FROM push_subscriptions WHERE id = ANY($1::int[])",
          [expiredIds]
        );
      } catch (deleteError) {
        console.error("Failed to clean up expired subscriptions:", deleteError);
      }
    }

    return NextResponse.json({
      success: true,
      total: subscriptions.length,
      sent: sentCount,
      removed: expiredIds.length,
    });
  } catch (err) {
    console.error("POST /api/push/notify error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to dispatch notifications" },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
