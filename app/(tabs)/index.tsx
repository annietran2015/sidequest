import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ActiveQuestHero } from '@/components/quest/ActiveQuestHero';
import { QuestCard } from '@/components/quest/QuestCard';
import { Avatar } from '@/components/ui/Avatar';
import { useQuests } from '@/hooks/useQuests';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuthStore } from '@/stores/authStore';
import { COLORS } from '@/constants';
import type { Quest } from '@/types';

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { activeQuest, sentQuests, loading, refetch, completeQuest } = useQuests();
  const [completing, setCompleting] = useState(false);

  useNotifications();

  const handleComplete = async (quest: Quest) => {
    Alert.alert(
      'Complete Quest',
      `Mark "${quest.title}" as complete?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete!',
          onPress: async () => {
            setCompleting(true);
            const success = await completeQuest(quest.id);
            setCompleting(false);
            if (success) {
              Alert.alert('Quest Complete! 🎉', 'Your streak is growing. Keep it up!');
            } else {
              Alert.alert('Error', 'Failed to complete quest. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleSentQuestPress = (quest: Quest) => {
    router.push(`/quest/${quest.id}` as never);
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = profile?.display_name?.split(' ')[0] ?? 'friend';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refetch}
            tintColor={COLORS.terracotta}
            colors={[COLORS.terracotta]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.name}>{firstName} 👋</Text>
          </View>
          <View style={styles.headerRight}>
            {profile && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakEmoji}>🔥</Text>
                <Text style={styles.streakCount}>{profile.streak_count}</Text>
              </View>
            )}
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
              <Avatar
                uri={profile?.avatar_url}
                name={profile?.display_name}
                size={40}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Quest Hero */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Quest</Text>
          <ActiveQuestHero
            quest={activeQuest}
            onComplete={handleComplete}
            completing={completing}
          />
        </View>

        {/* Sent Quests */}
        {sentQuests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quests You Sent</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sentScroll}
            >
              {sentQuests.slice(0, 5).map((quest) => (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  onPress={handleSentQuestPress}
                  showSender={false}
                  showRecipient
                  compact
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Padding for FAB */}
        <View style={styles.fabPadding} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/send-quest' as never)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={COLORS.white} />
        <Text style={styles.fabText}>Send a Quest</Text>
      </TouchableOpacity>
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
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  greeting: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: COLORS.barkMuted,
  },
  name: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 26,
    color: COLORS.bark,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.terracottaLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  streakEmoji: {
    fontSize: 14,
  },
  streakCount: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
    color: COLORS.terracotta,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  sectionTitle: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 20,
    color: COLORS.bark,
    marginBottom: 14,
  },
  sentScroll: {
    paddingRight: 8,
    gap: 10,
  },
  fabPadding: {
    height: 80,
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.terracotta,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: COLORS.terracotta,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  fabText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: COLORS.white,
  },
});
