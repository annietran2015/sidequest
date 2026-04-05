import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/constants';
import type { Profile } from '@/types';

interface FriendListItemProps {
  profile: Profile;
  onSendQuest?: (profile: Profile) => void;
  onPress?: (profile: Profile) => void;
  onLongPress?: (profile: Profile) => void;
  showSendButton?: boolean;
  rightElement?: React.ReactNode;
}

export function FriendListItem({
  profile,
  onSendQuest,
  onPress,
  onLongPress,
  showSendButton = true,
  rightElement,
}: FriendListItemProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(profile)}
      onLongPress={() => onLongPress?.(profile)}
      activeOpacity={0.85}
      delayLongPress={600}
    >
      <Avatar uri={profile.avatar_url} name={profile.display_name} size={48} />

      <View style={styles.info}>
        <Text style={styles.displayName} numberOfLines={1}>
          {profile.display_name}
        </Text>
        <Text style={styles.username} numberOfLines={1}>
          @{profile.username}
        </Text>
      </View>

      {rightElement
        ? rightElement
        : showSendButton && onSendQuest && (
            <Button
              title="Send Quest"
              onPress={() => onSendQuest(profile)}
              variant="outline"
              size="sm"
            />
          )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  displayName: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 16,
    color: COLORS.bark,
  },
  username: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: COLORS.barkMuted,
  },
});
