// App colors for light and dark mode. One accent (tint) only.

export const Colors = {
  light: {
    text: '#191B20',
    textBody: '#333840',
    textSecondary: '#6B7079',
    background: '#FFFFFF',
    backgroundGrouped: '#F2F3F6',
    card: '#FFFFFF',
    backgroundElement: '#F2F3F6',
    backgroundSelected: '#E6E8EC',
    tint: '#5546FF',
    tintSoft: '#EFEDFF',
    tintInk: '#2A1FB0',
    danger: '#D92D20',
  },
  dark: {
    text: '#F2F3F6',
    textBody: '#C9CCD3',
    textSecondary: '#9AA0AB',
    background: '#0E1014',
    backgroundGrouped: '#0E1014',
    card: '#1E2129',
    backgroundElement: '#22262E',
    backgroundSelected: '#2C3038',
    tint: '#6E62FF',
    tintSoft: '#262A45',
    tintInk: '#C9C4FF',
    danger: '#FF6B5E',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;
