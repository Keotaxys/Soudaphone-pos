import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Animated,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { COLORS, SIDEBAR_WIDTH } from '../../types';

const { height } = Dimensions.get('window');

interface SidebarProps {
    visible: boolean;
    slideAnim: Animated.Value;
    onClose: () => void;
    currentTab: string;
    onNavigate: (tab: string) => void;
}

// 🟢 ລາຍການເມນູທັງໝົດ (ອ້າງອີງຈາກຮູບ 3.png)
const MENU_ITEMS = [
    { key: 'home', label: 'ໜ້າຫຼັກ', icon: 'grid-outline' },
    { key: 'pos', label: 'ຂາຍສິນຄ້າ', icon: 'desktop-outline' }, // ຮູບຄອມພິວເຕີ
    { key: 'orders', label: 'ຕິດຕາມຄຳສັ່ງຊື້', icon: 'cart-outline' },
    { key: 'history', label: 'ປະຫວັດການຂາຍ', icon: 'time-outline' }, // ຮູບໂມງ
    { key: 'shift', label: 'ຈັດການກະຈາຍ', icon: 'sync-outline' }, // ຫຼື swap-horizontal
    { key: 'products', label: 'ສິນຄ້າ', icon: 'cube-outline' },
    { key: 'customers', label: 'ລູກຄ້າ', icon: 'people-outline' },
    { key: 'expense', label: 'ລາຍຈ່າຍ', icon: 'wallet-outline' },
    { key: 'debts', label: 'ໜີ້ສິນ', icon: 'card-outline' },
    { key: 'report', label: 'ລາຍງານ', icon: 'document-text-outline' },
];

export default function Sidebar({ visible, slideAnim, onClose, currentTab, onNavigate }: SidebarProps) {
    
    if (!visible) return null;

    return (
        <View style={styles.overlay}>
            <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
            
            <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
                
                {/* --- Header ຂອງ Sidebar --- */}
                <View style={styles.sidebarHeader}>
                    <View style={styles.shopIcon}>
                        <Text style={styles.shopIconText}>S</Text>
                    </View>
                    <View>
                        <Text style={styles.shopName}>Soudaphone</Text>
                        <Text style={styles.shopSub}>ເສື້ອຜ້າເດັກ</Text>
                    </View>
                </View>

                {/* --- Menu List (ໃຊ້ ScrollView ເພາະເມນູຫຼາຍ) --- */}
                <ScrollView 
                    style={styles.menuContainer} 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                >
                    {MENU_ITEMS.map((item) => (
                        <TouchableOpacity
                            key={item.key}
                            style={[
                                styles.menuItem,
                                currentTab === item.key && styles.menuItemActive // Highlight ຖ້າເລືອກຢູ່
                            ]}
                            onPress={() => onNavigate(item.key)}
                        >
                            <Ionicons 
                                name={item.icon as any} 
                                size={22} 
                                color={currentTab === item.key ? COLORS.primary : '#555'} 
                            />
                            <Text style={[
                                styles.menuText, 
                                currentTab === item.key && styles.menuTextActive
                            ]}>
                                {item.label}
                            </Text>
                            
                            {/* ຂີດເສັ້ນທາງຂວາ ຖ້າ Active */}
                            {currentTab === item.key && <View style={styles.activeIndicator} />}
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* --- Footer (Version) --- */}
                <View style={styles.footer}>
                    <Text style={styles.versionText}>Version 1.0.0</Text>
                </View>

            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 },
    backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
    
    sidebar: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: SIDEBAR_WIDTH,
        backgroundColor: 'white',
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 5,
    },
    
    // Header Styles
    sidebarHeader: {
        height: 100,
        backgroundColor: COLORS.primary, // ສີ Teal
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 30, // ເພື່ອຫຼົບ Status Bar
    },
    shopIcon: {
        width: 40,
        height: 40,
        backgroundColor: 'white',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    shopIconText: {
        color: COLORS.primary,
        fontFamily: 'Lao-Bold',
        fontSize: 20,
    },
    shopName: {
        color: 'white',
        fontFamily: 'Lao-Bold',
        fontSize: 16,
    },
    shopSub: {
        color: 'rgba(255,255,255,0.8)',
        fontFamily: 'Lao-Regular',
        fontSize: 12,
    },

    // Menu Styles
    menuContainer: {
        flex: 1,
        paddingTop: 10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        // borderBottomWidth: 1, // ຖ້າຢາກມີເສັ້ນຂັ້ນ
        // borderBottomColor: '#f9f9f9',
    },
    menuItemActive: {
        backgroundColor: '#E0F2F1', // ສີພື້ນຫຼັງອ່ອນໆເວລາເລືອກ (Teal 50)
    },
    menuText: {
        marginLeft: 15,
        fontSize: 14,
        fontFamily: 'Lao-Regular',
        color: '#555',
    },
    menuTextActive: {
        fontFamily: 'Lao-Bold',
        color: COLORS.primary,
    },
    activeIndicator: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        backgroundColor: COLORS.primary,
        borderTopRightRadius: 4,
        borderBottomRightRadius: 4,
    },

    // Footer Styles
    footer: {
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        alignItems: 'center',
    },
    versionText: {
        color: '#ccc',
        fontSize: 12,
        fontFamily: 'Lao-Regular',
    }
});