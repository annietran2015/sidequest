import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useQuestStore } from '@/stores/questStore';
import type { Quest, QuestStatus } from '@/types';

const QUEST_SELECT = `
  *,
  sender:profiles!quests_sender_id_fkey(id, username, display_name, avatar_url),
  recipient:profiles!quests_recipient_id_fkey(id, username, display_name, avatar_url),
  completion:quest_completions(*)
`;

export function useQuests() {
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const { activeQuests, sentQuests, questLog, setActiveQuests, setSentQuests, setQuestLog, updateQuestStatus } =
    useQuestStore();

  const fetchQuests = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      // Active incoming quests
      const { data: incoming, error: incomingErr } = await supabase
        .from('quests')
        .select(QUEST_SELECT)
        .eq('recipient_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (incomingErr) throw incomingErr;
      setActiveQuests((incoming as Quest[]) ?? []);

      // Sent quests (recent active)
      const { data: sent, error: sentErr } = await supabase
        .from('quests')
        .select(QUEST_SELECT)
        .eq('sender_id', user.id)
        .in('status', ['active'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (sentErr) throw sentErr;
      setSentQuests((sent as Quest[]) ?? []);

      // Quest log (all terminal)
      const { data: log, error: logErr } = await supabase
        .from('quests')
        .select(QUEST_SELECT)
        .or(`recipient_id.eq.${user.id},sender_id.eq.${user.id}`)
        .in('status', ['completed', 'missed', 'cancelled'])
        .order('updated_at', { ascending: false })
        .limit(50);

      if (logErr) throw logErr;
      setQuestLog((log as Quest[]) ?? []);
    } catch (err) {
      console.error('useQuests fetchQuests error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Mark a quest as completed
  const completeQuest = useCallback(
    async (questId: string, note?: string, photoUrl?: string): Promise<boolean> => {
      if (!user?.id) return false;

      try {
        const { error: completionErr } = await supabase.from('quest_completions').insert({
          quest_id: questId,
          user_id: user.id,
          note: note ?? null,
          photo_url: photoUrl ?? null,
          completed_at: new Date().toISOString(),
        });

        if (completionErr) throw completionErr;

        const { error: questErr } = await supabase
          .from('quests')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('id', questId);

        if (questErr) throw questErr;

        updateQuestStatus(questId, 'completed');
        return true;
      } catch (err) {
        console.error('completeQuest error:', err);
        return false;
      }
    },
    [user?.id, updateQuestStatus]
  );

  // Set up Realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    fetchQuests();

    const channel = supabase
      .channel(`quests:user:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quests',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Realtime quest update:', payload.eventType);
          fetchQuests();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quests',
          filter: `sender_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Realtime sent quest update:', payload.eventType);
          fetchQuests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchQuests]);

  const activeQuest = activeQuests[0] ?? null;

  return {
    activeQuest,
    activeQuests,
    sentQuests,
    questLog,
    loading,
    refetch: fetchQuests,
    completeQuest,
    updateQuestStatus,
  };
}
