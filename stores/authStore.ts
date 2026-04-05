import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { Profile } from '@/types';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: Session['user'] | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (isLoading: boolean) => void;
  signOut: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  session: null,
  isLoading: true,

  setSession: (session) => {
    set({ session, user: session?.user ?? null });
  },

  setProfile: (profile) => {
    set({ profile });
  },

  setLoading: (isLoading) => {
    set({ isLoading });
  },

  fetchProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Failed to fetch profile:', error.message);
      return;
    }

    set({ profile: data as Profile });
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error.message);
    }
    set({ user: null, profile: null, session: null });
  },
}));
