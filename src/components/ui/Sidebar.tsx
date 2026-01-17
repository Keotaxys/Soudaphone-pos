import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { COLORS } from '../../types';

// ✅ ແກ້ໄຂ Path ໃຫ້ຖືກຕ້ອງ
import BillSettingsModal from '../modals/BillSettingsModal';

// 🟢 1. Import Hook ເພື່ອກວດສອບສິດ
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onClose?: () => void;
}

// 🟢 2. ເພີ່ມ field 'permission' ໃສ່ໃນ MENU_ITEMS ເພື່ອກຳກັບວ່າໃຜເຂົ້າໄດ້ແນ່
const MENU_ITEMS = [
  // ກຸ່ມຂາຍ
  { id: 'home', label: 'ໜ້າຫຼັກ', icon: 'home-outline' }, // ບໍ່ມີ permission = ເຂົ້າໄດ້ໝົດ
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
  
  // 🟢 3. ດຶງສິດການໃຊ້ງານມາ
  const { hasPermission } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ເມນູຫຼັກ</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={30} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.menuContainer} showsVerticalScrollIndicator={false}>
        {MENU_ITEMS.map((item, index) => {
          // 🟢 4. ກວດສອບສິດ: ຖ້າມີ permission ແລ້ວ user ບໍ່ມີສິດ -> ບໍ່ຕ້ອງສະແດງ (return null)
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
                    if (onClose) onClose(); // ປິດ Sidebar ເມື່ອກົດ
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

        {/* 🟢 5. ເພີ່ມເມນູ "ຈັດການຜູ້ໃຊ້" (ສະແດງສະເພາະ Admin/Manager) */}
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

        {/* ປຸ່ມຕັ້ງຄ່າໃບບິນ */}
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => setShowBillSettings(true)}
        >
          <Ionicons name="settings-outline" size={24} color="#555" />
          <Text style={styles.menuText}>ຕັ້ງຄ່າໃບບິນ</Text>
        </TouchableOpacity>
      </ScrollView>

      <BillSettingsModal 
        visible={showBillSettings} 
        onClose={() => setShowBillSettings(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', width: '100%', height: '100%' },
  header: { height: 100, backgroundColor: COLORS?.primary || '#008B94', paddingHorizontal: 20, paddingTop: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontFamily: 'Lao-Bold', color: 'white' },
  menuContainer: { padding: 15, paddingBottom: 50 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 10, marginBottom: 2 },
  activeItem: { backgroundColor: '#E0F2F1' },
  menuText: { fontSize: 16, fontFamily: 'Lao-Regular', marginLeft: 15, color: '#333' },
  activeText: { color: COLORS?.primary || '#008B94', fontFamily: 'Lao-Bold' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
  groupDivider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 5, marginHorizontal: 15 }
});