import { AppColors, Colors, PALETA_PADRAO } from '@/constants/theme';

export function useThemeColor(
  props: { light?: string },
  colorName: keyof AppColors
) {
  const colorFromProps = props.light;

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[PALETA_PADRAO][colorName];
  }
}
