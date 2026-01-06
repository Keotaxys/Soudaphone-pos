/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useColorScheme } from 'react-native';

// 🟢 ແກ້ໄຂ Path: ປ່ຽນຈາກ @/constants/Colors ເປັນ ../constants/Colors
import { Colors } from '../constants/Colors';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  // 🟢 ແກ້ໄຂ Logic: ບັງຄັບໃຫ້ມີຄ່າສະເໝີ (ຖ້າ null ໃຫ້ເປັນ light)
  const theme = useColorScheme() ?? 'light';

  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}