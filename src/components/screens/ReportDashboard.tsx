import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import { printToFileAsync } from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { onValue, ref } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image, // Import Image
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal
} from 'react-native';
import { db } from '../../firebase';
import { COLORS, formatNumber } from '../../types';

// Helper: ຈັດ Format ວັນທີພາສາລາວ
const formatDateLao = (date: Date) => {
  return date.toLocaleDateString('lo-LA', { day: 'numeric', month: 'long', year: 'numeric' });
};

// Helper: ແປງຄ່າເງິນຈາກ String ທີ່ມີ , ຫຼື space ໃຫ້ເປັນຕົວເລກ
const parseCurrency = (value: any): number => {
    if (value === undefined || value === null || value === '') return 0;
    // ແປງເປັນ string, ລຶບ , ແລະ ຊ່ອງວ່າງອອກ
    const strVal = String(value).replace(/,/g, '').replace(/ /g, '');
    const num = parseFloat(strVal);
    return isNaN(num) ? 0 : num;
};

type FilterType = 'day' | 'week' | 'month' | 'year';

export default function ReportDashboard() {
  // Raw Data
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  
  // Filter State
  const [filterType, setFilterType] = useState<FilterType>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Filtered Data & Stats
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [salesByCategory, setSalesByCategory] = useState<any[]>([]);
  const [expensesByCategory, setExpensesByCategory] = useState<any[]>([]);

  // 1. Fetch Data
  useEffect(() => {
    const salesRef = ref(db, 'sales');
    onValue(salesRef, (snapshot) => {
      const data = snapshot.val();
      setSales(data ? Object.values(data) : []);
    });

    const expRef = ref(db, 'expenses');
    onValue(expRef, (snapshot) => {
      const data = snapshot.val();
      setExpenses(data ? Object.values(data) : []);
    });
  }, []);

  // 2. Filter & Calculate Logic
  useEffect(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (filterType === 'week') {
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      end.setDate(start.getDate() + 6);
    } else if (filterType === 'month') {
      start.setDate(1);
      end.setMonth(start.getMonth() + 1, 0);
    } else if (filterType === 'year') {
      start.setMonth(0, 1);
      end.setMonth(11, 31);
    }

    const fSales = sales.filter(item => {
        const d = new Date(item.date);
        return d >= start && d <= end;
    });

    const fExpenses = expenses.filter(item => {
        const d = new Date(item.date);
        return d >= start && d <= end;
    });

    // ໃຊ້ parseCurrency ເພື່ອຄວາມຊົວ
    const revenue = fSales.reduce((sum, item: any) => sum + parseCurrency(item.total), 0);
    const expense = fExpenses.reduce((sum, item: any) => sum + parseCurrency(item.amount), 0);
    
    setTotalRevenue(revenue);
    setTotalExpense(expense);

    // Calculate Top Products & Categories
    const prodStats: any = {};
    const catStats: any = {};
    
    fSales.forEach((sale: any) => {
        if(sale.items) {
            sale.items.forEach((p: any) => {
                // ເກັບຂໍ້ມູນສິນຄ້າ ລວມທັງຮູບພາບ (imageUrl)
                if(!prodStats[p.id]) prodStats[p.id] = { ...p, totalSold: 0, totalAmount: 0 };
                prodStats[p.id].totalSold += p.quantity;
                prodStats[p.id].totalAmount += (p.price * p.quantity);

                const cat = p.category || 'ອື່ນໆ';
                if(!catStats[cat]) catStats[cat] = 0;
                catStats[cat] += (p.price * p.quantity);
            });
        }
    });

    setTopProducts(Object.values(prodStats).sort((a: any, b: any) => b.totalSold - a.totalSold).slice(0, 5));
    setSalesByCategory(Object.keys(catStats).map(k => ({ label: k, value: catStats[k] })).sort((a,b) => b.value - a.value));

    // Expenses Categories
    const expCatStats: any = {};
    fExpenses.forEach((e: any) => {
        const cat = e.category || 'ອື່ນໆ';
        if(!expCatStats[cat]) expCatStats[cat] = 0;
        expCatStats[cat] += parseCurrency(e.amount);
    });
    setExpensesByCategory(Object.keys(expCatStats).map(k => ({ label: k, value: expCatStats[k] })).sort((a,b) => b.value - a.value));

  }, [sales, expenses, filterType, currentDate]);

  // 3. Date Navigation
  const handleNavigateDate = (dir: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    const val = dir === 'next' ? 1 : -1;
    if (filterType === 'day') newDate.setDate(newDate.getDate() + val);
    else if (filterType === 'week') newDate.setDate(newDate.getDate() + (val * 7));
    else if (filterType === 'month') newDate.setMonth(newDate.getMonth() + val);
    else if (filterType === 'year') newDate.setFullYear(newDate.getFullYear() + val);
    setCurrentDate(newDate);
  };

  // 4. Export Functions (Excel/PDF) - ຫຍໍ້ໄວ້ຄືເກົ່າ
  const generateExcel = async () => { /* ... Logic ເດີມ ... */ 
    Alert.alert("Coming Soon", "Excel export function handles here.");
  };
  const generatePDF = async () => { /* ... Logic ເດີມ ... */ 
    Alert.alert("Coming Soon", "PDF export function handles here.");
  };

  // --- Components ---
  const SummaryCard = ({ label, amount, color, icon }: any) => (
    <View style={[styles.card, { borderLeftColor: color }]}>
        <View>
            <Text style={styles.cardLabel}>{label}</Text>
            <Text style={[styles.cardAmount, { color }]}>{formatNumber(amount)} ₭</Text>
        </View>
        <Ionicons name={icon} size={28} color={color} style={{opacity: 0.8}} />
    </View>
  );

  // Chart 1: ປຽບທຽບ ລາຍຮັບ vs ລາຍຈ່າຍ (ແນວນອນ)
  const HorizontalComparisonChart = () => {
    const maxVal = Math.max(totalRevenue, totalExpense) || 1;
    const primaryColor = COLORS?.primary || '#008B94';
    const expenseColor = '#F57C00';

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚖️ ປຽບທຽບ ລາຍຮັບ vs ລາຍຈ່າຍ</Text>
            
            {/* Revenue Bar */}
            <View style={styles.hChartRow}>
                <View style={styles.hChartLabels}>
                    <Text style={styles.hChartLabelText}>ລາຍຮັບ</Text>
                    <Text style={[styles.hChartValueText, {color: primaryColor}]}>{formatNumber(totalRevenue)} ₭</Text>
                </View>
                <View style={styles.barContainer}>
                    <View style={[styles.bar, { width: `${(totalRevenue / maxVal) * 100}%`, backgroundColor: primaryColor }]} />
                </View>
            </View>

            {/* Expense Bar */}
            <View style={styles.hChartRow}>
                <View style={styles.hChartLabels}>
                    <Text style={styles.hChartLabelText}>ລາຍຈ່າຍ</Text>
                    <Text style={[styles.hChartValueText, {color: expenseColor}]}>{formatNumber(totalExpense)} ₭</Text>
                </View>
                <View style={styles.barContainer}>
                    <View style={[styles.bar, { width: `${(totalExpense / maxVal) * 100}%`, backgroundColor: expenseColor }]} />
                </View>
            </View>
        </View>
    );
  };

  // Chart 2 & 3: Chart ແບບCategory (ໃຊ້ຮ່ວມກັນໄດ້)
  const CategoryChart = ({ title, data, barColor }: { title: string, data: any[], barColor: string }) => {
    const maxVal = Math.max(...data.map(d => d.value)) || 1;
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {data.length > 0 ? data.map((item, index) => (
                <View key={index} style={styles.catRow}>
                    <Text style={styles.catLabel}>{item.label}</Text>
                    <View style={styles.barContainer}>
                        <View style={[styles.bar, { width: `${(item.value / maxVal) * 100}%`, backgroundColor: barColor }]} />
                    </View>
                    <Text style={styles.catValue}>{formatNumber(item.value)}</Text>
                </View>
            )) : <Text style={styles.emptyText}>ບໍ່ມີຂໍ້ມູນ</Text>}
        </View>
    );
  };


  return (
    <ScrollView style={styles.container}>
      {/* Header & Export */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ລາຍງານ</Text>
        <View style={{flexDirection: 'row', gap: 8}}>
            <TouchableOpacity style={[styles.exportBtn, {backgroundColor: '#008B94'}]} onPress={generateExcel}>
                <Ionicons name="document-text" size={16} color="white" />
                <Text style={styles.exportText}>Excel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.exportBtn, {backgroundColor: '#F57C00'}]} onPress={generatePDF}>
                <Ionicons name="print" size={16} color="white" />
                <Text style={styles.exportText}>PDF</Text>
            </TouchableOpacity>
        </View>
      </View>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
         <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginRight: 10}}>
            {['day', 'week', 'month', 'year'].map((t) => (
                <TouchableOpacity 
                    key={t} 
                    style={[styles.filterChip, filterType === t && styles.activeFilter]}
                    onPress={() => setFilterType(t as FilterType)}
                >
                    <Text style={[styles.filterText, filterType === t && {color: 'white'}]}>
                        {t === 'day' ? 'ມື້' : t === 'week' ? 'ອາທິດ' : t === 'month' ? 'ເດືອນ' : 'ປີ'}
                    </Text>
                </TouchableOpacity>
            ))}
         </ScrollView>
         <View style={styles.dateNav}>
             <TouchableOpacity onPress={() => handleNavigateDate('prev')}><Ionicons name="chevron-back" size={20} color="#666" /></TouchableOpacity>
             <TouchableOpacity onPress={() => setShowDatePicker(true)}><Text style={styles.dateLabel}>{formatDateLao(currentDate)}</Text></TouchableOpacity>
             <TouchableOpacity onPress={() => handleNavigateDate('next')}><Ionicons name="chevron-forward" size={20} color="#666" /></TouchableOpacity>
         </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
            <SummaryCard label="ຍອດຂາຍລວມ" amount={totalRevenue} color={COLORS?.primary || '#008B94'} icon="cash" />
            <SummaryCard label="ລາຍຈ່າຍລວມ" amount={totalExpense} color="#F57C00" icon="wallet" />
        </View>
        <SummaryCard 
            label="ກຳໄລສຸດທິ" 
            amount={totalRevenue - totalExpense} 
            color={(totalRevenue - totalExpense) >= 0 ? (COLORS?.primary || '#008B94') : '#F57C00'} 
            icon="trending-up" 
        />

        {/* 1. Chart ປຽບທຽບ ລາຍຮັບ vs ລາຍຈ່າຍ */}
        <HorizontalComparisonChart />

        {/* 2. Chart ລາຍຮັບແຍກຕາມໝວດໝູ່ */}
        <CategoryChart title="💰 ລາຍຮັບຕາມໝວດໝູ່" data={salesByCategory} barColor={COLORS?.primary || '#008B94'} />

        {/* 3. Chart ລາຍຈ່າຍແຍກຕາມໝວດໝູ່ */}
        <CategoryChart title="💸 ລາຍຈ່າຍຕາມໝວດໝູ່" data={expensesByCategory} barColor="#F57C00" />

        {/* Top 5 Products with Images */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 5 ອັນດັບສິນຄ້າຂາຍດີ</Text>
            {topProducts.length > 0 ? topProducts.map((prod, index) => (
                <View key={index} style={styles.prodRow}>
                    <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                        {/* Rank # */}
                        <Text style={styles.rank}>#{index + 1}</Text>
                        
                        {/* Product Image */}
                        <Image 
                            source={prod.imageUrl ? { uri: prod.imageUrl } : { uri: 'https://via.placeholder.com/50' }} 
                            style={styles.prodImage} 
                        />
                        
                        {/* Product Name & Sold Count */}
                        <View style={{marginLeft: 10, flex: 1}}>
                            <Text style={styles.prodName} numberOfLines={1}>{prod.name}</Text>
                            <Text style={styles.prodSold}>ຂາຍແລ້ວ: {prod.totalSold}</Text>
                        </View>
                    </View>
                    <Text style={styles.prodAmount}>{formatNumber(prod.totalAmount)}</Text>
                </View>
            )) : <Text style={styles.emptyText}>ບໍ່ມີຂໍ້ມູນ</Text>}
        </View>

      </View>

      {/* Date Picker Modal */}
      {showDatePicker && (
        Platform.OS === 'ios' ? (
            <Modal visible={true} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.dateContainer}>
                        <DateTimePicker value={currentDate} mode="date" display="inline" onChange={(e, d) => { setShowDatePicker(false); if(d) setCurrentDate(d); }} />
                    </View>
                </View>
            </Modal>
        ) : (
            <DateTimePicker value={currentDate} mode="date" onChange={(e, d) => { setShowDatePicker(false); if(d) setCurrentDate(d); }} />
        )
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F9FA' },
  header: { padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontFamily: 'Lao-Bold', color: '#333' },
  exportBtn: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, alignItems: 'center', gap: 4 },
  exportText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 12 },
  filterBar: { flexDirection: 'row', backgroundColor: 'white', padding: 10, alignItems: 'center', justifyContent: 'space-between', elevation: 1 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 15, backgroundColor: '#f0f0f0', marginRight: 5 },
  activeFilter: { backgroundColor: COLORS?.primary || '#008B94' },
  filterText: { fontFamily: 'Lao-Regular', fontSize: 12, color: '#666' },
  dateNav: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f9f9f9', padding: 5, borderRadius: 10 },
  dateLabel: { fontFamily: 'Lao-Bold', fontSize: 13, color: '#333' },
  content: { padding: 15 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  card: { flex: 1, backgroundColor: 'white', padding: 15, borderRadius: 12, borderLeftWidth: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, elevation: 2 },
  cardLabel: { fontFamily: 'Lao-Regular', color: '#666', fontSize: 12 },
  cardAmount: { fontFamily: 'Lao-Bold', fontSize: 16, marginTop: 5 },
  
  // Section & Charts
  section: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginTop: 15, elevation: 2 },
  sectionTitle: { fontFamily: 'Lao-Bold', fontSize: 16, marginBottom: 15, color: '#333' },
  
  // Horizontal Chart Styles
  hChartRow: { marginBottom: 12 },
  hChartLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  hChartLabelText: { fontFamily: 'Lao-Regular', fontSize: 13, color: '#555' },
  hChartValueText: { fontFamily: 'Lao-Bold', fontSize: 13 },

  // Category Chart Styles
  catRow: { marginBottom: 12 },
  catLabel: { fontFamily: 'Lao-Regular', fontSize: 12, marginBottom: 4, color: '#555' },
  barContainer: { height: 8, backgroundColor: '#eee', borderRadius: 4, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: 4 },
  catValue: { fontFamily: 'Lao-Bold', fontSize: 11, alignSelf: 'flex-end', marginTop: 2, color: '#777' },
  
  // Top Product Styles
  prodRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  rank: { fontFamily: 'Lao-Bold', marginRight: 10, color: '#999', fontSize: 12 },
  prodImage: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#f0f0f0' },
  prodName: { fontFamily: 'Lao-Bold', fontSize: 13, color: '#333' },
  prodSold: { fontFamily: 'Lao-Regular', fontSize: 11, color: '#888' },
  prodAmount: { fontFamily: 'Lao-Bold', color: COLORS?.primary || '#008B94', fontSize: 13 },

  emptyText: { textAlign: 'center', color: '#999', fontFamily: 'Lao-Regular', marginVertical: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  dateContainer: { backgroundColor: 'white', padding: 20, borderRadius: 15, width: '90%' }
});