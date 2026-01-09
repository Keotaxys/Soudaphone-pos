import { Ionicons } from '@expo/vector-icons';
import {
    addDays,
    addMonths,
    addWeeks,
    addYears,
    endOfDay,
    endOfMonth,
    endOfWeek,
    endOfYear,
    format,
    isWithinInterval,
    startOfDay,
    startOfMonth,
    startOfWeek,
    startOfYear
} from 'date-fns';
import React, { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { COLORS, Product, SaleRecord, formatNumber } from '../../types';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  salesHistory: SaleRecord[];
  products: Product[];
  expenses?: any[];
}

type DateFilterType = 'day' | 'week' | 'month' | 'year';

export default function HomeScreen({ salesHistory, products, expenses = [] }: HomeScreenProps) {
  
  // State ວັນທີ
  const [filterType, setFilterType] = useState<DateFilterType>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // 1. ຄຳນວນຊ່ວງວັນທີ
  const getDateRange = () => {
      const now = new Date(currentDate);
      switch (filterType) {
          case 'day': return { start: startOfDay(now), end: endOfDay(now) };
          case 'week': return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
          case 'month': return { start: startOfMonth(now), end: endOfMonth(now) };
          case 'year': return { start: startOfYear(now), end: endOfYear(now) };
          default: return { start: startOfDay(now), end: endOfDay(now) };
      }
  };

  const { start, end } = getDateRange();

  // 2. ປ່ຽນວັນທີ
  const handleNavigateDate = (amount: number) => {
      let newDate = new Date(currentDate);
      switch (filterType) {
          case 'day': newDate = addDays(newDate, amount); break;
          case 'week': newDate = addWeeks(newDate, amount); break;
          case 'month': newDate = addMonths(newDate, amount); break;
          case 'year': newDate = addYears(newDate, amount); break;
      }
      setCurrentDate(newDate);
  };

  // 3. ກອງຂໍ້ມູນ
  const filteredSales = salesHistory.filter(s => isWithinInterval(new Date(s.date), { start, end }));
  const totalExpense = 0; // ລໍຖ້າຂໍ້ມູນຈິງ

  // 4. ຄຳນວນຍອດ
  const totalIncome = filteredSales.reduce((sum, s) => sum + s.total, 0);
  const totalProfit = totalIncome - totalExpense;
  const totalOrders = filteredSales.length;

  // 5. ຂໍ້ມູນ Chart
  const salesByCategory: {[key: string]: number} = {};
  filteredSales.forEach(sale => {
      sale.items.forEach(item => {
          const key = item.name || 'Other'; 
          salesByCategory[key] = (salesByCategory[key] || 0) + (item.price * item.quantity);
      });
  });

  // 🎨 ສີ Chart (ໃຊ້ Theme ຂອງເຮົາ)
  const chartColors = [COLORS.primary, COLORS.secondary, COLORS.success, '#FF7043', '#42A5F5', '#AB47BC'];

  const chartData = Object.keys(salesByCategory).map((key, index) => ({
      name: key,
      population: salesByCategory[key],
      color: chartColors[index % chartColors.length],
      legendFontColor: "#7F7F7F",
      legendFontSize: 12
  })).sort((a, b) => b.population - a.population).slice(0, 5);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      
      <Text style={styles.headerTitle}>ໜ້າຫຼັກ</Text>
      <Text style={styles.headerSubtitle}>ພາບລວມຂອງຮ້ານ ແລະ ສະຖິຕິ.</Text>

      {/* 🟢 Date Filter */}
      <View style={styles.filterCard}>
          <View style={styles.dateNavigator}>
              <TouchableOpacity onPress={() => handleNavigateDate(-1)} style={styles.navBtn}>
                  <Ionicons name="chevron-back" size={20} color={COLORS.text} />
              </TouchableOpacity>
              
              <View style={styles.filterTabs}>
                {(['day', 'week', 'month', 'year'] as DateFilterType[]).map((type) => (
                    <TouchableOpacity 
                        key={type} 
                        style={[styles.filterTab, filterType === type && styles.filterTabActive]}
                        onPress={() => setFilterType(type)}
                    >
                        <Text style={[styles.filterText, filterType === type && styles.filterTextActive]}>
                            {type === 'day' ? 'ມື້' : type === 'week' ? 'ອາທິດ' : type === 'month' ? 'ເດືອນ' : 'ປີ'}
                        </Text>
                    </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity onPress={() => handleNavigateDate(1)} style={styles.navBtn}>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.text} />
              </TouchableOpacity>
          </View>

          <View style={styles.dateDisplay}>
             <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
             <Text style={styles.currentDateText}>
                  {format(start, 'dd/MM/yyyy')} - {format(end, 'dd/MM/yyyy')}
             </Text>
          </View>
      </View>

      {/* 🟢 Summary Cards (Theme Colors) */}
      <View style={styles.summaryGrid}>
          {/* Orders (Orange Theme) */}
          <View style={[styles.card, { backgroundColor: '#FFF3E0', borderColor: COLORS.secondary }]}>
              <Text style={styles.cardLabel}>ຄຳສັ່ງຊື້</Text>
              <Text style={[styles.cardValue, { color: COLORS.secondaryDark }]}>{formatNumber(totalOrders)}</Text>
          </View>

          {/* Income (Green Theme) */}
          <View style={[styles.card, { backgroundColor: '#E8F5E9', borderColor: COLORS.success }]}>
              <Text style={styles.cardLabel}>ລາຍຮັບ</Text>
              <Text style={[styles.cardValue, { color: COLORS.success }]}>{formatNumber(totalIncome)} ₭</Text>
          </View>

          {/* Expense (Red Theme) */}
          <View style={[styles.card, { backgroundColor: '#FFEBEE', borderColor: COLORS.danger }]}>
              <Text style={styles.cardLabel}>ລາຍຈ່າຍ</Text>
              <Text style={[styles.cardValue, { color: COLORS.danger }]}>{formatNumber(totalExpense)} ₭</Text>
          </View>
      </View>

      {/* Profit Card (Primary Theme) */}
      <View style={[styles.fullCard, { backgroundColor: '#E0F2F1', borderColor: COLORS.primary }]}>
          <Text style={styles.cardLabel}>ກຳໄລລວມ</Text>
          <Text style={[styles.cardValueLarge, { color: COLORS.primaryDark }]}>{formatNumber(totalProfit)} ₭</Text>
      </View>

      {/* 🟢 Chart Section */}
      <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>ຍອດຂາຍແຍກຕາມໝວດໝູ່ (Top 5)</Text>
          {chartData.length > 0 ? (
              <PieChart
                data={chartData}
                width={width - 60}
                height={220}
                chartConfig={{
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor={"population"}
                backgroundColor={"transparent"}
                paddingLeft={"15"}
                absolute
              />
          ) : (
              <View style={styles.noData}>
                  <Text style={{color: '#999', fontFamily: 'Lao-Regular'}}>ບໍ່ມີຂໍ້ມູນການຂາຍໃນຊ່ວງເວລານີ້</Text>
              </View>
          )}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#FAFAFA' },
  headerTitle: { fontSize: 24, fontFamily: 'Lao-Bold', color: '#333' },
  headerSubtitle: { fontSize: 14, color: '#666', fontFamily: 'Lao-Regular', marginBottom: 15 },
  
  // Filter
  filterCard: { backgroundColor: 'white', borderRadius: 10, padding: 10, marginBottom: 15, borderWidth: 1, borderColor: '#eee' },
  dateNavigator: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, justifyContent: 'space-between' },
  navBtn: { padding: 8, backgroundColor: '#f5f5f5', borderRadius: 5 },
  
  filterTabs: { flexDirection: 'row', backgroundColor: '#f5f5f5', borderRadius: 8, padding: 2, flex: 1, marginHorizontal: 10 },
  filterTab: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 6 },
  filterTabActive: { backgroundColor: COLORS.primary, elevation: 2 }, // ໃຊ້ສີ Primary ເວລາເລືອກ
  filterText: { color: '#888', fontSize: 12, fontFamily: 'Lao-Regular' },
  filterTextActive: { color: 'white', fontFamily: 'Lao-Bold' }, // ຕົວໜັງສືຂາວ
  
  dateDisplay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9f9f9', padding: 8, borderRadius: 5, gap: 8 },
  currentDateText: { fontSize: 14, fontFamily: 'Lao-Bold', color: COLORS.primaryDark },

  // Cards
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  card: { width: '32%', padding: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', minHeight: 90 },
  fullCard: { width: '100%', padding: 15, borderRadius: 10, borderWidth: 1, alignItems: 'center', marginBottom: 20 },
  
  cardLabel: { fontSize: 12, fontFamily: 'Lao-Regular', marginBottom: 5, color: '#555' },
  cardValue: { fontSize: 13, fontFamily: 'Lao-Bold', textAlign: 'center' },
  cardValueLarge: { fontSize: 24, fontFamily: 'Lao-Bold' },

  // Chart
  chartContainer: { backgroundColor: 'white', borderRadius: 10, padding: 15, borderWidth: 1, borderColor: '#eee', minHeight: 300, alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontFamily: 'Lao-Regular', color: '#333', marginBottom: 10, alignSelf: 'flex-start' },
  noData: { height: 150, justifyContent: 'center', alignItems: 'center' },
});