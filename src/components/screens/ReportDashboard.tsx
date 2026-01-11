import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { printToFileAsync } from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { onValue, ref } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { db } from '../../firebase';
import { COLORS, formatDate, formatNumber } from '../../types';

const { width } = Dimensions.get('window');

// ປະເພດການກັ່ນຕອງ
type FilterType = 'day' | 'week' | 'month' | 'year';
type ReportTab = 'overview' | 'sales' | 'expenses' | 'debts';

export default function ReportDashboard() {
  // Data States
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  
  // Filter States
  const [filterType, setFilterType] = useState<FilterType>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // View State
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');

  // Filtered Data
  const [filteredSales, setFilteredSales] = useState<any[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<any[]>([]);
  
  // Totals
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [totalDebt, setTotalDebt] = useState(0);

  // 1. ດຶງຂໍ້ມູນທັງໝົດ
  useEffect(() => {
    const fetchData = () => {
      // Sales
      onValue(ref(db, 'sales'), (snapshot) => {
        const data = snapshot.val();
        if (data) setSales(Object.keys(data).map(key => ({ id: key, ...data[key] })));
        else setSales([]);
      });
      // Expenses
      onValue(ref(db, 'expenses'), (snapshot) => {
        const data = snapshot.val();
        if (data) setExpenses(Object.keys(data).map(key => ({ id: key, ...data[key] })));
        else setExpenses([]);
      });
      // Debts
      onValue(ref(db, 'debts'), (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
            setDebts(list);
            // ໜີ້ສິນນັບຍອດລວມທັງໝົດ (ບໍ່ກ່ຽວກັບວັນທີ)
            const debtSum = list.reduce((sum, item: any) => sum + (Number(item.totalAmount) - Number(item.paidAmount)), 0);
            setTotalDebt(debtSum);
        } else setDebts([]);
      });
    };
    fetchData();
  }, []);

  // 2. Logic ກັ່ນຕອງວັນທີ
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

    // Filter Sales
    const fSales = sales.filter(item => {
        const d = new Date(item.date);
        return d >= start && d <= end;
    });
    setFilteredSales(fSales);
    setTotalRevenue(fSales.reduce((sum, s) => sum + Number(s.total), 0));

    // Filter Expenses
    const fExpenses = expenses.filter(item => {
        const d = new Date(item.date);
        return d >= start && d <= end;
    });
    setFilteredExpenses(fExpenses);
    setTotalExpense(fExpenses.reduce((sum, e) => sum + Number(e.amount), 0));

  }, [sales, expenses, filterType, currentDate]);

  const handleNavigateDate = (dir: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    const val = dir === 'next' ? 1 : -1;
    if (filterType === 'day') newDate.setDate(newDate.getDate() + val);
    else if (filterType === 'week') newDate.setDate(newDate.getDate() + (val * 7));
    else if (filterType === 'month') newDate.setMonth(newDate.getMonth() + val);
    else if (filterType === 'year') newDate.setFullYear(newDate.getFullYear() + val);
    setCurrentDate(newDate);
  };

  // 3. Export PDF Function
  const generatePDF = async () => {
    const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 20px; }
            h1 { color: ${COLORS.primary}; text-align: center; }
            .summary { display: flex; justify-content: space-between; margin-bottom: 20px; padding: 15px; background: #f0f0f0; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: ${COLORS.primary}; color: white; }
            .money { text-align: right; }
          </style>
        </head>
        <body>
          <h1>ລາຍງານສະຫຼຸບ (Soudaphone POS)</h1>
          <p>ວັນທີ: ${formatDate(currentDate)} (${filterType})</p>
          
          <div class="summary">
            <div><b>ຍອດຂາຍ:</b> ${formatNumber(totalRevenue)} ກີບ</div>
            <div><b>ລາຍຈ່າຍ:</b> ${formatNumber(totalExpense)} ກີບ</div>
            <div><b>ກຳໄລ:</b> ${formatNumber(totalRevenue - totalExpense)} ກີບ</div>
          </div>

          <h3>ລາຍການຂາຍ (${filteredSales.length})</h3>
          <table>
            <tr><th>ເວລາ</th><th>ບິນ</th><th>ຈຳນວນເງິນ</th><th>ການຊຳລະ</th></tr>
            ${filteredSales.map(s => `
              <tr>
                <td>${new Date(s.date).toLocaleTimeString()}</td>
                <td>#${s.id.slice(-4)}</td>
                <td class="money">${formatNumber(s.total)}</td>
                <td>${s.paymentMethod}</td>
              </tr>
            `).join('')}
          </table>

          <h3>ລາຍຈ່າຍ (${filteredExpenses.length})</h3>
          <table>
            <tr><th>ເວລາ</th><th>ລາຍການ</th><th>ຈຳນວນເງິນ</th></tr>
            ${filteredExpenses.map(e => `
              <tr>
                <td>${new Date(e.date).toLocaleTimeString()}</td>
                <td>${e.category} (${e.note || '-'})</td>
                <td class="money">${formatNumber(e.amount)}</td>
              </tr>
            `).join('')}
          </table>
        </body>
      </html>
    `;

    try {
      const { uri } = await printToFileAsync({ html });
      await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      Alert.alert('Error', 'ບໍ່ສາມາດສ້າງ PDF ໄດ້');
    }
  };

  // --- Components ---

  const SummaryCard = ({ label, amount, color, icon }: any) => (
    <View style={[styles.card, { borderLeftColor: color, borderLeftWidth: 5 }]}>
      <View>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={[styles.cardAmount, { color }]}>{formatNumber(amount)} ₭</Text>
      </View>
      <View style={[styles.iconCircle, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
    </View>
  );

  // Custom Bar Chart (Simple View-based)
  const SimpleChart = () => {
    const maxVal = Math.max(totalRevenue, totalExpense) || 1;
    const revHeight = (totalRevenue / maxVal) * 150;
    const expHeight = (totalExpense / maxVal) * 150;

    return (
        <View style={styles.chartBox}>
            <Text style={styles.chartTitle}>ປຽບທຽບ ລາຍຮັບ vs ລາຍຈ່າຍ</Text>
            <View style={styles.chartArea}>
                <View style={styles.barGroup}>
                    <Text style={[styles.barLabel, {color: COLORS.primary}]}>{formatNumber(totalRevenue)}</Text>
                    <View style={[styles.bar, { height: revHeight, backgroundColor: COLORS.primary }]} />
                    <Text style={styles.barTitle}>ລາຍຮັບ</Text>
                </View>
                <View style={styles.barGroup}>
                    <Text style={[styles.barLabel, {color: COLORS.danger}]}>{formatNumber(totalExpense)}</Text>
                    <View style={[styles.bar, { height: expHeight, backgroundColor: COLORS.danger }]} />
                    <Text style={styles.barTitle}>ລາຍຈ່າຍ</Text>
                </View>
            </View>
        </View>
    );
  };

  const renderContent = () => {
      switch (activeTab) {
          case 'overview':
              return (
                  <ScrollView showsVerticalScrollIndicator={false}>
                      <SimpleChart />
                      <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 10}}>
                        <View style={{width: '100%'}}><SummaryCard label="ຍອດຂາຍລວມ" amount={totalRevenue} color={COLORS.primary} icon="cash" /></View>
                        <View style={{flex: 1}}><SummaryCard label="ລາຍຈ່າຍ" amount={totalExpense} color={COLORS.danger} icon="wallet" /></View>
                        <View style={{flex: 1}}><SummaryCard label="ກຳໄລສິດທິ" amount={totalRevenue - totalExpense} color={COLORS.success} icon="trending-up" /></View>
                      </View>
                      
                      <View style={styles.debtCard}>
                          <Text style={styles.debtTitle}>ສະຖານະໜີ້ສິນລວມ</Text>
                          <Text style={styles.debtAmount}>{formatNumber(totalDebt)} ₭</Text>
                          <Text style={styles.debtSub}>ທີ່ຍັງຄ້າງຊຳລະ</Text>
                      </View>
                  </ScrollView>
              );
          case 'sales':
              return (
                  <FlatList 
                    data={filteredSales}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{paddingBottom: 50}}
                    renderItem={({item}) => (
                        <View style={styles.listItem}>
                            <View>
                                <Text style={styles.listTitle}>ບິນ #{item.id.slice(-4)}</Text>
                                <Text style={styles.listSub}>{new Date(item.date).toLocaleString('lo-LA')}</Text>
                            </View>
                            <Text style={styles.listAmount}>+{formatNumber(item.total)}</Text>
                        </View>
                    )}
                    ListEmptyComponent={<Text style={styles.emptyText}>ບໍ່ມີຂໍ້ມູນການຂາຍ</Text>}
                  />
              );
          case 'expenses':
              return (
                <FlatList 
                    data={filteredExpenses}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{paddingBottom: 50}}
                    renderItem={({item}) => (
                        <View style={styles.listItem}>
                            <View>
                                <Text style={styles.listTitle}>{item.category}</Text>
                                <Text style={styles.listSub}>{item.note || 'ບໍ່ມີໝາຍເຫດ'}</Text>
                            </View>
                            <Text style={[styles.listAmount, {color: COLORS.danger}]}>-{formatNumber(item.amount)}</Text>
                        </View>
                    )}
                    ListEmptyComponent={<Text style={styles.emptyText}>ບໍ່ມີຂໍ້ມູນລາຍຈ່າຍ</Text>}
                  />
              );
          case 'debts':
              return (
                <FlatList 
                    data={debts} // ສະແດງໜີ້ທັງໝົດບໍ່ກ່ຽວກັບວັນທີ
                    keyExtractor={item => item.id}
                    contentContainerStyle={{paddingBottom: 50}}
                    renderItem={({item}) => (
                        <View style={styles.listItem}>
                            <View>
                                <Text style={styles.listTitle}>{item.title}</Text>
                                <Text style={styles.listSub}>ກຳນົດ: {formatDate(new Date(item.dueDate))}</Text>
                            </View>
                            <View style={{alignItems: 'flex-end'}}>
                                <Text style={[styles.listAmount, {color: '#F57C00'}]}>{formatNumber(item.totalAmount - item.paidAmount)}</Text>
                                <Text style={{fontSize: 10, color: '#999'}}>ຍັງເຫຼືອ</Text>
                            </View>
                        </View>
                    )}
                    ListEmptyComponent={<Text style={styles.emptyText}>ບໍ່ມີໜີ້ສິນ</Text>}
                  />
              );
      }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ລາຍງານ (Reports)</Text>
        <TouchableOpacity style={styles.exportBtn} onPress={generatePDF}>
            <Ionicons name="print-outline" size={20} color="white" />
            <Text style={styles.exportText}>Export PDF</Text>
        </TouchableOpacity>
      </View>

      {/* Date Filter Bar */}
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
            <TouchableOpacity onPress={() => setShowDatePicker(true)}><Text style={styles.dateLabel}>{formatDate(currentDate)}</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => handleNavigateDate('next')}><Ionicons name="chevron-forward" size={20} color="#666" /></TouchableOpacity>
        </View>
      </View>

      {/* Tabs Menu */}
      <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, activeTab === 'overview' && styles.activeTab]} onPress={() => setActiveTab('overview')}><Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>ພາບລວມ</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'sales' && styles.activeTab]} onPress={() => setActiveTab('sales')}><Text style={[styles.tabText, activeTab === 'sales' && styles.activeTabText]}>ການຂາຍ</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'expenses' && styles.activeTab]} onPress={() => setActiveTab('expenses')}><Text style={[styles.tabText, activeTab === 'expenses' && styles.activeTabText]}>ລາຍຈ່າຍ</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'debts' && styles.activeTab]} onPress={() => setActiveTab('debts')}><Text style={[styles.tabText, activeTab === 'debts' && styles.activeTabText]}>ໜີ້ສິນ</Text></TouchableOpacity>
      </View>

      {/* Content Area */}
      <View style={styles.content}>
          {renderContent()}
      </View>

      {showDatePicker && (<DateTimePicker value={currentDate} mode="date" display="default" onChange={(e, d) => { setShowDatePicker(false); if(d) setCurrentDate(d); }} />)}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  
  header: { padding: 20, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 20, fontFamily: 'Lao-Bold', color: COLORS.text },
  exportBtn: { flexDirection: 'row', backgroundColor: COLORS.secondary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignItems: 'center', gap: 5 },
  exportText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 12 },

  filterBar: { flexDirection: 'row', backgroundColor: 'white', padding: 10, alignItems: 'center', justifyContent: 'space-between', elevation: 1 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 15, backgroundColor: '#f0f0f0', marginRight: 5 },
  activeFilter: { backgroundColor: COLORS.primary },
  filterText: { fontFamily: 'Lao-Regular', fontSize: 12, color: '#666' },
  dateNav: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f9f9f9', padding: 5, borderRadius: 10 },
  dateLabel: { fontFamily: 'Lao-Bold', fontSize: 13, color: COLORS.text },

  tabs: { flexDirection: 'row', padding: 10, gap: 10 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: 'white', borderRadius: 10, elevation: 1 },
  activeTab: { backgroundColor: COLORS.primary },
  tabText: { fontFamily: 'Lao-Regular', color: '#666' },
  activeTabText: { color: 'white', fontFamily: 'Lao-Bold' },

  content: { flex: 1, padding: 15 },

  // Card Styles
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 2 },
  cardLabel: { fontSize: 12, color: '#888', fontFamily: 'Lao-Regular' },
  cardAmount: { fontSize: 18, fontFamily: 'Lao-Bold', marginTop: 2 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },

  // Chart Styles
  chartBox: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 15, elevation: 2, alignItems: 'center' },
  chartTitle: { fontFamily: 'Lao-Bold', fontSize: 14, color: '#666', marginBottom: 20 },
  chartArea: { flexDirection: 'row', alignItems: 'flex-end', height: 180, gap: 40 },
  barGroup: { alignItems: 'center' },
  bar: { width: 40, borderRadius: 5 },
  barLabel: { fontSize: 12, fontFamily: 'Lao-Bold', marginBottom: 5 },
  barTitle: { marginTop: 10, fontFamily: 'Lao-Regular', color: '#666' },

  debtCard: { backgroundColor: '#FFF3E0', padding: 15, borderRadius: 12, alignItems: 'center', borderLeftWidth: 5, borderLeftColor: COLORS.secondary },
  debtTitle: { fontSize: 14, fontFamily: 'Lao-Regular', color: '#E65100' },
  debtAmount: { fontSize: 24, fontFamily: 'Lao-Bold', color: '#E65100', marginVertical: 5 },
  debtSub: { fontSize: 12, color: '#EF6C00' },

  // List Styles
  listItem: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listTitle: { fontFamily: 'Lao-Bold', fontSize: 14, color: COLORS.text },
  listSub: { fontFamily: 'Lao-Regular', fontSize: 12, color: '#999' },
  listAmount: { fontFamily: 'Lao-Bold', fontSize: 16, color: COLORS.primary },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999', fontFamily: 'Lao-Regular' }
});