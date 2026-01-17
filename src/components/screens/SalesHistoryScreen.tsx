import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
// @ts-ignore
import * as FileSystem from 'expo-file-system/legacy';
import { shareAsync } from 'expo-sharing';
import { onValue, ref, remove } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { COLORS, formatNumber } from '../../types';

const ORANGE_COLOR = '#FF8F00';
type FilterType = 'day' | 'week' | 'month' | 'year' | 'custom';

const FIXED_EXCHANGE_RATE = 680;

const formatDateLao = (date: Date) => {
  return date.toLocaleDateString('lo-LA', { day: 'numeric', month: 'long', year: 'numeric' });
};

export default function SalesHistoryScreen() {
  const { hasPermission } = useAuth();

  // 🟢 1. ປະກາດ Hooks (useState) ທັງໝົດໄວ້ທາງເທິງກ່ອນ (ຫ້າມມີ return ຂັ້ນ)
  const [sales, setSales] = useState<any[]>([]);
  const [filteredSales, setFilteredSales] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<FilterType>('day');
  
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [datePickerMode, setDatePickerMode] = useState<'current' | 'start' | 'end'>('current');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 🟢 2. ປະກາດ useEffect (ຫ້າມມີ return ກ່ອນໜ້ານີ້)
  useEffect(() => {
    // ຖ້າບໍ່ມີສິດ ກໍບໍ່ຕ້ອງດຶງຂໍ້ມູນ (ປະຢັດຊັບພະຍາກອນ)
    if (!hasPermission('accessReports')) return;

    const salesRef = ref(db, 'sales');
    const unsubscribe = onValue(salesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] })).reverse();
        setSales(list);
      } else {
        setSales([]);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let start = new Date(currentDate);
    let end = new Date(currentDate);
    
    if (filterType === 'custom') {
        start = new Date(startDate);
        end = new Date(endDate);
    } else {
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

    const filtered = sales.filter(item => {
      const d = new Date(item.date);
      return d >= start && d <= end;
    });
    setFilteredSales(filtered);
  }, [sales, filterType, currentDate, startDate, endDate]);

  // --- Functions ---
  const handleExport = async () => {
    if (filteredSales.length === 0) {
        Alert.alert('ແຈ້ງເຕືອນ', 'ບໍ່ມີຂໍ້ມູນໃນຊ່ວງເວລານີ້');
        return;
    }

    let csvContent = "Date,Bill ID,Items,Total(LAK),Total(THB),Payment\n";
    
    filteredSales.forEach(item => {
        const correctTotalLAK = getCorrectTotalLAK(item);
        const totalTHB = item.currency === 'THB' ? Math.ceil(correctTotalLAK / (item.exchangeRateUsed || FIXED_EXCHANGE_RATE)) : 0;
        const totalLAK = item.currency === 'LAK' ? correctTotalLAK : 0;
        
        const dateStr = new Date(item.date).toLocaleDateString('en-GB');
        const itemsStr = item.items.map((i: any) => `${i.name} (x${i.quantity})`).join('; ');
        
        csvContent += `${dateStr},${item.id},"${itemsStr}",${totalLAK},${totalTHB},${item.paymentMethod}\n`;
    });

    const fileName = `${FileSystem.documentDirectory}sales_report_${new Date().getTime()}.csv`;
    try {
        await FileSystem.writeAsStringAsync(fileName, csvContent, { encoding: 'utf8' });
        await shareAsync(fileName, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' });
    } catch (error) {
        Alert.alert("Error", "ບໍ່ສາມາດ Export ໄດ້");
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('ຢືນຢັນ', 'ຕ້ອງການລຶບບິນນີ້ແທ້ບໍ່?', [
      { text: 'ຍົກເລີກ', style: 'cancel' },
      { text: 'ລຶບ', style: 'destructive', onPress: () => remove(ref(db, `sales/${id}`)) }
    ]);
  };

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

  const openDatePicker = (mode: 'current' | 'start' | 'end') => {
      setDatePickerMode(mode);
      setShowDatePicker(true);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
      setShowDatePicker(false);
      if (selectedDate) {
          if (datePickerMode === 'current') setCurrentDate(selectedDate);
          else if (datePickerMode === 'start') setStartDate(selectedDate);
          else if (datePickerMode === 'end') setEndDate(selectedDate);
      }
  };

  const getCorrectTotalLAK = (item: any) => {
    let subTotalLAK = 0;
    if (item.items && Array.isArray(item.items)) {
        item.items.forEach((prod: any) => {
            if (prod.priceCurrency === 'THB') {
                const rate = item.exchangeRateUsed || FIXED_EXCHANGE_RATE;
                subTotalLAK += (prod.price * prod.quantity * rate);
            } else {
                subTotalLAK += (prod.price * prod.quantity);
            }
        });
    }
    const discount = item.discount || 0;
    return subTotalLAK - discount;
  };

  const renderItem = ({ item }: { item: any }) => {
    const correctTotalLAK = getCorrectTotalLAK(item);
    const displayTotal = item.currency === 'THB' 
        ? Math.ceil(correctTotalLAK / (item.exchangeRateUsed || FIXED_EXCHANGE_RATE)) 
        : correctTotalLAK;
    const currencySymbol = item.currency === 'THB' ? '฿' : '₭';

    return (
      <View style={styles.card}>
        <TouchableOpacity style={styles.cardHeader} onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}>
            <View>
                <Text style={styles.billId}>ບິນ #{item.id ? item.id.slice(-4) : '...'}</Text>
                <Text style={styles.dateText}>{new Date(item.date).toLocaleTimeString('lo-LA')}</Text>
            </View>
            <View style={{alignItems: 'flex-end'}}>
                <Text style={styles.amountText}>+{formatNumber(displayTotal)} {currencySymbol}</Text>
                <Text style={styles.paymentText}>{item.paymentMethod || 'CASH'}</Text>
            </View>
        </TouchableOpacity>

        {expandedId === item.id && (
            <View style={styles.details}>
                <View style={styles.expandedHeader}>
                    <View>
                        <Text style={styles.expandedBillId}>ບິນ #{item.id ? item.id.slice(-4) : '...'}</Text>
                        <Text style={styles.expandedDate}>{new Date(item.date).toLocaleTimeString('lo-LA')}</Text>
                    </View>
                    <View style={{alignItems: 'flex-end'}}>
                        <Text style={styles.expandedAmount}>+{formatNumber(displayTotal)} {currencySymbol}</Text>
                        <Text style={styles.expandedPayment}>{item.paymentMethod || 'CASH'}</Text>
                    </View>
                </View>

                <View style={{paddingHorizontal: 15, paddingBottom: 15}}>
                    <View style={styles.divider} />
                    {item.items?.map((prod: any, idx: number) => (
                        <View key={idx} style={styles.itemRow}>
                            <Text style={styles.itemName}>{prod.name} x{prod.quantity}</Text>
                            <Text style={styles.itemPrice}>
                                {formatNumber(prod.price * prod.quantity)} {prod.priceCurrency === 'THB' ? '฿' : '₭'}
                            </Text>
                        </View>
                    ))}
                    {item.discount > 0 && (
                        <View style={styles.itemRow}>
                            <Text style={[styles.itemName, {color: 'red'}]}>ສ່ວນຫຼຸດ</Text>
                            <Text style={[styles.itemPrice, {color: 'red'}]}>-{formatNumber(item.discount)}</Text>
                        </View>
                    )}
                    <View style={[styles.itemRow, {marginTop: 10}]}>
                        <Text style={styles.itemName}>ຮັບເງິນ:</Text>
                        <Text style={styles.itemPrice}>{formatNumber(item.amountReceived)}</Text>
                    </View>
                    <View style={styles.itemRow}>
                        <Text style={[styles.itemName, {fontFamily: 'Lao-Bold'}]}>ເງິນທອນ:</Text>
                        <Text style={[styles.itemPrice, {color: COLORS.primary, fontSize: 16}]}>{formatNumber(item.change)}</Text>
                    </View>

                    {hasPermission('canDeleteProduct') && (
                        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                            <Ionicons name="trash-outline" size={18} color={ORANGE_COLOR} />
                            <Text style={[styles.deleteText, {color: ORANGE_COLOR}]}>ລຶບບິນນີ້</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        )}
      </View>
    );
  };

  // 🟢 3. ຍ້າຍການກວດສອບສິດມາໄວ້ບ່ອນນີ້ (ຫຼັງຈາກ Hooks ທັງໝົດທຳງານແລ້ວ)
  if (!hasPermission('accessReports')) {
      return (
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F9FA'}}>
              <Ionicons name="lock-closed-outline" size={50} color="#ccc" />
              <Text style={{fontFamily: 'Lao-Bold', fontSize: 18, color: '#666', marginTop: 10}}>ທ່ານບໍ່ມີສິດເຂົ້າເຖິງໜ້ານີ້</Text>
          </View>
      );
  }

  // 🟢 4. Return ໜ້າຈໍຫຼັກ
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ປະຫວັດການຂາຍ</Text>
        
        {filteredSales.length > 0 && (
            <TouchableOpacity onPress={handleExport} style={styles.exportBtn}>
                <Ionicons name="share-outline" size={20} color={COLORS.primary} />
                <Text style={{fontFamily: 'Lao-Bold', color: COLORS.primary, marginLeft: 5}}>Export</Text>
            </TouchableOpacity>
        )}
      </View>
        
      <View style={styles.dateNavContainer}>
        {filterType !== 'custom' ? (
             <View style={styles.dateNav}>
                 <TouchableOpacity onPress={() => handleNavigateDate('prev')}><Ionicons name="chevron-back" size={20} color="#666" /></TouchableOpacity>
                 <TouchableOpacity onPress={() => openDatePicker('current')}><Text style={styles.dateLabel}>{formatDateLao(currentDate)}</Text></TouchableOpacity>
                 <TouchableOpacity onPress={() => handleNavigateDate('next')}><Ionicons name="chevron-forward" size={20} color="#666" /></TouchableOpacity>
             </View>
        ) : (
             <View style={styles.customDateNav}>
                 <TouchableOpacity onPress={() => openDatePicker('start')} style={styles.dateBox}>
                     <Text style={styles.dateSmallLabel}>ເລີ່ມຕົ້ນ</Text>
                     <Text style={styles.dateValue}>{formatDateLao(startDate)}</Text>
                 </TouchableOpacity>
                 <Ionicons name="arrow-forward" size={16} color="#999" />
                 <TouchableOpacity onPress={() => openDatePicker('end')} style={styles.dateBox}>
                     <Text style={styles.dateSmallLabel}>ສິ້ນສຸດ</Text>
                     <Text style={styles.dateValue}>{formatDateLao(endDate)}</Text>
                 </TouchableOpacity>
             </View>
        )}
      </View>

      <View style={styles.filterBar}>
         {['day', 'week', 'month', 'year', 'custom'].map((t) => (
            <TouchableOpacity key={t} style={[styles.filterChip, filterType === t && styles.activeFilter]} onPress={() => setFilterType(t as FilterType)}>
                <Text style={[styles.filterText, filterType === t && {color: 'white'}]}>
                    {t === 'day' ? 'ມື້' : t === 'week' ? 'ອາທິດ' : t === 'month' ? 'ເດືອນ' : t === 'year' ? 'ປີ' : 'ກຳນົດເອງ'}
                </Text>
            </TouchableOpacity>
         ))}
      </View>

      <FlatList
        data={filteredSales}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 15 }}
        ListEmptyComponent={<Text style={styles.emptyText}>ບໍ່ພົບປະຫວັດການຂາຍ</Text>}
        renderItem={renderItem}
      />

      {showDatePicker && (
        Platform.OS === 'ios' ? (
            <Modal visible={true} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.dateContainer}>
                        <DateTimePicker 
                            value={datePickerMode === 'current' ? currentDate : datePickerMode === 'start' ? startDate : endDate} 
                            mode="date" 
                            display="inline" 
                            onChange={onDateChange} 
                            textColor="black"
                            themeVariant="light"
                            style={{backgroundColor: 'white'}}
                        />
                        <TouchableOpacity onPress={() => setShowDatePicker(false)} style={styles.closeBtn}>
                            <Text style={styles.closeBtnText}>ປິດ</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        ) : (
            <DateTimePicker 
                value={datePickerMode === 'current' ? currentDate : datePickerMode === 'start' ? startDate : endDate} 
                mode="date" 
                onChange={onDateChange} 
            />
        )
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F9FA' },
  header: { padding: 20, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontFamily: 'Lao-Bold', color: COLORS?.text || '#333' },
  exportBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0F2F1', padding: 8, borderRadius: 8 },
  
  dateNavContainer: { backgroundColor: 'white', paddingBottom: 10, alignItems: 'center' },
  dateNav: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f9f9f9', padding: 8, borderRadius: 10, minWidth: 200, justifyContent: 'center' },
  customDateNav: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateBox: { backgroundColor: '#f9f9f9', padding: 8, borderRadius: 8, alignItems: 'center', minWidth: 100 },
  dateSmallLabel: { fontSize: 10, color: '#999', fontFamily: 'Lao-Regular' },
  dateValue: { fontSize: 12, fontFamily: 'Lao-Bold', color: '#333' },
  dateLabel: { fontFamily: 'Lao-Bold', fontSize: 14 },

  filterBar: { flexDirection: 'row', backgroundColor: 'white', padding: 10, justifyContent: 'center', gap: 8, flexWrap: 'wrap' },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f0f0f0' },
  activeFilter: { backgroundColor: COLORS?.primary || '#008B94' },
  filterText: { fontFamily: 'Lao-Regular', fontSize: 12, color: '#666' },
  
  card: { backgroundColor: 'white', borderRadius: 12, marginBottom: 10, overflow: 'hidden', elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
  billId: { fontFamily: 'Lao-Bold', fontSize: 14, color: '#333' },
  dateText: { fontFamily: 'Lao-Regular', fontSize: 12, color: '#888' },
  amountText: { fontFamily: 'Lao-Bold', fontSize: 16, color: COLORS?.primary || '#008B94' },
  paymentText: { fontFamily: 'Lao-Regular', fontSize: 12, color: '#666' },
  
  details: { backgroundColor: 'white' },
  expandedHeader: { backgroundColor: '#FFECB3', padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  expandedBillId: { fontFamily: 'Lao-Bold', fontSize: 16, color: '#333' },
  expandedDate: { fontFamily: 'Lao-Regular', fontSize: 12, color: '#666' },
  expandedAmount: { fontFamily: 'Lao-Bold', fontSize: 18, color: COLORS?.primary || '#008B94' },
  expandedPayment: { fontFamily: 'Lao-Regular', fontSize: 12, color: '#666' },

  divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  itemName: { fontFamily: 'Lao-Regular', fontSize: 14, color: '#333' },
  itemPrice: { fontFamily: 'Lao-Bold', fontSize: 14, color: '#333' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', gap: 5, marginTop: 15 },
  deleteText: { fontFamily: 'Lao-Bold', fontSize: 12 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999', fontFamily: 'Lao-Regular' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  dateContainer: { backgroundColor: 'white', padding: 20, borderRadius: 15, width: '90%', alignItems: 'center' },
  closeBtn: { marginTop: 15, padding: 10, backgroundColor: '#f0f0f0', borderRadius: 10, width: '100%', alignItems: 'center' },
  closeBtnText: { fontFamily: 'Lao-Bold', color: '#333' }
});