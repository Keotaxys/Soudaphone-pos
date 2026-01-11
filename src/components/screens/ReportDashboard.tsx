import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
// @ts-ignore
import * as FileSystem from 'expo-file-system/legacy';
import { printToFileAsync } from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { onValue, ref } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
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

type FilterType = 'day' | 'week' | 'month' | 'year';
type ReportTab = 'overview' | 'sales' | 'expenses' | 'debts';

export default function ReportDashboard() {
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  
  const [filterType, setFilterType] = useState<FilterType>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');

  const [filteredSales, setFilteredSales] = useState<any[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<any[]>([]);
  
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [totalDebt, setTotalDebt] = useState(0);
  
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [salesByCategory, setSalesByCategory] = useState<any[]>([]);
  const [expensesByCategory, setExpensesByCategory] = useState<any[]>([]);

  const parseCurrency = (value: any) => {
      if (value === undefined || value === null || value === '') return 0;
      const strVal = String(value).replace(/,/g, '').replace(/ /g, '');
      const num = parseFloat(strVal);
      return isNaN(num) ? 0 : num;
  };

  useEffect(() => {
    const fetchData = () => {
      onValue(ref(db, 'sales'), (snapshot) => {
        const data = snapshot.val();
        if (data) setSales(Object.keys(data).map(key => ({ id: key, ...data[key] })));
        else setSales([]);
      });
      onValue(ref(db, 'expenses'), (snapshot) => {
        const data = snapshot.val();
        if (data) setExpenses(Object.keys(data).map(key => ({ id: key, ...data[key] })));
        else setExpenses([]);
      });
      onValue(ref(db, 'debts'), (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const list = Object.keys(data).map(key => {
                const item = data[key];
                const total = parseCurrency(item.originalAmount || item.totalAmount || item.amount);
                const paid = parseCurrency(item.paidAmount || item.paid);
                let remaining = parseCurrency(item.remainingBalance);
                if (remaining === 0 && total > 0) remaining = total - paid;
                return { ...item, id: key, remainingBalance: remaining };
            });
            setDebts(list);
            const debtSum = list.reduce((sum, item: any) => sum + item.remainingBalance, 0);
            setTotalDebt(debtSum);
        } else {
            setDebts([]);
            setTotalDebt(0);
        }
      });
    };
    fetchData();
  }, []);

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
    setFilteredSales(fSales);
    setTotalRevenue(fSales.reduce((sum, s) => sum + parseCurrency(s.total || s.amountReceived), 0));

    // Stats
    const productStats: any = {};
    const catStats: any = {};

    fSales.forEach(sale => {
        if (sale.items && Array.isArray(sale.items)) {
            sale.items.forEach((item: any) => {
                if (!productStats[item.name]) {
                    productStats[item.name] = { ...item, totalSold: 0, totalAmount: 0 };
                }
                productStats[item.name].totalSold += item.quantity;
                productStats[item.name].totalAmount += (item.price * item.quantity);

                const catName = item.category || 'ທົ່ວໄປ';
                if (!catStats[catName]) catStats[catName] = 0;
                catStats[catName] += (item.price * item.quantity);
            });
        }
    });

    const sortedProducts = Object.values(productStats).sort((a: any, b: any) => b.totalSold - a.totalSold).slice(0, 5);
    setTopProducts(sortedProducts);

    const sortedSalesCat = Object.keys(catStats)
        .map(key => ({ label: key, value: catStats[key] }))
        .sort((a, b) => b.value - a.value);
    setSalesByCategory(sortedSalesCat);

    const fExpenses = expenses.filter(item => {
        const d = new Date(item.date);
        return d >= start && d <= end;
    });
    setFilteredExpenses(fExpenses);
    setTotalExpense(fExpenses.reduce((sum, e) => sum + parseCurrency(e.amount), 0));

    const expCatStats: any = {};
    fExpenses.forEach(exp => {
        const catName = exp.category || 'ອື່ນໆ';
        if (!expCatStats[catName]) expCatStats[catName] = 0;
        expCatStats[catName] += parseCurrency(exp.amount);
    });

    const sortedExpCat = Object.keys(expCatStats)
        .map(key => ({ label: key, value: expCatStats[key] }))
        .sort((a, b) => b.value - a.value);
    setExpensesByCategory(sortedExpCat);

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

  const generateExcel = async () => {
      let csvContent = "Date,Type,Category,Description,Amount\n";
      filteredSales.forEach(s => {
          csvContent += `${new Date(s.date).toLocaleDateString()},Sale,-,Bill #${s.id ? s.id.slice(-4) : '-'},${parseCurrency(s.total)}\n`;
      });
      filteredExpenses.forEach(e => {
          csvContent += `${new Date(e.date).toLocaleDateString()},Expense,${e.category},${e.note || '-'},-${parseCurrency(e.amount)}\n`;
      });

      try {
          const docDir = FileSystem.documentDirectory;
          const fileName = `${docDir}report_${new Date().getTime()}.csv`;
          
          await FileSystem.writeAsStringAsync(fileName, csvContent, { encoding: 'utf8' });
          await shareAsync(fileName, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' });
      } catch (error) {
          Alert.alert("Error", "ບໍ່ສາມາດ Export Excel ໄດ້: " + error);
      }
  };

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
            <div><b>ຍອດຂາຍ:</b> ${formatNumber(totalRevenue)} ₭</div>
            <div><b>ລາຍຈ່າຍ:</b> ${formatNumber(totalExpense)} ₭</div>
            <div><b>ກຳໄລ:</b> ${formatNumber(totalRevenue - totalExpense)} ₭</div>
          </div>
          <h3>ສິນຄ້າຂາຍດີ 5 ອັນດັບ</h3>
          <table>
            <tr><th>ຊື່ສິນຄ້າ</th><th>ຈຳນວນຂາຍ</th><th>ຍອດເງິນ</th></tr>
            ${topProducts.map(p => `<tr><td>${p.name}</td><td>${p.totalSold}</td><td class="money">${formatNumber(p.totalAmount)}</td></tr>`).join('')}
          </table>
        </body>
      </html>
    `;
    const { uri } = await printToFileAsync({ html });
    await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  };

  const SummaryCard = ({ label, amount, color, icon, isProfit = false }: any) => {
    const displayColor = isProfit && amount < 0 ? COLORS.danger : color;
    return (
        <View style={[styles.card, { borderLeftColor: displayColor, borderLeftWidth: 5 }]}>
        <View>
            <Text style={styles.cardLabel}>{label}</Text>
            <Text style={[styles.cardAmount, { color: displayColor }]}>
                {isProfit && amount > 0 ? '+' : ''}{formatNumber(amount)} ₭
            </Text>
        </View>
        <View style={[styles.iconCircle, { backgroundColor: displayColor + '20' }]}>
            <Ionicons name={icon} size={24} color={displayColor} />
        </View>
        </View>
    );
  };

  const CategoryChart = ({ title, data, color }: { title: string, data: any[], color: string }) => {
      const maxValue = Math.max(...data.map(d => d.value)) || 1;
      if (data.length === 0) return null;
      return (
          <View style={styles.chartBox}>
              <Text style={styles.chartTitle}>{title}</Text>
              {data.map((item, index) => (
                  <View key={index} style={styles.chartRow}>
                      <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5}}>
                          <Text style={styles.chartLabel}>{item.label}</Text>
                          <Text style={[styles.chartValue, {color}]}>{formatNumber(item.value)} ₭</Text>
                      </View>
                      <View style={styles.chartTrack}>
                          <View style={[styles.chartBar, { width: `${(item.value / maxValue) * 100}%`, backgroundColor: color }]} />
                      </View>
                  </View>
              ))}
          </View>
      );
  };

  // 🟢 Horizontal Chart (ລວງນອນ)
  const HorizontalChart = () => {
    const maxVal = Math.max(totalRevenue, totalExpense) || 1;
    return (
        <View style={styles.chartBox}>
            <Text style={styles.chartTitle}>ປຽບທຽບ ລາຍຮັບ vs ລາຍຈ່າຍ</Text>
            {/* ລາຍຮັບ (Income) */}
            <View style={styles.chartRow}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5}}>
                    <Text style={styles.chartLabel}>ລາຍຮັບ</Text>
                    <Text style={[styles.chartValue, {color: COLORS.primary}]}>{formatNumber(totalRevenue)} ₭</Text>
                </View>
                <View style={styles.chartTrack}>
                    <View style={[styles.chartBar, { width: `${(totalRevenue / maxVal) * 100}%`, backgroundColor: COLORS.primary }]} />
                </View>
            </View>
            {/* ລາຍຈ່າຍ (Expense) - ສີສົ້ມ */}
            <View style={styles.chartRow}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5}}>
                    <Text style={styles.chartLabel}>ລາຍຈ່າຍ</Text>
                    <Text style={[styles.chartValue, {color: '#F57C00'}]}>{formatNumber(totalExpense)} ₭</Text>
                </View>
                <View style={styles.chartTrack}>
                    <View style={[styles.chartBar, { width: `${(totalExpense / maxVal) * 100}%`, backgroundColor: '#F57C00' }]} />
                </View>
            </View>
        </View>
    );
  };

  const keyExtractor = (item: any, index: number) => item.id ? item.id.toString() : index.toString();

  const renderContent = () => {
      switch (activeTab) {
          case 'overview':
              const profit = totalRevenue - totalExpense;
              return (
                  <ScrollView showsVerticalScrollIndicator={false}>
                      <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 10}}>
                        <View style={{width: '100%'}}>
                            <SummaryCard label="ກຳໄລສຸດທິ" amount={profit} color={COLORS.success} icon="trending-up" isProfit={true} />
                        </View>
                        <View style={{flex: 1}}><SummaryCard label="ຍອດຂາຍລວມ" amount={totalRevenue} color={COLORS.primary} icon="cash" /></View>
                        {/* 🟢 ລາຍຈ່າຍ ໃຊ້ສີສົ້ມ */}
                        <View style={{flex: 1}}><SummaryCard label="ລາຍຈ່າຍ" amount={totalExpense} color="#F57C00" icon="wallet" /></View>
                      </View>
                      
                      <HorizontalChart />

                      {topProducts.length > 0 && (
                          <View style={styles.topProductsCard}>
                              <View style={styles.sectionHeaderRow}>
                                <Text style={styles.sectionHeader}>🏆 5 ອັນດັບສິນຄ້າຂາຍດີ</Text>
                              </View>
                              {topProducts.map((prod, index) => (
                                  <View key={index} style={styles.topProductRow}>
                                      <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                                          <View style={[styles.rankBadge, index === 0 ? {backgroundColor: '#FFD700'} : index === 1 ? {backgroundColor: '#C0C0C0'} : index === 2 ? {backgroundColor: '#CD7F32'} : {}]}>
                                            <Text style={[styles.rankText, index < 3 ? {color: 'white'} : {}]}>{index + 1}</Text>
                                          </View>
                                          <Image source={prod.imageUrl ? { uri: prod.imageUrl } : { uri: 'https://via.placeholder.com/50' }} style={styles.prodImage} />
                                          <View style={{marginLeft: 10}}>
                                              <Text style={styles.prodName} numberOfLines={1}>{prod.name}</Text>
                                              <Text style={styles.prodSold}>ຂາຍອອກ: {prod.totalSold} ໜ່ວຍ</Text>
                                          </View>
                                      </View>
                                      <Text style={styles.prodAmount}>{formatNumber(prod.totalAmount)}</Text>
                                  </View>
                              ))}
                          </View>
                      )}

                      <CategoryChart title="💰 ລາຍຮັບແຍກຕາມໝວດໝູ່" data={salesByCategory} color={COLORS.primary} />
                      {/* 🟢 ລາຍຈ່າຍແຍກຕາມໝວດໝູ່ ໃຊ້ສີສົ້ມ */}
                      <CategoryChart title="💸 ລາຍຈ່າຍແຍກຕາມໝວດໝູ່" data={expensesByCategory} color="#F57C00" />

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
                    keyExtractor={keyExtractor}
                    contentContainerStyle={{paddingBottom: 50}}
                    renderItem={({item}) => (
                        <View style={styles.listItem}>
                            <View>
                                <Text style={styles.listTitle}>ບິນ #{item.id ? item.id.slice(-4) : '-'}</Text>
                                <Text style={styles.listSub}>{new Date(item.date).toLocaleString('lo-LA')}</Text>
                            </View>
                            <Text style={styles.listAmount}>+{formatNumber(parseCurrency(item.total))}</Text>
                        </View>
                    )}
                    ListEmptyComponent={<Text style={styles.emptyText}>ບໍ່ມີຂໍ້ມູນການຂາຍ</Text>}
                  />
              );
          case 'expenses':
              return (
                <FlatList 
                    data={filteredExpenses}
                    keyExtractor={keyExtractor}
                    contentContainerStyle={{paddingBottom: 50}}
                    renderItem={({item}) => (
                        <View style={styles.listItem}>
                            <View>
                                <Text style={styles.listTitle}>{item.category}</Text>
                                <Text style={styles.listSub}>{item.note || 'ບໍ່ມີໝາຍເຫດ'}</Text>
                            </View>
                            {/* 🟢 ລາຍການລາຍຈ່າຍ ໃຊ້ສີສົ້ມ */}
                            <Text style={[styles.listAmount, {color: '#F57C00'}]}>-{formatNumber(parseCurrency(item.amount))}</Text>
                        </View>
                    )}
                    ListEmptyComponent={<Text style={styles.emptyText}>ບໍ່ມີຂໍ້ມູນລາຍຈ່າຍ</Text>}
                  />
              );
          case 'debts':
              return (
                <FlatList 
                    data={debts}
                    keyExtractor={keyExtractor}
                    contentContainerStyle={{paddingBottom: 50}}
                    renderItem={({item}) => (
                        <View style={styles.listItem}>
                            <View>
                                <Text style={styles.listTitle}>{item.title}</Text>
                                <Text style={styles.listSub}>ກຳນົດ: {formatDate(new Date(item.dueDate))}</Text>
                            </View>
                            <View style={{alignItems: 'flex-end'}}>
                                <Text style={[styles.listAmount, {color: '#F57C00'}]}>{formatNumber(item.remainingBalance)}</Text>
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ລາຍງານ (Reports)</Text>
        <View style={{flexDirection: 'row', gap: 5}}>
            {/* 🟢 ປຸ່ມ Excel ສີ Theme */}
            <TouchableOpacity style={[styles.exportBtn, {backgroundColor: COLORS.primary}]} onPress={generateExcel}>
                <Ionicons name="document-text-outline" size={16} color="white" />
                <Text style={styles.exportText}>Excel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportBtn} onPress={generatePDF}>
                <Ionicons name="print-outline" size={16} color="white" />
                <Text style={styles.exportText}>PDF</Text>
            </TouchableOpacity>
        </View>
      </View>

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

      <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, activeTab === 'overview' && styles.activeTab]} onPress={() => setActiveTab('overview')}><Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>ພາບລວມ</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'sales' && styles.activeTab]} onPress={() => setActiveTab('sales')}><Text style={[styles.tabText, activeTab === 'sales' && styles.activeTabText]}>ການຂາຍ</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'expenses' && styles.activeTab]} onPress={() => setActiveTab('expenses')}><Text style={[styles.tabText, activeTab === 'expenses' && styles.activeTabText]}>ລາຍຈ່າຍ</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'debts' && styles.activeTab]} onPress={() => setActiveTab('debts')}><Text style={[styles.tabText, activeTab === 'debts' && styles.activeTabText]}>ໜີ້ສິນ</Text></TouchableOpacity>
      </View>

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
  exportBtn: { flexDirection: 'row', backgroundColor: '#F57C00', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, alignItems: 'center', gap: 3 },
  exportText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 11 },
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
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 2 },
  cardLabel: { fontSize: 12, color: '#888', fontFamily: 'Lao-Regular' },
  cardAmount: { fontSize: 18, fontFamily: 'Lao-Bold', marginTop: 2 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  
  // Chart Styles
  chartBox: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 15, elevation: 2 },
  chartTitle: { fontFamily: 'Lao-Bold', fontSize: 14, color: '#666', marginBottom: 10 },
  chartRow: { marginBottom: 10 },
  chartLabel: { fontFamily: 'Lao-Regular', fontSize: 13, color: '#444' },
  chartValue: { fontFamily: 'Lao-Bold', fontSize: 13 },
  chartTrack: { height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' },
  chartBar: { height: '100%', borderRadius: 4 },

  debtCard: { backgroundColor: '#FFF3E0', padding: 15, borderRadius: 12, alignItems: 'center', borderLeftWidth: 5, borderLeftColor: COLORS.secondary },
  debtTitle: { fontSize: 14, fontFamily: 'Lao-Regular', color: '#E65100' },
  debtAmount: { fontSize: 24, fontFamily: 'Lao-Bold', color: '#E65100', marginVertical: 5 },
  debtSub: { fontSize: 12, color: '#EF6C00' },
  listItem: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listTitle: { fontFamily: 'Lao-Bold', fontSize: 14, color: COLORS.text },
  listSub: { fontFamily: 'Lao-Regular', fontSize: 12, color: '#999' },
  listAmount: { fontFamily: 'Lao-Bold', fontSize: 16, color: COLORS.primary },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999', fontFamily: 'Lao-Regular' },
  
  // Top Products Styles
  topProductsCard: { backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2 },
  sectionHeaderRow: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 10, marginBottom: 10 },
  sectionHeader: { fontFamily: 'Lao-Bold', fontSize: 16, color: COLORS.text },
  topProductRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  rankBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  rankText: { fontFamily: 'Lao-Bold', fontSize: 12, color: '#666' },
  prodImage: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#f0f0f0' },
  prodName: { fontFamily: 'Lao-Bold', fontSize: 13, color: COLORS.text },
  prodSold: { fontFamily: 'Lao-Regular', fontSize: 11, color: '#666' },
  prodAmount: { fontFamily: 'Lao-Bold', fontSize: 14, color: COLORS.primary }
});