import { Ionicons } from '@expo/vector-icons';
import { onValue, ref } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { db } from '../../firebase';
import { COLORS, formatDate, formatNumber, Product, SaleRecord } from '../../types';

const { width } = Dimensions.get('window');
const ORANGE_COLOR = '#FF7043';
const ORANGE_BG = '#FFF3E0';

interface HomeScreenProps {
  salesHistory: SaleRecord[];
  products: Product[];
  onQuickAddProduct: () => void;
  onQuickScan: () => void;
  onQuickCustomer: () => void;
}

type FilterType = 'day' | 'week' | 'month' | 'year';

export default function HomeScreen({ 
  salesHistory, 
  products,
  onQuickAddProduct,
  onQuickScan,
  onQuickCustomer
}: HomeScreenProps) {
  
  const [filterType, setFilterType] = useState<FilterType>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [expensesData, setExpensesData] = useState<any[]>([]);
  const [filteredTotal, setFilteredTotal] = useState(0);
  const [filteredOrders, setFilteredOrders] = useState(0);
  const [filteredExpenses, setFilteredExpenses] = useState(0);

  useEffect(() => {
    const expenseRef = ref(db, 'expenses');
    const unsubscribe = onValue(expenseRef, (snapshot) => {
      if (snapshot.exists()) setExpensesData(Object.values(snapshot.val()));
      else setExpensesData([]);
    });
    return () => unsubscribe();
  }, []);

  const getDateRange = () => {
    let start = new Date(currentDate);
    let end = new Date(currentDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    switch (filterType) {
      case 'week':
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        start.setDate(1);
        end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'year':
        start.setMonth(0, 1);
        end.setMonth(11, 31);
        end.setHours(23, 59, 59, 999);
        break;
    }
    return { start, end };
  };

  useEffect(() => {
    const { start, end } = getDateRange();
    
    const fSales = salesHistory.filter(sale => {
      const d = new Date(sale.date);
      return d >= start && d <= end && sale.status !== 'ຍົກເລີກ';
    });

    const fExp = expensesData.filter(exp => {
      const d = new Date(exp.date);
      return d >= start && d <= end;
    });

    setFilteredTotal(fSales.reduce((sum, sale) => sum + sale.total, 0));
    setFilteredOrders(fSales.length);
    setFilteredExpenses(fExp.reduce((sum, exp) => sum + exp.amount, 0));

  }, [salesHistory, expensesData, filterType, currentDate]);

  const handleNavigateDate = (dir: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    const val = dir === 'next' ? 1 : -1;
    if (filterType === 'day') newDate.setDate(newDate.getDate() + val);
    else if (filterType === 'week') newDate.setDate(newDate.getDate() + (val * 7));
    else if (filterType === 'month') newDate.setMonth(newDate.getMonth() + val);
    else if (filterType === 'year') newDate.setFullYear(newDate.getFullYear() + val);
    setCurrentDate(newDate);
  };

  const getDateLabel = () => {
    const { start } = getDateRange();
    return formatDate(start); 
  };

  const profit = filteredTotal - filteredExpenses;

  return (
    <View style={styles.container}>
      
      {/* 🟢 ສ່ວນທີ 1: Header Fixed (ລັອກໄວ້ດ້ານເທິງ) */}
      <View style={styles.fixedHeader}>
        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          {['day', 'week', 'month', 'year'].map((type) => (
            <TouchableOpacity 
                key={type} 
                style={[styles.filterTab, filterType === type && styles.activeTab]} 
                onPress={() => setFilterType(type as FilterType)}
            >
              <Text style={[styles.filterText, filterType === type && styles.activeText]}>
                  {type === 'day' ? 'ມື້' : type === 'week' ? 'ອາທິດ' : type === 'month' ? 'ເດືອນ' : 'ປີ'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date Navigator */}
        <View style={styles.navRow}>
            <TouchableOpacity onPress={() => handleNavigateDate('prev')} style={styles.navBtn}>
                <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <Text style={styles.dateLabel}>{getDateLabel()}</Text>
            <TouchableOpacity onPress={() => handleNavigateDate('next')} style={styles.navBtn}>
                <Ionicons name="chevron-forward" size={24} color={COLORS.primary} />
            </TouchableOpacity>
        </View>
      </View>

      {/* 🟢 ສ່ວນທີ 2: Scrollable Content (ເນື້ອຫາທີ່ເລື່ອນໄດ້) */}
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        
        {/* Stats Grid (2 Columns) */}
        <View style={styles.statsGrid}>
            {/* Card 1: ຍອດຂາຍ */}
            <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
            <View style={styles.iconCircleWhite}><Ionicons name="cash" size={24} color={COLORS.primary} /></View>
            <View><Text style={styles.statLabelWhite}>ຍອດຂາຍ</Text><Text style={styles.statValueWhite}>{formatNumber(filteredTotal)} ₭</Text></View>
            </View>

            {/* Card 2: ກຳໄລ */}
            <View style={[styles.statCard, { backgroundColor: '#E0F2F1', borderWidth: 1, borderColor: COLORS.primary }]}>
            <View style={[styles.iconCircle, { backgroundColor: 'white' }]}><Ionicons name="trending-up" size={24} color={COLORS.primary} /></View>
            <View><Text style={[styles.statLabel, {color: COLORS.primary}]}>ກຳໄລ</Text><Text style={[styles.statValue, { color: profit >= 0 ? COLORS.primary : ORANGE_COLOR }]}>{profit >= 0 ? '+' : ''}{formatNumber(profit)}</Text></View>
            </View>

            {/* Card 3: ອໍເດີ */}
            <View style={[styles.statCard, { backgroundColor: COLORS.secondary }]}>
            <View style={styles.iconCircleWhite}><Ionicons name="receipt" size={24} color={COLORS.secondaryDark} /></View>
            <View><Text style={styles.statLabelWhite}>ອໍເດີ</Text><Text style={styles.statValueWhite}>{filteredOrders}</Text></View>
            </View>

            {/* Card 4: ລາຍຈ່າຍ */}
            <View style={[styles.statCard, { backgroundColor: 'white', borderWidth: 1, borderColor: '#eee' }]}>
            <View style={[styles.iconCircle, { backgroundColor: ORANGE_BG }]}><Ionicons name="wallet-outline" size={24} color={ORANGE_COLOR} /></View>
            <View><Text style={styles.statLabel}>ລາຍຈ່າຍ</Text><Text style={[styles.statValue, { color: ORANGE_COLOR }]}>{formatNumber(filteredExpenses)}</Text></View>
            </View>
        </View>

        {/* Quick Menu */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ເມນູດ່ວນ</Text>
        </View>
        
        <View style={styles.quickMenu}>
            <TouchableOpacity style={styles.quickMenuItem} onPress={onQuickAddProduct}>
                <View style={styles.quickMenuIcon}><Ionicons name="add-circle-outline" size={28} color={COLORS.primary} /></View>
                <Text style={styles.quickMenuText}>ເພີ່ມສິນຄ້າ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickMenuItem} onPress={onQuickScan}>
                <View style={styles.quickMenuIcon}><Ionicons name="qr-code-outline" size={28} color={COLORS.primary} /></View>
                <Text style={styles.quickMenuText}>ສະແກນ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickMenuItem} onPress={onQuickCustomer}>
                <View style={styles.quickMenuIcon}><Ionicons name="people-outline" size={28} color={COLORS.primary} /></View>
                <Text style={styles.quickMenuText}>ລູກຄ້າ</Text>
            </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  
  // 🟢 Fixed Header Styles
  fixedHeader: {
    backgroundColor: 'white',
    paddingBottom: 15,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    elevation: 2, // ເງົາ Android
    shadowColor: '#000', // ເງົາ iOS
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 10 // ໃຫ້ຢູ່ເທິງສຸດ
  },
  
  // Filter Styles
  filterTabs: { flexDirection: 'row', justifyContent: 'center', marginBottom: 10, gap: 5 },
  filterTab: { paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f0f0f0' },
  activeTab: { backgroundColor: COLORS.primary },
  filterText: { fontFamily: 'Lao-Regular', color: '#666', fontSize: 12 },
  activeText: { color: 'white', fontFamily: 'Lao-Bold' },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  navBtn: { padding: 5 },
  dateLabel: { fontFamily: 'Lao-Bold', fontSize: 16, color: COLORS.text },

  // Scroll Content
  scrollContent: { flex: 1 },

  // Grid Styles
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 15, justifyContent: 'space-between', gap: 12 },
  statCard: { width: '48%', padding: 15, borderRadius: 16, marginBottom: 0, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, shadowOffset: { width:0, height:2 }, flexDirection: 'column', justifyContent: 'space-between', minHeight: 130, gap: 10 },
  
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  iconCircleWhite: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  
  statLabel: { fontSize: 12, fontFamily: 'Lao-Regular', color: COLORS.textLight },
  statValue: { fontSize: 20, fontFamily: 'Lao-Bold', color: COLORS.text },
  statLabelWhite: { fontSize: 12, fontFamily: 'Lao-Regular', color: 'rgba(255,255,255,0.9)' },
  statValueWhite: { fontSize: 20, fontFamily: 'Lao-Bold', color: 'white' },

  // Quick Menu
  sectionHeader: { marginTop: 5, paddingHorizontal: 20, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontFamily: 'Lao-Bold', color: COLORS.text },
  quickMenu: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'white', padding: 20, marginHorizontal: 15, borderRadius: 15, elevation: 2, marginBottom: 30 },
  quickMenuItem: { alignItems: 'center', gap: 5 },
  quickMenuIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F0F9FA', justifyContent: 'center', alignItems: 'center' },
  quickMenuText: { fontSize: 12, fontFamily: 'Lao-Regular', color: '#555' }
});