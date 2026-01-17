import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// 🟢 1. Import Hook ເຂົ້າມາ
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../types';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onClose: () => void;
  tabs: string[];
}

export default function Sidebar({ activeTab, onTabChange, onClose, tabs }: SidebarProps) {
  const insets = useSafeAreaInsets();
  
  // 🟢 2. ເອີ້ນໃຊ້ Hook
  const { hasPermission } = useAuth();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.title}>ເມນູຫຼັກ</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.menuList}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.menuItem, activeTab === tab && styles.activeItem]}
            onPress={() => onTabChange(tab)}
          >
            <Ionicons 
              name={getIconName(tab)} 
              size={22} 
              color={activeTab === tab ? COLORS.primary : '#666'} 
            />
            <Text style={[styles.menuText, activeTab === tab && styles.activeText]}>
              {translateTab(tab)}
            </Text>
          </TouchableOpacity>
        ))}

        {/* 🟢 3. ເພີ່ມປຸ່ມ "ຈັດການຜູ້ໃຊ້" (ສະເພາະ Admin) */}
        {/* ໃຊ້ onTabChange ແທນ navigation */}
        {hasPermission('canManageUsers') && (
           <>
             <View style={styles.divider} />
             <TouchableOpacity
                style={[styles.menuItem, activeTab === 'Users' && styles.activeItem]}
                onPress={() => {
                    onTabChange('Users'); // 👉 ສົ່ງຄ່າ 'Users' ໄປໃຫ້ App.tsx
                    onClose();
                }}
              >
                <Ionicons name="people-outline" size={22} color={activeTab === 'Users' ? COLORS.primary : '#666'} />
                <Text style={[styles.menuText, activeTab === 'Users' && styles.activeText]}>
                  ຈັດການຜູ້ໃຊ້
                </Text>
              </TouchableOpacity>
           </>
        )}

      </ScrollView>
      
      <View style={styles.footer}>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </View>
  );
}

// Helper Functions
const getIconName = (tab: string): any => {
  switch (tab.toLowerCase()) {
    case 'home': return 'home-outline';
    case 'pos': return 'cart-outline';
    case 'products': return 'cube-outline';
    case 'customers': return 'people-outline';
    case 'orders': return 'clipboard-outline';
    case 'reports': return 'bar-chart-outline';
    case 'expenses': return 'wallet-outline';
    case 'debts': return 'book-outline';
    case 'shift': return 'time-outline';
    default: return 'list-outline';
  }
};

const translateTab = (tab: string) => {
    switch (tab.toLowerCase()) {
        case 'home': return 'ໜ້າຫຼັກ';
        case 'pos': return 'ຂາຍສິນຄ້າ';
        case 'products': return 'ສິນຄ້າ';
        case 'customers': return 'ລູກຄ້າ';
        case 'orders': return 'ອໍເດີ້';
        case 'reports': return 'ລາຍງານ';
        case 'expenses': return 'ລາຍຈ່າຍ';
        case 'debts': return 'ໜີ້ສິນ';
        case 'shift': return 'ປິດກະ';
        default: return tab;
    }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', width: 280, borderRightWidth: 1, borderRightColor: '#eee' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  title: { fontSize: 20, fontFamily: 'Lao-Bold', color: '#333' },
  menuList: { flex: 1, paddingVertical: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, marginBottom: 5 },
  activeItem: { backgroundColor: '#E0F2F1', borderRightWidth: 4, borderRightColor: COLORS.primary },
  menuText: { marginLeft: 15, fontSize: 16, fontFamily: 'Lao-Regular', color: '#666' },
  activeText: { color: COLORS.primary, fontFamily: 'Lao-Bold' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 10, marginHorizontal: 20 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#f0f0f0', alignItems: 'center' },
  versionText: { color: '#999', fontSize: 12 }
});