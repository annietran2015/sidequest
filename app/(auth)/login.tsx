import React, { useState } from 'react';
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
import { COLORS } from '@/constants';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'apple' | 'google' | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        Alert.alert('Sign In Failed', error.message);
      }
      // Navigation handled by AuthGate in _layout
    } catch (err) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'apple' | 'google') => {
    setOauthLoading(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: 'sidequest://auth/callback',
        },
      });
      if (error) Alert.alert('Sign In Failed', error.message);
    } catch (err) {
      Alert.alert('Error', 'OAuth sign in failed.');
    } finally {
      setOauthLoading(null);
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
          {/* Logo + branding */}
          <View style={styles.brandSection}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoEmoji}>🗺️</Text>
            </View>
            <Text style={styles.appName}>SideQuest</Text>
            <Text style={styles.tagline}>Daily challenges for you & your people</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
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
              placeholder="Your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              error={errors.password}
              containerStyle={styles.inputContainer}
            />

            <Button
              title="Sign In"
              onPress={handleSignIn}
              loading={loading}
              fullWidth
              style={styles.signInBtn}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* OAuth Buttons */}
            <TouchableOpacity
              style={styles.oauthBtn}
              onPress={() => handleOAuth('apple')}
              disabled={oauthLoading !== null}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-apple" size={20} color={COLORS.bark} />
              <Text style={styles.oauthBtnText}>Continue with Apple</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.oauthBtn}
              onPress={() => handleOAuth('google')}
              disabled={oauthLoading !== null}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-google" size={20} color={COLORS.bark} />
              <Text style={styles.oauthBtnText}>Continue with Google</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text style={styles.footerLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
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
    paddingTop: 24,
    paddingBottom: 40,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.terracottaLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: COLORS.terracotta,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  logoEmoji: {
    fontSize: 40,
  },
  appName: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 36,
    color: COLORS.bark,
    marginBottom: 8,
  },
  tagline: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: COLORS.barkMuted,
    textAlign: 'center',
  },
  form: {
    gap: 4,
  },
  inputContainer: {
    marginBottom: 12,
  },
  signInBtn: {
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: COLORS.barkMuted,
  },
  oauthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    marginBottom: 12,
  },
  oauthBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: COLORS.bark,
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
});
