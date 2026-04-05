import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pill } from '@/components/ui/Pill';
import { QuestLogEntry } from '@/components/quest/QuestLogEntry';
import { EmptyState } from '@/components/ui/EmptyState';
import { useQuests } from '@/hooks/useQuests';
import { useAuthStore } from '@/stores/authStore';
import { formatMonthYear } from '@/lib/utils';
import { COLORS, CADENCES } from '@/constants';
import type { Quest, QuestCadence } from '@/types';

type DirectionFilter = 'all' | 'received' | 'sent';

interface GroupedQuests {
  title: string;
  data: Quest[];
}

export default function LogScreen() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const { questLog, loading, refetch } = useQuests();

  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('all');
  const [cadenceFilter, setCadenceFilter] = useState<QuestCadence | 'all'>('all');

  // Stats
  const completedCount = questLog.filter((q) => q.status === 'completed').length;
  const totalCount = questLog.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const streak = profile?.streak_count ?? 0;

  // Filtered quests
  const filtered = useMemo(() => {
    return questLog.filter((q) => {
      if (directionFilter === 'received' && q.recipient_id !== user?.id) return false;
      if (directionFilter === 'sent' && q.sender_id !== user?.id) return false;
      if (cadenceFilter !== 'all' && q.cadence !== cadenceFilter) return false;
      return true;
    });
  }, [questLog, directionFilter, cadenceFilter, user?.id]);

  // Group by month
  const grouped = useMemo<GroupedQuests[]>(() => {
    const groups: Record<string, Quest[]> = {};
    filtered.forEach((quest) => {
      const key = formatMonthYear(quest.updated_at ?? quest.created_at);
      if (!groups[key]) groups[key] = [];
      groups[key].push(quest);
    });
    return Object.entries(groups).map(([title, data]) => ({ title, data }));
  }, [filtered]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Quest Log</Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{completedCount}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={[styles.statCard, styles.statCardMiddle]}>
          <Text style={styles.statValue}>{completionRate}%</Text>
          <Text style={styles.statLabel}>Rate</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>🔥 {streak}</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {/* Direction filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {(['all', 'received', 'sent'] as DirectionFilter[]).map((dir) => (
            <Pill
              key={dir}
              label={dir === 'all' ? 'All' : dir.charAt(0).toUpperCase() + dir.slice(1)}
              selected={directionFilter === dir}
              onPress={() => setDirectionFilter(dir)}
              color={COLORS.terracotta}
              size="sm"
              style={styles.filterPill}
            />
          ))}
        </ScrollView>

        {/* Cadence filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <Pill
            label="All Cadences"
            selected={cadenceFilter === 'all'}
            onPress={() => setCadenceFilter('all')}
            color={COLORS.sage}
            size="sm"
            style={styles.filterPill}
          />
          {CADENCES.map((c) => (
            <Pill
              key={c.id}
              label={c.label}
              selected={cadenceFilter === c.id}
              onPress={() => setCadenceFilter(c.id)}
              color={COLORS.sage}
              size="sm"
              style={styles.filterPill}
            />
          ))}
        </ScrollView>
      </View>

      {/* List */}
      {grouped.length === 0 ? (
        <EmptyState
          emoji="📜"
          title="No quests yet"
          subtitle="Complete quests to build your log and track your streaks."
          style={styles.empty}
        />
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={(item) => item.title}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refetch}
              tintColor={COLORS.terracotta}
              colors={[COLORS.terracotta]}
            />
          }
          renderItem={({ item: group }) => (
            <View style={styles.group}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              {group.data.map((quest) => (
                <QuestLogEntry
                  key={quest.id}
                  quest={quest}
                  currentUserId={user?.id ?? ''}
                  onPress={(q) => router.push(`/quest/${q.id}` as never)}
                />
              ))}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  screenTitle: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 28,
    color: COLORS.bark,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: COLORS.terracotta,
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
  },
  statCardMiddle: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  statValue: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 22,
    color: COLORS.white,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  filtersContainer: {
    gap: 8,
    marginBottom: 8,
  },
  filterRow: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterPill: {
    marginRight: 0,
  },
  empty: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  group: {
    marginBottom: 8,
  },
  groupTitle: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 16,
    color: COLORS.barkMuted,
    marginBottom: 10,
    marginTop: 8,
  },
});
