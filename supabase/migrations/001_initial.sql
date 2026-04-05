-- =============================================
-- SideQuest Initial Database Migration
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ENUMS
-- =============================================

CREATE TYPE friendship_status AS ENUM ('pending', 'accepted', 'declined', 'blocked');
CREATE TYPE quest_status AS ENUM ('active', 'completed', 'missed', 'cancelled');
CREATE TYPE quest_cadence AS ENUM ('daily', 'weekly', 'monthly');
CREATE TYPE notification_type AS ENUM (
  'quest_received',
  'quest_completed',
  'quest_missed',
  'friend_request',
  'friend_accepted'
);
CREATE TYPE platform_type AS ENUM ('ios', 'android', 'web');

-- =============================================
-- PROFILES TABLE
-- =============================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  streak_count INTEGER NOT NULL DEFAULT 0,
  total_completed INTEGER NOT NULL DEFAULT 0,
  push_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT username_length CHECK (char_length(username) BETWEEN 3 AND 20),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$'),
  CONSTRAINT display_name_length CHECK (char_length(display_name) BETWEEN 1 AND 40),
  CONSTRAINT streak_non_negative CHECK (streak_count >= 0),
  CONSTRAINT total_completed_non_negative CHECK (total_completed >= 0)
);

CREATE INDEX idx_profiles_username ON profiles(username);

-- =============================================
-- FRIENDSHIPS TABLE
-- =============================================

CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status friendship_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT no_self_friendship CHECK (requester_id != addressee_id),
  CONSTRAINT unique_friendship UNIQUE (requester_id, addressee_id)
);

CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX idx_friendships_status ON friendships(status);

-- =============================================
-- QUESTS TABLE
-- =============================================

CREATE TABLE quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  vibe_tag TEXT NOT NULL,
  cadence quest_cadence NOT NULL,
  status quest_status NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT no_self_quest CHECK (sender_id != recipient_id),
  CONSTRAINT title_length CHECK (char_length(title) BETWEEN 1 AND 80),
  CONSTRAINT description_length CHECK (description IS NULL OR char_length(description) <= 200)
);

CREATE INDEX idx_quests_recipient ON quests(recipient_id);
CREATE INDEX idx_quests_sender ON quests(sender_id);
CREATE INDEX idx_quests_status ON quests(status);
CREATE INDEX idx_quests_expires_at ON quests(expires_at);
CREATE INDEX idx_quests_recipient_status ON quests(recipient_id, status);

-- Enforce: one active quest per sender-recipient-cadence combination
CREATE UNIQUE INDEX one_active_quest_per_cadence
  ON quests (sender_id, recipient_id, cadence)
  WHERE status = 'active';

-- =============================================
-- QUEST COMPLETIONS TABLE
-- =============================================

CREATE TABLE quest_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  note TEXT,
  photo_url TEXT,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_quest_completion UNIQUE (quest_id),
  CONSTRAINT note_length CHECK (note IS NULL OR char_length(note) <= 500)
);

CREATE INDEX idx_quest_completions_quest ON quest_completions(quest_id);
CREATE INDEX idx_quest_completions_user ON quest_completions(user_id);

-- =============================================
-- NOTIFICATIONS TABLE
-- =============================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read) WHERE read = FALSE;

-- =============================================
-- PUSH TOKENS TABLE
-- =============================================

CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform platform_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_push_token_per_user UNIQUE (user_id)
);

CREATE INDEX idx_push_tokens_user ON push_tokens(user_id);

-- =============================================
-- UPDATED_AT TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_friendships_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_quests_updated_at
  BEFORE UPDATE ON quests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_push_tokens_updated_at
  BEFORE UPDATE ON push_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only insert if not already present (client may have created it)
  INSERT INTO profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      'user_' || substr(NEW.id::text, 1, 8)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.email
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- --------- PROFILES ---------

-- Anyone can read profiles (for search)
CREATE POLICY "Profiles are publicly readable"
  ON profiles FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- --------- FRIENDSHIPS ---------

-- Users can see friendships they're part of
CREATE POLICY "Users can view own friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Requesters can create friend requests
CREATE POLICY "Users can send friend requests"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Addressee can update status (accept/decline), requester can cancel
CREATE POLICY "Users can update relevant friendships"
  ON friendships FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Either party can delete a friendship
CREATE POLICY "Users can delete own friendships"
  ON friendships FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- --------- QUESTS ---------

-- Users can see quests they sent or received
CREATE POLICY "Users can view own quests"
  ON quests FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Only accepted friends can send quests to each other
CREATE POLICY "Users can send quests to accepted friends"
  ON quests FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM friendships
      WHERE status = 'accepted'
        AND (
          (requester_id = auth.uid() AND addressee_id = recipient_id)
          OR
          (addressee_id = auth.uid() AND requester_id = recipient_id)
        )
    )
  );

-- Sender can cancel, recipient can complete/miss
CREATE POLICY "Users can update relevant quests"
  ON quests FOR UPDATE
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- --------- QUEST COMPLETIONS ---------

-- Users can view completions of their quests
CREATE POLICY "Users can view quest completions"
  ON quest_completions FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM quests
      WHERE quests.id = quest_completions.quest_id
        AND (quests.sender_id = auth.uid() OR quests.recipient_id = auth.uid())
    )
  );

-- Recipients can create completions
CREATE POLICY "Recipients can create completions"
  ON quest_completions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM quests
      WHERE quests.id = quest_completions.quest_id
        AND quests.recipient_id = auth.uid()
        AND quests.status = 'active'
    )
  );

-- --------- NOTIFICATIONS ---------

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Service role can insert notifications
CREATE POLICY "Service role can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- --------- PUSH TOKENS ---------

CREATE POLICY "Users can manage own push tokens"
  ON push_tokens FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- STORAGE BUCKET (avatars)
-- =============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =============================================
-- REALTIME PUBLICATION
-- =============================================

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE quests;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE friendships;
