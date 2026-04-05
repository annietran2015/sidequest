import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Pill } from '@/components/ui/Pill';
import { Button } from '@/components/ui/Button';
import { COLORS, VIBE_TAGS } from '@/constants';
import { formatTimeRemaining, getVibeEmoji, getVibeColor } from '@/lib/utils';
import type { Quest } from '@/types';

interface QuestCardProps {
  quest: Quest;
  onComplete?: (quest: Quest) => void;
  onPress?: (quest: Quest) => void;
  showSender?: boolean;
  showRecipient?: boolean;
  compact?: boolean;
}

export function QuestCard({
  quest,
  onComplete,
  onPress,
  showSender = true,
  showRecipient = false,
  compact = false,
}: QuestCardProps) {
  const [timeRemaining, setTimeRemaining] = useState(() => formatTimeRemaining(quest.expires_at));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(formatTimeRemaining(quest.expires_at));
    }, 1000);
    return () => clearInterval(interval);
  }, [quest.expires_at]);

  const vibeTag = VIBE_TAGS.find((v) => v.id === quest.vibe_tag);
  const vibeColor = getVibeColor(quest.vibe_tag as any);
  const vibeEmoji = getVibeEmoji(quest.vibe_tag as any);
  const isExpired = new Date(quest.expires_at) < new Date();
  const person = showSender ? quest.sender : quest.recipient;

  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.cardCompact]}
      onPress={() => onPress?.(quest)}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        {vibeTag && (
          <Pill
            label={vibeTag.label}
            emoji={vibeEmoji}
            color={vibeColor}
            selected
            size="sm"
          />
        )}
        <View style={styles.cadenceBadge}>
          <Text style={styles.cadenceText}>{quest.cadence}</Text>
        </View>
      </View>

      <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={2}>
        {quest.title}
      </Text>

      {!compact && quest.description && (
        <Text style={styles.description} numberOfLines={2}>
          {quest.description}
        </Text>
      )}

      <View style={styles.footer}>
        {person && (
          <View style={styles.personRow}>
            <Avatar uri={person.avatar_url} name={person.display_name} size={24} />
            <Text style={styles.personName} numberOfLines={1}>
              {showSender ? 'from ' : 'to '}
              <Text style={styles.personNameBold}>{person.display_name}</Text>
            </Text>
          </View>
        )}

        <View style={styles.timerRow}>
          <Text style={[styles.timer, isExpired && styles.timerExpired]}>
            {isExpired ? 'Expired' : `⏱ ${timeRemaining}`}
          </Text>
        </View>
      </View>

      {onComplete && quest.status === 'active' && !compact && (
        <Button
          title="Mark Complete ✓"
          onPress={() => onComplete(quest)}
          variant="primary"
          size="sm"
          style={styles.completeBtn}
          fullWidth
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.bark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  cardCompact: {
    padding: 12,
    marginBottom: 0,
    minWidth: 200,
    maxWidth: 220,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cadenceBadge: {
    backgroundColor: COLORS.sageLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  cadenceText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    color: COLORS.sage,
    textTransform: 'capitalize',
  },
  title: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 18,
    color: COLORS.bark,
    marginBottom: 6,
    lineHeight: 24,
  },
  titleCompact: {
    fontSize: 14,
    lineHeight: 20,
  },
  description: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: COLORS.barkMuted,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  personName: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: COLORS.barkMuted,
  },
  personNameBold: {
    fontFamily: 'DMSans_600SemiBold',
    color: COLORS.bark,
  },
  timerRow: {
    alignItems: 'flex-end',
  },
  timer: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: COLORS.sage,
  },
  timerExpired: {
    color: COLORS.error,
  },
  completeBtn: {
    marginTop: 12,
  },
});
