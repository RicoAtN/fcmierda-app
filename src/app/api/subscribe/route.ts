import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function POST(req: Request) {
  try {
    const subscription = await req.json();

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: 'Invalid subscription object' }, { status: 400 });
    }

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error('DATABASE_URL is not set');
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    const sql = neon(dbUrl);

    // Insert or update subscription
    await sql`
      INSERT INTO push_subscriptions (endpoint, p256dh, auth)
      VALUES (
        ${subscription.endpoint},
        ${subscription.keys.p256dh},
        ${subscription.keys.auth}
      )
      ON CONFLICT (endpoint) DO UPDATE 
      SET 
        p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth,
        created_at = CURRENT_TIMESTAMP;
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving subscription:', error);
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
  }
}
