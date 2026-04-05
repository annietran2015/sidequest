import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
  showCharCount?: boolean;
  maxLength?: number;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
}

export function Input({
  label,
  error,
  hint,
  containerStyle,
  showCharCount,
  maxLength,
  rightIcon,
  onRightIconPress,
  secureTextEntry,
  value,
  style,
  ...rest
}: InputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = secureTextEntry;
  const currentLength = value?.length ?? 0;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[styles.inputWrapper, error ? styles.inputWrapperError : null]}>
        <TextInput
          style={[styles.input, rightIcon || isPassword ? styles.inputWithIcon : null, style]}
          value={value}
          secureTextEntry={isPassword && !isPasswordVisible}
          placeholderTextColor={COLORS.barkMuted}
          maxLength={maxLength}
          autoCapitalize="none"
          autoCorrect={false}
          {...rest}
        />

        {isPassword && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setIsPasswordVisible((v) => !v)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={COLORS.barkMuted}
            />
          </TouchableOpacity>
        )}

        {rightIcon && !isPassword && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onRightIconPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name={rightIcon} size={20} color={COLORS.barkMuted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : hint ? (
            <Text style={styles.hintText}>{hint}</Text>
          ) : null}
        </View>

        {showCharCount && maxLength && (
          <Text style={[styles.charCount, currentLength >= maxLength && styles.charCountMax]}>
            {currentLength}/{maxLength}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  label: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: COLORS.bark,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  inputWrapperError: {
    borderColor: COLORS.error,
  },
  input: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    color: COLORS.bark,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 50,
  },
  inputWithIcon: {
    paddingRight: 48,
  },
  iconButton: {
    position: 'absolute',
    right: 14,
    padding: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    minHeight: 18,
    paddingHorizontal: 2,
  },
  footerLeft: {
    flex: 1,
  },
  errorText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: COLORS.error,
  },
  hintText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: COLORS.barkMuted,
  },
  charCount: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: COLORS.barkMuted,
    marginLeft: 8,
  },
  charCountMax: {
    color: COLORS.error,
  },
});
