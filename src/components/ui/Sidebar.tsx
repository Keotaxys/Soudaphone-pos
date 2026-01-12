import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { COLORS } from '../../types';
import BillSettingsModal from '../modals/BillSettingsModal';

const { width, height } = Dimensions.get('window');

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
  slideAnim: Animated.Value;
  currentTab: string;
  onNavigate: (tab: string) => void;
}

const MENU_ITEMS = [
  { id: 'home', label: 'ໜ້າຫຼັກ', icon: 'home-outline' },
  { id: 'pos', label: 'ຂາຍສິນຄ້າ', icon: 'cart-outline' },
  // 🟢 ກູ້ຄືນ "ປະຫວັດການຂາຍ" (ໃຊ້ id: history ເພື່ອບໍ່ໃຫ້ຊ້ຳກັບ report)
  { id: 'history', label: 'ປະຫວັດການຂາຍ', icon: 'time-outline' }, 
  { id: 'products', label: 'ຈັດການສິນຄ້າ', icon: 'cube-outline' },
  { id: 'expense', label: 'ບັນທຶກລາຍຈ່າຍ', icon: 'wallet-outline' },
  { id: 'orders', label: 'ຕິດຕາມຄຳສັ່ງຊື້', icon: 'cube-outline' },
  { id: 'customers', label: 'ຂໍ້ມູນລູກຄ້າ', icon: 'people-outline' },
  // 🟢 ປ່ຽນຊື່ຈາກ "ຕິດໜີ້" -> "ໜີ້ສິນ"
  { id: 'debts', label: 'ໜີ້ສິນ', icon: 'document-text-outline' },
  { id: 'report', label: 'ລາຍງານ', icon: 'bar-chart-outline' },
  { id: 'shifts', label: 'ປິດກະລາຍວັນ', icon: 'time-outline' },
];

export default function Sidebar({ visible, onClose, slideAnim, currentTab, onNavigate }: SidebarProps) {
  
  const [showBillSettings, setShowBillSettings] = useState(false);

  if (!visible) return null;

  return (
    <>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.header}>
          <Text style={styles.title}>ເມນູຫຼັກ</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.menuContainer}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.menuItem, currentTab === item.id && styles.activeItem]}
              onPress={() => onNavigate(item.id)}
            >
              <Ionicons name={item.icon as any} size={24} color={currentTab === item.id ? COLORS.primary : '#333'} />
              <Text style={[styles.menuText, currentTab === item.id && styles.activeText]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          <View style={styles.divider} />

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => setShowBillSettings(true)}
          >
            <Ionicons name="settings-outline" size={24} color="#333" />
            <Text style={styles.menuText}>ຕັ້ງຄ່າໃບບິນ</Text>
          </TouchableOpacity>

        </View>
        
        <BillSettingsModal visible={showBillSettings} onClose={() => setShowBillSettings(false)} />

      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99 },
  sidebar: { position: 'absolute', top: 0, left: 0, bottom: 0, width: width * 0.75, backgroundColor: 'white', zIndex: 100, elevation: 5 },
  header: { height: 120, backgroundColor: COLORS.primary, padding: 20, paddingTop: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontFamily: 'Lao-Bold', color: 'white' },
  menuContainer: { padding: 15 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 10, borderRadius: 10, marginBottom: 5 },
  activeItem: { backgroundColor: '#E0F2F1' },
  menuText: { fontSize: 16, fontFamily: 'Lao-Regular', marginLeft: 15, color: '#333' },
  activeText: { color: COLORS.primary, fontFamily: 'Lao-Bold' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 }
});