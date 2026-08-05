import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { markOnboardingSeen } from '@/lib/onboarding-storage';
import { colors, fontFamily, fontSize, radii, spacing } from '@/lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    title: 'Compare Every Rate, Instantly',
    subtitle: 'Browse real Singapore bank loan offers side by side — personal and business.',
  },
  {
    title: 'See Your True Cost',
    subtitle: 'Built-in EIR and repayment calculators mean no surprises before you apply.',
  },
  {
    title: 'Matched To You',
    subtitle: "Set up your profile once and see only the loans you're actually eligible for.",
  },
];

export default function OnboardingScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const isLastSlide = index === SLIDES.length - 1;

  function handleScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH));
  }

  function goToSlide(nextIndex: number) {
    scrollRef.current?.scrollTo({ x: nextIndex * SCREEN_WIDTH, animated: true });
    setIndex(nextIndex);
  }

  async function finishOnboarding() {
    await markOnboardingSeen();
    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Pressable
        style={({ pressed }) => [styles.skipButton, pressed && styles.skipButtonPressed]}
        onPress={finishOnboarding}
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
            <HeroGraphic />
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
          label={isLastSlide ? 'Get Started' : 'Next'}
          onPress={() => (isLastSlide ? finishOnboarding() : goToSlide(index + 1))}
        />
      </View>
    </SafeAreaView>
  );
}

// A single reusable abstract graphic (soft radial glow + a few floating
// tinted shapes) rather than a bespoke illustration per slide - keeps the
// three slides feeling like one consistent, deliberate visual system.
function HeroGraphic() {
  return (
    <View style={styles.heroWrap}>
      <LinearGradient
        colors={[colors.primary, colors.background]}
        style={styles.heroGlow}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <View style={[styles.heroShape, styles.heroShapePurple]} />
      <View style={[styles.heroShape, styles.heroShapeCyan]} />
      <View style={[styles.heroShape, styles.heroShapeWhite]} />
    </View>
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
  heroShape: {
    position: 'absolute',
    borderRadius: radii.xl,
  },
  heroShapePurple: {
    width: 96,
    height: 96,
    backgroundColor: colors.primary,
    top: 24,
    left: 20,
  },
  heroShapeCyan: {
    width: 64,
    height: 64,
    backgroundColor: colors.cyan,
    bottom: 30,
    right: 24,
    borderRadius: 32,
  },
  heroShapeWhite: {
    width: 44,
    height: 44,
    backgroundColor: colors.textPrimary,
    bottom: 10,
    left: 50,
    borderRadius: 22,
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
});
