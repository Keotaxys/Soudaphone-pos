import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SIDEBAR_WIDTH } from '../../types';

interface SidebarProps {
  visible: boolean;
  slideAnim: Animated.Value;
  onClose: () => void;
  currentTab: string;
  onNavigate: (tab: 'home' | 'pos' | 'expense' | 'report') => void;
}

export default function Sidebar({ visible, slideAnim, onClose, currentTab, onNavigate }: SidebarProps) {
  
  if (!visible) return null;

  const handleNav = (tab: 'home' | 'pos' | 'expense' | 'report') => {
    onNavigate(tab);
    // ບໍ່ຕ້ອງສັ່ງ onClose() ຢູ່ທີ່ນີ້ ເພາະໃນ index.tsx ເຮົາສັ່ງ toggleMenu(false) ຢູ່ແລ້ວ
  };

  return (
    <View style={styles.sidebarOverlay}>
        {/* ພື້ນຫຼັງສີດຳຈາງໆ (ກົດແລ້ວປິດເມນູ) */}
        <TouchableOpacity style={{flex: 1}} onPress={onClose} activeOpacity={1} />
        
        {/* ຕົວ Slide Bar */}
        <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
            <View style={styles.sidebarHeader}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>S</Text>
                </View>
                <View>
                    <Text style={styles.sidebarTitle}>Soudaphone POS</Text>
                    <Text style={styles.sidebarSubtitle}>Admin</Text>
                </View>
            </View>

            <ScrollView style={styles.menuContainer}>
                <TouchableOpacity 
                    style={[styles.menuItem, currentTab === 'home' && styles.menuActive]} 
                    onPress={() => handleNav('home')}
                >
                    <Ionicons name="home-outline" size={24} color={currentTab === 'home' ? COLORS.primaryDark : COLORS.text} />
                    <Text style={[styles.menuText, currentTab === 'home' && styles.menuTextActive]}>ໜ້າຫຼັກ</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.menuItem, currentTab === 'pos' && styles.menuActive]} 
                    onPress={() => handleNav('pos')}
                >
                    <Ionicons name="cart-outline" size={24} color={currentTab === 'pos' ? COLORS.primaryDark : COLORS.text} />
                    <Text style={[styles.menuText, currentTab === 'pos' && styles.menuTextActive]}>ຂາຍສິນຄ້າ</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.menuItem, currentTab === 'report' && styles.menuActive]} 
                    onPress={() => handleNav('report')}
                >
                    <Ionicons name="bar-chart-outline" size={24} color={currentTab === 'report' ? COLORS.primaryDark : COLORS.text} />
                    <Text style={[styles.menuText, currentTab === 'report' && styles.menuTextActive]}>ລາຍງານ</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Info', 'Version 1.0.0')}>
                    <Ionicons name="settings-outline" size={24} color={COLORS.text} />
                    <Text style={styles.menuText}>ຕັ້ງຄ່າ</Text>
                </TouchableOpacity>
            </ScrollView>
        </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebarOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, flexDirection: 'row' },
  sidebar: { width: SIDEBAR_WIDTH, backgroundColor: 'white', height: '100%', paddingTop: 50, shadowColor: '#000', shadowOffset: { width: 2, height: 0 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  sidebarHeader: { paddingHorizontal: 20, marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 15 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: 'white', fontSize: 20, fontFamily: 'Lao-Bold' },
  sidebarTitle: { fontSize: 18, fontFamily: 'Lao-Bold', color: '#333' },
  sidebarSubtitle: { fontSize: 14, fontFamily: 'Lao-Regular', color: '#888' },
  menuContainer: { flex: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20 },
  menuActive: { backgroundColor: '#F0F4F4', borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  menuText: { fontSize: 16, fontFamily: 'Lao-Regular', marginLeft: 15, color: '#666' },
  menuTextActive: { color: COLORS.primaryDark, fontFamily: 'Lao-Bold' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 10 },
});