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
const ORANGE_COLOR = '#F57C00'; // 🟢 ສີສົ້ມເຂັ້ມ

type FilterType = 'day' | 'week' | 'month' | 'year';

export default function ReportDashboard() {
  const [sales, setSales] = useState<any[]>([]);
  
  const [filterType, setFilterType] = useState<FilterType>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [filteredSales, setFilteredSales] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  
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
    setFilteredSales(fSales.reverse());
    setTotalRevenue(fSales.reduce((sum, s) => sum + parseCurrency(s.total || s.amountReceived), 0));
    setTotalOrders(fSales.length);

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

  const onDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) setCurrentDate(date);
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

  const HeaderComponent = () => (
    <View>
        <View style={styles.header}>
            <Text style={styles.headerTitle}>ປະຫວັດການຂາຍ</Text>
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

        <View style={{flexDirection: 'row', padding: 15, gap: 10, paddingBottom: 5}}>
            <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>ຍອດຂາຍລວມ</Text>
                <Text style={styles.summaryAmount}>{formatNumber(totalRevenue)} ₭</Text>
            </View>
            <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>ຈຳນວນອໍເດີ</Text>
                <Text style={[styles.summaryAmount, {color: COLORS.secondary}]}>{totalOrders}</Text>
            </View>
        </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList 
        data={filteredSales}
        keyExtractor={item => item.id!}
        ListHeaderComponent={<HeaderComponent />}
        contentContainerStyle={{paddingBottom: 50}}
        renderItem={({item}) => {
            const isExpanded = expandedId === item.id;
            return (
                <View style={[styles.listItem, { marginHorizontal: 15 }]}>
                    {/* Header Item */}
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

                    {isExpanded && (
                        <View style={styles.itemDetails}>
                            <View style={styles.infoRow}>
                                <View style={styles.infoChip}>
                                    <Ionicons name="storefront-outline" size={14} color="#666" />
                                    <Text style={styles.infoText}>{item.source || 'ໜ້າຮ້ານ'}</Text>
                                </View>
                                <View style={styles.infoChip}>
                                    <Ionicons name="card-outline" size={14} color="#666" />
                                    <Text style={styles.infoText}>{item.paymentMethod}</Text>
                                </View>
                            </View>

                            <View style={styles.divider} />
                            
                            {item.items && item.items.map((prod: any, idx: number) => (
                                <View key={idx} style={styles.prodRow}>
                                    <Text style={styles.prodName}>{prod.name} x{prod.quantity}</Text>
                                    <Text style={styles.prodPrice}>{formatNumber(prod.price * prod.quantity)}</Text>
                                </View>
                            ))}
                            
                            <View style={styles.divider} />
                            
                            {/* 🟢 ປຸ່ມລຶບສີສົ້ມເຂັ້ມ (ຕາມທີ່ຕ້ອງການ) */}
                            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                                <Ionicons name="trash-outline" size={18} color={ORANGE_COLOR} />
                                <Text style={[styles.deleteText, {color: ORANGE_COLOR}]}>ລຶບບິນນີ້</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            );
        }}
        ListEmptyComponent={<Text style={styles.emptyText}>ບໍ່ມີຂໍ້ມູນການຂາຍ</Text>}
      />

      {/* Date Picker Modal */}
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
            <DateTimePicker 
              value={currentDate} 
              mode="date" 
              display="default" 
              onChange={onDateChange} 
            />
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
  
  summaryCard: { flex: 1, backgroundColor: 'white', padding: 15, borderRadius: 10, alignItems: 'center', elevation: 1 },
  summaryLabel: { fontSize: 12, color: '#888', fontFamily: 'Lao-Regular' },
  summaryAmount: { fontSize: 16, fontFamily: 'Lao-Bold', color: COLORS.primary, marginTop: 5 },

  listItem: { backgroundColor: 'white', borderRadius: 12, marginBottom: 10, elevation: 1, overflow: 'hidden' },
  itemHeader: { padding: 15 },
  listTitle: { fontFamily: 'Lao-Bold', fontSize: 14, color: COLORS.text },
  listSub: { fontFamily: 'Lao-Regular', fontSize: 12, color: '#999' },
  listAmount: { fontFamily: 'Lao-Bold', fontSize: 16, color: COLORS.primary },
  iconBox: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  badge: { backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, alignSelf: 'flex-end', marginTop: 4 },
  badgeText: { fontSize: 10, fontFamily: 'Lao-Bold', color: '#666' },

  itemDetails: { paddingHorizontal: 15, paddingBottom: 15, backgroundColor: '#FAFAFA' },
  infoRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  infoChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'white', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, borderWidth: 1, borderColor: '#eee' },
  infoText: { fontFamily: 'Lao-Regular', fontSize: 12, color: '#666' },
  
  prodRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  prodName: { fontFamily: 'Lao-Regular', fontSize: 13, color: '#444' },
  prodPrice: { fontFamily: 'Lao-Bold', fontSize: 13, color: '#333' },
  
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', gap: 5 },
  deleteText: { fontFamily: 'Lao-Bold', fontSize: 12 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999', fontFamily: 'Lao-Regular' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  iosDatePickerContainer: { backgroundColor: 'white', borderRadius: 20, width: '85%', padding: 20, alignItems: 'center' },
  iosDateDoneBtn: { marginTop: 10, padding: 10, width: '100%', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#eee' },
  iosDateDoneText: { fontFamily: 'Lao-Bold', color: COLORS.primary, fontSize: 16 }
});