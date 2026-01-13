import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import { shareAsync } from 'expo-sharing';
import { onValue, ref } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { db } from '../../firebase';
import { COLORS, formatNumber } from '../../types';

// Helper: ຈັດ Format ວັນທີພາສາລາວ (ແບບຫຍໍ້ເພື່ອປະຢັດພື້ນທີ່)
const formatDateLao = (date: Date) => {
  return date.toLocaleDateString('lo-LA', { day: 'numeric', month: 'numeric', year: '2-digit' });
};

const parseCurrency = (value: any): number => {
    if (value === undefined || value === null || value === '') return 0;
    const strVal = String(value).replace(/,/g, '').replace(/ /g, '');
    const num = parseFloat(strVal);
    return isNaN(num) ? 0 : num;
};

type FilterType = 'day' | 'week' | 'month' | 'year' | 'custom';

export default function ReportDashboard() {
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  
  const [filterType, setFilterType] = useState<FilterType>('day');
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'single' | 'start' | 'end'>('single');

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

  // 2. Filter Logic
  useEffect(() => {
    let start = new Date();
    let end = new Date();

    if (filterType === 'custom') {
        start = new Date(startDate);
        end = new Date(endDate);
    } else {
        start = new Date(currentDate);
        end = new Date(currentDate);
        
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
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const fSales = sales.filter(item => {
        const d = new Date(item.date);
        return d >= start && d <= end;
    });

    const fExpenses = expenses.filter(item => {
        const d = new Date(item.date);
        return d >= start && d <= end;
    });

    const revenue = fSales.reduce((sum, item: any) => sum + parseCurrency(item.total), 0);
    const expense = fExpenses.reduce((sum, item: any) => sum + parseCurrency(item.amount), 0);
    
    setTotalRevenue(revenue);
    setTotalExpense(expense);

    const prodStats: any = {};
    const catStats: any = {};
    fSales.forEach((sale: any) => {
        if(sale.items) {
            sale.items.forEach((p: any) => {
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

    const expCatStats: any = {};
    fExpenses.forEach((e: any) => {
        const cat = e.category || 'ອື່ນໆ';
        if(!expCatStats[cat]) expCatStats[cat] = 0;
        expCatStats[cat] += parseCurrency(e.amount);
    });
    setExpensesByCategory(Object.keys(expCatStats).map(k => ({ label: k, value: expCatStats[k] })).sort((a,b) => b.value - a.value));

  }, [sales, expenses, filterType, currentDate, startDate, endDate]);

  const handleNavigateDate = (dir: 'prev' | 'next') => {
    if (filterType === 'custom') return;
    const newDate = new Date(currentDate);
    const val = dir === 'next' ? 1 : -1;
    if (filterType === 'day') newDate.setDate(newDate.getDate() + val);
    else if (filterType === 'week') newDate.setDate(newDate.getDate() + (val * 7));
    else if (filterType === 'month') newDate.setMonth(newDate.getMonth() + val);
    else if (filterType === 'year') newDate.setFullYear(newDate.getFullYear() + val);
    setCurrentDate(newDate);
  };

  const openDatePicker = (mode: 'single' | 'start' | 'end') => {
    setPickerMode(mode);
    setShowDatePicker(true);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) {
        if (pickerMode === 'single') setCurrentDate(selectedDate);
        if (pickerMode === 'start') setStartDate(selectedDate);
        if (pickerMode === 'end') setEndDate(selectedDate);
    }
  };

  const generateExcel = async () => {
    let csvContent = "Date,Type,Description,Amount\n";
    salesByCategory.forEach((cat: any) => csvContent += `${formatDateLao(currentDate)},Sale,${cat.label},${cat.value}\n`);
    expensesByCategory.forEach((cat: any) => csvContent += `${formatDateLao(currentDate)},Expense,${cat.label},-${cat.value}\n`);
    try {
        const docDir = (FileSystem as any).documentDirectory;
        const fileName = `${docDir}report_${new Date().getTime()}.csv`;
        await FileSystem.writeAsStringAsync(fileName, csvContent, { encoding: 'utf8' });
        await shareAsync(fileName, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' });
    } catch (error) { Alert.alert("Error", "Export Failed"); }
  };

  const generatePDF = async () => {
    Alert.alert("Coming Soon", "PDF Export will be available here.");
  };

  const SummaryCard = ({ label, amount, color, icon }: any) => (
    <View style={[styles.card, { borderLeftColor: color }]}>
        <View>
            <Text style={styles.cardLabel}>{label}</Text>
            <Text style={[styles.cardAmount, { color }]}>{formatNumber(amount)} ₭</Text>
        </View>
        <Ionicons name={icon} size={28} color={color} style={{opacity: 0.8}} />
    </View>
  );

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

  const HorizontalComparisonChart = () => {
    const maxVal = Math.max(totalRevenue, totalExpense) || 1;
    const primaryColor = COLORS?.primary || '#008B94';
    const expenseColor = '#F57C00';
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚖️ ປຽບທຽບ ລາຍຮັບ vs ລາຍຈ່າຍ</Text>
            <View style={styles.hChartRow}>
                <View style={styles.hChartLabels}><Text style={styles.hChartLabelText}>ລາຍຮັບ</Text><Text style={[styles.hChartValueText, {color: primaryColor}]}>{formatNumber(totalRevenue)} ₭</Text></View>
                <View style={styles.barContainer}><View style={[styles.bar, { width: `${(totalRevenue / maxVal) * 100}%`, backgroundColor: primaryColor }]} /></View>
            </View>
            <View style={styles.hChartRow}>
                <View style={styles.hChartLabels}><Text style={styles.hChartLabelText}>ລາຍຈ່າຍ</Text><Text style={[styles.hChartValueText, {color: expenseColor}]}>{formatNumber(totalExpense)} ₭</Text></View>
                <View style={styles.barContainer}><View style={[styles.bar, { width: `${(totalExpense / maxVal) * 100}%`, backgroundColor: expenseColor }]} /></View>
            </View>
        </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ລາຍງານ</Text>
        <View style={{flexDirection: 'row', gap: 8}}>
            <TouchableOpacity style={[styles.exportBtn, {backgroundColor: '#008B94'}]} onPress={generateExcel}><Ionicons name="document-text" size={16} color="white" /><Text style={styles.exportText}>Excel</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.exportBtn, {backgroundColor: '#F57C00'}]} onPress={generatePDF}><Ionicons name="print" size={16} color="white" /><Text style={styles.exportText}>PDF</Text></TouchableOpacity>
        </View>
      </View>

      {/* 🟢 Filter Bar ແບບແຖວດຽວ ເຕັມພື້ນທີ່ */}
      <View style={styles.filterBar}>
         {/* ສ່ວນປຸ່ມກົດ (Flex 1 ເພື່ອໃຫ້ຍືດເຕັມທີ່) */}
         <View style={styles.filterGroup}>
            {['day', 'week', 'month', 'year', 'custom'].map((t) => (
                <TouchableOpacity 
                    key={t} 
                    style={[styles.filterChip, filterType === t && styles.activeFilter]}
                    onPress={() => setFilterType(t as FilterType)}
                >
                    <Text style={[styles.filterText, filterType === t && {color: 'white'}]}>
                        {t === 'day' ? 'ມື້' : t === 'week' ? 'ອາທິດ' : t === 'month' ? 'ເດືອນ' : t === 'year' ? 'ປີ' : 'ກຳນົດ'}
                    </Text>
                </TouchableOpacity>
            ))}
         </View>

         {/* ສ່ວນວັນທີ (ຢູ່ດ້ານຂວາສຸດ) */}
         <View style={styles.dateNav}>
             {filterType !== 'custom' ? (
                 <>
                    <TouchableOpacity onPress={() => handleNavigateDate('prev')} hitSlop={10}><Ionicons name="chevron-back" size={18} color="#666" /></TouchableOpacity>
                    <TouchableOpacity onPress={() => openDatePicker('single')}>
                        <Text style={styles.dateLabel}>{formatDateLao(currentDate)}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleNavigateDate('next')} hitSlop={10}><Ionicons name="chevron-forward" size={18} color="#666" /></TouchableOpacity>
                 </>
             ) : (
                 <View style={{flexDirection: 'row', alignItems: 'center', gap: 3}}>
                    <TouchableOpacity onPress={() => openDatePicker('start')} style={styles.customDateBtn}>
                        <Text style={styles.customDateText}>{formatDateLao(startDate)}</Text>
                    </TouchableOpacity>
                    <Text style={{fontSize: 10}}>-</Text>
                    <TouchableOpacity onPress={() => openDatePicker('end')} style={styles.customDateBtn}>
                        <Text style={styles.customDateText}>{formatDateLao(endDate)}</Text>
                    </TouchableOpacity>
                 </View>
             )}
         </View>
      </View>

      <View style={styles.content}>
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

        <HorizontalComparisonChart />
        <CategoryChart title="💰 ລາຍຮັບຕາມໝວດໝູ່" data={salesByCategory} barColor={COLORS?.primary || '#008B94'} />
        <CategoryChart title="💸 ລາຍຈ່າຍຕາມໝວດໝູ່" data={expensesByCategory} barColor="#F57C00" />

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 5 ອັນດັບສິນຄ້າຂາຍດີ</Text>
            {topProducts.length > 0 ? topProducts.map((prod, index) => (
                <View key={index} style={styles.prodRow}>
                    <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                        <Text style={styles.rank}>#{index + 1}</Text>
                        <Image source={prod.imageUrl ? { uri: prod.imageUrl } : { uri: 'https://via.placeholder.com/50' }} style={styles.prodImage} />
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

      {/* Date Picker Modal (Fix iOS Dark Mode) */}
      {showDatePicker && (
        Platform.OS === 'ios' ? (
            <Modal visible={true} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.dateContainer}>
                        {/* 🟢 Fix: themeVariant="light" ແລະ textColor="black" */}
                        <DateTimePicker 
                            value={pickerMode === 'start' ? startDate : pickerMode === 'end' ? endDate : currentDate} 
                            mode="date" 
                            display="inline"
                            themeVariant="light"
                            textColor="black"
                            style={{backgroundColor: 'white'}}
                            onChange={onDateChange} 
                        />
                        <TouchableOpacity onPress={() => setShowDatePicker(false)} style={styles.closeBtn}>
                            <Text style={styles.closeBtnText}>ປິດ</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        ) : (
            <DateTimePicker 
                value={pickerMode === 'start' ? startDate : pickerMode === 'end' ? endDate : currentDate} 
                mode="date" 
                onChange={onDateChange} 
            />
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

  // 🟢 ປັບ Styles ສຳລັບ Single Row
  filterBar: { flexDirection: 'row', backgroundColor: 'white', paddingHorizontal: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'space-between', elevation: 1 },
  filterGroup: { flexDirection: 'row', flex: 1, justifyContent: 'flex-start', flexWrap: 'nowrap', gap: 4 }, // ໃຊ້ gap ແທນ margin
  filterChip: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 15, backgroundColor: '#f0f0f0' }, // ຫຼຸດ padding
  activeFilter: { backgroundColor: COLORS?.primary || '#008B94' },
  filterText: { fontFamily: 'Lao-Regular', fontSize: 11, color: '#666' }, // ຫຼຸດ font size
  
  dateNav: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#f9f9f9', padding: 5, borderRadius: 8, marginLeft: 5 },
  dateLabel: { fontFamily: 'Lao-Bold', fontSize: 12, color: '#333' },
  customDateBtn: { paddingHorizontal: 4, paddingVertical: 2, backgroundColor: '#fff', borderRadius: 4, borderWidth: 1, borderColor: '#ddd' },
  customDateText: { fontSize: 10, fontFamily: 'Lao-Bold', color: '#333' },

  content: { padding: 15 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  card: { flex: 1, backgroundColor: 'white', padding: 15, borderRadius: 12, borderLeftWidth: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, elevation: 2 },
  cardLabel: { fontFamily: 'Lao-Regular', color: '#666', fontSize: 12 },
  cardAmount: { fontFamily: 'Lao-Bold', fontSize: 16, marginTop: 5 },
  
  section: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginTop: 15, elevation: 2 },
  sectionTitle: { fontFamily: 'Lao-Bold', fontSize: 16, marginBottom: 15, color: '#333' },
  
  hChartRow: { marginBottom: 12 },
  hChartLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  hChartLabelText: { fontFamily: 'Lao-Regular', fontSize: 13, color: '#555' },
  hChartValueText: { fontFamily: 'Lao-Bold', fontSize: 13 },
  
  catRow: { marginBottom: 12 },
  catLabel: { fontFamily: 'Lao-Regular', fontSize: 12, marginBottom: 4, color: '#555' },
  barContainer: { height: 8, backgroundColor: '#eee', borderRadius: 4, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: 4 },
  catValue: { fontFamily: 'Lao-Bold', fontSize: 11, alignSelf: 'flex-end', marginTop: 2, color: '#777' },
  
  prodRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  rank: { fontFamily: 'Lao-Bold', marginRight: 10, color: '#999', fontSize: 12 },
  prodImage: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#f0f0f0' },
  prodName: { fontFamily: 'Lao-Bold', fontSize: 13, color: '#333' },
  prodSold: { fontFamily: 'Lao-Regular', fontSize: 11, color: '#888' },
  prodAmount: { fontFamily: 'Lao-Bold', color: COLORS?.primary || '#008B94', fontSize: 13 },

  emptyText: { textAlign: 'center', color: '#999', fontFamily: 'Lao-Regular', marginVertical: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  dateContainer: { backgroundColor: 'white', padding: 20, borderRadius: 15, width: '90%' },
  closeBtn: { marginTop: 10, padding: 10, alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 10 },
  closeBtnText: { fontFamily: 'Lao-Bold', color: '#333' }
});