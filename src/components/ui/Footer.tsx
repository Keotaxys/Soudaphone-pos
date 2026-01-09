import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../types';

interface FooterProps {
  currentTab: string;
  onTabChange: (tab: 'home' | 'pos' | 'expense' | 'report') => void;
}

export default function Footer({ currentTab, onTabChange }: FooterProps) {
  
  // ຟັງຊັນຊ່ວຍເລືອກສີ Icon (Active = ຂາວ, Inactive = ຂາວຈາງໆ)
  const getIconColor = (tabName: string) => {
      return currentTab === tabName ? 'white' : 'rgba(255, 255, 255, 0.6)';
  };

  return (
    <View style={styles.footer}>
        <TouchableOpacity style={styles.navBtn} onPress={() => onTabChange('home')}>
            <Ionicons name="home" size={24} color={getIconColor('home')} />
            <Text style={[styles.navText, currentTab === 'home' && styles.navTextActive]}>ໜ້າຫຼັກ</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navBtn} onPress={() => onTabChange('pos')}>
            {/* ປຸ່ມຂາຍທາງກາງ: ພື້ນຫຼັງສີຂາວ, Icon ສີຂຽວ ເພື່ອໃຫ້ເດັ່ນ */}
            <View style={[styles.navIconCircle, currentTab === 'pos' && styles.activeCircle]}>
               <Ionicons name="cart" size={28} color={COLORS.primary} />
            </View>
            <Text style={[styles.navText, currentTab === 'pos' && styles.navTextActive]}>ຂາຍສິນຄ້າ</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navBtn} onPress={() => onTabChange('expense')}>
            <Ionicons name="wallet" size={24} color={getIconColor('expense')} />
            <Text style={[styles.navText, currentTab === 'expense' && styles.navTextActive]}>ລາຍຈ່າຍ</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navBtn} onPress={() => onTabChange('report')}>
            <Ionicons name="bar-chart" size={24} color={getIconColor('report')} />
            <Text style={[styles.navText, currentTab === 'report' && styles.navTextActive]}>ລາຍງານ</Text>
        </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { 
      flexDirection: 'row', 
      backgroundColor: COLORS.primary, // 🟢 ປ່ຽນພື້ນຫຼັງເປັນສີຂຽວ Theme
      height: 75, // ເພີ່ມຄວາມສູງໜ້ອຍໜຶ່ງໃຫ້ເບິ່ງໂປ່ງ
      alignItems: 'center', 
      justifyContent: 'space-around', 
      paddingBottom: 10, 
      // ເພີ່ມຄວາມໂຄ້ງມົນດ້ານເທິງ ໃຫ້ເບິ່ງ Soft ຂຶ້ນ
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      elevation: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.1,
      shadowRadius: 3
  },
  navBtn: { 
      alignItems: 'center', 
      justifyContent: 'center', 
      flex: 1 
  },
  navText: { 
      color: 'rgba(255, 255, 255, 0.6)', // ສີຕົວໜັງສືທົ່ວໄປ (ຂາວຈາງ)
      fontSize: 10, 
      marginTop: 4, 
      fontFamily: 'Lao-Regular' 
  },
  navTextActive: { 
      color: 'white', // ສີຕົວໜັງສືຕອນເລືອກ (ຂາວແຈ້ງ)
      fontFamily: 'Lao-Bold' 
  },
  navIconCircle: { 
      width: 54, 
      height: 54, 
      borderRadius: 27, 
      backgroundColor: 'white', // ວົງມົນສີຂາວ
      justifyContent: 'center', 
      alignItems: 'center', 
      marginTop: -25, // ຍົກຂຶ້ນໃຫ້ລອຍ
      elevation: 5, 
      shadowColor: '#000', 
      shadowOpacity: 0.2, 
      shadowRadius: 3 
  },
  activeCircle: {
      borderWidth: 3,
      borderColor: '#E0F2F1' // ເພີ່ມຂອບສີຂຽວອ່ອນໆ ເມື່ອຖືກເລືອກ
  }
});