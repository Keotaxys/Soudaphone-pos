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
}

type FilterType = 'day' | 'week' | 'month' | 'year';

export default function HomeScreen({ salesHistory, products }: HomeScreenProps) {
  const [filterType, setFilterType] = useState<FilterType>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Data States
  const [expensesData, setExpensesData] = useState<any[]>([]);
  const [filteredTotal, setFilteredTotal] = useState(0);
  const [filteredOrders, setFilteredOrders] = useState(0);
  const [filteredExpenses, setFilteredExpenses] = useState(0);

  // 1. Fetch Expenses Realtime
  useEffect(() => {
    const expenseRef = ref(db, 'expenses');
    const unsubscribe = onValue(expenseRef, (snapshot) => {
      if (snapshot.exists()) setExpensesData(Object.values(snapshot.val()));
      else setExpensesData([]);
    });
    return () => unsubscribe();
  }, []);

  // 2. Logic Filter ວັນທີ
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

  // 3. ຄຳນວນຍອດເງິນ
  useEffect(() => {
    const { start, end } = getDateRange();
    
    // Filter Sales
    const fSales = salesHistory.filter(sale => {
      const d = new Date(sale.date);
      return d >= start && d <= end && sale.status !== 'ຍົກເລີກ';
    });

    // Filter Expenses
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* --- Filter Section --- */}
      <View style={styles.filterSection}>
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

      {/* --- 🟢 Stats Grid (2 Columns) --- */}
      <View style={styles.statsGrid}>
        
        {/* Card 1: ຍອດຂາຍ */}
        <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
          <View style={styles.iconCircleWhite}>
              <Ionicons name="cash" size={24} color={COLORS.primary} />
          </View>
          <View>
              <Text style={styles.statLabelWhite}>ຍອດຂາຍ</Text>
              <Text style={styles.statValueWhite}>{formatNumber(filteredTotal)} ₭</Text>
          </View>
        </View>

        {/* Card 2: ກຳໄລ */}
        <View style={[styles.statCard, { backgroundColor: '#E0F2F1', borderWidth: 1, borderColor: COLORS.primary }]}>
          <View style={[styles.iconCircle, { backgroundColor: 'white' }]}>
              <Ionicons name="trending-up" size={24} color={COLORS.primary} />
          </View>
          <View>
              <Text style={[styles.statLabel, {color: COLORS.primary}]}>ກຳໄລ</Text>
              <Text style={[styles.statValue, { color: profit >= 0 ? COLORS.primary : ORANGE_COLOR }]}>
                  {profit >= 0 ? '+' : ''}{formatNumber(profit)}
              </Text>
          </View>
        </View>

        {/* Card 3: ອໍເດີ */}
        <View style={[styles.statCard, { backgroundColor: COLORS.secondary }]}>
          <View style={styles.iconCircleWhite}>
              <Ionicons name="receipt" size={24} color={COLORS.secondaryDark} />
          </View>
          <View>
              <Text style={styles.statLabelWhite}>ອໍເດີ</Text>
              <Text style={styles.statValueWhite}>{filteredOrders}</Text>
          </View>
        </View>

        {/* Card 4: ລາຍຈ່າຍ */}
        <View style={[styles.statCard, { backgroundColor: 'white', borderWidth: 1, borderColor: '#eee' }]}>
          <View style={[styles.iconCircle, { backgroundColor: ORANGE_BG }]}>
              <Ionicons name="wallet-outline" size={24} color={ORANGE_COLOR} />
          </View>
          <View>
              <Text style={styles.statLabel}>ລາຍຈ່າຍ</Text>
              <Text style={[styles.statValue, { color: ORANGE_COLOR }]}>{formatNumber(filteredExpenses)}</Text>
          </View>
        </View>

      </View>

      {/* --- Quick Menu --- */}
      <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>ເມນູດ່ວນ</Text>
      </View>
      
      <View style={styles.quickMenu}>
          <View style={styles.quickMenuItem}>
              <Ionicons name="add-circle-outline" size={30} color={COLORS.primary} />
              <Text style={styles.quickMenuText}>ເພີ່ມສິນຄ້າ</Text>
          </View>
          <View style={styles.quickMenuItem}>
              <Ionicons name="qr-code-outline" size={30} color={COLORS.primary} />
              <Text style={styles.quickMenuText}>ສະແກນ</Text>
          </View>
          <View style={styles.quickMenuItem}>
              <Ionicons name="people-outline" size={30} color={COLORS.primary} />
              <Text style={styles.quickMenuText}>ລູກຄ້າ</Text>
          </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  
  // Filter Styles
  filterSection: { backgroundColor: 'white', paddingBottom: 10, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  filterTabs: { flexDirection: 'row', justifyContent: 'center', marginTop: 10, marginBottom: 10, gap: 5 },
  filterTab: { paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f0f0f0' },
  activeTab: { backgroundColor: COLORS.primary },
  filterText: { fontFamily: 'Lao-Regular', color: '#666', fontSize: 12 },
  activeText: { color: 'white', fontFamily: 'Lao-Bold' },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  navBtn: { padding: 5 },
  dateLabel: { fontFamily: 'Lao-Bold', fontSize: 16, color: COLORS.text },

  // 🟢 Grid Styles (2 ຄໍລຳ)
  statsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    padding: 15, 
    justifyContent: 'space-between', // ຍູ້ອອກຂ້າງ
    gap: 12 // ໄລຍະຫ່າງ (Android ໃໝ່/iOS)
  },
  statCard: { 
    width: '48%', // ແບ່ງເຄິ່ງໜ້າຈໍ
    padding: 15, 
    borderRadius: 16, 
    marginBottom: 0, // ໃຊ້ gap ແທນ ຫຼື ຖ້າບໍ່ຮອງຮັບ gap ໃຫ້ໃສ່ marginBottom: 10
    elevation: 3, 
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, shadowOffset: { width:0, height:2 },
    flexDirection: 'column', 
    justifyContent: 'space-between',
    minHeight: 130, // ຄວາມສູງຂັ້ນຕ່ຳໃຫ້ເທົ່າກັນ
    gap: 10
  },
  
  // Icons & Text
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  iconCircleWhite: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  
  statLabel: { fontSize: 12, fontFamily: 'Lao-Regular', color: COLORS.textLight },
  statValue: { fontSize: 20, fontFamily: 'Lao-Bold', color: COLORS.text }, // ເພີ່ມຂະໜາດຕົວເລກ
  statLabelWhite: { fontSize: 12, fontFamily: 'Lao-Regular', color: 'rgba(255,255,255,0.9)' },
  statValueWhite: { fontSize: 20, fontFamily: 'Lao-Bold', color: 'white' }, // ເພີ່ມຂະໜາດຕົວເລກ

  // Quick Menu
  sectionHeader: { marginTop: 10, paddingHorizontal: 20, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontFamily: 'Lao-Bold', color: COLORS.text },
  quickMenu: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'white', padding: 20, marginHorizontal: 15, borderRadius: 15, elevation: 2, marginBottom: 30 },
  quickMenuItem: { alignItems: 'center', gap: 5 },
  quickMenuText: { fontSize: 12, fontFamily: 'Lao-Regular', color: '#555' }
});