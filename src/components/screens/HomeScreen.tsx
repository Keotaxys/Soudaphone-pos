import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS, Product, SaleRecord, formatNumber } from '../../types';

interface HomeScreenProps {
  salesHistory: SaleRecord[];
  products: Product[];
}

export default function HomeScreen({ salesHistory, products }: HomeScreenProps) {
  
  // ຄຳນວນຍອດຂາຍ
  const totalSales = salesHistory.reduce((sum, s) => sum + s.total, 0);
  const totalBills = salesHistory.length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
      
      {/* 🟢 Card 1: ຍອດຂາຍ */}
      <View style={[styles.dashboardCard, { backgroundColor: COLORS.primary }]}>
        <View>
            <Text style={styles.dashLabel}>ຍອດຂາຍທັງໝົດ</Text>
            <Text style={styles.dashValue}>{formatNumber(totalSales)} ₭</Text>
        </View>
        <View style={styles.iconContainer}>
            <Ionicons name="cash-outline" size={30} color="white" />
        </View>
      </View>

      {/* 🟠 Card 2: ຈຳນວນບິນ */}
      <View style={[styles.dashboardCard, { backgroundColor: COLORS.secondary }]}>
        <View>
            <Text style={styles.dashLabel}>ຈຳນວນບິນຂາຍ</Text>
            <Text style={styles.dashValue}>{formatNumber(totalBills)} ບິນ</Text>
        </View>
        <View style={styles.iconContainer}>
            <Ionicons name="receipt-outline" size={30} color="white" />
        </View>
      </View>

      {/* 🔵 Card 3: ສິນຄ້າຄົງເຫຼືອ */}
      <View style={[styles.dashboardCard, { backgroundColor: COLORS.blue }]}>
        <View>
            <Text style={styles.dashLabel}>ສິນຄ້າໃນສະຕັອກ</Text>
            <Text style={styles.dashValue}>{formatNumber(totalStock)} ລາຍການ</Text>
        </View>
        <View style={styles.iconContainer}>
            <Ionicons name="cube-outline" size={30} color="white" />
        </View>
      </View>

      {/* Recent Activity Label */}
      <Text style={styles.sectionTitle}>ການເຄື່ອນໄຫວລ່າສຸດ</Text>
      
      {/* ລາຍການລ່າສຸດ (ຕົວຢ່າງ 3 ລາຍການ) */}
      {salesHistory.slice(0, 3).map((sale) => (
          <View key={sale.id} style={styles.recentItem}>
              <View>
                  <Text style={styles.recentTitle}>ຂາຍສິນຄ້າ ({sale.items.length} ລາຍການ)</Text>
                  <Text style={styles.recentDate}>{new Date(sale.date).toLocaleString()}</Text>
              </View>
              <Text style={[styles.recentAmount, { color: COLORS.success }]}>+{formatNumber(sale.total)}</Text>
          </View>
      ))}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  dashboardCard: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderRadius: 15, marginBottom: 15, 
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: {width: 0, height: 2}
  },
  dashLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontFamily: 'Lao-Regular', marginBottom: 5 },
  dashValue: { color: 'white', fontSize: 24, fontFamily: 'Lao-Bold' },
  iconContainer: { width: 50, height: 50, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  
  sectionTitle: { fontSize: 16, fontFamily: 'Lao-Bold', color: '#666', marginTop: 10, marginBottom: 10 },
  recentItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: 'white', borderRadius: 10, marginBottom: 10 },
  recentTitle: { fontSize: 14, fontFamily: 'Lao-Bold', color: '#333' },
  recentDate: { fontSize: 12, color: '#888', marginTop: 2 },
  recentAmount: { fontSize: 16, fontFamily: 'Lao-Bold' }
});