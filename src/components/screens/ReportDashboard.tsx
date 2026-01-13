import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import { printToFileAsync } from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { onValue, ref } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
  Alert,
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

// Helper: ຈັດ Format ວັນທີພາສາລາວ
const formatDateLao = (date: Date) => {
  return date.toLocaleDateString('lo-LA', { day: 'numeric', month: 'long', year: 'numeric' });
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

    const revenue = fSales.reduce((sum, item: any) => sum + (parseFloat(item.total) || 0), 0);
    const expense = fExpenses.reduce((sum, item: any) => sum + (parseFloat(item.amount) || 0), 0);
    
    setTotalRevenue(revenue);
    setTotalExpense(expense);

    const prodStats: any = {};
    const catStats: any = {};
    
    fSales.forEach((sale: any) => {
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

    const expCatStats: any = {};
    fExpenses.forEach((e: any) => {
        const cat = e.category || 'Other';
        if(!expCatStats[cat]) expCatStats[cat] = 0;
        expCatStats[cat] += (parseFloat(e.amount) || 0);
    });
    setExpensesByCategory(Object.keys(expCatStats).map(k => ({ label: k, value: expCatStats[k] })));

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

  // 4. Export Functions
  const generateExcel = async () => {
    let csvContent = "Date,Type,Description,Amount\n";
    salesByCategory.forEach((cat: any) => {
        csvContent += `${formatDateLao(currentDate)},Sale,${cat.label},${cat.value}\n`;
    });
    expensesByCategory.forEach((cat: any) => {
        csvContent += `${formatDateLao(currentDate)},Expense,${cat.label},-${cat.value}\n`;
    });
    csvContent += `\nSUMMARY,,,\n`;
    csvContent += `,,Total Revenue,${totalRevenue}\n`;
    csvContent += `,,Total Expense,${totalExpense}\n`;
    csvContent += `,,Net Profit,${totalRevenue - totalExpense}\n`;

    try {
        const docDir = (FileSystem as any).documentDirectory;
        const fileName = `${docDir}report_${new Date().getTime()}.csv`;
        await FileSystem.writeAsStringAsync(fileName, csvContent, { encoding: 'utf8' });
        await shareAsync(fileName, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' });
    } catch (error) {
        Alert.alert("Error", "Export ລົ້ມເຫຼວ");
    }
  };

  const generatePDF = async () => {
    const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 20px; }
            h1 { color: ${COLORS?.primary || '#008B94'}; text-align: center; }
            .summary { background: #f0f0f0; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: ${COLORS?.primary || '#008B94'}; color: white; }
            .money { text-align: right; }
          </style>
        </head>
        <body>
          <h1>ລາຍງານສະຫຼຸບ (Soudaphone POS)</h1>
          <p align="center">ວັນທີ: ${formatDateLao(currentDate)} (${filterType})</p>
          
          <div class="summary">
            <div class="row"><b>ຍອດຂາຍລວມ:</b> <span>${formatNumber(totalRevenue)} ₭</span></div>
            <div class="row"><b>ລາຍຈ່າຍລວມ:</b> <span>${formatNumber(totalExpense)} ₭</span></div>
            <hr/>
            <div class="row" style="font-size: 18px; color: ${totalRevenue - totalExpense >= 0 ? '#008B94' : '#F57C00'}">
                <b>ກຳໄລສຸດທິ:</b> <span>${formatNumber(totalRevenue - totalExpense)} ₭</span>
            </div>
          </div>

          <h3>🏆 5 ອັນດັບສິນຄ້າຂາຍດີ</h3>
          <table>
            <tr><th>ຊື່ສິນຄ້າ</th><th>ຈຳນວນ</th><th class="money">ຍອດຂາຍ</th></tr>
            ${topProducts.map(p => `<tr><td>${p.name}</td><td>${p.totalSold}</td><td class="money">${formatNumber(p.totalAmount)}</td></tr>`).join('')}
          </table>

          <h3>📊 ໝວດໝູ່ລາຍຈ່າຍ</h3>
          <table>
            <tr><th>ໝວດໝູ່</th><th class="money">ຈຳນວນເງິນ</th></tr>
            ${expensesByCategory.map(e => `<tr><td>${e.label}</td><td class="money">${formatNumber(e.value)}</td></tr>`).join('')}
          </table>
        </body>
      </html>
    `;
    const { uri } = await printToFileAsync({ html });
    await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
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

  return (
    <ScrollView style={styles.container}>
      {/* Header & Export */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ລາຍງານ</Text>
        <View style={{flexDirection: 'row', gap: 8}}>
            
            {/* Excel = Teal */}
            <TouchableOpacity style={[styles.exportBtn, {backgroundColor: '#008B94'}]} onPress={generateExcel}>
                <Ionicons name="document-text" size={16} color="white" />
                <Text style={styles.exportText}>Excel</Text>
            </TouchableOpacity>

            {/* PDF = Dark Orange */}
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
        <View style={styles.summaryRow}>
            <SummaryCard label="ຍອດຂາຍລວມ" amount={totalRevenue} color={COLORS?.primary || '#008B94'} icon="cash" />
            <SummaryCard label="ລາຍຈ່າຍລວມ" amount={totalExpense} color="#F57C00" icon="wallet" />
        </View>
        
        {/* 🟢 ປັບເງື່ອນໄຂສີ: + Teal, - Orange */}
        <SummaryCard 
            label="ກຳໄລສຸດທິ" 
            amount={totalRevenue - totalExpense} 
            color={(totalRevenue - totalExpense) >= 0 ? (COLORS?.primary || '#008B94') : '#F57C00'} 
            icon="trending-up" 
        />

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 ສິນຄ້າຂາຍດີ 5 ອັນດັບ</Text>
            {topProducts.length > 0 ? topProducts.map((prod, index) => (
                <View key={index} style={styles.prodRow}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Text style={styles.rank}>#{index + 1}</Text>
                        <Text style={styles.prodName}>{prod.name}</Text>
                    </View>
                    <Text style={styles.prodAmount}>{formatNumber(prod.totalAmount)} ₭</Text>
                </View>
            )) : <Text style={styles.emptyText}>ບໍ່ມີຂໍ້ມູນ</Text>}
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 ສັດສ່ວນຍອດຂາຍ</Text>
            {salesByCategory.length > 0 ? salesByCategory.map((cat, index) => (
                <View key={index} style={styles.catRow}>
                    <Text style={styles.catLabel}>{cat.label}</Text>
                    <View style={styles.barContainer}>
                        <View style={[styles.bar, { width: `${(cat.value / totalRevenue) * 100}%` }]} />
                    </View>
                    <Text style={styles.catValue}>{formatNumber(cat.value)}</Text>
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
  catValue: { fontFamily: 'Lao-Bold', fontSize: 12, alignSelf: 'flex-end' },
  emptyText: { textAlign: 'center', color: '#999', fontFamily: 'Lao-Regular', marginVertical: 10 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  dateContainer: { backgroundColor: 'white', padding: 20, borderRadius: 15, width: '90%' }
});