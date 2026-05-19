import { Platform } from 'react-native';

const tintColorLight = '#2E7D32'; // Verde forte
const tintColorDark = '#81C784';

export const Colors = {
  light: {
    text: '#1F2937',
    background: '#F3F4F6', // Cinza muito claro, ótimo para Neomorfismo/Clean
    card: '#FFFFFF',
    tint: tintColorLight,
    icon: '#6B7280',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: tintColorLight,
    border: '#E5E7EB',
  },
  dark: {
    text: '#F9FAFB',
    background: '#111827',
    card: '#1F2937',
    tint: tintColorDark,
    icon: '#9CA3AF',
    tabIconDefault: '#4B5563',
    tabIconSelected: tintColorDark,
    border: '#374151',
  },
  severity: {
    critica: '#EF4444', // Red-500
    alta: '#F97316',    // Orange-500
    media: '#F59E0B',   // Amber-500
    normal: '#10B981',  // Emerald-500
    sem_dados: '#6B7280' // Gray-500
  }
};

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
    sans: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
