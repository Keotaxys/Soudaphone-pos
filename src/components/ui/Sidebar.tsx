import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Modal, // 🟢 1. Import Modal
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
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
  // ... (ຮັກສາລາຍການເມນູໄວ້ຄືເກົ່າ)
  { id: 'home', label: 'ໜ້າຫຼັກ', icon: 'home' },
  { id: 'pos', label: 'ຂາຍສິນຄ້າ', icon: 'cart', permission: 'accessPos' },
  { id: 'special_sale', label: 'ຂາຍພິເສດ', icon: 'flash', permission: 'accessPos' },
  { id: 'history', label: 'ປະຫວັດການຂາຍ', icon: 'time', permission: 'accessReports' },
  { id: 'products', label: 'ຈັດການສິນຄ້າ', icon: 'cube', permission: 'accessProducts' },
  { id: 'orders', label: 'ຕິດຕາມຄຳສັ່ງຊື້', icon: 'list', permission: 'accessProducts' },
  { id: 'customers', label: 'ຂໍ້ມູນລູກຄ້າ', icon: 'people', permission: 'accessCustomers' },
  { id: 'debts_receivable', label: 'ໜີ້ຕ້ອງຮັບ', icon: 'download', permission: 'accessFinancial' },
  { id: 'debts_payable', label: 'ໜີ້ຕ້ອງສົ່ງ', icon: 'arrow-up-circle', permission: 'accessFinancial' },
  { id: 'expenses', label: 'ບັນທຶກລາຍຈ່າຍ', icon: 'wallet', permission: 'accessFinancial' },
  { id: 'reports', label: 'ລາຍງານ', icon: 'bar-chart', permission: 'accessReports' },
  { id: 'shift', label: 'ປິດກະລາຍວັນ', icon: 'lock-closed', permission: 'accessReports' },
];

export default function Sidebar({ activeTab, onTabChange, onClose }: SidebarProps) {
  const [showBillSettings, setShowBillSettings] = useState(false);
  const { hasPermission } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    // 🟢 2. ໃຊ້ Modal ແທນ View (ແກ້ໄຂບັນຫາ Layer ຈົມ ແລະ ຂອບເທິງ)
    <Modal
      visible={true} // ຖືວ່າ Component ນີ້ຖືກເອີ້ນເມື່ອຕ້ອງການສະແດງຜົນ
      transparent={true} // ໃຫ້ເຫັນພື້ນຫຼັງທາງຫຼັງໄດ້
      animationType="fade" // ໃສ່ Animation ຕອນເປີດ
      statusBarTranslucent={true} // ✅ ໃຫ້ມັນກວມຂຶ້ນໄປຮອດ Status Bar (ແກ້ບັນຫາຂອບເທິງ)
      onRequestClose={onClose} // ສຳລັບປຸ່ມ Back ຂອງ Android
    >
      <View style={styles.overlayContainer}>
        
        {/* 🟢 3. ສ່ວນຂອງ Sidebar (ຊິດຊ້າຍ) */}
        <View style={[
            styles.sidebarPanel, 
            { paddingTop: Platform.OS === 'android' ? 25 : insets.top } // ຈັດ padding ໃຫ້ພົ້ນ Status Bar
        ]}>
          
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
                        <Ionicons name="people-circle" size={24} color={activeTab === 'Users' ? (COLORS?.primary || '#008B94') : '#555'} />
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
              <Ionicons name="settings" size={24} color="#555" />
              <Text style={styles.menuText}>ຕັ້ງຄ່າໃບບິນ</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* 🟢 4. ສ່ວນ Backdrop ສີດຳຈາງໆ (ຊິດຂວາ) - ກົດແລ້ວປິດ */}
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />

        <BillSettingsModal 
          visible={showBillSettings} 
          onClose={() => setShowBillSettings(false)} 
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // 🟢 ຈັດ Layout ຂອງ Modal ໃຫ້ເປັນລວງນອນ (Sidebar | Backdrop)
  overlayContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebarPanel: {
    width: '75%', // ກວ້າງ 75%
    maxWidth: 320,
    backgroundColor: 'white',
    height: '100%',
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 }, // ເງົາໄປທາງຂວາ
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10, // ສຳລັບ Android ໃຫ້ລອຍເດັ່ນຂຶ້ນມາ
    zIndex: 2,
  },
  backdrop: {
    flex: 1, // ກິນພື້ນທີ່ທີ່ເຫຼືອ
    backgroundColor: 'rgba(0,0,0,0.5)', // ສີດຳຈາງ
  },
  header: { 
    backgroundColor: COLORS?.primary || '#008B94', 
    paddingHorizontal: 20, 
    paddingBottom: 20, 
    paddingTop: 20, // ໄລຍະຫ່າງພາຍໃນເພີ່ມຕື່ມ
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