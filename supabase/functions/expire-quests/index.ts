import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * expire-quests Edge Function (Cron Job)
 *
 * Marks overdue quests as 'missed' and updates streak counts.
 * Should be scheduled to run every 15 minutes via pg_cron or Supabase scheduled functions.
 *
 * Schedule: "*/15 * * * *"
 */

interface QuestRow {
  id: string;
  sender_id: string;
  recipient_id: string;
  cadence: 'daily' | 'weekly' | 'monthly';
  expires_at: string;
}

serve(async (req: Request) => {
  // Allow GET for cron trigger or POST for manual trigger
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    const now = new Date().toISOString();
    const results = {
      missedCount: 0,
      streakUpdates: 0,
      errors: [] as string[],
    };

    // 1. Find all overdue active quests
    const { data: overdueQuests, error: fetchErr } = await supabaseAdmin
      .from('quests')
      .select('id, sender_id, recipient_id, cadence, expires_at')
      .eq('status', 'active')
      .lt('expires_at', now);

    if (fetchErr) {
      console.error('Failed to fetch overdue quests:', fetchErr.message);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch overdue quests', details: fetchErr.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!overdueQuests || overdueQuests.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No overdue quests found', ...results }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${overdueQuests.length} overdue quests to expire`);

    // 2. Mark all overdue quests as 'missed' in bulk
    const overdueIds = overdueQuests.map((q: QuestRow) => q.id);

    const { error: updateErr } = await supabaseAdmin
      .from('quests')
      .update({ status: 'missed', updated_at: now })
      .in('id', overdueIds);

    if (updateErr) {
      console.error('Failed to mark quests as missed:', updateErr.message);
      results.errors.push(`Quest update failed: ${updateErr.message}`);
    } else {
      results.missedCount = overdueIds.length;
      console.log(`Marked ${overdueIds.length} quests as missed`);
    }

    // 3. Update streaks: reset streak for recipients who missed a quest
    // Group missed quests by recipient
    const recipientIds = [...new Set(overdueQuests.map((q: QuestRow) => q.recipient_id))];

    for (const recipientId of recipientIds) {
      try {
        // Check if the recipient has any completed quests in the last 24h
        // If not, reset their streak to 0
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const { data: recentCompletion } = await supabaseAdmin
          .from('quest_completions')
          .select('id')
          .eq('user_id', recipientId)
          .gte('completed_at', oneDayAgo)
          .maybeSingle();

        if (!recentCompletion) {
          // No recent completion — reset streak
          const { error: streakErr } = await supabaseAdmin
            .from('profiles')
            .update({ streak_count: 0, updated_at: now })
            .eq('id', recipientId);

          if (streakErr) {
            console.error(`Streak reset failed for ${recipientId}:`, streakErr.message);
            results.errors.push(`Streak reset failed for user ${recipientId}: ${streakErr.message}`);
          } else {
            results.streakUpdates++;
          }
        }
      } catch (err) {
        console.error(`Error processing streak for ${recipientId}:`, err);
        results.errors.push(`Streak processing error for ${recipientId}`);
      }
    }

    // 4. Create 'missed' notifications for recipients
    const notificationInserts = overdueQuests.map((q: QuestRow) => ({
      user_id: q.recipient_id,
      type: 'quest_missed',
      title: 'Quest Expired',
      body: 'A quest has expired without being completed. Keep your streak going!',
      data: { questId: q.id },
      read: false,
    }));

    if (notificationInserts.length > 0) {
      const { error: notifErr } = await supabaseAdmin
        .from('notifications')
        .insert(notificationInserts);

      if (notifErr) {
        console.error('Failed to insert missed notifications:', notifErr.message);
        results.errors.push(`Notification insert failed: ${notifErr.message}`);
      }
    }

    // 5. Send push notifications for missed quests (batched)
    for (const quest of overdueQuests as QuestRow[]) {
      try {
        await supabaseAdmin.functions.invoke('send-push-notification', {
          body: {
            user_id: quest.recipient_id,
            title: 'Quest Expired ⏰',
            body: "You missed a quest! Don't let your streak break.",
            data: { questId: quest.id, screen: 'log' },
          },
        });
      } catch (err) {
        console.error(`Failed to send push notification for quest ${quest.id}:`, err);
      }
    }

    console.log('expire-quests completed:', results);

    return new Response(
      JSON.stringify({ success: true, ...results }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('expire-quests fatal error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
