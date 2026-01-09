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
}

type DateFilterType = 'day' | 'week' | 'month' | 'year';

export default function HomeScreen({ salesHistory, products }: HomeScreenProps) {
  
  // State ວັນທີ
  const [filterType, setFilterType] = useState<DateFilterType>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // 1. ຄຳນວນຊ່ວງວັນທີ (Start - End)
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

  // 2. ປ່ຽນວັນທີ (Next / Prev)
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
  
  // (ສົມມຸດລາຍຈ່າຍ - ໃນອະນາຄົດຕ້ອງດຶງຈາກ Firebase ຈິງ)
  const totalExpense = 0; 

  // 4. ຄຳນວນຍອດລວມ
  const totalIncome = filteredSales.reduce((sum, s) => sum + s.total, 0);
  const totalProfit = totalIncome - totalExpense;
  const totalOrders = filteredSales.length;

  // 5. ຈັດກຽມຂໍ້ມູນກຣາຟ (Pie Chart)
  const salesByCategory: {[key: string]: number} = {};
  filteredSales.forEach(sale => {
      sale.items.forEach(item => {
          const key = item.name || 'Other'; 
          salesByCategory[key] = (salesByCategory[key] || 0) + (item.price * item.quantity);
      });
  });

  // ສີສຳລັບ Chart
  const chartColors = [COLORS.primary, COLORS.secondary, COLORS.success, COLORS.danger, COLORS.blue, '#8E44AD'];

  const chartData = Object.keys(salesByCategory).map((key, index) => ({
      name: key,
      population: salesByCategory[key],
      color: chartColors[index % chartColors.length],
      legendFontColor: "#7F7F7F",
      legendFontSize: 12
  })).sort((a, b) => b.population - a.population).slice(0, 5); // ເອົາ Top 5

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      
      {/* 🟢 Date Filter Section */}
      <View style={styles.filterCard}>
          <View style={styles.dateNavigator}>
              <TouchableOpacity onPress={() => handleNavigateDate(-1)} style={styles.navBtn}>
                  <Ionicons name="chevron-back" size={20} color="#555" />
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
                  <Ionicons name="chevron-forward" size={20} color="#555" />
              </TouchableOpacity>
          </View>

          <View style={styles.dateDisplay}>
             <Ionicons name="calendar-outline" size={18} color="#666" />
             <Text style={styles.currentDateText}>
                  {format(start, 'dd/MM/yyyy')} - {format(end, 'dd/MM/yyyy')}
             </Text>
          </View>
      </View>

      {/* 🟢 Summary Cards */}
      <View style={styles.summaryGrid}>
          {/* Orders */}
          <View style={[styles.card, { backgroundColor: '#FFF9C4', borderColor: '#FBC02D' }]}>
              <Text style={styles.cardLabel}>ຕິດຄຳສັ່ງຊື້</Text>
              <Text style={[styles.cardValue, { color: '#F57F17' }]}>{formatNumber(totalOrders)}</Text>
          </View>

          {/* Income */}
          <View style={[styles.card, { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' }]}>
              <Text style={styles.cardLabel}>ລາຍຮັບ</Text>
              <Text style={[styles.cardValue, { color: '#2E7D32' }]}>{formatNumber(totalIncome)} ₭</Text>
          </View>

          {/* Expense */}
          <View style={[styles.card, { backgroundColor: '#FFEBEE', borderColor: '#EF5350' }]}>
              <Text style={styles.cardLabel}>ລາຍຈ່າຍ</Text>
              <Text style={[styles.cardValue, { color: '#C62828' }]}>{formatNumber(totalExpense)} ₭</Text>
          </View>
      </View>

      {/* Profit Card */}
      <View style={[styles.fullCard, { backgroundColor: '#E3F2FD', borderColor: '#2196F3' }]}>
          <Text style={styles.cardLabel}>ກຳໄລລວມ</Text>
          <Text style={[styles.cardValueLarge, { color: '#1565C0' }]}>{formatNumber(totalProfit)} ₭</Text>
      </View>

      {/* 🟢 Chart Section */}
      <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>ຍອດຂາຍແຍກຕາມສິນຄ້າ (Top 5)</Text>
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
  
  // Filter
  filterCard: { backgroundColor: 'white', borderRadius: 10, padding: 10, marginBottom: 15, borderWidth: 1, borderColor: '#eee' },
  dateNavigator: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, justifyContent: 'space-between' },
  navBtn: { padding: 8, backgroundColor: '#f5f5f5', borderRadius: 5 },
  
  filterTabs: { flexDirection: 'row', backgroundColor: '#f5f5f5', borderRadius: 8, padding: 2, flex: 1, marginHorizontal: 10 },
  filterTab: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 6 },
  filterTabActive: { backgroundColor: 'white', elevation: 1 },
  filterText: { color: '#888', fontSize: 12, fontFamily: 'Lao-Regular' },
  filterTextActive: { color: '#333', fontFamily: 'Lao-Bold' },
  
  dateDisplay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9f9f9', padding: 8, borderRadius: 5, gap: 8 },
  currentDateText: { fontSize: 14, fontFamily: 'Lao-Bold', color: '#555' },

  // Cards
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  card: { width: '32%', padding: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', minHeight: 90 },
  fullCard: { width: '100%', padding: 15, borderRadius: 10, borderWidth: 1, alignItems: 'center', marginBottom: 20 },
  
  cardLabel: { fontSize: 12, fontFamily: 'Lao-Regular', marginBottom: 5, color: '#555' },
  cardValue: { fontSize: 14, fontFamily: 'Lao-Bold', textAlign: 'center' },
  cardValueLarge: { fontSize: 24, fontFamily: 'Lao-Bold' },

  // Chart
  chartContainer: { backgroundColor: 'white', borderRadius: 10, padding: 15, borderWidth: 1, borderColor: '#eee', minHeight: 300, alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontFamily: 'Lao-Regular', color: '#333', marginBottom: 10, alignSelf: 'flex-start' },
  noData: { height: 150, justifyContent: 'center', alignItems: 'center' },
});