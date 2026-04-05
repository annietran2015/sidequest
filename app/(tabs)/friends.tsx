import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  ActionSheetIOS,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { FriendListItem } from '@/components/friends/FriendListItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { useFriends } from '@/hooks/useFriends';
import { COLORS } from '@/constants';
import type { Profile } from '@/types';
import type { FriendWithProfile } from '@/stores/friendStore';

export default function FriendsScreen() {
  const router = useRouter();
  const {
    friends,
    pendingRequests,
    loading,
    refetch,
    sendFriendRequest,
    acceptRequest,
    declineRequest,
    searchUsers,
    removeFriendship,
  } = useFriends();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addQuery, setAddQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  // Filter friends by search
  const filteredFriends = friends.filter((f) => {
    const q = searchQuery.toLowerCase();
    return (
      f.friend.display_name.toLowerCase().includes(q) ||
      f.friend.username.toLowerCase().includes(q)
    );
  });

  // Search users in add modal
  useEffect(() => {
    if (!addQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearchLoading(true);
      const results = await searchUsers(addQuery);
      setSearchResults(results);
      setSearchLoading(false);
    }, 400);
    return () => clearTimeout(timeout);
  }, [addQuery]);

  const handleSendRequest = async (profile: Profile) => {
    setSendingTo(profile.id);
    const { success, message } = await sendFriendRequest(profile.id);
    setSendingTo(null);
    Alert.alert(success ? 'Request Sent!' : 'Oops', message);
    if (success) setShowAddModal(false);
  };

  const handleLongPressFriend = (friend: FriendWithProfile) => {
    const options = ['Remove Friend', 'Cancel'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex: 0,
          cancelButtonIndex: 1,
          title: friend.friend.display_name,
        },
        async (index) => {
          if (index === 0) {
            const success = await removeFriendship(friend.id);
            if (!success) Alert.alert('Error', 'Failed to remove friend.');
          }
        }
      );
    } else {
      Alert.alert(
        friend.friend.display_name,
        'What would you like to do?',
        [
          {
            text: 'Remove Friend',
            style: 'destructive',
            onPress: async () => {
              const success = await removeFriendship(friend.id);
              if (!success) Alert.alert('Error', 'Failed to remove friend.');
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Friends</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Ionicons name="person-add-outline" size={20} color={COLORS.terracotta} />
          <Text style={styles.addBtnText}>Add Friend</Text>
        </TouchableOpacity>
      </View>

      {/* Pending requests banner */}
      {pendingRequests.length > 0 && (
        <View style={styles.pendingBanner}>
          <Text style={styles.pendingTitle}>
            {pendingRequests.length} pending {pendingRequests.length === 1 ? 'request' : 'requests'}
          </Text>
          {pendingRequests.map((req) => (
            <View key={req.id} style={styles.pendingItem}>
              <View style={styles.pendingLeft}>
                <Avatar uri={req.friend.avatar_url} name={req.friend.display_name} size={36} />
                <View>
                  <Text style={styles.pendingName}>{req.friend.display_name}</Text>
                  <Text style={styles.pendingUsername}>@{req.friend.username}</Text>
                </View>
              </View>
              <View style={styles.pendingActions}>
                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={() => acceptRequest(req.id)}
                >
                  <Ionicons name="checkmark" size={18} color={COLORS.white} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.declineBtn}
                  onPress={() => declineRequest(req.id)}
                >
                  <Ionicons name="close" size={18} color={COLORS.barkMuted} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={COLORS.barkMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search friends..."
          placeholderTextColor={COLORS.barkMuted}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Friends list */}
      {filteredFriends.length === 0 && !loading ? (
        <EmptyState
          emoji="👫"
          title="No friends yet"
          subtitle="Add friends to send them daily quests and share your adventures."
          ctaTitle="Add a Friend"
          onCta={() => setShowAddModal(true)}
          style={styles.empty}
        />
      ) : (
        <FlatList
          data={filteredFriends}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <FriendListItem
              profile={item.friend}
              onSendQuest={(profile) => {
                router.push(`/send-quest?recipientId=${profile.id}` as never);
              }}
              onLongPress={() => handleLongPressFriend(item)}
            />
          )}
        />
      )}

      {/* Add Friend Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add a Friend</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.bark} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalSearchContainer}>
            <Ionicons name="search-outline" size={18} color={COLORS.barkMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={addQuery}
              onChangeText={setAddQuery}
              placeholder="Search by name or username..."
              placeholderTextColor={COLORS.barkMuted}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            {searchLoading && (
              <ActivityIndicator size="small" color={COLORS.terracotta} style={{ marginRight: 12 }} />
            )}
          </View>

          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.modalList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              addQuery.length > 0 && !searchLoading ? (
                <EmptyState
                  emoji="🔍"
                  title="No users found"
                  subtitle="Try a different name or username."
                />
              ) : null
            }
            renderItem={({ item }) => (
              <FriendListItem
                profile={item}
                showSendButton={false}
                rightElement={
                  <Button
                    title="Add"
                    onPress={() => handleSendRequest(item)}
                    variant="primary"
                    size="sm"
                    loading={sendingTo === item.id}
                  />
                }
              />
            )}
          />
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  screenTitle: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 28,
    color: COLORS.bark,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.terracottaLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
  },
  addBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: COLORS.terracotta,
  },
  pendingBanner: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: COLORS.sageLight,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  pendingTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    color: COLORS.sage,
    marginBottom: 4,
  },
  pendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pendingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  pendingName: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: COLORS.bark,
  },
  pendingUsername: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: COLORS.barkMuted,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: COLORS.bark,
    paddingVertical: 12,
  },
  empty: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  modalTitle: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 22,
    color: COLORS.bark,
  },
  modalList: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
});
