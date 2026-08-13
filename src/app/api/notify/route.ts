import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import webpush from 'web-push';

// Configure Web Push with VAPID keys
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, opponent, gameResult, score } = body;

    let payloadTitle = 'FC Mierda Update';
    let payloadBody = '';

    if (type === 'future_match') {
      payloadTitle = `Next match update!`;
      payloadBody = `Update available on next match of FC Mierda against ${opponent || 'our next opponent'}! Click to view more.`;
    } else if (type === 'match_result') {
      payloadTitle = `Match Result: ${gameResult?.toUpperCase()}`;
      payloadBody = `New match result added: FC Mierda ${gameResult} the game against ${opponent || 'our opponent'}! Score: ${score}.`;
    } else {
      return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error('DATABASE_URL is not set');
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    const sql = neon(dbUrl);

    // Fetch all subscriptions
    const subscriptions = await sql`SELECT id, endpoint, p256dh, auth FROM push_subscriptions`;

    if (subscriptions.length === 0) {
      return NextResponse.json({ success: true, message: 'No subscriptions found' });
    }

    const notificationPayload = JSON.stringify({
      title: payloadTitle,
      body: payloadBody,
      icon: '/FCMierda-team-logo.png'
    });

    const sendPromises = subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      try {
        await webpush.sendNotification(pushSubscription, notificationPayload);
      } catch (error: any) {
        console.error(`Error sending push notification to ${sub.endpoint}:`, error);
        if (error.statusCode === 404 || error.statusCode === 410) {
          console.log(`Subscription expired or unsubscribed, deleting endpoint ${sub.endpoint}`);
          try {
            await sql`DELETE FROM push_subscriptions WHERE id = ${sub.id}`;
          } catch (deleteError) {
            console.error('Failed to delete expired subscription:', deleteError);
          }
        }
      }
    });

    await Promise.all(sendPromises);

    return NextResponse.json({ success: true, sent: subscriptions.length });
  } catch (error) {
    console.error('Error in /api/notify:', error);
    return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 });
  }
}
