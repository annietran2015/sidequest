import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '@/constants';
import { getInitials } from '@/lib/utils';

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
  style?: ViewStyle;
  backgroundColor?: string;
}

export function Avatar({ uri, name, size = 44, style, backgroundColor }: AvatarProps) {
  const initials = name ? getInitials(name) : '?';
  const bgColor = backgroundColor ?? COLORS.terracottaLight;
  const fontSize = Math.round(size * 0.38);
  const borderRadius = size / 2;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: bgColor,
        },
        style,
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={[styles.image, { width: size, height: size, borderRadius }]}
          resizeMode="cover"
        />
      ) : (
        <Text
          style={[
            styles.initials,
            { fontSize, lineHeight: size, color: COLORS.terracotta },
          ]}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  initials: {
    fontFamily: 'Fraunces_700Bold',
    textAlign: 'center',
  },
});
