import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// 🟢 1. Import Hook ນີ້ມາໃຊ້
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../types';

interface FooterProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  status?: string;
  version?: string;
}

export default function Footer({ currentTab, onTabChange }: FooterProps) {
  // 🟢 2. ດຶງຄ່າ safe area (ຂອບຈໍ)
  const insets = useSafeAreaInsets();
  
  const active = currentTab.toLowerCase();

  const getIconColor = (tabName: string) => {
      return active === tabName ? 'white' : 'rgba(255, 255, 255, 0.6)';
  };

  return (
    // 🟢 3. ປັບ Style ແບບ Dynamic ຕາມຂອບຈໍຂອງແຕ່ລະເຄື່ອງ
    <View style={[
      styles.footer, 
      { 
        // ຖ້າ Android ໃຫ້ດັນຂຶ້ນຢ່າງໜ້ອຍ 15px, ຖ້າ iOS ໃຫ້ໃຊ້ຕາມ safe area
        paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, 15) : Math.max(insets.bottom, 20),
        // ປັບຄວາມສູງໃຫ້ຍືດຕາມ Padding
        height: 60 + (Platform.OS === 'android' ? Math.max(insets.bottom, 15) : Math.max(insets.bottom, 20))
      }
    ]}>
        {/* 1. ປຸ່ມໜ້າຫຼັກ */}
        <TouchableOpacity style={styles.navBtn} onPress={() => onTabChange('home')}>
            <Ionicons name="home" size={24} color={getIconColor('home')} />
            <Text style={[styles.navText, active === 'home' && styles.navTextActive]}>ໜ້າຫຼັກ</Text>
        </TouchableOpacity>
        
        {/* 2. ປຸ່ມຂາຍ (POS) - ແບບລອຍເດັ່ນ */}
        <TouchableOpacity style={styles.navBtn} onPress={() => onTabChange('pos')}>
            <View style={[styles.navIconCircle, active === 'pos' && styles.activeCircle]}>
               <Ionicons name="cart" size={28} color={COLORS?.primary || '#008B94'} />
            </View>
            <Text style={[styles.navText, active === 'pos' && styles.navTextActive]}>ຂາຍສິນຄ້າ</Text>
        </TouchableOpacity>

        {/* 3. ປຸ່ມລາຍຈ່າຍ (expenses) */}
        <TouchableOpacity style={styles.navBtn} onPress={() => onTabChange('expenses')}>
            <Ionicons name="wallet" size={24} color={getIconColor('expenses')} />
            <Text style={[styles.navText, active === 'expenses' && styles.navTextActive]}>ລາຍຈ່າຍ</Text>
        </TouchableOpacity>

        {/* 4. ປຸ່ມລາຍງານ (reports) */}
        <TouchableOpacity style={styles.navBtn} onPress={() => onTabChange('reports')}>
            <Ionicons name="bar-chart" size={24} color={getIconColor('reports')} />
            <Text style={[styles.navText, active === 'reports' && styles.navTextActive]}>ລາຍງານ</Text>
        </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { 
      flexDirection: 'row', 
      backgroundColor: COLORS?.primary || '#008B94', 
      // height: 75,  <-- 🔴 ລຶບອອກ (ເພາະເຮົາກຳນົດແບບ dynamic ທາງເທິງແລ້ວ)
      alignItems: 'center', 
      justifyContent: 'space-around', 
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      elevation: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      position: 'absolute', 
      bottom: 0,
      left: 0,
      right: 0,
  },
  navBtn: { 
      alignItems: 'center', 
      justifyContent: 'center', 
      flex: 1,
      marginTop: -10 // 🟢 ປັບຂຶ້ນໜ້ອຍໜຶ່ງເພື່ອຄວາມສວຍງາມ
  },
  navText: { 
      color: 'rgba(255, 255, 255, 0.6)', 
      fontSize: 10, 
      marginTop: 4, 
      fontFamily: 'Lao-Regular' 
  },
  navTextActive: { 
      color: 'white', 
      fontFamily: 'Lao-Bold' 
  },
  navIconCircle: { 
      width: 54, 
      height: 54, 
      borderRadius: 27, 
      backgroundColor: 'white', 
      justifyContent: 'center', 
      alignItems: 'center', 
      marginTop: -25, 
      elevation: 5, 
      shadowColor: '#000', 
      shadowOpacity: 0.2, 
      shadowRadius: 3 
  },
  activeCircle: {
      borderWidth: 3,
      borderColor: '#E0F2F1' 
  }
});