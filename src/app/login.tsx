import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';

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
        setErrorMessage(error.message);
        return;
      }
      router.replace('/');
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setErrorMessage(error.message);
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
      <Pressable onPress={() => router.back()}>
        <Text style={styles.backLink}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>{mode === 'sign-in' ? 'Log In' : 'Create Account'}</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#999"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
      {infoMessage && <Text style={styles.infoText}>{infoMessage}</Text>}

      <Pressable
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>
            {mode === 'sign-in' ? 'Log In' : 'Sign Up'}
          </Text>
        )}
      </Pressable>

      <Pressable
        onPress={() => {
          setMode((m) => (m === 'sign-in' ? 'sign-up' : 'sign-in'));
          setErrorMessage(null);
          setInfoMessage(null);
        }}
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
    backgroundColor: '#fff',
    paddingHorizontal: 24,
  },
  backLink: {
    fontSize: 15,
    color: '#0066cc',
    marginTop: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  errorText: {
    color: '#c0392b',
    fontSize: 13,
    marginBottom: 12,
  },
  infoText: {
    color: '#2a7a2a',
    fontSize: 13,
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: '#111',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  switchModeText: {
    textAlign: 'center',
    color: '#0066cc',
    fontSize: 13,
    marginTop: 16,
  },
});
