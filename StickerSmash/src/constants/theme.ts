import { Platform } from 'react-native';
import { Palette, Colors as ThemeColors } from '../theme/colors';

export * from '../theme';

export const Colors = {
  ...ThemeColors,
  light: {
    text: Palette.textLight,
    background: Palette.bgDark,
    backgroundElement: Palette.cardBg,
    backgroundSelected: Palette.primaryLight,
    textSecondary: Palette.textMuted,
  },
  dark: {
    text: Palette.textLight,
    background: Palette.bgDark,
    backgroundElement: Palette.cardBg,
    backgroundSelected: Palette.primaryLight,
    textSecondary: Palette.textMuted,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
