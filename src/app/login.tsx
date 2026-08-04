import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { colors, fontSize, radii, spacing } from '@/lib/theme';

type Mode = 'sign-in' | 'sign-up';

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  async function handleSubmit() {
    setErrorMessage(null);
    setInfoMessage(null);
    setLoading(true);

    if (mode === 'sign-in') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        setErrorMessage(getFriendlyErrorMessage(error));
        return;
      }
      router.replace('/');
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setErrorMessage(getFriendlyErrorMessage(error));
      return;
    }
    // If email confirmation is required, Supabase returns a user but no session yet.
    if (data.session) {
      router.replace('/');
      return;
    }
    setInfoMessage('Account created. Check your email to confirm before logging in.');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => pressed && styles.linkPressed}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <Text style={styles.backLink}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>{mode === 'sign-in' ? 'Log In' : 'Create Account'}</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        textContentType="password"
        autoComplete="password"
        value={password}
        onChangeText={setPassword}
      />

      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
      {infoMessage && <Text style={styles.infoText}>{infoMessage}</Text>}

      <PrimaryButton
        label={mode === 'sign-in' ? 'Log In' : 'Sign Up'}
        onPress={handleSubmit}
        loading={loading}
      />

      <Pressable
        onPress={() => {
          setMode((m) => (m === 'sign-in' ? 'sign-up' : 'sign-in'));
          setErrorMessage(null);
          setInfoMessage(null);
        }}
        style={({ pressed }) => pressed && styles.linkPressed}
        accessibilityRole="button"
        accessibilityLabel={
          mode === 'sign-in' ? "Don't have an account? Sign up" : 'Already have an account? Log in'
        }
      >
        <Text style={styles.switchModeText}>
          {mode === 'sign-in' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xxl,
  },
  backLink: {
    fontSize: fontSize.body,
    color: colors.accent,
    marginTop: spacing.sm,
  },
  linkPressed: {
    opacity: 0.6,
  },
  title: {
    fontSize: fontSize.display,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.xxl,
    marginBottom: spacing.xxl,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.body,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: fontSize.bodySmall,
    marginBottom: spacing.md,
  },
  infoText: {
    color: colors.success,
    fontSize: fontSize.bodySmall,
    marginBottom: spacing.md,
  },
  switchModeText: {
    textAlign: 'center',
    color: colors.accent,
    fontSize: fontSize.bodySmall,
    marginTop: spacing.lg,
  },
});
