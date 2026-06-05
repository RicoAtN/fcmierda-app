import { NextResponse } from 'next/server';
import webpush from 'web-push';
import sql from '@/lib/db';

// VAPID keys should be stored in environment variables
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT; // e.g., 'mailto:your-email@example.com'

if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
  console.error('VAPID keys are not configured. Please check your environment variables.');
} else {
    webpush.setVapidDetails(
        vapidSubject,
        vapidPublicKey,
        vapidPrivateKey
    );
}

type Subscription = {
    endpoint: string;
    p256dh: string;
    auth: string;
};

export async function POST(request: Request) {
    if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
        return NextResponse.json({ error: 'VAPID keys are not configured on the server.' }, { status: 500 });
    }

    try {
        const body = await request.json();
        const { payload } = body;

        if (!payload || !payload.title || !payload.body) {
            return NextResponse.json({ error: 'Invalid notification payload' }, { status: 400 });
        }

        const subscriptions: Subscription[] = await sql`SELECT endpoint, p256dh, auth FROM push_subscriptions`;

        if (subscriptions.length === 0) {
            return NextResponse.json({ message: 'No subscriptions to notify.' }, { status: 200 });
        }

        const notificationPayload = JSON.stringify(payload);

        const sendPromises = subscriptions.map(sub => 
            webpush.sendNotification(
                { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                notificationPayload
            ).catch(async (error) => {
                // If a subscription is expired or invalid, the push service returns a 410 status code.
                if (error.statusCode === 410) {
                    console.log(`Subscription for ${sub.endpoint} has expired. Deleting.`);
                    await sql`DELETE FROM push_subscriptions WHERE endpoint = ${sub.endpoint}`;
                } else {
                    console.error(`Failed to send notification to ${sub.endpoint}:`, error.body);
                }
            })
        );

        await Promise.all(sendPromises);

        return NextResponse.json({ success: true, message: `Notifications sent to ${subscriptions.length} subscribers.` });

    } catch (error) {
        console.error('Error sending notifications:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Failed to send notifications', details: message }, { status: 500 });
    }
}
