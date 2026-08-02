// Single source of visual truth for the app: a clean, black-plus-one-accent
// fintech look (Revolut/Wise-inspired). Screens should pull from here rather
// than hardcoding colors/sizes, so a future palette change is a one-file edit.

export const colors = {
  background: '#FFFFFF',
  surface: '#F7F8FA',
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',

  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  onDark: '#FFFFFF',

  primary: '#111827', // buttons, active states - near-black
  accent: '#2563EB', // links, highlights
  accentSoft: '#EFF6FF',

  success: '#16A34A',
  successSoft: '#F0FDF4',
  successBorder: '#BBF7D0',

  danger: '#DC2626',
  dangerSoft: '#FEF2F2',

  warning: '#D97706',
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
  md: 10,
  lg: 12,
  xl: 16,
  pill: 999,
} as const;

export const fontSize = {
  micro: 11,
  caption: 12,
  bodySmall: 13,
  body: 15,
  h2: 18,
  h1: 24,
  display: 28,
} as const;
