import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
// @ts-ignore
import * as FileSystem from 'expo-file-system/legacy';
import { printToFileAsync } from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { onValue, ref, remove } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    Image,
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

type FilterType = 'day' | 'week' | 'month' | 'year';
export type ReportTab = 'overview' | 'sales';

interface ReportDashboardProps {
  initialTab?: ReportTab;
}

export default function ReportDashboard({ initialTab = 'overview' }: ReportDashboardProps) {
  const [sales, setSales] = useState<any[]>([]);
  
  const [filterType, setFilterType] = useState<FilterType>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [activeTab, setActiveTab] = useState<ReportTab>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const [filteredSales, setFilteredSales] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [salesByCategory, setSalesByCategory] = useState<any[]>([]);

  const [expandedId, setExpandedId] = useState<string | null>(null);

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
    setTotalOrders(fSales.length);

    // Stats Logic
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

  }, [sales, filterType, currentDate]);

  const handleNavigateDate = (dir: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    const val = dir === 'next' ? 1 : -1;
    if (filterType === 'day') newDate.setDate(newDate.getDate() + val);
    else if (filterType === 'week') newDate.setDate(newDate.getDate() + (val * 7));
    else if (filterType === 'month') newDate.setMonth(newDate.getMonth() + val);
    else if (filterType === 'year') newDate.setFullYear(newDate.getFullYear() + val);
    setCurrentDate(newDate);
  };

  const handleDelete = (id: string) => {
    Alert.alert('ຢືນຢັນການລຶບ', 'ທ່ານຕ້ອງການລຶບປະຫວັດການຂາຍນີ້ແທ້ບໍ່? ຂໍ້ມູນຈະຫາຍໄປຖາວອນ.', [
        { text: 'ຍົກເລີກ', style: 'cancel' },
        { text: 'ລຶບ', style: 'destructive', onPress: async () => await remove(ref(db, `sales/${id}`)) }
    ]);
  };

  const generateExcel = async () => {
      let csvContent = "Date,Bill ID,Source,Payment,Amount\n";
      filteredSales.forEach(s => {
          csvContent += `${new Date(s.date).toLocaleDateString()},#${s.id ? s.id.slice(-4) : '-'},${s.source || 'Shop'},${s.paymentMethod},${parseCurrency(s.total)}\n`;
      });

      try {
          const docDir = FileSystem.documentDirectory;
          const fileName = `${docDir}sales_report_${new Date().getTime()}.csv`;
          
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
          <h1>ລາຍງານຍອດຂາຍ (Soudaphone POS)</h1>
          <p>ວັນທີ: ${formatDate(currentDate)} (${filterType})</p>
          <div class="summary">
            <div><b>ຈຳນວນອໍເດີ:</b> ${totalOrders}</div>
            <div><b>ຍອດຂາຍລວມ:</b> ${formatNumber(totalRevenue)} ₭</div>
          </div>
          <h3>ລາຍການຂາຍ</h3>
          <table>
            <tr><th>ວັນທີ</th><th>ແຫຼ່ງຂາຍ</th><th>ຊຳລະ</th><th class="money">ຍອດເງິນ</th></tr>
            ${filteredSales.map(s => `<tr>
                <td>${new Date(s.date).toLocaleDateString()}</td>
                <td>${s.source || 'ໜ້າຮ້ານ'}</td>
                <td>${s.paymentMethod}</td>
                <td class="money">${formatNumber(s.total)}</td>
            </tr>`).join('')}
          </table>
        </body>
      </html>
    `;
    const { uri } = await printToFileAsync({ html });
    await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  };

  const SummaryCard = ({ label, amount, color, icon }: any) => (
    <View style={[styles.card, { borderLeftColor: color, borderLeftWidth: 5 }]}>
      <View>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={[styles.cardAmount, { color: color }]}>{amount}</Text>
      </View>
      <View style={[styles.iconCircle, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
    </View>
  );

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

  const keyExtractor = (item: any, index: number) => item.id ? item.id.toString() : index.toString();

  // 🟢 Date Change Handler (ແກ້ໄຂ Dark Mode)
  const onDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) setCurrentDate(date);
  };

  // 🟢 Dashboard Content (Overview)
  const DashboardContent = () => (
    <View>
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 15}}>
            <View style={{flex: 1}}>
                <SummaryCard label="ຍອດຂາຍລວມ" amount={`${formatNumber(totalRevenue)} ₭`} color={COLORS.primary} icon="cash" />
            </View>
            <View style={{flex: 1}}>
                <SummaryCard label="ຈຳນວນອໍເດີ" amount={`${totalOrders} ບິນ`} color={COLORS.secondary} icon="receipt" />
            </View>
        </View>
        
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

        <CategoryChart title="💰 ຍອດຂາຍແຍກຕາມໝວດໝູ່" data={salesByCategory} color={COLORS.primary} />
    </View>
  );

  // 🟢 Header Component (Filters & Tabs)
  const HeaderComponent = () => (
    <View>
        <View style={styles.header}>
            <Text style={styles.headerTitle}>ລາຍງານ (Reports)</Text>
            <View style={{flexDirection: 'row', gap: 5}}>
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
            <TouchableOpacity style={[styles.tab, activeTab === 'sales' && styles.activeTab]} onPress={() => setActiveTab('sales')}><Text style={[styles.tabText, activeTab === 'sales' && styles.activeTabText]}>ລາຍການຂາຍ</Text></TouchableOpacity>
        </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {activeTab === 'overview' ? (
          <FlatList
            data={[]} 
            renderItem={null}
            ListHeaderComponent={
                <>
                    <HeaderComponent />
                    <View style={styles.content}>
                        <DashboardContent />
                    </View>
                </>
            }
            contentContainerStyle={{paddingBottom: 50}}
          />
      ) : (
          <FlatList 
            data={filteredSales}
            keyExtractor={keyExtractor}
            ListHeaderComponent={<HeaderComponent />}
            contentContainerStyle={{paddingBottom: 50}}
            renderItem={({item}) => {
                const isExpanded = expandedId === item.id;
                return (
                    <View style={[styles.listItem, { marginHorizontal: 15 }]}>
                        {/* Header ຂອງບິນ */}
                        <TouchableOpacity style={styles.itemHeader} onPress={() => setExpandedId(isExpanded ? null : item.id)}>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                                <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                                    <View style={[styles.iconBox, {backgroundColor: item.paymentMethod === 'CASH' ? '#E8F5E9' : '#E3F2FD'}]}>
                                        <Ionicons name={item.paymentMethod === 'CASH' ? 'cash' : 'qr-code'} size={20} color={item.paymentMethod === 'CASH' ? COLORS.success : COLORS.primary} />
                                    </View>
                                    <View>
                                        <Text style={styles.listTitle}>ບິນ #{item.id ? item.id.slice(-4) : '-'}</Text>
                                        <Text style={styles.listSub}>{new Date(item.date).toLocaleTimeString('lo-LA', {hour: '2-digit', minute:'2-digit'})}</Text>
                                    </View>
                                </View>
                                <View style={{alignItems: 'flex-end'}}>
                                    <Text style={styles.listAmount}>{formatNumber(parseCurrency(item.total))}</Text>
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>{item.source || 'ໜ້າຮ້ານ'}</Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>

                        {/* ລາຍລະອຽດສິນຄ້າ (ສະແດງເມື່ອກົດ) */}
                        {isExpanded && (
                            <View style={styles.itemDetails}>
                                <View style={styles.divider} />
                                {item.items && item.items.map((prod: any, idx: number) => (
                                    <View key={idx} style={styles.prodRow}>
                                        <Text style={styles.prodName}>{prod.name} x{prod.quantity}</Text>
                                        <Text style={styles.prodPrice}>{formatNumber(prod.price * prod.quantity)}</Text>
                                    </View>
                                ))}
                                <View style={styles.divider} />
                                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                                    <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                                    <Text style={styles.deleteText}>ລຶບບິນນີ້</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                );
            }}
            ListEmptyComponent={<Text style={styles.emptyText}>ບໍ່ມີຂໍ້ມູນການຂາຍ</Text>}
          />
      )}

      {/* 🟢 Modal ວັນທີສຳລັບ iOS (ແກ້ໄຂ Dark Mode) */}
      {showDatePicker && (
          Platform.OS === 'ios' ? (
              <Modal visible={true} transparent={true} animationType="fade">
                  <View style={styles.modalOverlay}>
                      <View style={styles.iosDatePickerContainer}>
                          <DateTimePicker 
                              value={currentDate} 
                              mode="date" 
                              display="inline" 
                              onChange={onDateChange} 
                              style={{ height: 320, width: '100%', backgroundColor: 'white' }} 
                              textColor="black" 
                              themeVariant="light"
                          />
                          <TouchableOpacity style={styles.iosDateDoneBtn} onPress={() => setShowDatePicker(false)}>
                              <Text style={styles.iosDateDoneText}>ຕົກລົງ</Text>
                          </TouchableOpacity>
                      </View>
                  </View>
              </Modal>
          ) : (
              <DateTimePicker value={currentDate} mode="date" display="default" onChange={onDateChange} />
          )
      )}
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
  
  // Card & Charts
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 2 },
  cardLabel: { fontSize: 12, color: '#888', fontFamily: 'Lao-Regular' },
  cardAmount: { fontSize: 18, fontFamily: 'Lao-Bold', marginTop: 2 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  
  chartBox: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 15, elevation: 2 },
  chartTitle: { fontFamily: 'Lao-Bold', fontSize: 14, color: '#666', marginBottom: 15 },
  chartLabel: { fontFamily: 'Lao-Regular', fontSize: 13, color: '#444' },
  chartValue: { fontFamily: 'Lao-Bold', fontSize: 13 },
  chartTrack: { height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' },
  chartBar: { height: '100%', borderRadius: 4 },
  chartRow: { marginBottom: 10 },
  
  // List Item Styles
  listItem: { backgroundColor: 'white', borderRadius: 12, marginBottom: 10, elevation: 1, overflow: 'hidden' },
  itemHeader: { padding: 15 },
  listTitle: { fontFamily: 'Lao-Bold', fontSize: 14, color: COLORS.text },
  listSub: { fontFamily: 'Lao-Regular', fontSize: 12, color: '#999' },
  listAmount: { fontFamily: 'Lao-Bold', fontSize: 16, color: COLORS.primary },
  iconBox: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  badge: { backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, alignSelf: 'flex-end', marginTop: 4 },
  badgeText: { fontSize: 10, fontFamily: 'Lao-Bold', color: '#666' },
  
  // Item Details
  itemDetails: { paddingHorizontal: 15, paddingBottom: 15, backgroundColor: '#FAFAFA' },
  prodRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  prodName: { fontFamily: 'Lao-Regular', fontSize: 13, color: '#444' },
  prodPrice: { fontFamily: 'Lao-Bold', fontSize: 13, color: '#333' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', gap: 5 },
  deleteText: { fontFamily: 'Lao-Bold', color: COLORS.danger, fontSize: 12 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999', fontFamily: 'Lao-Regular' },
  
  // Top Products
  topProductsCard: { backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2 },
  sectionHeaderRow: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 10, marginBottom: 10 },
  sectionHeader: { fontFamily: 'Lao-Bold', fontSize: 16, color: COLORS.text },
  topProductRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  rankBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  rankText: { fontFamily: 'Lao-Bold', fontSize: 12, color: '#666' },
  prodImage: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#f0f0f0' },
  // 🟢 ເພີ່ມ styles ທີ່ຂາດໄປ
  prodNameText: { fontFamily: 'Lao-Bold', fontSize: 13, color: COLORS.text }, 
  prodSold: { fontFamily: 'Lao-Regular', fontSize: 11, color: '#666' },
  prodAmount: { fontFamily: 'Lao-Bold', fontSize: 14, color: COLORS.primary },

  // 🟢 iOS Date Picker Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  iosDatePickerContainer: { backgroundColor: 'white', borderRadius: 20, width: '85%', padding: 20, alignItems: 'center' },
  iosDateDoneBtn: { marginTop: 10, padding: 10, width: '100%', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#eee' },
  iosDateDoneText: { fontFamily: 'Lao-Bold', color: COLORS.primary, fontSize: 16 }
});