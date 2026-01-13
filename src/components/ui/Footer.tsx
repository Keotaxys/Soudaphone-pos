import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { COLORS } from '../../types';

interface FooterProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  // ຮັບ props ເພີ່ມເຕີມເພື່ອບໍ່ໃຫ້ index.tsx ຟ້ອງ Error (Optional)
  status?: string;
  version?: string;
}

export default function Footer({ currentTab, onTabChange }: FooterProps) {
  
  // ປ່ຽນເປັນ toLowerCase ເພື່ອປ້ອງກັນບັນຫາ home vs Home
  const active = currentTab.toLowerCase();

  const getIconColor = (tabName: string) => {
      return active === tabName ? 'white' : 'rgba(255, 255, 255, 0.6)';
  };

  return (
    <View style={styles.footer}>
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
      height: 75, 
      alignItems: 'center', 
      justifyContent: 'space-around', 
      paddingBottom: Platform.OS === 'ios' ? 20 : 10, // ປັບໃຫ້ພໍດີກັບ iPhone X+
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      elevation: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      position: 'absolute', // 🟢 Fix ໃຫ້ມັນຢູ່ລຸ່ມສຸດສະເໝີ
      bottom: 0,
      left: 0,
      right: 0,
  },
  navBtn: { 
      alignItems: 'center', 
      justifyContent: 'center', 
      flex: 1 
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
      marginTop: -25, // ເທັກນິກເຮັດໃຫ້ປຸ່ມລອຍ
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