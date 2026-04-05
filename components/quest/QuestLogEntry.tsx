import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/ui/Avatar';
import { Pill } from '@/components/ui/Pill';
import { COLORS } from '@/constants';
import { formatShortDate, getVibeEmoji, getVibeColor } from '@/lib/utils';
import type { Quest, QuestStatus } from '@/types';

interface QuestLogEntryProps {
  quest: Quest;
  currentUserId: string;
  onPress?: (quest: Quest) => void;
}

const STATUS_CONFIG: Record<QuestStatus, { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  completed: { label: 'Completed', color: COLORS.sage, icon: 'checkmark-circle' },
  missed: { label: 'Missed', color: COLORS.barkMuted, icon: 'time-outline' },
  cancelled: { label: 'Cancelled', color: COLORS.error, icon: 'close-circle-outline' },
  active: { label: 'Active', color: COLORS.terracotta, icon: 'flash-outline' },
};

export function QuestLogEntry({ quest, currentUserId, onPress }: QuestLogEntryProps) {
  const statusConfig = STATUS_CONFIG[quest.status];
  const vibeColor = getVibeColor(quest.vibe_tag as any);
  const vibeEmoji = getVibeEmoji(quest.vibe_tag as any);
  const isSent = quest.sender_id === currentUserId;
  const otherPerson = isSent ? quest.recipient : quest.sender;
  const date = quest.completion?.completed_at ?? quest.updated_at ?? quest.created_at;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(quest)}
      activeOpacity={0.8}
    >
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: statusConfig.color }]} />

      <View style={styles.content}>
        {/* Top row: title + status */}
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={2}>
            {quest.title}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: `${statusConfig.color}22` }]}>
            <Ionicons name={statusConfig.icon} size={12} color={statusConfig.color} />
            <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Middle row: vibe + cadence + direction */}
        <View style={styles.midRow}>
          <Pill
            label={quest.vibe_tag}
            emoji={vibeEmoji}
            color={vibeColor}
            selected
            size="sm"
          />
          <Text style={styles.cadenceText}>{quest.cadence}</Text>
          <View style={styles.directionBadge}>
            <Ionicons
              name={isSent ? 'arrow-up-outline' : 'arrow-down-outline'}
              size={12}
              color={COLORS.barkMuted}
            />
            <Text style={styles.directionText}>{isSent ? 'sent' : 'received'}</Text>
          </View>
        </View>

        {/* Bottom row: person + date */}
        <View style={styles.bottomRow}>
          {otherPerson && (
            <View style={styles.personRow}>
              <Avatar uri={otherPerson.avatar_url} name={otherPerson.display_name} size={20} />
              <Text style={styles.personName} numberOfLines={1}>
                {isSent ? 'to ' : 'from '}
                <Text style={styles.personNameBold}>{otherPerson.display_name}</Text>
              </Text>
            </View>
          )}
          <Text style={styles.date}>{formatShortDate(date)}</Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={16} color={COLORS.barkMuted} style={styles.chevron} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'stretch',
  },
  accentBar: {
    width: 4,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  content: {
    flex: 1,
    padding: 14,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flex: 1,
    fontFamily: 'Fraunces_400Regular',
    fontSize: 16,
    color: COLORS.bark,
    lineHeight: 22,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
    flexShrink: 0,
  },
  statusLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
  },
  midRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cadenceText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: COLORS.barkMuted,
    textTransform: 'capitalize',
  },
  directionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  directionText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: COLORS.barkMuted,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  date: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: COLORS.barkMuted,
  },
  chevron: {
    alignSelf: 'center',
    marginRight: 12,
  },
});
