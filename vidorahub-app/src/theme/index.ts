export const colors = {
  primary: '#7c3aed',
  primaryEnd: '#a855f7',
  royalPurple: '#6d28d9',
  white: '#ffffff',
  bg: '#ffffff',
  bgSubtle: '#f6f4fb',
  bgMuted: '#f9f7ff',
  border: 'rgba(124, 58, 237, 0.12)',
  textPrimary: '#1a1a2e',
  textMuted: '#6b7280',
  textFaint: '#9ca3af',
  black: '#000000',
  error: '#ef4444',
  success: '#22c55e',
  overlay: 'rgba(0, 0, 0, 0.6)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
  card: 28,
} as const;

export const shadows = {
  sm: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 32,
    elevation: 8,
  },
} as const;

export const typography = {
  fontFamily: {
    regular: 'BeVietnamPro_400Regular',
    medium: 'BeVietnamPro_500Medium',
    semiBold: 'BeVietnamPro_600SemiBold',
    bold: 'BeVietnamPro_700Bold',
  },
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    hero: 32,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
} as const;

export const theme = {
  colors,
  spacing,
  radius,
  shadows,
  typography,
  breakpoints,
} as const;

export type Theme = typeof theme;
