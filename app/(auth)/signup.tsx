import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { COLORS, MAX_DISPLAY_NAME_LENGTH, MAX_USERNAME_LENGTH, MIN_PASSWORD_LENGTH } from '@/constants';
import { isValidUsername } from '@/lib/utils';

type UsernameState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export default function SignupScreen() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameState, setUsernameState] = useState<UsernameState>('idle');
  const usernameTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Real-time username uniqueness check
  useEffect(() => {
    if (usernameTimeout.current) clearTimeout(usernameTimeout.current);
    if (!username) {
      setUsernameState('idle');
      return;
    }
    if (!isValidUsername(username)) {
      setUsernameState('invalid');
      return;
    }
    setUsernameState('checking');
    usernameTimeout.current = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.toLowerCase())
        .maybeSingle();
      setUsernameState(data ? 'taken' : 'available');
    }, 600);

    return () => {
      if (usernameTimeout.current) clearTimeout(usernameTimeout.current);
    };
  }, [username]);

  const getUsernameHint = (): string | undefined => {
    switch (usernameState) {
      case 'checking': return 'Checking availability...';
      case 'available': return '✓ Username is available';
      case 'taken': return 'Username already taken';
      case 'invalid': return 'Letters, numbers, and underscores only (3-20 chars)';
      default: return undefined;
    }
  };

  const getUsernameError = (): string | undefined => {
    if (usernameState === 'taken') return 'Username already taken';
    if (usernameState === 'invalid') return 'Invalid username format';
    if (errors.username) return errors.username;
    return undefined;
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!displayName.trim()) newErrors.displayName = 'Display name is required';
    if (!username.trim()) newErrors.username = 'Username is required';
    else if (usernameState === 'taken') newErrors.username = 'Username already taken';
    else if (usernameState === 'invalid') newErrors.username = 'Invalid username format';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < MIN_PASSWORD_LENGTH)
      newErrors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: displayName.trim(),
            username: username.toLowerCase().trim(),
          },
        },
      });

      if (authError) {
        Alert.alert('Sign Up Failed', authError.message);
        return;
      }

      if (!authData.user) {
        Alert.alert('Sign Up Failed', 'Something went wrong. Please try again.');
        return;
      }

      // Create profile row
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        username: username.toLowerCase().trim(),
        display_name: displayName.trim(),
        bio: null,
        avatar_url: null,
        streak_count: 0,
        total_completed: 0,
      });

      if (profileError) {
        // If profile creation fails, still navigate (trigger may have handled it)
        console.error('Profile creation error:', profileError.message);
      }

      // Navigation handled by AuthGate
    } catch (err) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.bark} />
            </TouchableOpacity>
          </View>

          <View style={styles.titleSection}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Start your quest journey</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Display Name"
              placeholder="How should people know you?"
              value={displayName}
              onChangeText={setDisplayName}
              autoComplete="name"
              textContentType="name"
              maxLength={MAX_DISPLAY_NAME_LENGTH}
              error={errors.displayName}
              containerStyle={styles.inputContainer}
            />

            <Input
              label="Username"
              placeholder="@yourhandle"
              value={username}
              onChangeText={(t) => setUsername(t.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              autoComplete="username"
              textContentType="username"
              maxLength={MAX_USERNAME_LENGTH}
              error={getUsernameError()}
              hint={usernameState === 'available' ? getUsernameHint() : usernameState === 'checking' ? getUsernameHint() : undefined}
              containerStyle={styles.inputContainer}
              rightIcon={
                usernameState === 'available'
                  ? 'checkmark-circle'
                  : usernameState === 'taken'
                  ? 'close-circle'
                  : undefined
              }
            />

            <Input
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              error={errors.email}
              containerStyle={styles.inputContainer}
            />

            <Input
              label="Password"
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              error={errors.password}
              containerStyle={styles.inputContainer}
            />

            <Button
              title="Create Account"
              onPress={handleSignUp}
              loading={loading}
              disabled={usernameState === 'taken' || usernameState === 'invalid' || usernameState === 'checking'}
              fullWidth
              style={styles.createBtn}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.terms}>
            By creating an account you agree to our Terms of Service and Privacy Policy.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  keyboardView: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    paddingTop: 16,
    marginBottom: 8,
  },
  backBtn: {
    padding: 4,
    alignSelf: 'flex-start',
  },
  titleSection: {
    marginBottom: 32,
  },
  title: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 32,
    color: COLORS.bark,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    color: COLORS.barkMuted,
  },
  form: {
    gap: 4,
  },
  inputContainer: {
    marginBottom: 12,
  },
  createBtn: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: COLORS.barkMuted,
  },
  footerLink: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
    color: COLORS.terracotta,
  },
  terms: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: COLORS.barkMuted,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});
