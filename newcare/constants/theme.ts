import { Platform } from 'react-native';

export type PaletaAcessibilidadeId =
  | 'auroraHealth'
  | 'oceanFocus'
  | 'solarVision'
  | 'roseContrast'
  | 'midnightAccessibility'
  | 'calmMinimal';

export type AppColors = {
  text: string;
  background: string;
  surface: string;
  card: string;
  muted: string;
  border: string;
  primary: string;
  tint: string;
  primarySoft: string;
  secondary: string;
  secondarySoft: string;
  accent: string;
  accentSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  highlight: string;
  icon: string;
  tabIconDefault: string;
  tabIconSelected: string;
};

type PaletaBase = {
  background: string;
  surface: string;
  card: string;
  text: string;
  muted: string;
  border: string;
  primary: string;
  primarySoft: string;
  secondary: string;
  secondarySoft: string;
  accent: string;
  accentSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
};

function montarPaleta(paleta: PaletaBase): AppColors {
  return {
    ...paleta,
    tint: paleta.primary,
    highlight: paleta.accent,
    icon: paleta.text,
    tabIconDefault: paleta.muted,
    tabIconSelected: paleta.primary,
  };
}

export const Colors = {
  auroraHealth: montarPaleta({
    background: '#121212',
    surface: '#1E1E1E',
    card: '#1E1E1E',
    text: '#FFFFFF',
    muted: '#B3B3B3',
    border: '#333333',
    primary: '#8B5CF6',
    primarySoft: '#2E2152',
    secondary: '#22C55E',
    secondarySoft: '#123B24',
    accent: '#06B6D4',
    accentSoft: '#073D47',
    success: '#4ADE80',
    successSoft: '#173B25',
    warning: '#FACC15',
    warningSoft: '#493D0B',
    danger: '#F87171',
  }),
  oceanFocus: montarPaleta({
    background: '#0F172A',
    surface: '#1E293B',
    card: '#1E293B',
    text: '#FFFFFF',
    muted: '#CBD5E1',
    border: '#334155',
    primary: '#38BDF8',
    primarySoft: '#123B52',
    secondary: '#EAB308',
    secondarySoft: '#443507',
    accent: '#14B8A6',
    accentSoft: '#0C3D39',
    success: '#2DD4BF',
    successSoft: '#0F453F',
    warning: '#FACC15',
    warningSoft: '#4A3D08',
    danger: '#FB923C',
  }),
  solarVision: montarPaleta({
    background: '#111827',
    surface: '#1F2937',
    card: '#1F2937',
    text: '#FFFFFF',
    muted: '#D1D5DB',
    border: '#374151',
    primary: '#F59E0B',
    primarySoft: '#4A3008',
    secondary: '#3B82F6',
    secondarySoft: '#142C56',
    accent: '#A855F7',
    accentSoft: '#351950',
    success: '#60A5FA',
    successSoft: '#173654',
    warning: '#FBBF24',
    warningSoft: '#4A380A',
    danger: '#EF4444',
  }),
  roseContrast: montarPaleta({
    background: '#18181B',
    surface: '#27272A',
    card: '#27272A',
    text: '#FFFFFF',
    muted: '#D4D4D8',
    border: '#3F3F46',
    primary: '#EC4899',
    primarySoft: '#4A1834',
    secondary: '#F97316',
    secondarySoft: '#4A2509',
    accent: '#EF4444',
    accentSoft: '#4A1515',
    success: '#FB7185',
    successSoft: '#4B1F27',
    warning: '#FDBA74',
    warningSoft: '#4A321C',
    danger: '#DC2626',
  }),
  midnightAccessibility: montarPaleta({
    background: '#000000',
    surface: '#121212',
    card: '#121212',
    text: '#FFFFFF',
    muted: '#E5E5E5',
    border: '#3A3A3A',
    primary: '#FFFFFF',
    primarySoft: '#2A2A2A',
    secondary: '#FFD700',
    secondarySoft: '#4A3F00',
    accent: '#00FFFF',
    accentSoft: '#003F3F',
    success: '#00FF7F',
    successSoft: '#003D1F',
    warning: '#FFFF00',
    warningSoft: '#4A4A00',
    danger: '#FF4C4C',
  }),
  calmMinimal: montarPaleta({
    background: '#1A1A1A',
    surface: '#2A2A2A',
    card: '#2A2A2A',
    text: '#FFFFFF',
    muted: '#CCCCCC',
    border: '#3A3A3A',
    primary: '#E5E5E5',
    primarySoft: '#3A3A3A',
    secondary: '#B3B3B3',
    secondarySoft: '#363636',
    accent: '#FFFFFF',
    accentSoft: '#444444',
    success: '#A3A3A3',
    successSoft: '#333333',
    warning: '#D4D4D4',
    warningSoft: '#3E3E3E',
    danger: '#737373',
  }),
};

export const PALETA_PADRAO: PaletaAcessibilidadeId = 'auroraHealth';

export const paletasAcessibilidade = [
  {
    id: 'auroraHealth',
    nome: 'Aurora Health',
    resumo: 'Tema padrão',
    finalidade: 'Visual tecnológico e confortável para saúde e gamificação.',
  },
  {
    id: 'oceanFocus',
    nome: 'Ocean Focus',
    resumo: 'Protanopia',
    finalidade: 'Evita conflitos entre vermelho e verde.',
  },
  {
    id: 'solarVision',
    nome: 'Solar Vision',
    resumo: 'Deuteranopia',
    finalidade: 'Diferencia estados sem depender de tons verdes.',
  },
  {
    id: 'roseContrast',
    nome: 'Rose Contrast',
    resumo: 'Tritanopia',
    finalidade: 'Evita combinações críticas entre azul e amarelo.',
  },
  {
    id: 'midnightAccessibility',
    nome: 'Midnight Accessibility',
    resumo: 'Alto contraste',
    finalidade: 'Leitura reforçada para baixa visão e ambientes iluminados.',
  },
  {
    id: 'calmMinimal',
    nome: 'Calm Minimal',
    resumo: 'Redução de estímulos',
    finalidade: 'Interface minimalista para foco e concentração.',
  },
] as const satisfies ReadonlyArray<{
  id: PaletaAcessibilidadeId;
  nome: string;
  resumo: string;
  finalidade: string;
}>;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
