import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useFriendStore, type FriendWithProfile } from '@/stores/friendStore';
import type { Profile } from '@/types';

export function useFriends() {
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const { friends, pendingRequests, setFriends, setPendingRequests, acceptRequest, declineRequest } =
    useFriendStore();

  const fetchFriends = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      // Accepted friendships
      const { data: acceptedData, error: acceptedErr } = await supabase
        .from('friendships')
        .select(
          `
          *,
          requester:profiles!friendships_requester_id_fkey(*),
          addressee:profiles!friendships_addressee_id_fkey(*)
        `
        )
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (acceptedErr) throw acceptedErr;

      const accepted: FriendWithProfile[] = (acceptedData ?? []).map((f) => ({
        ...f,
        friend: f.requester_id === user.id ? (f.addressee as Profile) : (f.requester as Profile),
      }));
      setFriends(accepted);

      // Pending incoming requests
      const { data: pendingData, error: pendingErr } = await supabase
        .from('friendships')
        .select(
          `
          *,
          requester:profiles!friendships_requester_id_fkey(*),
          addressee:profiles!friendships_addressee_id_fkey(*)
        `
        )
        .eq('addressee_id', user.id)
        .eq('status', 'pending');

      if (pendingErr) throw pendingErr;

      const pending: FriendWithProfile[] = (pendingData ?? []).map((f) => ({
        ...f,
        friend: f.requester as Profile,
      }));
      setPendingRequests(pending);
    } catch (err) {
      console.error('useFriends fetchFriends error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const sendFriendRequest = useCallback(
    async (addresseeId: string): Promise<{ success: boolean; message: string }> => {
      if (!user?.id) return { success: false, message: 'Not authenticated' };

      try {
        // Check for existing friendship
        const { data: existing } = await supabase
          .from('friendships')
          .select('id, status')
          .or(
            `and(requester_id.eq.${user.id},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${user.id})`
          )
          .maybeSingle();

        if (existing) {
          if (existing.status === 'accepted') return { success: false, message: 'Already friends' };
          if (existing.status === 'pending') return { success: false, message: 'Request already sent' };
        }

        const { error } = await supabase.from('friendships').insert({
          requester_id: user.id,
          addressee_id: addresseeId,
          status: 'pending',
        });

        if (error) throw error;
        return { success: true, message: 'Friend request sent!' };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to send request';
        return { success: false, message };
      }
    },
    [user?.id]
  );

  const handleAcceptRequest = useCallback(
    async (friendshipId: string): Promise<boolean> => {
      if (!user?.id) return false;

      try {
        const { data, error } = await supabase
          .from('friendships')
          .update({ status: 'accepted', updated_at: new Date().toISOString() })
          .eq('id', friendshipId)
          .select(
            `
            *,
            requester:profiles!friendships_requester_id_fkey(*),
            addressee:profiles!friendships_addressee_id_fkey(*)
          `
          )
          .single();

        if (error) throw error;

        const updatedFriendship: FriendWithProfile = {
          ...data,
          friend:
            data.requester_id === user.id ? (data.addressee as Profile) : (data.requester as Profile),
        };

        acceptRequest(friendshipId, updatedFriendship);
        return true;
      } catch (err) {
        console.error('acceptRequest error:', err);
        return false;
      }
    },
    [user?.id, acceptRequest]
  );

  const handleDeclineRequest = useCallback(
    async (friendshipId: string): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from('friendships')
          .update({ status: 'declined', updated_at: new Date().toISOString() })
          .eq('id', friendshipId);

        if (error) throw error;
        declineRequest(friendshipId);
        return true;
      } catch (err) {
        console.error('declineRequest error:', err);
        return false;
      }
    },
    [declineRequest]
  );

  const searchUsers = useCallback(
    async (query: string): Promise<Profile[]> => {
      if (!query.trim() || !user?.id) return [];

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
          .neq('id', user.id)
          .limit(20);

        if (error) throw error;
        return (data as Profile[]) ?? [];
      } catch (err) {
        console.error('searchUsers error:', err);
        return [];
      }
    },
    [user?.id]
  );

  const removeFriendship = useCallback(
    async (friendshipId: string): Promise<boolean> => {
      try {
        const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
        if (error) throw error;
        setFriends(friends.filter((f) => f.id !== friendshipId));
        return true;
      } catch (err) {
        console.error('removeFriendship error:', err);
        return false;
      }
    },
    [friends, setFriends]
  );

  useEffect(() => {
    if (!user?.id) return;
    fetchFriends();
  }, [user?.id, fetchFriends]);

  return {
    friends,
    pendingRequests,
    loading,
    refetch: fetchFriends,
    sendFriendRequest,
    acceptRequest: handleAcceptRequest,
    declineRequest: handleDeclineRequest,
    searchUsers,
    removeFriendship,
  };
}
