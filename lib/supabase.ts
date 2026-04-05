import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase URL or Anon Key is missing. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.'
  );
}

// Use AsyncStorage on native, localStorage on web (SSR-safe)
function getStorage() {
  if (Platform.OS === 'web') {
    // Return a no-op storage during SSR where window/localStorage don't exist
    if (typeof window === 'undefined') {
      return {
        getItem: async (_key: string) => null,
        setItem: async (_key: string, _value: string) => {},
        removeItem: async (_key: string) => {},
      };
    }
    return {
      getItem: async (key: string) => window.localStorage.getItem(key),
      setItem: async (key: string, value: string) => window.localStorage.setItem(key, value),
      removeItem: async (key: string) => window.localStorage.removeItem(key),
    };
  }
  // Native: use AsyncStorage
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  return AsyncStorage;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: getStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          bio: string | null;
          avatar_url: string | null;
          streak_count: number;
          total_completed: number;
          push_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name: string;
          bio?: string | null;
          avatar_url?: string | null;
          streak_count?: number;
          total_completed?: number;
          push_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          username?: string;
          display_name?: string;
          bio?: string | null;
          avatar_url?: string | null;
          streak_count?: number;
          total_completed?: number;
          push_token?: string | null;
          updated_at?: string;
        };
      };
      friendships: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: 'pending' | 'accepted' | 'declined' | 'blocked';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          addressee_id: string;
          status?: 'pending' | 'accepted' | 'declined' | 'blocked';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: 'pending' | 'accepted' | 'declined' | 'blocked';
          updated_at?: string;
        };
      };
      quests: {
        Row: {
          id: string;
          sender_id: string;
          recipient_id: string;
          title: string;
          description: string | null;
          vibe_tag: string;
          cadence: 'daily' | 'weekly' | 'monthly';
          status: 'active' | 'completed' | 'missed' | 'cancelled';
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          recipient_id: string;
          title: string;
          description?: string | null;
          vibe_tag: string;
          cadence: 'daily' | 'weekly' | 'monthly';
          status?: 'active' | 'completed' | 'missed' | 'cancelled';
          expires_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: 'active' | 'completed' | 'missed' | 'cancelled';
          updated_at?: string;
        };
      };
      quest_completions: {
        Row: {
          id: string;
          quest_id: string;
          user_id: string;
          note: string | null;
          photo_url: string | null;
          completed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          quest_id: string;
          user_id: string;
          note?: string | null;
          photo_url?: string | null;
          completed_at?: string;
          created_at?: string;
        };
        Update: {
          note?: string | null;
          photo_url?: string | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string;
          data: Record<string, unknown> | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body: string;
          data?: Record<string, unknown> | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          read?: boolean;
        };
      };
      push_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          platform: 'ios' | 'android' | 'web';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          platform: 'ios' | 'android' | 'web';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          token?: string;
          updated_at?: string;
        };
      };
    };
  };
};
