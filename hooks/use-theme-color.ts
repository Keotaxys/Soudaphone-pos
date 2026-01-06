import { useColorScheme } from 'react-native';

// 🟢 1. ກຳນົດຄ່າສີຢູ່ບ່ອນນີ້ເລີຍ (ແກ້ບັນຫາຫາໄຟລ໌ບໍ່ເຫັນ)
const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: '#0a7ea4',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#0a7ea4',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#fff',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#fff',
  },
};

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  // 🟢 2. ບັງຄັບຄ່າໃຫ້ເປັນ 'light' ຫຼື 'dark' ເທົ່ານັ້ນ
  const systemTheme = useColorScheme();
  const theme = systemTheme === 'dark' ? 'dark' : 'light';

  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}