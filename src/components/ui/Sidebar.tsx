import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { COLORS } from '../../types';

// 🟢 ຖ້າມີ Modal ຕັ້ງຄ່າໃບບິນ ໃຫ້ເປີດໃຊ້ບ່ອນນີ້
// import BillSettingsModal from '../modals/BillSettingsModal';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onClose?: () => void;
  tabs?: string[];
}

const MENU_ITEMS = [
  // 1. ກຸ່ມຂາຍ
  { id: 'home', label: 'ໜ້າຫຼັກ', icon: 'home-outline' },
  { id: 'pos', label: 'ຂາຍສິນຄ້າ', icon: 'cart-outline' },
  { id: 'special_sale', label: 'ຂາຍພິເສດ', icon: 'flash-outline' }, // 🟢 ເພີ່ມໃໝ່
  { id: 'history', label: 'ປະຫວັດການຂາຍ', icon: 'time-outline' },

  // 2. ກຸ່ມຈັດການ
  { id: 'products', label: 'ຈັດການສິນຄ້າ', icon: 'cube-outline' },
  { id: 'orders', label: 'ຕິດຕາມຄຳສັ່ງຊື້', icon: 'list-outline' },
  { id: 'customers', label: 'ຂໍ້ມູນລູກຄ້າ', icon: 'people-outline' },

  // 3. ກຸ່ມການເງິນ & ໜີ້ສິນ
  { id: 'expenses', label: 'ບັນທຶກລາຍຈ່າຍ', icon: 'wallet-outline' },
  { id: 'debts_receivable', label: 'ໜີ້ຕ້ອງຮັບ', icon: 'download-outline' }, // 🟢 ເພີ່ມໃໝ່ (ຮັບຈາກລູກຄ້າ)
  { id: 'debts_payable', label: 'ໜີ້ຕ້ອງສົ່ງ', icon: 'arrow-up-circle-outline' }, // 🟢 ປ່ຽນຊື່ຈາກ "ຕິດໜີ້"

  // 4. ອື່ນໆ
  { id: 'reports', label: 'ລາຍງານ', icon: 'bar-chart-outline' },
  { id: 'shift', label: 'ປິດກະລາຍວັນ', icon: 'lock-closed-outline' },
];

export default function Sidebar({ activeTab, onTabChange, onClose }: SidebarProps) {
  
  const [showBillSettings, setShowBillSettings] = useState(false);

  return (
    <View style={styles.container}>
      {/* Header ສີຂຽວ */}
      <View style={styles.header}>
        <Text style={styles.title}>ເມນູຫຼັກ</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={30} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.menuContainer} showsVerticalScrollIndicator={false}>
        {MENU_ITEMS.map((item, index) => {
          // ກວດສອບ Active Tab (ທຽບແບບ case-insensitive)
          const isActive = activeTab.toLowerCase() === item.id.toLowerCase();
          
          // ເພີ່ມເສັ້ນຂັ້ນລະຫວ່າງກຸ່ມ (ເພື່ອຄວາມສວຍງາມ)
          const isGroupDivider = index === 4 || index === 7 || index === 10;

          return (
            <React.Fragment key={item.id}>
              {isGroupDivider && <View style={styles.groupDivider} />}
              
              <TouchableOpacity 
                style={[styles.menuItem, isActive && styles.activeItem]}
                onPress={() => onTabChange(item.id)}
              >
                <Ionicons 
                  name={item.icon as any} 
                  size={24} 
                  color={isActive ? (COLORS?.primary || '#008B94') : '#555'} 
                />
                <Text style={[styles.menuText, isActive && styles.activeText]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            </React.Fragment>
          );
        })}

        {/* ເສັ້ນຂັ້ນ */}
        <View style={styles.divider} />

        {/* ປຸ່ມຕັ້ງຄ່າໃບບິນ */}
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => {
             setShowBillSettings(true);
             Alert.alert("Coming Soon", "ຟັງຊັນຕັ້ງຄ່າໃບບິນ");
          }}
        >
          <Ionicons name="settings-outline" size={24} color="#555" />
          <Text style={styles.menuText}>ຕັ້ງຄ່າໃບບິນ</Text>
        </TouchableOpacity>

      </ScrollView>
      
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
    height: 100, 
    backgroundColor: COLORS?.primary || '#008B94', 
    paddingHorizontal: 20, 
    paddingTop: 40, 
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
    padding: 15,
    paddingBottom: 50
  },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12, 
    paddingHorizontal: 15, 
    borderRadius: 10, 
    marginBottom: 2 
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
    marginVertical: 15 
  },
  groupDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 5,
    marginHorizontal: 15
  }
});