import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

// Modern futuristic font configuration
// Using system fonts optimized for futuristic feel
const fontConfig = {
  fontFamily: 'System',
};

// ============================================================================
// FUTURISTIC AI-POWERED COLOR PALETTE
// ============================================================================

// Primary: Cyber Blue - represents AI, technology, trust
// Secondary: Neon Green - represents success, transactions, growth
// Tertiary: Electric Purple - represents AI magic, premium features
// Accent colors for futuristic glow effects

const futuristicColors = {
  // Core AI colors
  primary: '#0EA5E9', // Cyber Blue - brighter, more electric
  primaryContainer: '#0C4A6E',
  secondary: '#10B981', // Neon Green for success states
  secondaryContainer: '#064E3B',
  tertiary: '#A855F7', // Electric Purple for AI features
  tertiaryContainer: '#581C87',

  // Status colors
  error: '#EF4444',
  errorContainer: '#7F1D1D',
  warning: '#F59E0B',
  warningContainer: '#78350F',
  success: '#22C55E',
  successContainer: '#14532D',

  // Accent/Glow colors for special effects
  glow: {
    cyan: '#22D3EE',
    purple: '#C084FC',
    blue: '#60A5FA',
    green: '#34D399',
  },
};

// ============================================================================
// LIGHT THEME - Clean futuristic with subtle gradients
// ============================================================================

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#0EA5E9', // Cyber Blue
    primaryContainer: '#E0F2FE',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#082F49',

    secondary: '#10B981', // Neon Green
    secondaryContainer: '#D1FAE5',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#064E3B',

    tertiary: '#A855F7', // Electric Purple
    tertiaryContainer: '#F3E8FF',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#581C87',

    error: '#EF4444',
    errorContainer: '#FEE2E2',
    onError: '#FFFFFF',
    onErrorContainer: '#7F1D1D',

    // Surface colors - clean whites with subtle depth
    background: '#F8FAFC', // Slightly cool white
    surface: '#FFFFFF',
    surfaceVariant: '#F1F5F9', // Cool gray

    // On colors - optimized contrast
    onBackground: '#0F172A',
    onSurface: '#0F172A',
    onSurfaceVariant: '#64748B',

    // Outline colors
    outline: '#CBD5E1',
    outlineVariant: '#E2E8F0',

    // Inverse colors
    inverseSurface: '#1E293B',
    inverseOnSurface: '#F1F5F9',
    inversePrimary: '#38BDF8',

    // Elevation/Shadow
    shadow: '#000000',
    scrim: '#000000',

    // Additional required MD3 colors
    surfaceDisabled: 'rgba(15, 23, 42, 0.12)',
    onSurfaceDisabled: 'rgba(15, 23, 42, 0.38)',
    backdrop: 'rgba(15, 23, 42, 0.4)',
    elevation: {
      level0: 'transparent',
      level1: '#F8FAFC',
      level2: '#F1F5F9',
      level3: '#E2E8F0',
      level4: '#CBD5E1',
      level5: '#94A3B8',
    },
  },
  fonts: configureFonts({ config: fontConfig }),
};

// ============================================================================
// DARK THEME - Deep space with neon accents
// ============================================================================

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#38BDF8', // Bright Cyber Blue
    primaryContainer: '#0C4A6E',
    onPrimary: '#082F49',
    onPrimaryContainer: '#BAE6FD',

    secondary: '#34D399', // Bright Neon Green
    secondaryContainer: '#064E3B',
    onSecondary: '#064E3B',
    onSecondaryContainer: '#A7F3D0',

    tertiary: '#C084FC', // Bright Electric Purple
    tertiaryContainer: '#581C87',
    onTertiary: '#3B0764',
    onTertiaryContainer: '#E9D5FF',

    error: '#F87171',
    errorContainer: '#7F1D1D',
    onError: '#7F1D1D',
    onErrorContainer: '#FECACA',

    // Surface colors - deep space blacks with blue undertone
    background: '#0A0F1A', // Deep space blue-black
    surface: '#111827', // Slightly lighter
    surfaceVariant: '#1E293B', // Card backgrounds

    // On colors - bright for contrast
    onBackground: '#F1F5F9',
    onSurface: '#F1F5F9',
    onSurfaceVariant: '#94A3B8',

    // Outline colors with subtle glow potential
    outline: '#334155',
    outlineVariant: '#1E293B',

    // Inverse colors
    inverseSurface: '#E2E8F0',
    inverseOnSurface: '#1E293B',
    inversePrimary: '#0284C7',

    // Elevation/Shadow
    shadow: '#000000',
    scrim: '#000000',

    // Additional required MD3 colors
    surfaceDisabled: 'rgba(241, 245, 249, 0.12)',
    onSurfaceDisabled: 'rgba(241, 245, 249, 0.38)',
    backdrop: 'rgba(0, 0, 0, 0.6)',
    elevation: {
      level0: 'transparent',
      level1: '#111827',
      level2: '#1E293B',
      level3: '#334155',
      level4: '#475569',
      level5: '#64748B',
    },
  },
  fonts: configureFonts({ config: fontConfig }),
};

// ============================================================================
// CURRENCY FORMATTING
// ============================================================================

// Zambian Kwacha formatting
export const CURRENCY = {
  code: 'ZMW',
  symbol: 'K',
  locale: 'en-ZM',
};

export function formatPrice(amount: number): string {
  return `K${amount.toLocaleString('en-ZM', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ============================================================================
// DESIGN TOKENS
// ============================================================================

export const designTokens = {
  // Border radius scale
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    full: 9999,
  },

  // Spacing scale
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 48,
  },

  // Animation durations
  animation: {
    fast: 150,
    normal: 300,
    slow: 500,
    slower: 800,
  },

  // Glow effects for futuristic look
  glow: {
    sm: {
      shadowColor: '#0EA5E9',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    md: {
      shadowColor: '#0EA5E9',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 8,
    },
    lg: {
      shadowColor: '#0EA5E9',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 16,
    },
  },

  // Gradient presets
  gradients: {
    primary: ['#0EA5E9', '#06B6D4'] as [string, string],
    secondary: ['#10B981', '#34D399'] as [string, string],
    tertiary: ['#A855F7', '#C084FC'] as [string, string],
    ai: ['#0EA5E9', '#A855F7'] as [string, string],
    dark: ['#0A0F1A', '#1E293B'] as [string, string],
    glass: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'] as [string, string],
  },
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type AppTheme = MD3Theme;
export { futuristicColors };
