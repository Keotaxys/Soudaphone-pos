import { useColorScheme } from 'react-native';

// 🟢 Import COLORS ຈາກ Global ມາໃຊ້ (ເພື່ອໃຫ້ສີຄືກັນທົ່ວແອັບ)
// ຕ້ອງແນ່ໃຈວ່າ path ນີ້ຖືກຕ້ອງ (ຖ້າຢູ່ໃນ hooks ຕ້ອງຖອຍອອກ 1 ຂັ້ນ)

// ຫຼື ຖ້າຂີ້ຄ້ານ import ກໍກຳນົດສີຕາຍໂຕຢູ່ນີ້ເລີຍ:
const PRIMARY_COLOR = '#008B94'; // ສີ Teal ຂອງທ່ານ

const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: PRIMARY_COLOR, // ✅ ປ່ຽນຈາກ #0a7ea4 ເປັນສີ Teal
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: PRIMARY_COLOR, // ✅ ປ່ຽນເປັນສີ Teal
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
  const systemTheme = useColorScheme();
  const theme = systemTheme === 'dark' ? 'dark' : 'light';

  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}