export type VibeTag =
  | 'health'
  | 'active'
  | 'creative'
  | 'mindful'
  | 'silly'
  | 'connect'
  | 'mind'
  | 'grow'
  | 'reflect'
  | 'together';

export type QuestCadence = 'daily' | 'weekly' | 'monthly';

export type QuestStatus = 'active' | 'completed' | 'missed' | 'cancelled';

export type FriendshipStatus = 'pending' | 'accepted' | 'declined' | 'blocked';

export interface Profile {
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
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
  requester?: Profile;
  addressee?: Profile;
}

export interface Quest {
  id: string;
  sender_id: string;
  recipient_id: string;
  title: string;
  description: string | null;
  vibe_tag: VibeTag;
  cadence: QuestCadence;
  status: QuestStatus;
  expires_at: string;
  created_at: string;
  updated_at: string;
  sender?: Profile;
  recipient?: Profile;
  completion?: QuestCompletion;
}

export interface QuestCompletion {
  id: string;
  quest_id: string;
  user_id: string;
  note: string | null;
  photo_url: string | null;
  completed_at: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}

export type NotificationType =
  | 'quest_received'
  | 'quest_completed'
  | 'quest_missed'
  | 'friend_request'
  | 'friend_accepted';

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  created_at: string;
  updated_at: string;
}

export interface VibeTagMeta {
  id: VibeTag;
  label: string;
  emoji: string;
  color: string;
}

export interface CadenceMeta {
  id: QuestCadence;
  label: string;
  durationHours: number;
}
