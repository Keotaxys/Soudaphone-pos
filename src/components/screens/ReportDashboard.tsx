import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

// 🟢 ແກ້ໄຂ: ໃຊ້ /legacy ແລະໃສ່ @ts-ignore
// @ts-ignore
import * as FileSystem from 'expo-file-system/legacy';

import { printToFileAsync } from 'expo-print';
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
import { useAuth } from '../../hooks/useAuth'; // 🟢 1. Import useAuth
import { COLORS, formatNumber } from '../../types';

// 🟢 ກຳນົດຄ່າຄົງທີ່ (Fallback)
const FIXED_EXCHANGE_RATE = 680;

const formatDateLao = (date: Date) => {
  return date.toLocaleDateString('lo-LA', { day: 'numeric', month: 'numeric', year: '2-digit' });
};

// 🟢 ຟັງຊັນແປງຄ່າເງິນເປັນ Number ປົກກະຕິ
const parseCurrency = (value: any): number => {
  if (value === undefined || value === null || value === '') return 0;
  const strVal = String(value).replace(/,/g, '').replace(/ /g, '');
  const num = parseFloat(strVal);
  return isNaN(num) ? 0 : num;
};

// 🟢 ຟັງຊັນຄິດໄລ່ເງິນທຽບເທົ່າເປັນກີບ (LAK)
const calculateLAK = (item: any) => {
  const amount = parseCurrency(item.total || item.amount);
  
  // ຖ້າເປັນເງິນບາດ ໃຫ້ຄູນດ້ວຍເລດທີ່ໃຊ້ຕອນນັ້ນ ຫຼື ເລດກາງ
  if (item.currency === 'THB') {
    const rate = item.exchangeRateUsed || FIXED_EXCHANGE_RATE;
    return amount * rate;
  }
  
  // ຖ້າເປັນກີບຢູ່ແລ້ວ ກໍສົ່ງຄ່າກັບໄປເລີຍ
  return amount;
};

type FilterType = 'day' | 'week' | 'month' | 'year' | 'custom';

export default function ReportDashboard() {
  const { hasPermission } = useAuth(); // 🟢 2. ດຶງສິດມາໃຊ້
  
  // 🟢 3. ສ້າງຕົວປ່ຽນ boolean ເພື່ອໃຊ້ເປັນ Dependency ທີ່ໝັ້ນຄົງ (ແກ້ບັນຫາ Loop)
  const canViewFinancials = hasPermission('viewFinancials');

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

  // 1. Fetch Sales Data (Separate Effect)
  useEffect(() => {
    const salesRef = ref(db, 'sales');
    const unsubscribe = onValue(salesRef, (snapshot) => {
      const data = snapshot.val();
      setSales(data ? Object.values(data) : []);
    });
    return () => unsubscribe();
  }, []);

  // 🟢 4. Fetch Expenses Data (Separate Effect using stable dependency)
  useEffect(() => {
    if (canViewFinancials) {
        const expRef = ref(db, 'expenses');
        const unsubscribe = onValue(expRef, (snapshot) => {
            const data = snapshot.val();
            setExpenses(data ? Object.values(data) : []);
        });
        return () => unsubscribe();
    } else {
        setExpenses([]); // ເຄຍຂໍ້ມູນລາຍຈ່າຍຖ້າບໍ່ມີສິດ
    }
  }, [canViewFinancials]); // ✅ ໃຊ້ boolean ແທນ function

  // Helper: Get Filtered Data
  const getFilteredData = () => {
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

    return { fSales, fExpenses, start, end };
  };

  // 2. Calculate Stats
  useEffect(() => {
    const { fSales, fExpenses } = getFilteredData();

    const revenue = fSales.reduce((sum, item: any) => sum + calculateLAK(item), 0);
    const expense = fExpenses.reduce((sum, item: any) => sum + parseCurrency(item.amount), 0); 
    
    setTotalRevenue(revenue);
    setTotalExpense(expense);

    const prodStats: any = {};
    const catStats: any = {};
    
    fSales.forEach((sale: any) => {
        // const saleTotalLAK = calculateLAK(sale); // Unused variable
        
        if(sale.items) {
            sale.items.forEach((p: any) => {
                if(!prodStats[p.id]) prodStats[p.id] = { ...p, totalSold: 0, totalAmount: 0 };
                
                prodStats[p.id].totalSold += p.quantity;
                
                let itemTotalLAK = 0;
                if (p.priceCurrency === 'THB') {
                    const rate = sale.exchangeRateUsed || FIXED_EXCHANGE_RATE;
                    itemTotalLAK = (p.price * p.quantity) * rate;
                } else {
                    itemTotalLAK = p.price * p.quantity;
                }

                prodStats[p.id].totalAmount += itemTotalLAK;

                const cat = p.category || 'ອື່ນໆ';
                if(!catStats[cat]) catStats[cat] = 0;
                catStats[cat] += itemTotalLAK;
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

  // 3. Navigation
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

  // 4. EXPORT EXCEL
  const generateExcel = async () => {
    try {
        const { fSales, fExpenses } = getFilteredData();
        
        let csv = "Date,Type,Category,Description,Total(LAK),Original Total,Currency\n";
        
        fSales.forEach(s => {
            const dateStr = new Date(s.date).toLocaleDateString('lo-LA');
            const totalLAK = calculateLAK(s);
            csv += `${dateStr},Sale,-,Bill #${s.id ? s.id.slice(-4) : '-'},${totalLAK},${s.total},${s.currency}\n`;
        });

        // 🟢 ໃຊ້ variable canViewFinancials ແທນການເອີ້ນ function
        if (canViewFinancials) {
            fExpenses.forEach(e => {
                const dateStr = new Date(e.date).toLocaleDateString('lo-LA');
                csv += `${dateStr},Expense,${e.category},${e.note || '-'},-${parseCurrency(e.amount)},${e.amount},LAK\n`;
            });
        }

        const totalRev = fSales.reduce((s, i) => s + calculateLAK(i), 0);
        const totalExp = canViewFinancials ? fExpenses.reduce((s, i) => s + parseCurrency(i.amount), 0) : 0;
        
        csv += `\nSUMMARY,,,\n`;
        csv += `,,Total Revenue (LAK),${totalRev}\n`;
        
        if (canViewFinancials) {
            csv += `,,Total Expense (LAK),${totalExp}\n`;
            csv += `,,Net Profit (LAK),${totalRev - totalExp}\n`;
        }

        const fileName = `Report_${new Date().getTime()}.csv`;
        const docDir = FileSystem.documentDirectory;
        const fileUri = docDir + fileName;

        await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: 'utf8' });
        await shareAsync(fileUri, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' });

    } catch (error: any) {
        Alert.alert("Error", "Export ລົ້ມເຫຼວ: " + error.message);
    }
  };

  // 5. EXPORT PDF
  const generatePDF = async () => {
    try {
        const { fSales, fExpenses, start, end } = getFilteredData();
        const totalRev = fSales.reduce((s, i) => s + calculateLAK(i), 0);
        const totalExp = canViewFinancials ? fExpenses.reduce((s, i) => s + parseCurrency(i.amount), 0) : 0;
        const profit = totalRev - totalExp;

        // 🟢 ໃຊ້ variable canViewFinancials
        const summarySection = `
            <div class="summary">
                <div class="row"><b>ຍອດຂາຍລວມ (Revenue):</b> <span>${formatNumber(totalRev)} ₭</span></div>
                ${canViewFinancials ? `
                    <div class="row"><b>ລາຍຈ່າຍລວມ (Expense):</b> <span>${formatNumber(totalExp)} ₭</span></div>
                    <hr/>
                    <div class="row" style="font-size: 16px;">
                        <b>ກຳໄລສຸດທິ (Net Profit):</b> 
                        <span class="${profit >= 0 ? 'profit' : 'loss'}">${formatNumber(profit)} ₭</span>
                    </div>
                ` : ''}
            </div>
        `;

        const html = `
        <html>
            <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
                body { font-family: 'Helvetica', sans-serif; padding: 20px; }
                h1 { color: #008B94; text-align: center; }
                .summary { background: #f0f0f0; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                .row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #008B94; color: white; }
                .money { text-align: right; }
                .loss { color: red; }
                .profit { color: green; }
            </style>
            </head>
            <body>
            <h1>ລາຍງານສະຫຼຸບ (POS Report)</h1>
            <p align="center">ວັນທີ: ${formatDateLao(start)} - ${formatDateLao(end)}</p>
            
            ${summarySection}

            <h3>ລາຍການຂາຍລ່າສຸດ (Sales)</h3>
            <table>
                <tr><th>ວັນທີ</th><th>ເລກບິນ</th><th class="money">ຍອດ LAK</th><th class="money">ຍອດເດີມ</th></tr>
                ${fSales.slice(0, 20).map((s: any) => `
                    <tr>
                        <td>${new Date(s.date).toLocaleDateString()}</td>
                        <td>#${s.id ? s.id.slice(-4) : '-'}</td>
                        <td class="money">${formatNumber(calculateLAK(s))}</td>
                        <td class="money" style="color: #888;">${formatNumber(s.total)} ${s.currency}</td>
                    </tr>
                `).join('')}
            </table>
            
            <p align="center" style="margin-top: 20px; color: #888;">Generate by Soudaphone POS</p>
            </body>
        </html>
        `;

        const { uri } = await printToFileAsync({ html });
        await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });

    } catch (error: any) {
        Alert.alert("Error", "PDF ລົ້ມເຫຼວ: " + error.message);
    }
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

      <View style={styles.filterBar}>
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
            
            {/* 🟢 7. ຊອນບັດລາຍຈ່າຍ ຖ້າບໍ່ມີສິດ (ໃຊ້ variable) */}
            {canViewFinancials && (
                <SummaryCard label="ລາຍຈ່າຍລວມ" amount={totalExpense} color="#F57C00" icon="wallet" />
            )}
        </View>
        
        {/* 🟢 8. ຊອນບັດກຳໄລ ຖ້າບໍ່ມີສິດ */}
        {canViewFinancials && (
            <SummaryCard 
                label="ກຳໄລສຸດທິ" 
                amount={totalRevenue - totalExpense} 
                color={(totalRevenue - totalExpense) >= 0 ? (COLORS?.primary || '#008B94') : '#F57C00'} 
                icon="trending-up" 
            />
        )}

        {/* 🟢 9. ຊອນກຣາຟປຽບທຽບ ແລະ ກຣາຟລາຍຈ່າຍ ຖ້າບໍ່ມີສິດ */}
        {canViewFinancials && (
            <>
                <HorizontalComparisonChart />
                <CategoryChart title="💸 ລາຍຈ່າຍຕາມໝວດໝູ່" data={expensesByCategory} barColor="#F57C00" />
            </>
        )}

        <CategoryChart title="💰 ລາຍຮັບຕາມໝວດໝູ່" data={salesByCategory} barColor={COLORS?.primary || '#008B94'} />

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

      {/* Date Picker Modal */}
      {showDatePicker && (
        Platform.OS === 'ios' ? (
            <Modal visible={true} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.dateContainer}>
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
                display="default" 
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

  filterBar: { flexDirection: 'row', backgroundColor: 'white', paddingHorizontal: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'space-between', elevation: 1 },
  filterGroup: { flexDirection: 'row', flex: 1, justifyContent: 'flex-start', flexWrap: 'nowrap', gap: 4 },
  filterChip: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 15, backgroundColor: '#f0f0f0' },
  activeFilter: { backgroundColor: COLORS?.primary || '#008B94' },
  filterText: { fontFamily: 'Lao-Regular', fontSize: 11, color: '#666' },
  
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