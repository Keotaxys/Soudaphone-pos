import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { onValue, ref } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useExchangeRate } from '../../../hooks/useExchangeRate';
import { db } from '../../firebase';
import { COLORS, formatDate, formatNumber, Product, SaleRecord } from '../../types';

const { width } = Dimensions.get('window');
const ORANGE_COLOR = '#FF7043';
const ORANGE_BG = '#FFF3E0';
const ORANGE_TEXT = '#E64A19';

interface HomeScreenProps {
  salesHistory: SaleRecord[];
  products: Product[];
}

type FilterType = 'day' | 'week' | 'month' | 'year' | 'custom';

interface ChartData {
  category: string;
  amount: number;
  percentage: number;
}

export default function HomeScreen({ salesHistory, products }: HomeScreenProps) {
  const exchangeRate = useExchangeRate();
  const currentRate = exchangeRate > 0 ? exchangeRate : 680;

  const [filterType, setFilterType] = useState<FilterType>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [customStart, setCustomStart] = useState(new Date());
  const [customEnd, setCustomEnd] = useState(new Date());
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'start' | 'end'>('start');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [filteredTotal, setFilteredTotal] = useState(0);
  const [filteredOrders, setFilteredOrders] = useState(0);
  const [filteredExpenses, setFilteredExpenses] = useState(0);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [expensesData, setExpensesData] = useState<any[]>([]);
  const [salesChartData, setSalesChartData] = useState<ChartData[]>([]);
  const [expenseChartData, setExpenseChartData] = useState<ChartData[]>([]);

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
      case 'custom':
        start = new Date(customStart);
        start.setHours(0, 0, 0, 0);
        end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
        break;
    }
    return { start, end };
  };

  useEffect(() => {
    const { start, end } = getDateRange();
    const filteredSales = salesHistory.filter(sale => {
      const d = new Date(sale.date);
      return d >= start && d <= end && sale.status !== 'ຍົກເລີກ';
    });
    const filteredExp = expensesData.filter(exp => {
      const d = new Date(exp.date);
      return d >= start && d <= end;
    });

    setFilteredTotal(filteredSales.reduce((sum, sale) => sum + sale.total, 0));
    setFilteredOrders(filteredSales.length);
    setFilteredExpenses(filteredExp.reduce((sum, exp) => sum + exp.amount, 0));
    setLowStockProducts(products.filter(p => p.stock <= 5));

    const salesMap: Record<string, number> = {};
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const cat = item.category || 'ທົ່ວໄປ';
        let amount = item.price * item.quantity;
        if (item.priceCurrency === 'THB') amount = amount * currentRate;
        salesMap[cat] = (salesMap[cat] || 0) + amount;
      });
    });
    const sortedSales = Object.keys(salesMap).map(key => ({ category: key, amount: salesMap[key], percentage: 0 })).sort((a, b) => b.amount - a.amount);
    const maxSale = sortedSales.length > 0 ? sortedSales[0].amount : 0;
    setSalesChartData(sortedSales.map(item => ({ ...item, percentage: maxSale > 0 ? (item.amount / maxSale) * 100 : 0 })));

    const expMap: Record<string, number> = {};
    filteredExp.forEach(exp => {
      const cat = exp.category || 'ອື່ນໆ';
      expMap[cat] = (expMap[cat] || 0) + exp.amount;
    });
    const sortedExp = Object.keys(expMap).map(key => ({ category: key, amount: expMap[key], percentage: 0 })).sort((a, b) => b.amount - a.amount);
    const maxExp = sortedExp.length > 0 ? sortedExp[0].amount : 0;
    setExpenseChartData(sortedExp.map(item => ({ ...item, percentage: maxExp > 0 ? (item.amount / maxExp) * 100 : 0 })));
  }, [salesHistory, expensesData, filterType, currentDate, customStart, customEnd, products, currentRate]);

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
    if (filterType === 'custom') return `${formatDate(customStart)} - ${formatDate(customEnd)}`;
    const { start } = getDateRange();
    if (filterType === 'day') return formatDate(start);
    return formatDate(start); 
  };

  // 🟢 ຟັງຊັນຈັດການເລືອກວັນທີ (ແກ້ໄຂບັນຫາ Dark Mode)
  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
        setShowDatePicker(false);
    }
    if (selectedDate) {
        if (pickerMode === 'start') setCustomStart(selectedDate);
        else setCustomEnd(selectedDate);
    }
  };

  const profit = filteredTotal - filteredExpenses;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabs}>
          {['day', 'week', 'month', 'year', 'custom'].map((type) => (
            <TouchableOpacity 
                key={type} 
                style={[styles.filterTab, filterType === type && styles.activeTab]} 
                onPress={() => { 
                    setFilterType(type as FilterType); 
                    // 🟢 ເປີດ Modal ທັນທີເມື່ອກົດ "custom"
                    if (type === 'custom') setShowCustomPicker(true); 
                }}
            >
              <Text style={[styles.filterText, filterType === type && styles.activeText]}>
                  {type === 'day' ? 'ມື້' : type === 'week' ? 'ອາທິດ' : type === 'month' ? 'ເດືອນ' : type === 'year' ? 'ປີ' : 'ກຳນົດເອງ'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filterType !== 'custom' ? (
          <View style={styles.navRow}>
            <TouchableOpacity onPress={() => handleNavigateDate('prev')} style={styles.navBtn}><Ionicons name="chevron-back" size={24} color={COLORS.primary} /></TouchableOpacity>
            <Text style={styles.dateLabel}>{getDateLabel()}</Text>
            <TouchableOpacity onPress={() => handleNavigateDate('next')} style={styles.navBtn}><Ionicons name="chevron-forward" size={24} color={COLORS.primary} /></TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.customDateDisplay} onPress={() => setShowCustomPicker(true)}>
            <Ionicons name="calendar" size={20} color={COLORS.primary} />
            <Text style={styles.dateLabel}>{getDateLabel()}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
          <View style={styles.iconCircleWhite}><Ionicons name="cash" size={24} color={COLORS.primary} /></View>
          <View><Text style={styles.statLabelWhite}>ຍອດຂາຍ</Text><Text style={styles.statValueWhite}>{formatNumber(filteredTotal)} ₭</Text></View>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#E0F2F1', borderWidth: 1, borderColor: COLORS.primary }]}>
          <View style={[styles.iconCircle, { backgroundColor: 'white' }]}><Ionicons name="trending-up" size={24} color={COLORS.primary} /></View>
          <View><Text style={[styles.statLabel, {color: COLORS.primary}]}>ກຳໄລ</Text><Text style={[styles.statValue, { color: profit >= 0 ? COLORS.primary : ORANGE_COLOR }]}>{profit >= 0 ? '+' : ''}{formatNumber(profit)}</Text></View>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.secondary }]}>
          <View style={styles.iconCircleWhite}><Ionicons name="receipt" size={24} color={COLORS.secondaryDark} /></View>
          <View><Text style={styles.statLabelWhite}>ອໍເດີ</Text><Text style={styles.statValueWhite}>{filteredOrders}</Text></View>
        </View>
        <View style={[styles.statCard, { backgroundColor: 'white', borderWidth: 1, borderColor: '#eee' }]}>
          <View style={[styles.iconCircle, { backgroundColor: ORANGE_BG }]}><Ionicons name="wallet-outline" size={24} color={ORANGE_COLOR} /></View>
          <View><Text style={styles.statLabel}>ລາຍຈ່າຍ</Text><Text style={[styles.statValue, { color: ORANGE_COLOR }]}>{formatNumber(filteredExpenses)}</Text></View>
        </View>
      </View>

      {lowStockProducts.length > 0 && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}><Ionicons name="alert-circle" size={20} color={ORANGE_COLOR} /><Text style={styles.sectionTitle}>ສິນຄ້າໃກ້ໝົດ ({lowStockProducts.length})</Text></View>
          <FlatList horizontal data={lowStockProducts} keyExtractor={item => item.id!} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 5 }}
            renderItem={({ item }) => (
              <View style={styles.lowStockCard}><Text style={styles.lowStockName} numberOfLines={1}>{item.name}</Text><Text style={styles.lowStockValue}>ເຫຼືອ: {item.stock}</Text></View>
            )}
          />
        </View>
      )}

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>ຍອດຂາຍຕາມໝວດໝູ່</Text>
        {salesChartData.length > 0 ? salesChartData.map((item, index) => (
          <View key={index} style={styles.chartRow}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5}}>
              <Text style={styles.chartLabel}>{item.category}</Text><Text style={styles.chartValue}>{formatNumber(item.amount)} ₭</Text>
            </View>
            <View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: `${item.percentage}%`, backgroundColor: COLORS.primary }]} /></View>
          </View>
        )) : <Text style={styles.noDataText}>ບໍ່ມີຂໍ້ມູນ</Text>}
      </View>

      <View style={[styles.chartContainer, { marginBottom: 30 }]}>
        <Text style={styles.chartTitle}>ລາຍຈ່າຍແຍກຕາມໝວດໝູ່</Text>
        {expenseChartData.length > 0 ? expenseChartData.map((item, index) => (
          <View key={index} style={styles.chartRow}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5}}>
              <Text style={styles.chartLabel}>{item.category}</Text>
              <Text style={[styles.chartValue, {color: ORANGE_COLOR}]}>{formatNumber(item.amount)} ₭</Text>
            </View>
            <View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: `${item.percentage}%`, backgroundColor: ORANGE_COLOR }]} /></View>
          </View>
        )) : <Text style={styles.noDataText}>ບໍ່ມີຂໍ້ມູນ</Text>}
      </View>

      {/* 🟢 Modal ເລືອກວັນທີ (Custom Picker) */}
      <Modal visible={showCustomPicker} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={styles.pickerContainer}>
                <Text style={styles.pickerTitle}>ເລືອກຊ່ວງວັນທີ</Text>
                
                <View style={styles.pickerRow}>
                    <TouchableOpacity 
                        style={[styles.dateInput, pickerMode === 'start' && showDatePicker && styles.activeDateInput]} 
                        onPress={() => { setPickerMode('start'); setShowDatePicker(true); }}
                    >
                        <Text style={styles.pickerLabel}>ເລີ່ມຕົ້ນ</Text>
                        <Text style={styles.pickerValue}>{formatDate(customStart)}</Text>
                    </TouchableOpacity>
                    
                    <Ionicons name="arrow-forward" size={20} color="#ccc" />
                    
                    <TouchableOpacity 
                        style={[styles.dateInput, pickerMode === 'end' && showDatePicker && styles.activeDateInput]} 
                        onPress={() => { setPickerMode('end'); setShowDatePicker(true); }}
                    >
                        <Text style={styles.pickerLabel}>ສິ້ນສຸດ</Text>
                        <Text style={styles.pickerValue}>{formatDate(customEnd)}</Text>
                    </TouchableOpacity>
                </View>

                {showDatePicker && (
                    <View style={{width: '100%', alignItems: 'center', marginVertical: 10, backgroundColor: 'white', borderRadius: 10}}>
                        <DateTimePicker 
                            value={pickerMode === 'start' ? customStart : customEnd} 
                            mode="date" 
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'} 
                            onChange={onDateChange}
                            style={{height: 120, width: '100%', backgroundColor: 'white'}} // 🟢 ແກ້ Dark Mode ໃຫ້ພື້ນຫຼັງຂາວ
                            textColor="black" // 🟢 ບັງຄັບຕົວໜັງສືດຳ
                            themeVariant="light" // 🟢 ບັງຄັບ Light Theme (iOS 13+)
                        />
                        {Platform.OS === 'ios' && (
                            <TouchableOpacity style={styles.iosDoneBtn} onPress={() => setShowDatePicker(false)}>
                                <Text style={styles.iosDoneText}>ຕົກລົງ</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
                
                {!showDatePicker && (
                    <TouchableOpacity style={styles.confirmBtn} onPress={() => setShowCustomPicker(false)}>
                        <Text style={styles.confirmText}>ຢືນຢັນການເລືອກ</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  filterSection: { backgroundColor: 'white', paddingBottom: 10, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, elevation: 5 },
  filterTabs: { paddingHorizontal: 15, marginTop: 10, marginBottom: 10 },
  filterTab: { paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20, marginRight: 8, backgroundColor: '#f0f0f0' },
  activeTab: { backgroundColor: COLORS.primary },
  filterText: { fontFamily: 'Lao-Regular', color: '#666' },
  activeText: { color: 'white', fontFamily: 'Lao-Bold' },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  navBtn: { padding: 5 },
  dateLabel: { fontFamily: 'Lao-Bold', fontSize: 16, color: COLORS.text },
  customDateDisplay: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, padding: 10, backgroundColor: '#f9f9f9', marginHorizontal: 20, borderRadius: 10 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 15, gap: 10, justifyContent: 'space-between' },
  statCard: { width: (width - 40) / 2, padding: 15, borderRadius: 16, marginBottom: 5, elevation: 2, flexDirection: 'column', gap: 10 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  iconCircleWhite: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  statLabel: { fontSize: 12, fontFamily: 'Lao-Regular', color: COLORS.textLight },
  statValue: { fontSize: 18, fontFamily: 'Lao-Bold', color: COLORS.text },
  statLabelWhite: { fontSize: 12, fontFamily: 'Lao-Regular', color: 'rgba(255,255,255,0.9)' },
  statValueWhite: { fontSize: 18, fontFamily: 'Lao-Bold', color: 'white' },
  sectionContainer: { marginTop: 10, paddingHorizontal: 15, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  sectionTitle: { fontFamily: 'Lao-Bold', fontSize: 16, color: COLORS.text },
  lowStockCard: { backgroundColor: ORANGE_BG, padding: 10, borderRadius: 10, marginRight: 10, minWidth: 120, borderWidth: 1, borderColor: '#FFE0B2' },
  lowStockName: { fontFamily: 'Lao-Bold', color: ORANGE_TEXT, fontSize: 12, marginBottom: 4 },
  lowStockValue: { fontFamily: 'Lao-Regular', color: ORANGE_TEXT, fontSize: 10 },
  chartContainer: { backgroundColor: 'white', marginHorizontal: 15, marginBottom: 15, padding: 15, borderRadius: 16, elevation: 2 },
  chartTitle: { fontFamily: 'Lao-Bold', fontSize: 16, color: COLORS.text, marginBottom: 15 },
  chartRow: { marginBottom: 15 },
  chartLabel: { fontFamily: 'Lao-Regular', fontSize: 14, color: COLORS.text },
  chartValue: { fontFamily: 'Lao-Bold', fontSize: 14, color: COLORS.primary },
  progressBarBg: { height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  noDataText: { textAlign: 'center', color: '#ccc', fontFamily: 'Lao-Regular', padding: 20 },
  
  // 🟢 Modal Picker Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  pickerContainer: { width: '85%', backgroundColor: 'white', borderRadius: 20, padding: 20, elevation: 5 },
  pickerTitle: { fontFamily: 'Lao-Bold', fontSize: 18, textAlign: 'center', marginBottom: 20 },
  pickerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  dateInput: { flex: 1, alignItems: 'center', padding: 12, backgroundColor: '#f0f0f0', borderRadius: 10, borderWidth: 1, borderColor: 'transparent' },
  activeDateInput: { borderColor: COLORS.primary, backgroundColor: '#E0F2F1' },
  pickerLabel: { fontSize: 12, color: '#888' },
  pickerValue: { fontFamily: 'Lao-Bold', color: COLORS.primary, marginTop: 5, fontSize: 16 },
  confirmBtn: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  confirmText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 16 },
  iosDoneBtn: { marginTop: 5, padding: 5 },
  iosDoneText: { color: COLORS.primary, fontFamily: 'Lao-Bold' }
});