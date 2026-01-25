import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
// 🟢 Import ໂຕນີ້ເພື່ອຈັດການຂອບຈໍເທິງ (Notch)
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../types';
import BillSettingsModal from '../modals/BillSettingsModal';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onClose?: () => void;
}

const MENU_ITEMS = [
  // ກຸ່ມຂາຍ
  { id: 'home', label: 'ໜ້າຫຼັກ', icon: 'home-outline' },
  { id: 'pos', label: 'ຂາຍສິນຄ້າ', icon: 'cart-outline', permission: 'accessPos' },
  { id: 'special_sale', label: 'ຂາຍພິເສດ', icon: 'flash-outline', permission: 'accessPos' },
  { id: 'history', label: 'ປະຫວັດການຂາຍ', icon: 'time-outline', permission: 'accessReports' },

  // ກຸ່ມສິນຄ້າ
  { id: 'products', label: 'ຈັດການສິນຄ້າ', icon: 'cube-outline', permission: 'accessProducts' },
  { id: 'orders', label: 'ຕິດຕາມຄຳສັ່ງຊື້', icon: 'list-outline', permission: 'accessProducts' },
   
  // ກຸ່ມການເງິນ & ໜີ້ສິນ
  { id: 'customers', label: 'ຂໍ້ມູນລູກຄ້າ', icon: 'people-outline', permission: 'accessCustomers' },
  { id: 'debts_receivable', label: 'ໜີ້ຕ້ອງຮັບ', icon: 'download-outline', permission: 'accessFinancial' },
  { id: 'debts_payable', label: 'ໜີ້ຕ້ອງສົ່ງ', icon: 'arrow-up-circle-outline', permission: 'accessFinancial' },
  { id: 'expenses', label: 'ບັນທຶກລາຍຈ່າຍ', icon: 'wallet-outline', permission: 'accessFinancial' },

  // ອື່ນໆ
  { id: 'reports', label: 'ລາຍງານ', icon: 'bar-chart-outline', permission: 'accessReports' },
  { id: 'shift', label: 'ປິດກະລາຍວັນ', icon: 'lock-closed-outline', permission: 'accessReports' },
];

export default function Sidebar({ activeTab, onTabChange, onClose }: SidebarProps) {
  const [showBillSettings, setShowBillSettings] = useState(false);
  const { hasPermission } = useAuth();
  const insets = useSafeAreaInsets(); // 🟢 ດຶງຄ່າຂອບຈໍ

  return (
    // 🟢 1. ປັບ Container ໃຫ້ເປັນ Absolute Overlay ເຕັມຈໍ
    <View style={styles.overlayContainer}>
      
      {/* 🟢 2. ພື້ນຫຼັງສີດຳຈາງໆ (ກົດແລ້ວປິດເມນູ) */}
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={onClose}
      />

      {/* 🟢 3. ຕົວ Sidebar ຕົວຈິງ */}
      <View style={[styles.sidebarPanel, { paddingTop: insets.top }]}>
        
        {/* Header ສ່ວນຫົວ */}
        <View style={styles.header}>
          <Text style={styles.title}>ເມນູຫຼັກ</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.menuContainer} showsVerticalScrollIndicator={false}>
          {MENU_ITEMS.map((item, index) => {
            if (item.permission && !hasPermission(item.permission as any)) {
              return null;
            }

            const isActive = activeTab.toLowerCase() === item.id.toLowerCase();
            const isGroupDivider = index === 4 || index === 6 || index === 10;

            return (
              <React.Fragment key={item.id}>
                {isGroupDivider && <View style={styles.groupDivider} />}
                <TouchableOpacity 
                  style={[styles.menuItem, isActive && styles.activeItem]}
                  onPress={() => {
                      onTabChange(item.id);
                      if (onClose) onClose(); 
                  }}
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

          {hasPermission('canManageUsers') && (
              <>
                  <View style={styles.groupDivider} />
                  <TouchableOpacity 
                      style={[styles.menuItem, activeTab === 'Users' && styles.activeItem]}
                      onPress={() => {
                          onTabChange('Users');
                          if (onClose) onClose();
                      }}
                  >
                      <Ionicons name="people-circle-outline" size={24} color={activeTab === 'Users' ? (COLORS?.primary || '#008B94') : '#555'} />
                      <Text style={[styles.menuText, activeTab === 'Users' && styles.activeText]}>
                          ຈັດການຜູ້ໃຊ້
                      </Text>
                  </TouchableOpacity>
              </>
          )}

          <View style={styles.divider} />

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => setShowBillSettings(true)}
          >
            <Ionicons name="settings-outline" size={24} color="#555" />
            <Text style={styles.menuText}>ຕັ້ງຄ່າໃບບິນ</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <BillSettingsModal 
        visible={showBillSettings} 
        onClose={() => setShowBillSettings(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // 🟢 Style ໃໝ່ສຳລັບ Overlay
  overlayContainer: {
    position: 'absolute', // ລອຍຢູ່ເໜືອທຸກຢ່າງ
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999, // ໃຫ້ຢູ່ຊັ້ນເທິງສຸດ
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', // ສີດຳຈາງໆ
  },
  sidebarPanel: {
    width: '75%', // ກວ້າງ 75% ຂອງໜ້າຈໍ (ສ່ວນທີ່ເຫຼືອເຫັນ Backdrop)
    maxWidth: 300,
    backgroundColor: 'white',
    height: '100%',
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: { 
    backgroundColor: COLORS?.primary || '#008B94', 
    paddingHorizontal: 20, 
    paddingBottom: 20, 
    paddingTop: 20, // ໄລຍະຫ່າງຈາກຂອບເທິງ (ເພີ່ມຈາກ insets.top)
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  title: { 
    fontSize: 22, 
    fontFamily: 'Lao-Bold', 
    color: 'white' 
  },
  closeBtn: {
    padding: 5
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