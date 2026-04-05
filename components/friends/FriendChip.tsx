import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import type { Profile } from '@/types';

interface FriendChipProps {
  profile: Profile;
  selected?: boolean;
  onPress?: (profile: Profile) => void;
}

export function FriendChip({ profile, selected = false, onPress }: FriendChipProps) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={() => onPress?.(profile)}
      activeOpacity={0.75}
    >
      <View style={styles.avatarWrapper}>
        <Avatar uri={profile.avatar_url} name={profile.display_name} size={40} />
        {selected && (
          <View style={styles.checkBadge}>
            <Ionicons name="checkmark" size={10} color={COLORS.white} />
          </View>
        )}
      </View>
      <Text style={[styles.name, selected && styles.nameSelected]} numberOfLines={1}>
        {profile.display_name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    minWidth: 72,
    maxWidth: 88,
    marginRight: 10,
  },
  chipSelected: {
    borderColor: COLORS.terracotta,
    backgroundColor: COLORS.terracottaLight,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 6,
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  name: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: COLORS.bark,
    textAlign: 'center',
  },
  nameSelected: {
    color: COLORS.terracotta,
    fontFamily: 'DMSans_700Bold',
  },
});
