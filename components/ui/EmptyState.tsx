import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  emoji?: string;
  title: string;
  subtitle?: string;
  ctaTitle?: string;
  onCta?: () => void;
  style?: ViewStyle;
}

export function EmptyState({
  icon,
  emoji,
  title,
  subtitle,
  ctaTitle,
  onCta,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      {emoji ? (
        <Text style={styles.emoji}>{emoji}</Text>
      ) : icon ? (
        <View style={styles.iconWrapper}>
          <Ionicons name={icon} size={40} color={COLORS.barkMuted} />
        </View>
      ) : null}

      <Text style={styles.title}>{title}</Text>

      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

      {ctaTitle && onCta && (
        <Button
          title={ctaTitle}
          onPress={onCta}
          variant="primary"
          style={styles.cta}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emoji: {
    fontSize: 52,
    marginBottom: 16,
    textAlign: 'center',
  },
  title: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 20,
    color: COLORS.bark,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: COLORS.barkMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  cta: {
    marginTop: 24,
    minWidth: 160,
  },
});
