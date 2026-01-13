import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { COLORS } from '../../types';

// 🟢 ຖ້າຍັງບໍ່ມີໄຟລ໌ນີ້ ໃຫ້ຄອມເມັ້ນໄວ້ກ່ອນ
// import BillSettingsModal from '../modals/BillSettingsModal';

const { width } = Dimensions.get('window');

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onClose?: () => void; // ເພີ່ມໂຕນີ້ເພື່ອໃຫ້ປຸ່ມ X ເຮັດວຽກ
  tabs?: string[]; // ຮັບໄວ້ຊື່ໆເພື່ອບໍ່ໃຫ້ index.tsx error
}

const MENU_ITEMS = [
  { id: 'home', label: 'ໜ້າຫຼັກ', icon: 'home-outline' },
  { id: 'pos', label: 'ຂາຍສິນຄ້າ', icon: 'cart-outline' },
  { id: 'history', label: 'ປະຫວັດການຂາຍ', icon: 'time-outline' }, // ຫມາຍເຫດ: ຕ້ອງເພີ່ມ case 'history' ໃນ index.tsx
  { id: 'products', label: 'ຈັດການສິນຄ້າ', icon: 'cube-outline' },
  { id: 'expenses', label: 'ບັນທຶກລາຍຈ່າຍ', icon: 'wallet-outline' }, // ແກ້ expense -> expenses ໃຫ້ຕົງກັບ index
  { id: 'orders', label: 'ຕິດຕາມຄຳສັ່ງຊື້', icon: 'cube-outline' },
  { id: 'customers', label: 'ຂໍ້ມູນລູກຄ້າ', icon: 'people-outline' },
  { id: 'debts', label: 'ໜີ້ສິນ', icon: 'document-text-outline' },
  { id: 'reports', label: 'ລາຍງານ', icon: 'bar-chart-outline' }, // ແກ້ report -> reports
  { id: 'shift', label: 'ປິດກະລາຍວັນ', icon: 'time-outline' }, // ແກ້ shifts -> shift
];

export default function Sidebar({ activeTab, onTabChange, onClose }: SidebarProps) {
  
  const [showBillSettings, setShowBillSettings] = useState(false);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>ເມນູຫຼັກ</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={30} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.menuContainer} showsVerticalScrollIndicator={false}>
        {MENU_ITEMS.map((item) => {
          const isActive = activeTab.toLowerCase() === item.id.toLowerCase();
          return (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.menuItem, isActive && styles.activeItem]}
              onPress={() => onTabChange(item.id)}
            >
              <Ionicons 
                name={item.icon as any} 
                size={24} 
                color={isActive ? (COLORS?.primary || '#008B94') : '#333'} 
              />
              <Text style={[styles.menuText, isActive && styles.activeText]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        <View style={styles.divider} />

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => {
             // ຖ້າມີ Modal ໃຫ້ເປີດ, ຖ້າບໍ່ມີໃຫ້ແຈ້ງເຕືອນ
             setShowBillSettings(true);
             // Alert.alert("Settings", "ເປີດການຕັ້ງຄ່າໃບບິນ");
          }}
        >
          <Ionicons name="settings-outline" size={24} color="#333" />
          <Text style={styles.menuText}>ຕັ້ງຄ່າໃບບິນ</Text>
        </TouchableOpacity>

      </ScrollView>
      
      {/* 🟢 ຖ້າມີໄຟລ໌ BillSettingsModal ໃຫ້ເປີດ Comment ນີ້ */}
      {/* <BillSettingsModal visible={showBillSettings} onClose={() => setShowBillSettings(false)} /> */}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    width: '100%',
    height: '100%',
  },
  header: { 
    height: 120, 
    backgroundColor: COLORS?.primary || '#008B94', 
    padding: 20, 
    paddingTop: 50, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  title: { 
    fontSize: 24, 
    fontFamily: 'Lao-Bold', 
    color: 'white' 
  },
  menuContainer: { 
    padding: 15 
  },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 15, 
    paddingHorizontal: 10, 
    borderRadius: 10, 
    marginBottom: 5 
  },
  activeItem: { 
    backgroundColor: '#E0F2F1' 
  },
  menuText: { 
    fontSize: 16, 
    fontFamily: 'Lao-Regular', 
    marginLeft: 15, 
    color: '#333' 
  },
  activeText: { 
    color: COLORS?.primary || '#008B94', 
    fontFamily: 'Lao-Bold' 
  },
  divider: { 
    height: 1, 
    backgroundColor: '#eee', 
    marginVertical: 10 
  }
});