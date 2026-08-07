import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ComponentProps, useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { useProfile } from '@/context/profile-context';
import { EMPLOYMENT_TYPES } from '@/lib/employment-types';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { INCOME_RANGES } from '@/lib/income-ranges';
import { saveLocalProfileDraft } from '@/lib/local-profile-storage';
import { markOnboardingSeen } from '@/lib/onboarding-storage';
import { supabase } from '@/lib/supabase';
import { colors, fontFamily, fontSize, radii, spacing } from '@/lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const SLIDES: { title: string; subtitle: string; icon: IoniconName; tint: string }[] = [
  {
    title: 'Compare Every Rate, Instantly',
    subtitle: 'Browse real Singapore bank loan offers side by side — personal and business.',
    icon: 'git-compare',
    tint: colors.primary,
  },
  {
    title: 'See Your True Cost',
    subtitle: 'Built-in EIR and repayment calculators mean no surprises before you apply.',
    icon: 'calculator',
    tint: colors.cyan,
  },
  {
    title: 'Matched To You',
    subtitle: "Set up your profile once and see only the loans you're actually eligible for.",
    icon: 'checkmark-circle',
    tint: colors.success,
  },
];

type Phase = 'intro' | 'profile' | 'signup';
type AuthMode = 'sign-in' | 'sign-up';
type ProfileFieldKey = 'name' | 'age' | 'income' | 'employment';

const PROFILE_FIELDS: ProfileFieldKey[] = ['name', 'age', 'income', 'employment'];
const FIELD_TITLES: Record<ProfileFieldKey, string> = {
  name: "What's your name?",
  age: 'When were you born?',
  income: "What's your annual income range?",
  employment: "What's your employment type?",
};

const CURRENT_YEAR = new Date().getFullYear();
const MIN_BIRTH_YEAR = CURRENT_YEAR - 100;
const MAX_BIRTH_YEAR = CURRENT_YEAR - 18;
// Descending - most recently eligible birth year first, since that's closer
// to where most adult users will need to scroll from the default selection.
const BIRTH_YEARS = Array.from(
  { length: MAX_BIRTH_YEAR - MIN_BIRTH_YEAR + 1 },
  (_, i) => MAX_BIRTH_YEAR - i
);

export default function OnboardingScreen() {
  const { refresh: refreshProfile, updateLocalProfile } = useProfile();

  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const isLastIntroSlide = index === SLIDES.length - 1;

  const [phase, setPhase] = useState<Phase>('intro');

  const [authMode, setAuthMode] = useState<AuthMode>('sign-up');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authInfo, setAuthInfo] = useState<string | null>(null);

  const [fieldIndex, setFieldIndex] = useState(0);
  const [draftName, setDraftName] = useState('');
  const [selectedBirthYear, setSelectedBirthYear] = useState(CURRENT_YEAR - 30);
  const [draftAge, setDraftAge] = useState<number | null>(null);
  const [draftIncomeRange, setDraftIncomeRange] = useState<string | null>(null);
  const [draftEmploymentType, setDraftEmploymentType] = useState<string | null>(null);

  function handleScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH));
  }

  function goToSlide(nextIndex: number) {
    scrollRef.current?.scrollTo({ x: nextIndex * SCREEN_WIDTH, animated: true });
    setIndex(nextIndex);
  }

  async function skipToApp() {
    await markOnboardingSeen();
    router.replace('/(tabs)');
  }

  async function skipAccountCreation() {
    await saveLocalProfileDraft({
      name: draftName || null,
      age: draftAge,
      incomeRange: draftIncomeRange,
      employmentType: draftEmploymentType,
      desiredAmount: null,
    });
    // The ProfileProvider mounted before this draft existed, so it needs an
    // explicit re-read - otherwise "For You" keeps using its stale (empty)
    // guest profile until something else happens to trigger a refetch.
    await refreshProfile();
    await skipToApp();
  }

  async function handleAuthSubmit() {
    setAuthError(null);
    setAuthInfo(null);
    setAuthLoading(true);

    if (authMode === 'sign-in') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setAuthLoading(false);
        setAuthError(getFriendlyErrorMessage(error));
        return;
      }
      await completeOnboarding(data.session.user.id);
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setAuthLoading(false);
      setAuthError(getFriendlyErrorMessage(error));
      return;
    }
    // If email confirmation is required, Supabase returns a user but no session yet.
    if (data.session) {
      await completeOnboarding(data.session.user.id);
      return;
    }
    setAuthLoading(false);
    setAuthInfo('Account created. Check your email to confirm, then log in below to continue.');
    setAuthMode('sign-in');
  }

  async function completeOnboarding(userId: string) {
    const { error } = await supabase
      .from('users')
      .update({
        name: draftName || null,
        age: draftAge,
        income_range: draftIncomeRange,
        employment_type: draftEmploymentType,
      })
      .eq('id', userId);

    setAuthLoading(false);

    if (error) {
      setAuthError(getFriendlyErrorMessage(error));
      return;
    }

    updateLocalProfile({
      name: draftName || null,
      age: draftAge,
      incomeRange: draftIncomeRange,
      employmentType: draftEmploymentType,
    });

    await markOnboardingSeen();
    router.replace('/(tabs)');
  }

  function skipField() {
    const key = PROFILE_FIELDS[fieldIndex];
    if (key === 'name') setDraftName('');
    if (key === 'income') setDraftIncomeRange(null);
    if (key === 'employment') setDraftEmploymentType(null);
    advanceField();
  }

  function handleNextField() {
    if (PROFILE_FIELDS[fieldIndex] === 'age') {
      setDraftAge(CURRENT_YEAR - selectedBirthYear);
    }
    advanceField();
  }

  function advanceField() {
    if (fieldIndex < PROFILE_FIELDS.length - 1) {
      setFieldIndex((i) => i + 1);
    } else {
      setPhase('signup');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {phase === 'intro' && (
        <>
          <Pressable
            style={({ pressed }) => [styles.skipButton, pressed && styles.skipButtonPressed]}
            onPress={skipToApp}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>

          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScrollEnd}
          >
            {SLIDES.map((slide) => (
              <View key={slide.title} style={[styles.slide, { width: SCREEN_WIDTH }]}>
                <HeroGraphic icon={slide.icon} tint={slide.tint} />
                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.subtitle}>{slide.subtitle}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.dots}>
              {SLIDES.map((slide, i) => (
                <View key={slide.title} style={[styles.dot, i === index && styles.dotActive]} />
              ))}
            </View>

            <PrimaryButton
              label={isLastIntroSlide ? 'Get Started' : 'Next'}
              onPress={() => (isLastIntroSlide ? setPhase('profile') : goToSlide(index + 1))}
            />
          </View>
        </>
      )}

      {phase === 'profile' && (
        <View style={styles.formPhase}>
          <View style={styles.formContent}>
            <Text style={styles.formTitle}>{FIELD_TITLES[PROFILE_FIELDS[fieldIndex]]}</Text>

            {PROFILE_FIELDS[fieldIndex] === 'name' && (
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor={colors.textMuted}
                value={draftName}
                onChangeText={setDraftName}
              />
            )}

            {PROFILE_FIELDS[fieldIndex] === 'age' && (
              <>
                <View style={styles.pickerWrap}>
                  <Picker
                    selectedValue={selectedBirthYear}
                    onValueChange={(value) => setSelectedBirthYear(Number(value))}
                    itemStyle={styles.pickerItem}
                  >
                    {BIRTH_YEARS.map((year) => (
                      <Picker.Item key={year} label={String(year)} value={year} />
                    ))}
                  </Picker>
                </View>
                <Text style={styles.ageDerivedText}>
                  = {CURRENT_YEAR - selectedBirthYear} years old
                </Text>
              </>
            )}

            {PROFILE_FIELDS[fieldIndex] === 'income' && (
              <View style={styles.optionsWrap}>
                {INCOME_RANGES.map((range) => (
                  <OptionPill
                    key={range.label}
                    label={range.label}
                    active={draftIncomeRange === range.label}
                    onPress={() => setDraftIncomeRange(range.label)}
                  />
                ))}
              </View>
            )}

            {PROFILE_FIELDS[fieldIndex] === 'employment' && (
              <View style={styles.optionsWrap}>
                {EMPLOYMENT_TYPES.map((type) => (
                  <OptionPill
                    key={type}
                    label={type}
                    active={draftEmploymentType === type}
                    onPress={() => setDraftEmploymentType(type)}
                  />
                ))}
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <View style={styles.dots}>
              {PROFILE_STEP_LABELS.map((label, i) => (
                <View key={label} style={[styles.dot, i === fieldIndex && styles.dotActive]} />
              ))}
            </View>

            <PrimaryButton
              label={fieldIndex === PROFILE_FIELDS.length - 1 ? 'Continue' : 'Next'}
              onPress={handleNextField}
            />

            <Pressable
              onPress={skipField}
              style={({ pressed }) => pressed && styles.linkPressed}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Skip this question"
            >
              <Text style={styles.switchModeText}>Skip</Text>
            </Pressable>
          </View>
        </View>
      )}

      {phase === 'signup' && (
        <View style={styles.formPhase}>
          <Pressable
            style={({ pressed }) => [styles.skipButton, pressed && styles.skipButtonPressed]}
            onPress={skipAccountCreation}
            disabled={authLoading}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Skip account creation for now"
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>

          <View style={styles.formContent}>
            <Text style={styles.formTitle}>
              {authMode === 'sign-up' ? 'Create Your Account' : 'Log In'}
            </Text>
            <Text style={styles.formSubtitle}>
              {authMode === 'sign-up'
                ? "You'll need an account to apply for a loan, but you can explore first — what you entered is saved on this device either way."
                : 'Log in to continue where you left off.'}
            </Text>

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

            {authError && <Text style={styles.errorText}>{authError}</Text>}
            {authInfo && <Text style={styles.infoText}>{authInfo}</Text>}
          </View>

          <View style={styles.footer}>
            <View style={styles.dots}>
              {PROFILE_STEP_LABELS.map((label, i) => (
                <View key={label} style={[styles.dot, i === 4 && styles.dotActive]} />
              ))}
            </View>

            <PrimaryButton
              label={authMode === 'sign-up' ? 'Sign Up' : 'Log In'}
              onPress={handleAuthSubmit}
              loading={authLoading}
            />

            <Pressable
              onPress={() => {
                setAuthMode((m) => (m === 'sign-up' ? 'sign-in' : 'sign-up'));
                setAuthError(null);
                setAuthInfo(null);
              }}
              style={({ pressed }) => pressed && styles.linkPressed}
              accessibilityRole="button"
              accessibilityLabel={
                authMode === 'sign-up' ? 'Already have an account? Log in' : "Don't have an account? Sign up"
              }
            >
              <Text style={styles.switchModeText}>
                {authMode === 'sign-up' ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const PROFILE_STEP_LABELS = ['Name', 'Age', 'Income', 'Employment', 'Account'];

// Same visual system across all three slides (soft radial glow behind a
// centered icon badge) so they still read as one consistent whole, but each
// slide's icon and tint reflect its own theme rather than being identical.
function HeroGraphic({ icon, tint }: { icon: IoniconName; tint: string }) {
  return (
    <View style={styles.heroWrap}>
      <LinearGradient
        colors={[tint, colors.background]}
        style={styles.heroGlow}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <View style={styles.heroBadge}>
        <Ionicons name={icon} size={72} color={tint} />
      </View>
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

const HERO_SIZE = 240;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  skipButton: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.xl,
    zIndex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  skipButtonPressed: {
    opacity: 0.6,
  },
  skipText: {
    fontSize: fontSize.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  slide: {
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxxl + spacing.xl,
  },
  heroWrap: {
    width: HERO_SIZE,
    height: HERO_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxxl,
  },
  heroGlow: {
    position: 'absolute',
    width: HERO_SIZE,
    height: HERO_SIZE,
    borderRadius: HERO_SIZE / 2,
    opacity: 0.35,
  },
  heroBadge: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xl,
    paddingTop: spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 20,
  },
  linkPressed: {
    opacity: 0.6,
  },
  formPhase: {
    flex: 1,
    justifyContent: 'space-between',
  },
  formContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  formTitle: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h1,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  formSubtitle: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.xl,
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
  pickerWrap: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  pickerItem: {
    color: colors.textPrimary,
    fontSize: fontSize.body,
  },
  ageDerivedText: {
    fontSize: fontSize.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
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
});
