import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { useSession } from '@/hooks/use-session';
import { supabase } from '@/lib/supabase';

const INCOME_RANGES = [
  'Below S$20,000',
  'S$20,000 - S$39,999',
  'S$40,000 - S$79,999',
  'S$80,000 and above',
];

const EMPLOYMENT_TYPES = ['Salaried', 'Self-Employed', 'Business Owner', 'Unemployed'];

type ScreenStatus = 'loading' | 'loaded' | 'error';
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function ProfileDetailsScreen() {
  const { session, loading: sessionLoading } = useSession();

  const [status, setStatus] = useState<ScreenStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [ageText, setAgeText] = useState('');
  const [incomeRange, setIncomeRange] = useState<string | null>(null);
  const [employmentType, setEmploymentType] = useState<string | null>(null);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) {
      router.replace('/login');
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      setStatus('loading');
      const { data, error } = await supabase
        .from('users')
        .select('email, name, avatar_url, age, income_range, employment_type')
        .eq('id', session!.user.id)
        .single();
      if (cancelled) return;

      if (error) {
        setErrorMessage(error.message);
        setStatus('error');
        return;
      }

      setEmail(data.email);
      setName(data.name ?? '');
      setAvatarUrl(data.avatar_url);
      setAgeText(data.age != null ? String(data.age) : '');
      setIncomeRange(data.income_range);
      setEmploymentType(data.employment_type);
      setStatus('loaded');
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [session, sessionLoading]);

  async function handleChangePhoto() {
    if (!session) return;
    setPhotoError(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setPhotoError('Photo library access is needed to set a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;

    setUploadingPhoto(true);
    try {
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      // Fixed path per user (not a new filename each time) so old photos don't
      // pile up in storage; the cache-busting query param below is what makes
      // the updated image actually show instead of a stale cached one.
      const path = `${session.user.id}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { contentType: 'image/jpeg', upsert: true });

      if (uploadError) {
        setPhotoError(uploadError.message);
        return;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const bustedUrl = `${data.publicUrl}?updated=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: bustedUrl })
        .eq('id', session.user.id);

      if (updateError) {
        setPhotoError(updateError.message);
        return;
      }

      setAvatarUrl(bustedUrl);
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSave() {
    if (!session) return;

    const age = ageText ? Number(ageText) : null;
    if (ageText && (!Number.isInteger(age) || age! < 18 || age! > 100)) {
      setSaveError('Enter a valid age between 18 and 100.');
      return;
    }

    setSaveError(null);
    setSaveStatus('saving');

    const { error } = await supabase
      .from('users')
      .update({
        name: name || null,
        age,
        income_range: incomeRange,
        employment_type: employmentType,
      })
      .eq('id', session.user.id);

    if (error) {
      setSaveError(error.message);
      setSaveStatus('error');
      return;
    }
    setSaveStatus('saved');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.backLink}>← Back</Text>
      </Pressable>

      {status === 'loading' && (
        <View style={styles.centerFill}>
          <Text style={styles.mutedText}>Loading profile…</Text>
        </View>
      )}

      {status === 'error' && (
        <View style={styles.centerFill}>
          <Text style={styles.errorText}>Couldn't load your profile.</Text>
          <Text style={styles.mutedText}>{errorMessage}</Text>
        </View>
      )}

      {status === 'loaded' && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Profile Details</Text>

          <View style={styles.avatarRow}>
            <Avatar url={avatarUrl} size={80} />
            <Pressable onPress={handleChangePhoto} disabled={uploadingPhoto}>
              <Text style={styles.changePhotoLink}>
                {uploadingPhoto ? 'Uploading…' : 'Change photo'}
              </Text>
            </Pressable>
          </View>
          {photoError && <Text style={styles.errorText}>{photoError}</Text>}

          <Text style={styles.subtitle}>{email}</Text>

          <FormField label="Name">
            <TextInput
              style={styles.input}
              placeholder="Your name"
              value={name}
              onChangeText={setName}
            />
          </FormField>

          <FormField label="Age">
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              placeholder="e.g. 30"
              value={ageText}
              onChangeText={setAgeText}
            />
          </FormField>

          <FormField label="Annual income range">
            <View style={styles.optionsWrap}>
              {INCOME_RANGES.map((range) => (
                <OptionPill
                  key={range}
                  label={range}
                  active={incomeRange === range}
                  onPress={() => setIncomeRange(range)}
                />
              ))}
            </View>
          </FormField>

          <FormField label="Employment type">
            <View style={styles.optionsWrap}>
              {EMPLOYMENT_TYPES.map((type) => (
                <OptionPill
                  key={type}
                  label={type}
                  active={employmentType === type}
                  onPress={() => setEmploymentType(type)}
                />
              ))}
            </View>
          </FormField>

          {saveError && <Text style={styles.errorText}>{saveError}</Text>}
          {saveStatus === 'saved' && <Text style={styles.successText}>Saved.</Text>}

          <Pressable
            style={[styles.saveButton, saveStatus === 'saving' && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saveStatus === 'saving'}
          >
            <Text style={styles.saveButtonText}>
              {saveStatus === 'saving' ? 'Saving…' : 'Save'}
            </Text>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function OptionPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.optionPill, active && styles.optionPillActive]}>
      <Text style={[styles.optionPillText, active && styles.optionPillTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  backLink: {
    fontSize: 15,
    color: '#0066cc',
    marginTop: 8,
    marginBottom: 8,
  },
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  mutedText: {
    fontSize: 13,
    color: '#888',
  },
  content: {
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 16,
  },
  changePhotoLink: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 12,
    marginBottom: 20,
  },
  field: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
  },
  optionPillActive: {
    backgroundColor: '#111',
  },
  optionPillText: {
    fontSize: 13,
    color: '#333',
  },
  optionPillTextActive: {
    color: '#fff',
  },
  errorText: {
    color: '#c0392b',
    fontSize: 13,
    marginTop: 8,
    marginBottom: 12,
  },
  successText: {
    color: '#2a7a2a',
    fontSize: 13,
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: '#111',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
