import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/ui/Avatar';
import { Pill } from '@/components/ui/Pill';
import { Button } from '@/components/ui/Button';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { formatRelativeDate, formatTimeRemaining, getVibeEmoji, getVibeColor } from '@/lib/utils';
import { COLORS } from '@/constants';
import type { Quest, QuestStatus } from '@/types';

const STATUS_LABELS: Record<QuestStatus, string> = {
  active: 'Active',
  completed: 'Completed',
  missed: 'Missed',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<QuestStatus, string> = {
  active: COLORS.terracotta,
  completed: COLORS.sage,
  missed: COLORS.barkMuted,
  cancelled: COLORS.error,
};

export default function QuestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const [quest, setQuest] = useState<Quest | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    fetchQuest();
  }, [id]);

  useEffect(() => {
    if (!quest || quest.status !== 'active') return;
    setTimeRemaining(formatTimeRemaining(quest.expires_at));
    const interval = setInterval(() => {
      setTimeRemaining(formatTimeRemaining(quest.expires_at));
    }, 1000);
    return () => clearInterval(interval);
  }, [quest?.expires_at, quest?.status]);

  const fetchQuest = async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('quests')
      .select(`
        *,
        sender:profiles!quests_sender_id_fkey(*),
        recipient:profiles!quests_recipient_id_fkey(*),
        completion:quest_completions(*)
      `)
      .eq('id', id)
      .single();

    setLoading(false);
    if (error) {
      Alert.alert('Error', 'Could not load quest details.');
      router.back();
      return;
    }
    setQuest(data as Quest);
  };

  const handleComplete = async () => {
    if (!quest || !user?.id) return;

    Alert.alert(
      'Complete Quest',
      `Mark "${quest.title}" as complete?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete!',
          onPress: async () => {
            setCompleting(true);
            try {
              await supabase.from('quest_completions').insert({
                quest_id: quest.id,
                user_id: user.id,
                completed_at: new Date().toISOString(),
              });
              await supabase
                .from('quests')
                .update({ status: 'completed', updated_at: new Date().toISOString() })
                .eq('id', quest.id);
              await fetchQuest();
              Alert.alert('Quest Complete! 🎉', 'Great work! Keep up the streak!');
            } catch {
              Alert.alert('Error', 'Failed to complete quest.');
            } finally {
              setCompleting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator
          color={COLORS.terracotta}
          size="large"
          style={styles.loadingIndicator}
        />
      </SafeAreaView>
    );
  }

  if (!quest) return null;

  const isRecipient = quest.recipient_id === user?.id;
  const canComplete = isRecipient && quest.status === 'active';
  const vibeColor = getVibeColor(quest.vibe_tag as any);
  const vibeEmoji = getVibeEmoji(quest.vibe_tag as any);
  const statusColor = STATUS_COLORS[quest.status];
  const isExpired = new Date(quest.expires_at) < new Date();
  const completion = Array.isArray(quest.completion)
    ? quest.completion[0]
    : quest.completion;

  return (
    <ScreenWrapper showBack title="Quest Details">
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}22` }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {STATUS_LABELS[quest.status]}
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{quest.title}</Text>

        {/* Vibe + Cadence */}
        <View style={styles.tagsRow}>
          <Pill
            label={quest.vibe_tag}
            emoji={vibeEmoji}
            color={vibeColor}
            selected
            size="md"
          />
          <View style={styles.cadenceBadge}>
            <Ionicons name="repeat-outline" size={14} color={COLORS.sage} />
            <Text style={styles.cadenceText}>{quest.cadence}</Text>
          </View>
        </View>

        {/* Description */}
        {quest.description && (
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionLabel}>Description</Text>
            <Text style={styles.descriptionText}>{quest.description}</Text>
          </View>
        )}

        {/* People row */}
        <View style={styles.peopleCard}>
          {/* Sender */}
          {quest.sender && (
            <View style={styles.personRow}>
              <Avatar uri={quest.sender.avatar_url} name={quest.sender.display_name} size={40} />
              <View style={styles.personInfo}>
                <Text style={styles.personRole}>Sent by</Text>
                <Text style={styles.personName}>{quest.sender.display_name}</Text>
                <Text style={styles.personUsername}>@{quest.sender.username}</Text>
              </View>
            </View>
          )}

          <View style={styles.peopleDivider}>
            <Ionicons name="arrow-down-outline" size={16} color={COLORS.barkMuted} />
          </View>

          {/* Recipient */}
          {quest.recipient && (
            <View style={styles.personRow}>
              <Avatar uri={quest.recipient.avatar_url} name={quest.recipient.display_name} size={40} />
              <View style={styles.personInfo}>
                <Text style={styles.personRole}>Quest for</Text>
                <Text style={styles.personName}>{quest.recipient.display_name}</Text>
                <Text style={styles.personUsername}>@{quest.recipient.username}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Time remaining / expiry */}
        {quest.status === 'active' && (
          <View style={[styles.timerCard, isExpired && styles.timerCardExpired]}>
            <Ionicons
              name="timer-outline"
              size={20}
              color={isExpired ? COLORS.error : COLORS.sage}
            />
            <View style={styles.timerInfo}>
              <Text style={styles.timerLabel}>
                {isExpired ? 'Quest expired' : 'Time remaining'}
              </Text>
              <Text style={[styles.timerValue, isExpired && styles.timerExpired]}>
                {isExpired ? 'Expired' : timeRemaining}
              </Text>
            </View>
          </View>
        )}

        {/* Completion details */}
        {quest.status === 'completed' && completion && (
          <View style={styles.completionCard}>
            <View style={styles.completionHeader}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.sage} />
              <Text style={styles.completionTitle}>Completed!</Text>
              <Text style={styles.completionDate}>
                {formatRelativeDate(completion.completed_at)}
              </Text>
            </View>

            {completion.note && (
              <View style={styles.completionNote}>
                <Text style={styles.completionNoteLabel}>Note</Text>
                <Text style={styles.completionNoteText}>{completion.note}</Text>
              </View>
            )}

            {completion.photo_url && (
              <Image
                source={{ uri: completion.photo_url }}
                style={styles.completionPhoto}
                resizeMode="cover"
              />
            )}
          </View>
        )}

        {/* Dates */}
        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Sent</Text>
            <Text style={styles.metaValue}>{formatRelativeDate(quest.created_at)}</Text>
          </View>
          {quest.status !== 'active' && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Updated</Text>
              <Text style={styles.metaValue}>{formatRelativeDate(quest.updated_at)}</Text>
            </View>
          )}
        </View>

        {/* Complete CTA */}
        {canComplete && !isExpired && (
          <Button
            title="Mark Complete ✓"
            onPress={handleComplete}
            loading={completing}
            fullWidth
            size="lg"
            style={styles.completeBtn}
          />
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  loadingIndicator: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    marginBottom: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
  },
  title: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 28,
    color: COLORS.bark,
    lineHeight: 36,
    marginBottom: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  cadenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.sageLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
  },
  cadenceText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: COLORS.sage,
    textTransform: 'capitalize',
  },
  descriptionCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  descriptionLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: COLORS.barkMuted,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  descriptionText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: COLORS.bark,
    lineHeight: 22,
  },
  peopleCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  peopleDivider: {
    paddingLeft: 52,
  },
  personInfo: {
    flex: 1,
    gap: 1,
  },
  personRole: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: COLORS.barkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  personName: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: COLORS.bark,
  },
  personUsername: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: COLORS.barkMuted,
  },
  timerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.sageLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  timerCardExpired: {
    backgroundColor: COLORS.errorLight,
  },
  timerInfo: {
    flex: 1,
  },
  timerLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: COLORS.barkMuted,
    marginBottom: 2,
  },
  timerValue: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 20,
    color: COLORS.sage,
    letterSpacing: 0.5,
  },
  timerExpired: {
    color: COLORS.error,
  },
  completionCard: {
    backgroundColor: COLORS.sageLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  completionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completionTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: COLORS.sage,
    flex: 1,
  },
  completionDate: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: COLORS.barkMuted,
  },
  completionNote: {
    gap: 4,
  },
  completionNoteLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: COLORS.barkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  completionNoteText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: COLORS.bark,
    lineHeight: 22,
  },
  completionPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  metaCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: COLORS.barkMuted,
  },
  metaValue: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: COLORS.bark,
  },
  completeBtn: {
    marginTop: 8,
  },
});
