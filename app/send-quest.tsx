import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { FriendChip } from '@/components/friends/FriendChip';
import { useFriends } from '@/hooks/useFriends';
import { useAuthStore } from '@/stores/authStore';
import { useQuestStore } from '@/stores/questStore';
import { supabase } from '@/lib/supabase';
import { computeExpiresAt } from '@/lib/utils';
import { COLORS, VIBE_TAGS, CADENCES, MAX_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH } from '@/constants';
import type { VibeTag, QuestCadence, Profile, Quest } from '@/types';

export default function SendQuestScreen() {
  const router = useRouter();
  const { recipientId } = useLocalSearchParams<{ recipientId?: string }>();
  const { user } = useAuthStore();
  const { friends, loading: friendsLoading } = useFriends();
  const { addQuest } = useQuestStore();

  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(recipientId ?? null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cadence, setCadence] = useState<QuestCadence>('daily');
  const [vibeTag, setVibeTag] = useState<VibeTag | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [titleError, setTitleError] = useState<string | undefined>();
  const [friendError, setFriendError] = useState<string | undefined>();
  const [vibeError, setVibeError] = useState<string | undefined>();

  const selectedFriend = friends.find((f) => f.friend.id === selectedFriendId)?.friend ?? null;

  const validate = (): boolean => {
    let valid = true;
    if (!selectedFriendId) {
      setFriendError('Please select a friend to send this quest to.');
      valid = false;
    } else {
      setFriendError(undefined);
    }
    if (!title.trim()) {
      setTitleError('Quest title is required.');
      valid = false;
    } else if (title.trim().length > MAX_TITLE_LENGTH) {
      setTitleError(`Title must be ${MAX_TITLE_LENGTH} characters or less.`);
      valid = false;
    } else {
      setTitleError(undefined);
    }
    if (!vibeTag) {
      setVibeError('Please pick a vibe for this quest.');
      valid = false;
    } else {
      setVibeError(undefined);
    }
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate() || !user?.id) return;
    setSubmitting(true);

    try {
      const expiresAt = computeExpiresAt(cadence);

      const { data, error } = await supabase
        .from('quests')
        .insert({
          sender_id: user.id,
          recipient_id: selectedFriendId!,
          title: title.trim(),
          description: description.trim() || null,
          vibe_tag: vibeTag!,
          cadence,
          status: 'active',
          expires_at: expiresAt,
        })
        .select(`
          *,
          sender:profiles!quests_sender_id_fkey(*),
          recipient:profiles!quests_recipient_id_fkey(*)
        `)
        .single();

      if (error) throw error;

      addQuest(data as Quest);
      Alert.alert(
        'Quest Sent! 🎉',
        `Your quest was sent to ${selectedFriend?.display_name ?? 'your friend'}!`,
        [{ text: 'Awesome', onPress: () => router.back() }]
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send quest.';
      // Check for unique constraint violation
      if (msg.includes('one_active_quest_per_cadence') || msg.includes('unique')) {
        Alert.alert(
          'Quest Already Active',
          `Your friend already has an active ${cadence} quest from you. Wait for it to complete first!`
        );
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={COLORS.bark} />
            </TouchableOpacity>
            <Text style={styles.screenTitle}>Send a Quest</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Step 1: Pick a friend */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              Send to <Text style={styles.required}>*</Text>
            </Text>

            {friendsLoading ? (
              <ActivityIndicator color={COLORS.terracotta} />
            ) : friends.length === 0 ? (
              <View style={styles.noFriendsCard}>
                <Text style={styles.noFriendsText}>
                  You don't have any friends yet. Add some in the Friends tab!
                </Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.friendsScroll}
              >
                {friends.map((f) => (
                  <FriendChip
                    key={f.id}
                    profile={f.friend}
                    selected={selectedFriendId === f.friend.id}
                    onPress={(profile) =>
                      setSelectedFriendId((prev) =>
                        prev === profile.id ? null : profile.id
                      )
                    }
                  />
                ))}
              </ScrollView>
            )}

            {friendError && <Text style={styles.errorText}>{friendError}</Text>}
          </View>

          {/* Step 2: Title */}
          <View style={styles.section}>
            <Input
              label={
                <Text>
                  Quest Title <Text style={styles.required}>*</Text>
                </Text>
              }
              placeholder="e.g. Go on a 10 minute walk outside"
              value={title}
              onChangeText={setTitle}
              maxLength={MAX_TITLE_LENGTH}
              showCharCount
              error={titleError}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Step 3: Description */}
          <View style={styles.section}>
            <Input
              label="Description (optional)"
              placeholder="Add context, rules, or encouragement..."
              value={description}
              onChangeText={setDescription}
              maxLength={MAX_DESCRIPTION_LENGTH}
              showCharCount
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Step 4: Cadence */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Cadence</Text>
            <View style={styles.cadenceRow}>
              {CADENCES.map((c) => (
                <Pill
                  key={c.id}
                  label={c.label}
                  selected={cadence === c.id}
                  onPress={() => setCadence(c.id)}
                  color={COLORS.sage}
                  size="md"
                  style={styles.cadencePill}
                />
              ))}
            </View>
          </View>

          {/* Step 5: Vibe tag */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              Vibe <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.vibeGrid}>
              {VIBE_TAGS.map((vibe) => (
                <Pill
                  key={vibe.id}
                  label={vibe.label}
                  emoji={vibe.emoji}
                  selected={vibeTag === vibe.id}
                  onPress={() => setVibeTag(vibe.id)}
                  color={vibe.color}
                  size="md"
                  style={styles.vibePill}
                />
              ))}
            </View>
            {vibeError && <Text style={styles.errorText}>{vibeError}</Text>}
          </View>

          {/* Submit */}
          <Button
            title={submitting ? 'Sending...' : 'Send Quest 🚀'}
            onPress={handleSubmit}
            loading={submitting}
            fullWidth
            size="lg"
            style={styles.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  keyboardView: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    marginBottom: 24,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.border,
    borderRadius: 18,
  },
  screenTitle: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 20,
    color: COLORS.bark,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
    color: COLORS.bark,
    marginBottom: 12,
  },
  required: {
    color: COLORS.terracotta,
  },
  friendsScroll: {
    paddingRight: 8,
  },
  noFriendsCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noFriendsText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: COLORS.barkMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  cadenceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cadencePill: {
    flex: 1,
  },
  vibeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  vibePill: {
    marginBottom: 0,
  },
  errorText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: COLORS.error,
    marginTop: 6,
  },
  submitBtn: {
    marginTop: 8,
  },
});
