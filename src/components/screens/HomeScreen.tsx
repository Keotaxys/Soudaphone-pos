import { Ionicons } from '@expo/vector-icons';
import { onValue, ref } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import { Dimensions, FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { db } from '../../firebase';
import { COLORS, formatNumber, Product, SaleRecord } from '../../types';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  salesHistory: SaleRecord[];
  products: Product[];
}

export default function HomeScreen({ salesHistory, products }: HomeScreenProps) {
  
  // --- States ---
  const [todaysTotal, setTodaysTotal] = useState(0);
  const [todaysOrders, setTodaysOrders] = useState(0);
  const [todaysExpenses, setTodaysExpenses] = useState(0);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);

  // 🟢 1. ຄິດໄລ່ຍອດຂາຍມື້ນີ້
  useEffect(() => {
    const todayStr = new Date().toDateString(); // "Fri Jan 10 2026"

    // ກັ່ນຕອງເອົາສະເພາະບິນຂາຍຂອງ "ມື້ນີ້"
    const todaySales = salesHistory.filter(sale => 
        new Date(sale.date).toDateString() === todayStr && sale.status !== 'ຍົກເລີກ'
    );

    // ລວມຍອດເງິນ (Base Total LAK)
    const total = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    
    setTodaysTotal(total);
    setTodaysOrders(todaySales.length);

    // 🟢 2. ຊອກຫາສິນຄ້າໃກ້ໝົດ (ນ້ອຍກວ່າ ຫຼື ເທົ່າກັບ 5)
    const lowStock = products.filter(p => p.stock <= 5);
    setLowStockProducts(lowStock);

  }, [salesHistory, products]);

  // 🟢 3. ດຶງລາຍຈ່າຍມື້ນີ້ (Realtime)
  useEffect(() => {
    const expenseRef = ref(db, 'expenses');
    const unsubscribe = onValue(expenseRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            const list = Object.values(data) as any[];
            const todayStr = new Date().toDateString();

            // ລວມຍອດລາຍຈ່າຍຂອງ "ມື້ນີ້"
            const totalExp = list
                .filter(item => new Date(item.date).toDateString() === todayStr)
                .reduce((sum, item) => sum + item.amount, 0);
            
            setTodaysExpenses(totalExp);
        } else {
            setTodaysExpenses(0);
        }
    });
    return () => unsubscribe();
  }, []);

  // ຄິດໄລ່ກຳໄລ (ຍອດຂາຍ - ລາຍຈ່າຍ)
  const todaysProfit = todaysTotal - todaysExpenses;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* --- Welcome Section --- */}
      <View style={styles.headerSection}>
        <View>
            <Text style={styles.greetingText}>ສະບາຍດີ, ເຈົ້າຂອງຮ້ານ 👋</Text>
            <Text style={styles.dateText}>{new Date().toLocaleDateString('lo-LA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
        </View>
        <View style={styles.profileIcon}>
            <Text style={{fontSize: 20}}>🏪</Text>
        </View>
      </View>

      {/* --- Dashboard Cards (Grid) --- */}
      <View style={styles.statsGrid}>
        
        {/* Card 1: ຍອດຂາຍ (Primary Color) */}
        <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
            <View style={styles.iconCircleWhite}>
                <Ionicons name="cash" size={24} color={COLORS.primary} />
            </View>
            <View>
                <Text style={styles.statLabelWhite}>ຍອດຂາຍມື້ນີ້</Text>
                <Text style={styles.statValueWhite}>{formatNumber(todaysTotal)} ₭</Text>
            </View>
        </View>

        {/* Card 2: ກຳໄລ (Profit) */}
        <View style={[styles.statCard, { backgroundColor: 'white', borderWidth: 1, borderColor: '#eee' }]}>
            <View style={[styles.iconCircle, { backgroundColor: '#E0F2F1' }]}>
                <Ionicons name="trending-up" size={24} color={COLORS.primaryDark} />
            </View>
            <View>
                <Text style={styles.statLabel}>ກຳໄລສິດທິ</Text>
                <Text style={[styles.statValue, { color: todaysProfit >= 0 ? COLORS.success : COLORS.danger }]}>
                    {todaysProfit >= 0 ? '+' : ''}{formatNumber(todaysProfit)}
                </Text>
            </View>
        </View>

        {/* Card 3: ຈຳນວນບິນ (Secondary Color) */}
        <View style={[styles.statCard, { backgroundColor: COLORS.secondary }]}>
            <View style={styles.iconCircleWhite}>
                <Ionicons name="receipt" size={24} color={COLORS.secondaryDark} />
            </View>
            <View>
                <Text style={styles.statLabelWhite}>ອໍເດີທັງໝົດ</Text>
                <Text style={styles.statValueWhite}>{todaysOrders} ບິນ</Text>
            </View>
        </View>

        {/* Card 4: ລາຍຈ່າຍ (Danger) */}
        <View style={[styles.statCard, { backgroundColor: 'white', borderWidth: 1, borderColor: '#eee' }]}>
            <View style={[styles.iconCircle, { backgroundColor: '#FFEBEE' }]}>
                <Ionicons name="wallet-outline" size={24} color={COLORS.danger} />
            </View>
            <View>
                <Text style={styles.statLabel}>ລາຍຈ່າຍ</Text>
                <Text style={[styles.statValue, { color: COLORS.danger }]}>{formatNumber(todaysExpenses)}</Text>
            </View>
        </View>
      </View>

      {/* --- Low Stock Warning --- */}
      {lowStockProducts.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
                <Ionicons name="alert-circle" size={20} color={COLORS.secondaryDark} />
                <Text style={styles.sectionTitle}>ສິນຄ້າໃກ້ໝົດ ({lowStockProducts.length})</Text>
            </View>
            <FlatList 
                horizontal
                data={lowStockProducts}
                keyExtractor={item => item.id!}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingLeft: 5 }}
                renderItem={({ item }) => (
                    <View style={styles.lowStockCard}>
                        <Text style={styles.lowStockName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.lowStockValue}>ເຫຼືອ: {item.stock}</Text>
                    </View>
                )}
            />
          </View>
      )}

      {/* --- Recent Transactions --- */}
      <View style={[styles.sectionContainer, {marginBottom: 20}]}>
        <Text style={[styles.sectionTitle, {marginBottom: 10, marginLeft: 5}]}>ລາຍການຂາຍລ່າສຸດ</Text>
        {salesHistory.slice(0, 5).map((sale) => (
            <View key={sale.id} style={styles.transactionRow}>
                <View style={styles.transLeft}>
                    <View style={[styles.transIcon, { backgroundColor: sale.paymentMethod === 'CASH' ? '#E8F5E9' : '#E3F2FD' }]}>
                        <Ionicons name={sale.paymentMethod === 'CASH' ? "cash-outline" : "qr-code-outline"} size={20} color={sale.paymentMethod === 'CASH' ? COLORS.success : COLORS.primary} />
                    </View>
                    <View>
                        <Text style={styles.transTime}>{new Date(sale.date).toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' })}</Text>
                        <Text style={styles.transItems}>{sale.items.length} ລາຍການ</Text>
                    </View>
                </View>
                <Text style={styles.transAmount}>+{formatNumber(sale.total)} ₭</Text>
            </View>
        ))}
        {salesHistory.length === 0 && (
            <Text style={{textAlign: 'center', color: '#ccc', marginVertical: 20}}>ຍັງບໍ່ມີລາຍການຂາຍມື້ນີ້</Text>
        )}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  
  // Header
  headerSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 10 },
  greetingText: { fontFamily: 'Lao-Bold', fontSize: 20, color: COLORS.text },
  dateText: { fontFamily: 'Lao-Regular', fontSize: 12, color: COLORS.textLight },
  profileIcon: { width: 45, height: 45, backgroundColor: 'white', borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 2 },

  // Grid Dashboard
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, gap: 10, justifyContent: 'space-between' },
  statCard: { width: (width - 45) / 2, padding: 15, borderRadius: 16, marginBottom: 10, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, flexDirection: 'column', gap: 10 },
  
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  iconCircleWhite: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  
  statLabel: { fontSize: 12, fontFamily: 'Lao-Regular', color: COLORS.textLight },
  statValue: { fontSize: 18, fontFamily: 'Lao-Bold', color: COLORS.text },
  
  statLabelWhite: { fontSize: 12, fontFamily: 'Lao-Regular', color: 'rgba(255,255,255,0.9)' },
  statValueWhite: { fontSize: 18, fontFamily: 'Lao-Bold', color: 'white' },

  // Low Stock Section
  sectionContainer: { marginTop: 20, paddingHorizontal: 15 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  sectionTitle: { fontFamily: 'Lao-Bold', fontSize: 16, color: COLORS.text },
  
  lowStockCard: { backgroundColor: '#FFEBEE', padding: 10, borderRadius: 10, marginRight: 10, minWidth: 120, borderWidth: 1, borderColor: '#FFCDD2' },
  lowStockName: { fontFamily: 'Lao-Bold', color: '#C62828', fontSize: 12, marginBottom: 4 },
  lowStockValue: { fontFamily: 'Lao-Regular', color: '#C62828', fontSize: 10 },

  // Transactions
  transactionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 8, elevation: 1 },
  transLeft: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  transIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  transTime: { fontFamily: 'Lao-Bold', color: COLORS.text, fontSize: 14 },
  transItems: { fontFamily: 'Lao-Regular', color: COLORS.textLight, fontSize: 12 },
  transAmount: { fontFamily: 'Lao-Bold', color: COLORS.success, fontSize: 16 },
});