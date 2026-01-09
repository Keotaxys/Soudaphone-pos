import { Ionicons } from '@expo/vector-icons';
import { addDays, addMonths, addWeeks, addYears, endOfDay, endOfMonth, endOfWeek, endOfYear, format, isWithinInterval, startOfDay, startOfMonth, startOfWeek, startOfYear } from 'date-fns';
import React, { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { COLORS, Product, SaleRecord, formatDate, formatNumber } from '../../types';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  salesHistory: SaleRecord[];
  products: Product[];
  expenses?: any[]; // ຮັບຂໍ້ມູນລາຍຈ່າຍ (ຖ້າມີ)
}

type DateFilterType = 'day' | 'week' | 'month' | 'year';

export default function HomeScreen({ salesHistory, products, expenses = [] }: HomeScreenProps) {
  
  // State ສຳລັບການກອງວັນທີ
  const [filterType, setFilterType] = useState<DateFilterType>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // ຄຳນວນຊ່ວງວັນທີ (Start - End)
  const getDateRange = () => {
      let start = new Date();
      let end = new Date();

      switch (filterType) {
          case 'day':
              start = startOfDay(currentDate);
              end = endOfDay(currentDate);
              break;
          case 'week':
              start = startOfWeek(currentDate, { weekStartsOn: 1 });
              end = endOfWeek(currentDate, { weekStartsOn: 1 });
              break;
          case 'month':
              start = startOfMonth(currentDate);
              end = endOfMonth(currentDate);
              break;
          case 'year':
              start = startOfYear(currentDate);
              end = endOfYear(currentDate);
              break;
      }
      return { start, end };
  };

  const { start, end } = getDateRange();

  // ປ່ຽນວັນທີ (Next / Prev)
  const handleNavigateDate = (direction: 'prev' | 'next') => {
      const amount = direction === 'next' ? 1 : -1;
      let newDate = new Date(currentDate);

      switch (filterType) {
          case 'day': newDate = addDays(newDate, amount); break;
          case 'week': newDate = addWeeks(newDate, amount); break;
          case 'month': newDate = addMonths(newDate, amount); break;
          case 'year': newDate = addYears(newDate, amount); break;
      }
      setCurrentDate(newDate);
  };

  // ກອງຂໍ້ມູນຕາມຊ່ວງວັນທີ
  const filteredSales = salesHistory.filter(s => isWithinInterval(new Date(s.date), { start, end }));
  const filteredExpenses = expenses.filter(e => isWithinInterval(new Date(e.date), { start, end }));

  // ຄຳນວນຍອດລວມ
  const totalIncome = filteredSales.reduce((sum, s) => sum + s.total, 0);
  const totalExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalProfit = totalIncome - totalExpense;
  const totalOrders = filteredSales.length;

  // ຈັດກຽມຂໍ້ມູນກຣາຟ (Pie Chart Data) - ແຍກຕາມສິນຄ້າ (ຕົວຢ່າງ)
  // (ໃນທີ່ຈິງຄວນແຍກຕາມ Category ແຕ່ດຶງຈາກ items ມາກ່ອນ)
  const salesByCategory: {[key: string]: number} = {};
  filteredSales.forEach(sale => {
      sale.items.forEach(item => {
          // ຖ້າມີ category ໃນ product ໃຫ້ໃຊ້, ຖ້າບໍ່ມີໃຫ້ໃຊ້ຊື່ສິນຄ້າແທນ
          const key = item.name || 'Other'; 
          salesByCategory[key] = (salesByCategory[key] || 0) + (item.price * item.quantity);
      });
  });

  const chartData = Object.keys(salesByCategory).map((key, index) => ({
      name: key,
      population: salesByCategory[key],
      color: index % 2 === 0 ? COLORS.primary : COLORS.secondary, // ສลับສີງ່າຍໆ
      legendFontColor: "#7F7F7F",
      legendFontSize: 12
  })).slice(0, 5); // ເອົາແຕ່ 5 ອັນດັບທຳອິດ

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      
      {/* 🟢 1. Date Filter Section */}
      <View style={styles.filterContainer}>
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

          <View style={styles.dateNavigator}>
              <TouchableOpacity onPress={() => handleNavigateDate('prev')} style={styles.navBtn}>
                  <Ionicons name="chevron-back" size={24} color={COLORS.text} />
              </TouchableOpacity>
              
              <Text style={styles.currentDateText}>
                  {filterType === 'day' ? format(currentDate, 'dd/MM/yyyy') : 
                   filterType === 'month' ? format(currentDate, 'MM/yyyy') : 
                   filterType === 'year' ? format(currentDate, 'yyyy') : 
                   `${format(start, 'dd/MM')} - ${format(end, 'dd/MM/yyyy')}`}
              </Text>

              <TouchableOpacity onPress={() => handleNavigateDate('next')} style={styles.navBtn}>
                  <Ionicons name="chevron-forward" size={24} color={COLORS.text} />
              </TouchableOpacity>
          </View>
      </View>

      {/* 🟢 2. Summary Cards */}
      <View style={styles.summaryGrid}>
          <View style={[styles.card, { borderLeftColor: COLORS.success }]}>
              <Text style={styles.cardLabel}>ລາຍຮັບ (Income)</Text>
              <Text style={[styles.cardValue, { color: COLORS.success }]}>{formatNumber(totalIncome)} ₭</Text>
          </View>
          <View style={[styles.card, { borderLeftColor: COLORS.danger }]}>
              <Text style={styles.cardLabel}>ລາຍຈ່າຍ (Expense)</Text>
              <Text style={[styles.cardValue, { color: COLORS.danger }]}>{formatNumber(totalExpense)} ₭</Text>
          </View>
          <View style={[styles.card, { borderLeftColor: COLORS.blue }]}>
              <Text style={styles.cardLabel}>ກຳໄລ (Profit)</Text>
              <Text style={[styles.cardValue, { color: COLORS.blue }]}>{formatNumber(totalProfit)} ₭</Text>
          </View>
          <View style={[styles.card, { borderLeftColor: COLORS.secondary }]}>
              <Text style={styles.cardLabel}>ອໍເດີ (Orders)</Text>
              <Text style={[styles.cardValue, { color: COLORS.secondary }]}>{formatNumber(totalOrders)}</Text>
          </View>
      </View>

      {/* 🟢 3. Chart Section */}
      <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>ຍອດຂາຍຕາມສິນຄ້າ (Top 5)</Text>
          {chartData.length > 0 ? (
              <PieChart
                data={chartData}
                width={width - 40}
                height={220}
                chartConfig={{
                  backgroundColor: "#ffffff",
                  backgroundGradientFrom: "#ffffff",
                  backgroundGradientTo: "#ffffff",
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor={"population"}
                backgroundColor={"transparent"}
                paddingLeft={"15"}
                absolute
              />
          ) : (
              <View style={styles.noData}>
                  <Text style={{color: '#999'}}>ບໍ່ມີຂໍ້ມູນໃນຊ່ວງເວລານີ້</Text>
              </View>
          )}
      </View>

      {/* 🟢 4. Recent Orders */}
      <Text style={styles.sectionTitle}>ລາຍການລ່າສຸດ</Text>
      {filteredSales.slice(0, 5).map((sale) => (
          <View key={sale.id} style={styles.recentItem}>
              <View>
                  <Text style={styles.recentTitle}>ຂາຍສິນຄ້າ ({sale.items.length} ລາຍການ)</Text>
                  <Text style={styles.recentDate}>{formatDate(sale.date)}</Text>
              </View>
              <Text style={[styles.recentAmount, { color: COLORS.success }]}>+{formatNumber(sale.total)}</Text>
          </View>
      ))}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  
  // Date Filter
  filterContainer: { backgroundColor: 'white', borderRadius: 10, padding: 10, marginBottom: 15, elevation: 2 },
  filterTabs: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 8, padding: 2, marginBottom: 10 },
  filterTab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 6 },
  filterTabActive: { backgroundColor: 'white', elevation: 1 },
  filterText: { color: '#888', fontSize: 12, fontFamily: 'Lao-Regular' },
  filterTextActive: { color: COLORS.primary, fontFamily: 'Lao-Bold' },
  
  dateNavigator: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10 },
  currentDateText: { fontSize: 16, fontFamily: 'Lao-Bold', color: '#333' },
  navBtn: { padding: 5 },

  // Summary Grid
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 15 },
  card: { width: '48%', backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, borderLeftWidth: 5, elevation: 2 },
  cardLabel: { fontSize: 12, color: '#666', fontFamily: 'Lao-Regular', marginBottom: 5 },
  cardValue: { fontSize: 18, fontFamily: 'Lao-Bold' },

  // Chart
  chartContainer: { backgroundColor: 'white', borderRadius: 10, padding: 15, marginBottom: 15, elevation: 2, alignItems: 'center' },
  noData: { height: 150, justifyContent: 'center', alignItems: 'center' },

  // Recent List
  sectionTitle: { fontSize: 16, fontFamily: 'Lao-Bold', color: '#444', marginBottom: 10, marginTop: 5 },
  recentItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: 'white', borderRadius: 10, marginBottom: 8, elevation: 1 },
  recentTitle: { fontSize: 14, fontFamily: 'Lao-Bold', color: '#333' },
  recentDate: { fontSize: 12, color: '#888', marginTop: 2 },
  recentAmount: { fontSize: 16, fontFamily: 'Lao-Bold' }
});