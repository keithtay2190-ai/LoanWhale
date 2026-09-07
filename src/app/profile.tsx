import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { PrimaryButton } from '@/components/primary-button';
import { useProfile } from '@/context/profile-context';
import { useSession } from '@/hooks/use-session';
import { EMPLOYMENT_TYPES } from '@/lib/employment-types';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { INCOME_RANGES } from '@/lib/income-ranges';
import { saveLocalProfileDraft } from '@/lib/local-profile-storage';
import { supabase } from '@/lib/supabase';
import { colors, fontFamily, fontSize, radii, spacing } from '@/lib/theme';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function ProfileDetailsScreen() {
  const { session } = useSession();
  const {
    profile,
    loading: profileLoading,
    error: profileError,
    refresh: refreshProfile,
    updateLocalProfile,
  } = useProfile();

  const [formInitialized, setFormInitialized] = useState(false);
  const [name, setName] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [ageText, setAgeText] = useState('');
  const [incomeRange, setIncomeRange] = useState<string | null>(null);
  const [employmentType, setEmploymentType] = useState<string | null>(null);
  const [desiredAmountText, setDesiredAmountText] = useState('');

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  // Seed the editable form fields once from the shared profile, rather than
  // binding inputs directly to context (which would fight with the user's
  // typing if the context refreshes for any reason).
  useEffect(() => {
    if (!formInitialized && profile) {
      setName(profile.name ?? '');
      setAgeText(profile.age != null ? String(profile.age) : '');
      setIncomeRange(profile.incomeRange);
      setEmploymentType(profile.employmentType);
      setDesiredAmountText(profile.desiredAmount != null ? String(profile.desiredAmount) : '');
      setFormInitialized(true);
    }
  }, [profile, formInitialized]);

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
      // React Native's fetch Blob support is unreliable with supabase-js
      // storage uploads - arrayBuffer is what Supabase's own Expo/React
      // Native docs use instead.
      const arrayBuffer = await fetch(asset.uri).then((res) => res.arrayBuffer());

      // Fixed path per user (not a new filename each time) so old photos don't
      // pile up in storage; the cache-busting query param below is what makes
      // the updated image actually show instead of a stale cached one.
      const path = `${session.user.id}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, arrayBuffer, { contentType: asset.mimeType ?? 'image/jpeg', upsert: true });

      if (uploadError) {
        setPhotoError(getFriendlyErrorMessage(uploadError));
        return;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const bustedUrl = `${data.publicUrl}?updated=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: bustedUrl })
        .eq('id', session.user.id);

      if (updateError) {
        setPhotoError(getFriendlyErrorMessage(updateError));
        return;
      }

      // Updates the header avatar (and anywhere else) immediately, without
      // needing to leave and come back to this screen.
      updateLocalProfile({ avatarUrl: bustedUrl });
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSave() {
    const age = ageText ? Number(ageText) : null;
    if (ageText && (!Number.isInteger(age) || age! < 18 || age! > 100)) {
      setSaveError('Enter a valid age between 18 and 100.');
      return;
    }

    const desiredAmount = desiredAmountText ? Number(desiredAmountText) : null;
    if (desiredAmountText && (!Number.isFinite(desiredAmount) || desiredAmount! <= 0)) {
      setSaveError('Enter a valid loan amount.');
      return;
    }

    setSaveError(null);
    setSaveStatus('saving');

    if (!session) {
      // Guest - no account to write to yet, so this just updates the
      // on-device draft. "For You" matching still picks it up immediately.
      try {
        await saveLocalProfileDraft({
          name: name || null,
          age,
          incomeRange,
          employmentType,
          desiredAmount,
        });
        await refreshProfile();
        setSaveStatus('saved');
      } catch (err) {
        setSaveError(getFriendlyErrorMessage(err));
        setSaveStatus('error');
      }
      return;
    }

    const { error } = await supabase
      .from('users')
      .update({
        name: name || null,
        age,
        income_range: incomeRange,
        employment_type: employmentType,
        desired_loan_amount: desiredAmount,
      })
      .eq('id', session.user.id);

    if (error) {
      setSaveError(getFriendlyErrorMessage(error));
      setSaveStatus('error');
      return;
    }

    updateLocalProfile({ name: name || null, age, incomeRange, employmentType, desiredAmount });
    setSaveStatus('saved');
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

      {profileLoading && (
        <View style={styles.centerFill}>
          <Text style={styles.mutedText}>Loading profile…</Text>
        </View>
      )}

      {!profileLoading && profileError && !profile && (
        <View style={styles.centerFill}>
          <Text style={styles.errorText}>Couldn't load your profile.</Text>
          <Text style={styles.mutedText}>{profileError}</Text>
          <View style={styles.retryButtonWrap}>
            <PrimaryButton label="Try Again" onPress={refreshProfile} />
          </View>
        </View>
      )}

      {!profileLoading && !(profileError && !profile) && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Profile Details</Text>

          {!session && (
            <View style={styles.guestBanner}>
              <Text style={styles.guestBannerText}>
                You're not logged in — what you enter here is saved on this device and used for
                "For You" matching. You'll need an account to apply for a loan.
              </Text>
              <Pressable
                onPress={() => router.push('/login')}
                style={({ pressed }) => pressed && styles.linkPressed}
                accessibilityRole="button"
                accessibilityLabel="Create an account or log in"
              >
                <Text style={styles.guestBannerLink}>Create an account / Log in</Text>
              </Pressable>
            </View>
          )}

          {session && (
            <>
              <View style={styles.avatarRow}>
                <Avatar url={profile?.avatarUrl ?? null} size={80} />
                <Pressable
                  onPress={handleChangePhoto}
                  disabled={uploadingPhoto}
                  style={({ pressed }) => pressed && styles.linkPressed}
                  accessibilityRole="button"
                  accessibilityLabel="Change profile photo"
                  accessibilityState={{ disabled: uploadingPhoto, busy: uploadingPhoto }}
                >
                  <Text style={styles.changePhotoLink}>
                    {uploadingPhoto ? 'Uploading…' : 'Change photo'}
                  </Text>
                </Pressable>
              </View>
              {photoError && <Text style={styles.errorText}>{photoError}</Text>}

              <Text style={styles.subtitle}>{profile?.email}</Text>
            </>
          )}

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

          <FormField label="Loan amount you're looking for">
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              placeholder="e.g. 20000"
              value={desiredAmountText}
              onChangeText={setDesiredAmountText}
            />
          </FormField>

          <FormField label="Annual income range">
            <View style={styles.optionsWrap}>
              {INCOME_RANGES.map((range) => (
                <OptionPill
                  key={range.label}
                  label={range.label}
                  active={incomeRange === range.label}
                  onPress={() => setIncomeRange(range.label)}
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

          <PrimaryButton
            label="Save"
            onPress={handleSave}
            loading={saveStatus === 'saving'}
          />
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
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionPill,
        active && styles.optionPillActive,
        pressed && styles.optionPillPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.optionPillText, active && styles.optionPillTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  backLink: {
    fontSize: fontSize.body,
    color: colors.accent,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  linkPressed: {
    opacity: 0.6,
  },
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: spacing.xl,
  },
  retryButtonWrap: {
    marginTop: spacing.md,
  },
  mutedText: {
    fontSize: fontSize.bodySmall,
    color: colors.textSecondary,
  },
  content: {
    paddingBottom: 40,
  },
  title: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h1,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  guestBanner: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  guestBannerText: {
    fontSize: fontSize.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  guestBannerLink: {
    fontSize: fontSize.bodySmall,
    color: colors.accent,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  changePhotoLink: {
    fontSize: fontSize.bodySmall + 1,
    color: colors.accent,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: fontSize.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  field: {
    marginBottom: spacing.xl,
  },
  fieldLabel: {
    fontSize: fontSize.bodySmall,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
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
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  optionPillActive: {
    backgroundColor: colors.primary,
  },
  optionPillPressed: {
    opacity: 0.7,
  },
  optionPillText: {
    fontSize: fontSize.bodySmall,
    color: colors.textPrimary,
  },
  optionPillTextActive: {
    color: colors.onDark,
  },
  errorText: {
    color: colors.danger,
    fontSize: fontSize.bodySmall,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  successText: {
    color: colors.success,
    fontSize: fontSize.bodySmall,
    marginBottom: spacing.md,
  },
});
