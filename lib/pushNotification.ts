import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

// Configure VAPID keys (set these in .env)
if (process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
  webpush.setVapidDetails(
    'mailto:foryou.innerpath@gmail.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  url: string = '/'
) {
  const { data: subscriptions } = await supabaseAdmin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId);

  if (!subscriptions?.length) return;

  const payload = JSON.stringify({ title, body, url });

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload
      )
    )
  );

  // Remove expired/invalid subscriptions
  const expiredIds = results
    .map((result, i) => {
      if (result.status === 'rejected' && 'statusCode' in (result.reason as any)) {
        const code = (result.reason as any).statusCode;
        if (code === 404 || code === 410) return subscriptions[i].id;
      }
      return null;
    })
    .filter(Boolean);

  if (expiredIds.length > 0) {
    await supabaseAdmin
      .from('push_subscriptions')
      .delete()
      .in('id', expiredIds);
  }
}
