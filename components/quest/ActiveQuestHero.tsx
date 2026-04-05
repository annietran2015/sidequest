import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Pill } from '@/components/ui/Pill';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { COLORS } from '@/constants';
import { formatTimeRemaining, getVibeEmoji, getVibeColor } from '@/lib/utils';
import type { Quest } from '@/types';

interface ActiveQuestHeroProps {
  quest: Quest | null;
  onComplete: (quest: Quest) => void;
  completing?: boolean;
}

export function ActiveQuestHero({ quest, onComplete, completing = false }: ActiveQuestHeroProps) {
  const router = useRouter();
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Tick every second
  useEffect(() => {
    if (!quest) return;
    setTimeRemaining(formatTimeRemaining(quest.expires_at));
    const interval = setInterval(() => {
      setTimeRemaining(formatTimeRemaining(quest.expires_at));
    }, 1000);
    return () => clearInterval(interval);
  }, [quest?.expires_at]);

  // Pulse animation for urgency (< 1 hour remaining)
  useEffect(() => {
    if (!quest) return;
    const remaining = new Date(quest.expires_at).getTime() - Date.now();
    if (remaining < 3600000) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.04,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [quest, pulseAnim]);

  if (!quest) {
    return (
      <View style={styles.emptyContainer}>
        <EmptyState
          emoji="🌿"
          title="No active quest"
          subtitle="Ask a friend to send you a quest and start your streak!"
          style={styles.emptyState}
        />
      </View>
    );
  }

  const vibeColor = getVibeColor(quest.vibe_tag as any);
  const vibeEmoji = getVibeEmoji(quest.vibe_tag as any);
  const isUrgent = new Date(quest.expires_at).getTime() - Date.now() < 3600000;
  const isExpired = new Date(quest.expires_at) < new Date();

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => router.push(`/quest/${quest.id}` as never)}
    >
      <Animated.View
        style={[
          styles.hero,
          { transform: [{ scale: pulseAnim }] },
          isUrgent && !isExpired && styles.heroUrgent,
        ]}
      >
        {/* Background gradient-like decorations */}
        <View style={[styles.bgCircle, styles.bgCircle1, { backgroundColor: `${vibeColor}18` }]} />
        <View style={[styles.bgCircle, styles.bgCircle2, { backgroundColor: `${vibeColor}10` }]} />

        {/* Header row */}
        <View style={styles.heroHeader}>
          <Pill
            label={quest.vibe_tag}
            emoji={vibeEmoji}
            color={vibeColor}
            selected
            size="sm"
          />
          <View style={styles.cadenceBadge}>
            <Text style={styles.cadenceText}>{quest.cadence}</Text>
          </View>
        </View>

        {/* Quest title */}
        <Text style={styles.heroTitle}>{quest.title}</Text>

        {/* Description */}
        {quest.description && (
          <Text style={styles.heroDesc} numberOfLines={3}>
            {quest.description}
          </Text>
        )}

        {/* Sender */}
        {quest.sender && (
          <View style={styles.senderRow}>
            <Avatar uri={quest.sender.avatar_url} name={quest.sender.display_name} size={28} />
            <Text style={styles.senderText}>
              from{' '}
              <Text style={styles.senderName}>{quest.sender.display_name}</Text>
            </Text>
          </View>
        )}

        {/* Countdown */}
        <View style={[styles.countdownRow, isUrgent && styles.countdownUrgent]}>
          <Text style={[styles.countdownLabel]}>
            {isExpired ? 'Quest expired' : 'Time remaining'}
          </Text>
          <Text style={[styles.countdown, isUrgent && styles.countdownUrgentText, isExpired && styles.countdownExpired]}>
            {isExpired ? 'Expired' : timeRemaining}
          </Text>
        </View>

        {/* CTA */}
        {!isExpired && (
          <Button
            title="Mark Complete ✓"
            onPress={() => onComplete(quest)}
            variant="primary"
            size="lg"
            loading={completing}
            style={styles.cta}
            fullWidth
          />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  emptyState: {
    paddingVertical: 48,
  },
  hero: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    shadowColor: COLORS.bark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  heroUrgent: {
    borderColor: COLORS.terracotta,
  },
  bgCircle: {
    position: 'absolute',
    borderRadius: 999,
  },
  bgCircle1: {
    width: 200,
    height: 200,
    top: -60,
    right: -60,
  },
  bgCircle2: {
    width: 120,
    height: 120,
    bottom: -30,
    left: -30,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cadenceBadge: {
    backgroundColor: COLORS.sageLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
  },
  cadenceText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: COLORS.sage,
    textTransform: 'capitalize',
  },
  heroTitle: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 26,
    color: COLORS.bark,
    lineHeight: 34,
    marginBottom: 10,
  },
  heroDesc: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: COLORS.barkMuted,
    lineHeight: 22,
    marginBottom: 16,
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  senderText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: COLORS.barkMuted,
  },
  senderName: {
    fontFamily: 'DMSans_600SemiBold',
    color: COLORS.bark,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.sageLight,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  countdownUrgent: {
    backgroundColor: COLORS.errorLight,
  },
  countdownLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: COLORS.barkMuted,
  },
  countdown: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 18,
    color: COLORS.sage,
    letterSpacing: 0.5,
  },
  countdownUrgentText: {
    color: COLORS.error,
  },
  countdownExpired: {
    color: COLORS.barkMuted,
  },
  cta: {},
});
