import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { COLORS, MAX_BIO_LENGTH, MAX_DISPLAY_NAME_LENGTH } from '@/constants';

export default function ProfileScreen() {
  const { profile, setProfile, signOut } = useAuthStore();

  const [editingField, setEditingField] = useState<'displayName' | 'bio' | null>(null);
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleSaveDisplayName = async () => {
    if (!displayName.trim() || !profile) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim(), updated_at: new Date().toISOString() })
      .eq('id', profile.id)
      .select()
      .single();
    setSaving(false);
    if (error) {
      Alert.alert('Error', 'Failed to save. Please try again.');
    } else {
      setProfile(data as typeof profile);
      setEditingField(null);
    }
  };

  const handleSaveBio = async () => {
    if (!profile) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('profiles')
      .update({ bio: bio.trim() || null, updated_at: new Date().toISOString() })
      .eq('id', profile.id)
      .select()
      .single();
    setSaving(false);
    if (error) {
      Alert.alert('Error', 'Failed to save. Please try again.');
    } else {
      setProfile(data as typeof profile);
      setEditingField(null);
    }
  };

  const handleChangeAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow photo library access to change your avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets[0] || !profile) return;

    setUploadingAvatar(true);
    try {
      const asset = result.assets[0];
      const fileName = `${profile.id}/avatar.jpg`;

      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq('id', profile.id)
        .select()
        .single();

      if (updateError) throw updateError;
      setProfile(data as typeof profile);
    } catch (err) {
      Alert.alert('Error', 'Failed to upload avatar. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={COLORS.terracotta} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.screenTitle}>Profile</Text>

        {/* Avatar section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={handleChangeAvatar}>
            <Avatar uri={profile.avatar_url} name={profile.display_name} size={96} />
            {uploadingAvatar ? (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color={COLORS.white} size="small" />
              </View>
            ) : (
              <View style={styles.avatarEditBadge}>
                <Ionicons name="camera" size={14} color={COLORS.white} />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.usernameTag}>@{profile.username}</Text>
        </View>

        {/* Display Name */}
        <View style={styles.fieldCard}>
          <View style={styles.fieldHeader}>
            <Text style={styles.fieldLabel}>Display Name</Text>
            {editingField === 'displayName' ? (
              <View style={styles.fieldActions}>
                <TouchableOpacity onPress={() => { setDisplayName(profile.display_name); setEditingField(null); }}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveDisplayName} disabled={saving}>
                  {saving ? (
                    <ActivityIndicator size="small" color={COLORS.terracotta} />
                  ) : (
                    <Text style={styles.saveText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setEditingField('displayName')}>
                <Ionicons name="pencil-outline" size={18} color={COLORS.terracotta} />
              </TouchableOpacity>
            )}
          </View>
          {editingField === 'displayName' ? (
            <TextInput
              style={styles.fieldInput}
              value={displayName}
              onChangeText={setDisplayName}
              maxLength={MAX_DISPLAY_NAME_LENGTH}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSaveDisplayName}
              placeholderTextColor={COLORS.barkMuted}
            />
          ) : (
            <Text style={styles.fieldValue}>{profile.display_name}</Text>
          )}
        </View>

        {/* Bio */}
        <View style={styles.fieldCard}>
          <View style={styles.fieldHeader}>
            <Text style={styles.fieldLabel}>Bio</Text>
            {editingField === 'bio' ? (
              <View style={styles.fieldActions}>
                <TouchableOpacity onPress={() => { setBio(profile.bio ?? ''); setEditingField(null); }}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveBio} disabled={saving}>
                  {saving ? (
                    <ActivityIndicator size="small" color={COLORS.terracotta} />
                  ) : (
                    <Text style={styles.saveText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setEditingField('bio')}>
                <Ionicons name="pencil-outline" size={18} color={COLORS.terracotta} />
              </TouchableOpacity>
            )}
          </View>
          {editingField === 'bio' ? (
            <TextInput
              style={[styles.fieldInput, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              maxLength={MAX_BIO_LENGTH}
              multiline
              numberOfLines={3}
              autoFocus
              placeholder="Tell your people a little about yourself..."
              placeholderTextColor={COLORS.barkMuted}
            />
          ) : (
            <Text style={[styles.fieldValue, !profile.bio && styles.fieldPlaceholder]}>
              {profile.bio || 'No bio yet. Tap to add one.'}
            </Text>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Your Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statEmoji}>🔥</Text>
              <Text style={styles.statValue}>{profile.streak_count}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statEmoji}>✅</Text>
              <Text style={styles.statValue}>{profile.total_completed}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>Settings</Text>
          <Button
            title="Sign Out"
            onPress={handleSignOut}
            variant="outline"
            style={styles.signOutBtn}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  screenTitle: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 28,
    color: COLORS.bark,
    paddingTop: 8,
    marginBottom: 24,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 48,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.cream,
  },
  usernameTag: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
    color: COLORS.barkMuted,
  },
  fieldCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  fieldLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: COLORS.barkMuted,
  },
  fieldActions: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: COLORS.barkMuted,
  },
  saveText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    color: COLORS.terracotta,
  },
  fieldValue: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    color: COLORS.bark,
    lineHeight: 24,
  },
  fieldPlaceholder: {
    color: COLORS.barkMuted,
    fontStyle: 'italic',
  },
  fieldInput: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    color: COLORS.bark,
    borderWidth: 1,
    borderColor: COLORS.terracotta,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.white,
  },
  bioInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  statsCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statsTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
    color: COLORS.bark,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statEmoji: {
    fontSize: 24,
  },
  statValue: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 28,
    color: COLORS.bark,
  },
  statLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: COLORS.barkMuted,
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: COLORS.border,
  },
  settingsCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  settingsTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
    color: COLORS.bark,
  },
  signOutBtn: {
    borderColor: COLORS.error,
  },
});
