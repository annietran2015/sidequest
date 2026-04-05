import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ViewStyle,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';

interface ScreenWrapperProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  scrollable?: boolean;
  noPadding?: boolean;
}

export function ScreenWrapper({
  children,
  title,
  showBack = false,
  onBack,
  rightElement,
  style,
  contentStyle,
  scrollable = false,
  noPadding = false,
}: ScreenWrapperProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const hasHeader = title || showBack || rightElement;

  const content = (
    <>
      {hasHeader && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {showBack && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="arrow-back" size={24} color={COLORS.bark} />
              </TouchableOpacity>
            )}
          </View>

          {title && (
            <Text style={styles.headerTitle} numberOfLines={1}>
              {title}
            </Text>
          )}

          <View style={styles.headerRight}>{rightElement ?? <View style={styles.placeholder} />}</View>
        </View>
      )}

      <View style={[styles.content, noPadding && styles.noPadding, contentStyle]}>
        {children}
      </View>
    </>
  );

  return (
    <SafeAreaView style={[styles.safe, style]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cream} />
      {scrollable ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.cream,
  },
  headerLeft: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'Fraunces_700Bold',
    fontSize: 18,
    color: COLORS.bark,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  placeholder: {
    width: 40,
  },
  backButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  noPadding: {
    paddingHorizontal: 0,
  },
});
