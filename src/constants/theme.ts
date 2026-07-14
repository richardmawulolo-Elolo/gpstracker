import '@/global.css';
import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1E293B',              // Slate 800 (Dark Charcoal)
    background: '#F8FAFC',        // Slate 50 (Off-white Neutral Light)
    backgroundElement: '#E2E8F0', // Slate 200 (Subtle Gray Border/Divider)
    backgroundSelected: '#DBEAFE', // Blue 100 (Soft Blue Highlight)
    textSecondary: '#64748B',      // Slate 500 (Muted Secondary Text)
    primary: '#1E40AF',            // Blue 800 (Deep Cobalt Primary Blue)
    primaryLight: '#3B82F6',       // Blue 500 (Electric Highlight Blue)
    cardBackground: '#FFFFFF',     // Pure White (Cards and Containers)
    border: '#E2E8F0',             // Slate 200 (Card Borders)
    danger: '#EF4444',             // Red 500 (Critical Alert)
    warning: '#F59E0B',            // Amber 500 (Warning Alert)
    success: '#10B981',            // Emerald 500 (Success State)
  },
  dark: {
    text: '#F8FAFC',               // Slate 50 (Light Text)
    background: '#0F172A',         // Slate 900 (Deep Midnight Blue)
    backgroundElement: '#1E293B',  // Slate 800 (Card/Element Background)
    backgroundSelected: '#1E3A8A', // Blue 900 (Deep Blue Highlight)
    textSecondary: '#94A3B8',      // Slate 400 (Muted Dark Text)
    primary: '#3B82F6',            // Blue 500 (Electric Blue Primary)
    primaryLight: '#60A5FA',       // Blue 400 (Soft Light Blue Accent)
    cardBackground: '#1E293B',     // Slate 800 (Card Base)
    border: '#334155',             // Slate 700 (Card Border)
    danger: '#F87171',             // Red 400 (Alert Red)
    warning: '#FBBF24',            // Amber 400 (Alert Yellow)
    success: '#34D399',            // Emerald 400 (Safe Green)
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'Georgia',
    rounded: 'System',
    mono: 'Courier New',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'system-ui, -apple-system, sans-serif',
    serif: 'serif',
    rounded: 'system-ui, sans-serif',
    mono: 'monospace',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
export const BorderColors = {
  light: '#E2E8F0',
  dark: '#334155'
} as const;
