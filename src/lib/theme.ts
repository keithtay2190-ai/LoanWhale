// Single source of visual truth for the app: a dark fintech look
// (near-black backgrounds, purple primary accent, cyan as a secondary
// highlight) inspired by modern budgeting-app UI. Screens should pull from
// here rather than hardcoding colors/sizes, so a future palette change is a
// one-file edit.

export const colors = {
  background: '#0E0E14',
  surface: '#1C1C26',
  surfaceAlt: '#242430',
  border: '#2E2E3A',
  borderStrong: '#3A3A48',

  textPrimary: '#FFFFFF',
  textSecondary: '#9B9BAA',
  textMuted: '#84848F', // was #6E6E7C - only ~3.8:1 against background, below WCAG AA 4.5:1
  onDark: '#FFFFFF', // text on the primary/accent-filled buttons
  onLight: '#0E0E14', // text on light-filled surfaces (e.g. white tiles)

  primary: '#7C6FF0', // purple - buttons, active states
  accent: '#B4A9FF', // brighter purple - link/badge text (better contrast than primary at small sizes)
  accentSoft: '#241F3D', // dark purple-tinted surface, e.g. badges

  cyan: '#7DE0EA', // secondary highlight color, used sparingly (tags)
  cyanSoft: '#132B2E',

  success: '#22C55E',
  successSoft: '#12271C',
  successBorder: '#1F4430',

  danger: '#F87171',
  dangerSoft: '#2A1616',

  warning: '#FBBF24',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

// Plus Jakarta Sans: a free, open-license (SIL OFL) geometric sans with a
// similarly warm/rounded character to Kind Sans (a commercial font we didn't
// have a license for), loaded via @expo-google-fonts in src/app/_layout.tsx.
export const fontFamily = {
  heading: 'PlusJakartaSans_700Bold',
} as const;

export const fontSize = {
  micro: 11,
  caption: 12,
  bodySmall: 13,
  body: 15,
  h2: 18,
  h1: 24,
  display: 30,
  hero: 40,
} as const;
