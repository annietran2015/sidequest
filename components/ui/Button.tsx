import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS } from '@/constants';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const containerStyle: ViewStyle[] = [
    styles.base,
    styles[`size_${size}`],
    styles[`variant_${variant}`],
    isDisabled && styles.disabled,
    fullWidth && styles.fullWidth,
    style ?? {},
  ];

  const labelStyle: TextStyle[] = [
    styles.label,
    styles[`label_${size}`],
    styles[`label_${variant}`],
    isDisabled && styles.labelDisabled,
    textStyle ?? {},
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? COLORS.terracotta : COLORS.cream}
          size="small"
        />
      ) : (
        <Text style={labelStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },

  // Sizes
  size_sm: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
  },
  size_md: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: 48,
  },
  size_lg: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    minHeight: 56,
  },

  // Variants
  variant_primary: {
    backgroundColor: COLORS.terracotta,
  },
  variant_secondary: {
    backgroundColor: COLORS.sage,
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.terracotta,
  },
  variant_ghost: {
    backgroundColor: 'transparent',
  },

  // Labels
  label: {
    fontFamily: 'DMSans_600SemiBold',
    letterSpacing: 0.2,
  },
  label_sm: {
    fontSize: 14,
  },
  label_md: {
    fontSize: 16,
  },
  label_lg: {
    fontSize: 18,
  },
  label_primary: {
    color: COLORS.cream,
  },
  label_secondary: {
    color: COLORS.cream,
  },
  label_outline: {
    color: COLORS.terracotta,
  },
  label_ghost: {
    color: COLORS.terracotta,
  },

  disabled: {
    opacity: 0.5,
  },
  labelDisabled: {},
});
