import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TouchableWithoutFeedback,
} from 'react-native';
import { COLORS, SIDEBAR_WIDTH } from '../../types';

interface SidebarProps {
  visible: boolean;
  slideAnim: Animated.Value;
  onClose: () => void;
  currentTab: string;
  onNavigate: (tab: string) => void;
}

export default function Sidebar({ visible, slideAnim, onClose, currentTab, onNavigate }: SidebarProps) {
  
  // 🟢 ກຳນົດລາຍການເມນູໃຫ້ຖືກຕ້ອງ
  const menuItems = [
    { id: 'home', title: 'ໜ້າຫຼັກ', icon: 'grid-outline' },
    { id: 'pos', title: 'ຂາຍສິນຄ້າ', icon: 'cart-outline' },
    { id: 'orders', title: 'ຕິດຕາມຄຳສັ່ງຊື້', icon: 'list-outline' },
    { id: 'history', title: 'ປະຫວັດການຂາຍ', icon: 'time-outline' },
    // 🟢 ປ່ຽນຊື່ຈາກ "ຈັດການກະຈາຍ" ເປັນ "ຈັດການກະຂາຍ" ແລະ ໃຊ້ id: 'shift'
    { id: 'shift', title: 'ຈັດການກະຂາຍ', icon: 'sync-outline' }, 
    { id: 'products', title: 'ສິນຄ້າ', icon: 'cube-outline' },
    { id: 'customers', title: 'ລູກຄ້າ', icon: 'people-outline' },
    { id: 'expense', title: 'ລາຍຈ່າຍ', icon: 'wallet-outline' },
    { id: 'debts', title: 'ໜີ້ສິນ', icon: 'journal-outline' },
    { id: 'report', title: 'ລາຍງານ', icon: 'bar-chart-outline' },
  ];

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
          <View style={styles.header}>
            <View style={styles.profileCircle}>
                <Text style={styles.profileInitial}>S</Text>
            </View>
            <View style={{marginLeft: 15}}>
                <Text style={styles.shopName}>Soudaphone POS</Text>
                <Text style={styles.shopType}>ເສື້ອຜ້າເດັກ</Text>
            </View>
          </View>

          <View style={styles.menuList}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  (currentTab === item.id || (item.id === 'history' && currentTab === 'report')) && styles.activeMenuItem
                ]}
                onPress={() => onNavigate(item.id)}
              >
                <Ionicons 
                    name={item.icon as any} 
                    size={22} 
                    color={currentTab === item.id ? COLORS.primary : '#555'} 
                />
                <Text style={[
                    styles.menuText, 
                    currentTab === item.id && styles.activeMenuText
                ]}>
                    {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.footer}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: 'white',
    height: '100%',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 10,
  },
  profileCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 20 },
  shopName: { fontFamily: 'Lao-Bold', fontSize: 16, color: COLORS.text },
  shopType: { fontFamily: 'Lao-Regular', fontSize: 12, color: COLORS.textLight },
  
  menuList: { flex: 1, paddingHorizontal: 10 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 5,
  },
  activeMenuItem: { backgroundColor: '#f0f9f9' },
  menuText: {
    fontFamily: 'Lao-Regular',
    fontSize: 15,
    color: '#444',
    marginLeft: 15,
  },
  activeMenuText: { fontFamily: 'Lao-Bold', color: COLORS.primary },
  
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#f0f0f0', alignItems: 'center' },
  versionText: { color: '#ccc', fontSize: 12, fontFamily: 'Lao-Regular' },
});