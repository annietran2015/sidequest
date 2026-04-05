import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS } from '@/constants';

interface PillProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
  emoji?: string;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export function Pill({
  label,
  selected = false,
  onPress,
  color = COLORS.terracotta,
  emoji,
  size = 'md',
  style,
  textStyle,
  disabled = false,
}: PillProps) {
  const selectedBg = color;
  const selectedText = COLORS.white;
  const unselectedBg = `${color}22`; // ~13% opacity
  const unselectedText = color;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[`size_${size}`],
        { backgroundColor: selected ? selectedBg : unselectedBg },
        selected && styles.selectedShadow,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={!onPress || disabled}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.label,
          styles[`label_${size}`],
          { color: selected ? selectedText : unselectedText },
          textStyle,
        ]}
      >
        {emoji ? `${emoji} ${label}` : label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  disabled: {
    opacity: 0.5,
  },

  // Sizes
  size_sm: {
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  size_md: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  size_lg: {
    paddingVertical: 11,
    paddingHorizontal: 20,
  },

  // Labels
  label: {
    fontFamily: 'DMSans_500Medium',
  },
  label_sm: {
    fontSize: 12,
  },
  label_md: {
    fontSize: 14,
  },
  label_lg: {
    fontSize: 16,
  },
});
