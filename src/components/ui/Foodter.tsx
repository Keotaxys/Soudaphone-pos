import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../types';

interface FooterProps {
  currentTab: string;
  onTabChange: (tab: 'home' | 'pos' | 'expense' | 'report') => void;
}

export default function Footer({ currentTab, onTabChange }: FooterProps) {
  return (
    <View style={styles.footer}>
        <TouchableOpacity style={styles.navBtn} onPress={() => onTabChange('home')}>
            <Ionicons name="home" size={24} color={currentTab === 'home' ? COLORS.primary : '#ccc'} />
            <Text style={[styles.navText, currentTab === 'home' && styles.navTextActive]}>ໜ້າຫຼັກ</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navBtn} onPress={() => onTabChange('pos')}>
            <View style={[styles.navIconCircle, currentTab === 'pos' && {borderColor: COLORS.primary, borderWidth: 2}]}>
               <Ionicons name="cart" size={28} color={COLORS.primary} />
            </View>
            <Text style={[styles.navText, currentTab === 'pos' && styles.navTextActive]}>ຂາຍສິນຄ້າ</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navBtn} onPress={() => onTabChange('expense')}>
            <Ionicons name="wallet" size={24} color={currentTab === 'expense' ? COLORS.primary : '#ccc'} />
            <Text style={[styles.navText, currentTab === 'expense' && styles.navTextActive]}>ລາຍຈ່າຍ</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navBtn} onPress={() => onTabChange('report')}>
            <Ionicons name="bar-chart" size={24} color={currentTab === 'report' ? COLORS.primary : '#ccc'} />
            <Text style={[styles.navText, currentTab === 'report' && styles.navTextActive]}>ລາຍງານ</Text>
        </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', backgroundColor: 'white', height: 70, alignItems: 'center', justifyContent: 'space-around', paddingBottom: 10, borderTopWidth: 1, borderTopColor: '#eee', elevation: 10 },
  navBtn: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  navText: { color: '#ccc', fontSize: 10, marginTop: 4, fontFamily: 'Lao-Regular' },
  navTextActive: { color: COLORS.primary, fontFamily: 'Lao-Bold' },
  navIconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', marginTop: -20, elevation: 5, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 3 },
});