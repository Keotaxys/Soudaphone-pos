import { Ionicons } from '@expo/vector-icons';
import { onValue, ref } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { db } from '../../firebase';
import { COLORS, formatNumber } from '../../types';

export default function ReportDashboard() {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [salesByCategory, setSalesByCategory] = useState<any[]>([]);

  useEffect(() => {
    // ດຶງຂໍ້ມູນ Sales
    const salesRef = ref(db, 'sales');
    onValue(salesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.values(data);
        // ຄຳນວນຍອດຂາຍລວມ
        const revenue = list.reduce((sum: number, item: any) => sum + (parseFloat(item.total) || 0), 0);
        setTotalRevenue(revenue);

        // ຄຳນວນ Top Products
        const prodStats: any = {};
        const catStats: any = {};
        
        list.forEach((sale: any) => {
            if(sale.items) {
                sale.items.forEach((p: any) => {
                    if(!prodStats[p.name]) prodStats[p.name] = { ...p, totalSold: 0, totalAmount: 0 };
                    prodStats[p.name].totalSold += p.quantity;
                    prodStats[p.name].totalAmount += (p.price * p.quantity);

                    const cat = p.category || 'Other';
                    if(!catStats[cat]) catStats[cat] = 0;
                    catStats[cat] += (p.price * p.quantity);
                });
            }
        });

        setTopProducts(Object.values(prodStats).sort((a: any, b: any) => b.totalSold - a.totalSold).slice(0, 5));
        
        setSalesByCategory(Object.keys(catStats).map(k => ({ label: k, value: catStats[k] })));
      }
    });

    // ດຶງຂໍ້ມູນ Expenses
    const expRef = ref(db, 'expenses');
    onValue(expRef, (snapshot) => {
        const data = snapshot.val();
        if(data) {
            const list = Object.values(data);
            const expense = list.reduce((sum: number, item: any) => sum + (parseFloat(item.amount) || 0), 0);
            setTotalExpense(expense);
        }
    });
  }, []);

  const SummaryCard = ({ label, amount, color, icon }: any) => (
    <View style={[styles.card, { borderLeftColor: color }]}>
        <View>
            <Text style={styles.cardLabel}>{label}</Text>
            <Text style={[styles.cardAmount, { color }]}>{formatNumber(amount)} ₭</Text>
        </View>
        <Ionicons name={icon} size={28} color={color} style={{opacity: 0.8}} />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ພາບລວມທຸລະກິດ</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.summaryRow}>
            <SummaryCard label="ຍອດຂາຍລວມ" amount={totalRevenue} color={COLORS?.primary || '#008B94'} icon="cash" />
            <SummaryCard label="ລາຍຈ່າຍລວມ" amount={totalExpense} color="#F57C00" icon="wallet" />
        </View>
        <SummaryCard label="ກຳໄລສຸດທິ" amount={totalRevenue - totalExpense} color="#4CAF50" icon="trending-up" />

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 ສິນຄ້າຂາຍດີ 5 ອັນດັບ</Text>
            {topProducts.map((prod, index) => (
                <View key={index} style={styles.prodRow}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Text style={styles.rank}>#{index + 1}</Text>
                        <Text style={styles.prodName}>{prod.name}</Text>
                    </View>
                    <Text style={styles.prodAmount}>{formatNumber(prod.totalAmount)} ₭</Text>
                </View>
            ))}
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 ສັດສ່ວນຍອດຂາຍ</Text>
            {salesByCategory.map((cat, index) => (
                <View key={index} style={styles.catRow}>
                    <Text style={styles.catLabel}>{cat.label}</Text>
                    <View style={styles.barContainer}>
                        <View style={[styles.bar, { width: `${(cat.value / totalRevenue) * 100}%` }]} />
                    </View>
                    <Text style={styles.catValue}>{formatNumber(cat.value)}</Text>
                </View>
            ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F9FA' },
  header: { padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#eee' },
  headerTitle: { fontSize: 22, fontFamily: 'Lao-Bold', color: '#333' },
  content: { padding: 15 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  card: { flex: 1, backgroundColor: 'white', padding: 15, borderRadius: 12, borderLeftWidth: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, elevation: 2 },
  cardLabel: { fontFamily: 'Lao-Regular', color: '#666', fontSize: 12 },
  cardAmount: { fontFamily: 'Lao-Bold', fontSize: 18, marginTop: 5 },
  section: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginTop: 15, elevation: 2 },
  sectionTitle: { fontFamily: 'Lao-Bold', fontSize: 16, marginBottom: 15, color: '#333' },
  prodRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  rank: { fontFamily: 'Lao-Bold', marginRight: 10, color: '#888', width: 25 },
  prodName: { fontFamily: 'Lao-Regular', color: '#333' },
  prodAmount: { fontFamily: 'Lao-Bold', color: COLORS?.primary || '#008B94' },
  catRow: { marginBottom: 10 },
  catLabel: { fontFamily: 'Lao-Regular', fontSize: 12, marginBottom: 2 },
  barContainer: { height: 6, backgroundColor: '#eee', borderRadius: 3, marginBottom: 2 },
  bar: { height: '100%', backgroundColor: COLORS?.primary || '#008B94', borderRadius: 3 },
  catValue: { fontFamily: 'Lao-Bold', fontSize: 12, alignSelf: 'flex-end' }
});