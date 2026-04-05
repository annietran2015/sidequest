import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_API = 'https://exp.host/--/api/v2/push/send';

interface PushPayload {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
  channel_id?: string;
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: {
    error?: string;
  };
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const payload: PushPayload = await req.json();

    if (!payload.user_id || !payload.title || !payload.body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, title, body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch push token(s) for the user
    const { data: tokenRows, error: tokenErr } = await supabaseAdmin
      .from('push_tokens')
      .select('token, platform')
      .eq('user_id', payload.user_id);

    if (tokenErr) {
      console.error('Failed to fetch push tokens:', tokenErr.message);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch push tokens' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!tokenRows || tokenRows.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No push tokens registered for user' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build Expo push messages
    const messages: ExpoPushMessage[] = tokenRows.map((row) => ({
      to: row.token,
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
      sound: payload.sound ?? 'default',
      badge: payload.badge,
      channelId: payload.channel_id ?? 'default',
    }));

    // Send to Expo Push API in chunks of 100
    const chunkSize = 100;
    const results: ExpoPushTicket[] = [];

    for (let i = 0; i < messages.length; i += chunkSize) {
      const chunk = messages.slice(i, i + chunkSize);

      const response = await fetch(EXPO_PUSH_API, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk),
      });

      if (!response.ok) {
        console.error('Expo push API error:', response.status, await response.text());
        continue;
      }

      const result = await response.json();
      if (result.data) {
        results.push(...result.data);
      }
    }

    // Log errors from Expo
    const errors = results.filter((r) => r.status === 'error');
    if (errors.length > 0) {
      console.error('Some push notifications failed:', JSON.stringify(errors));

      // Remove invalid tokens
      for (const err of errors) {
        if (err.details?.error === 'DeviceNotRegistered') {
          // Find and remove the token
          const failedMsg = messages.find((_, idx) => results[idx] === err);
          if (failedMsg) {
            await supabaseAdmin
              .from('push_tokens')
              .delete()
              .eq('token', failedMsg.to);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: results.filter((r) => r.status === 'ok').length,
        failed: errors.length,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err) {
    console.error('send-push-notification error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
