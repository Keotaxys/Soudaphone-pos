import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
// 🟢 1. ແກ້ໄຂການ Import ກັບມາເປັນແບບນີ້ (ມາດຕະຖານ)
import * as FileSystem from 'expo-file-system';
import { shareAsync } from 'expo-sharing';
import { onValue, ref, remove, update } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { COLORS, formatNumber } from '../../types';

const ORANGE_COLOR = '#FF8F00';
const SPECIAL_COLOR = '#9C27B0';

type FilterType = 'day' | 'week' | 'month' | 'year' | 'custom';
const FIXED_EXCHANGE_RATE = 680;

const formatDateLao = (date: Date) => {
  return date.toLocaleDateString('lo-LA', { day: 'numeric', month: 'long', year: 'numeric' });
};

export default function SalesHistoryScreen() {
  const { hasPermission, loading } = useAuth();

  // --- State ---
  const [rawNormalSales, setRawNormalSales] = useState<any[]>([]);
  const [rawSpecialSales, setRawSpecialSales] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]); 
  const [filteredSales, setFilteredSales] = useState<any[]>([]);
  
  const [filterType, setFilterType] = useState<FilterType>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  
  const [datePickerMode, setDatePickerMode] = useState<'current' | 'start' | 'end'>('current');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');

  // 2. Fetch Data
  useEffect(() => {
    if (loading) return;

    if (!hasPermission('accessReports')) {
        console.log("❌ Access Denied: Skipping Fetch");
        return;
    }

    console.log("🚀 Fetching Sales Data...");

    const salesRef = ref(db, 'sales');
    const specialSalesRef = ref(db, 'special_sales');

    const unsubSales = onValue(salesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.keys(data).map(key => ({
            id: key,
            ...data[key],
            sourceType: 'normal',
            date: data[key].date || new Date().toISOString()
        }));
        setRawNormalSales(list);
      } else {
        setRawNormalSales([]);
      }
    });

    const unsubSpecial = onValue(specialSalesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.keys(data).map(key => ({
            id: key,
            ...data[key],
            sourceType: 'special',
            date: data[key].date || new Date().toISOString()
        }));
        setRawSpecialSales(list);
      } else {
        setRawSpecialSales([]);
      }
    });

    return () => {
        unsubSales();
        unsubSpecial();
    };
  }, [loading]); 

  // 3. Merge Data
  useEffect(() => {
      const combined = [...rawNormalSales, ...rawSpecialSales];
      combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setSales(combined);
  }, [rawNormalSales, rawSpecialSales]);

  // 4. Filter Logic
  useEffect(() => {
    let start = new Date(currentDate);
    let end = new Date(currentDate);
    
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (filterType === 'custom') {
        start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
    } else if (filterType === 'week') {
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
    } else if (filterType === 'month') {
        start.setDate(1);
        end = new Date(start);
        end.setMonth(start.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
    } else if (filterType === 'year') {
        start.setMonth(0, 1);
        end = new Date(start);
        end.setFullYear(start.getFullYear() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
    }

    const filtered = sales.filter(item => {
      if (!item.date) return false;
      const d = new Date(item.date);
      if (isNaN(d.getTime())) return false; 
      return d >= start && d <= end;
    });
    
    setFilteredSales(filtered);

  }, [sales, filterType, currentDate, startDate, endDate]);

  // --- Functions ---
  const handleDelete = (item: any) => {
    const node = item.sourceType === 'special' ? 'special_sales' : 'sales';
    const title = item.sourceType === 'special' ? 'ລຶບລາຍການພິເສດ' : 'ລຶບບິນຂາຍ';

    Alert.alert('ຢືນຢັນ', `ຕ້ອງການ${title}ນີ້ແທ້ບໍ່?`, [
      { text: 'ຍົກເລີກ', style: 'cancel' },
      { text: 'ລຶບ', style: 'destructive', onPress: () => remove(ref(db, `${node}/${item.id}`)) }
    ]);
  };

  const openEditModal = (item: any) => {
      setEditingItem(item);
      setEditDescription(item.description || item.note || '');
      setEditAmount(item.amount?.toString() || item.total?.toString() || '');
      setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
      if (!editAmount || !editingItem) return;
      try {
          const updateRef = ref(db, `special_sales/${editingItem.id}`);
          await update(updateRef, {
              description: editDescription,
              amount: parseFloat(editAmount),
              total: parseFloat(editAmount)
          });
          Alert.alert("ສຳເລັດ", "ແກ້ໄຂຂໍ້ມູນຮຽບຮ້ອຍ");
          setShowEditModal(false);
          setEditingItem(null);
      } catch (error) {
          Alert.alert("Error", "ແກ້ໄຂບໍ່ໄດ້");
      }
  };

  const handleExport = async () => {
    if (filteredSales.length === 0) {
        Alert.alert('ແຈ້ງເຕືອນ', 'ບໍ່ມີຂໍ້ມູນໃນຊ່ວງເວລານີ້');
        return;
    }

    let csvContent = "Date,Type,ID,Description/Items,Total(LAK),Total(THB),Payment\n";
    
    filteredSales.forEach(item => {
        let totalLAK = 0;
        let totalTHB = 0;
        let desc = "";
        let type = "";

        if (item.sourceType === 'special') {
            type = "ຂາຍພິເສດ";
            desc = item.description || "ບໍ່ມີລາຍລະອຽດ";
            if (item.currency === 'THB') totalTHB = item.amount;
            else totalLAK = item.amount;
        } else {
            type = "ບິນຂາຍ";
            const correctTotalLAK = getCorrectTotalLAK(item);
            totalTHB = item.currency === 'THB' ? Math.ceil(correctTotalLAK / (item.exchangeRateUsed || FIXED_EXCHANGE_RATE)) : 0;
            totalLAK = item.currency === 'LAK' ? correctTotalLAK : 0;
            desc = item.items ? item.items.map((i: any) => `${i.name} (x${i.quantity})`).join('; ') : "";
        }
        
        const dateStr = new Date(item.date).toLocaleDateString('en-GB');
        csvContent += `${dateStr},${type},${item.id},"${desc}",${totalLAK},${totalTHB},${item.paymentMethod || 'CASH'}\n`;
    });

    // 🟢 2. ໃຊ້ FileSystem.documentDirectory (ແກ້ໄຂຈຸດນີ້)
    const fileName = `${FileSystem.documentDirectory}sales_report.csv`;
    try {
        await FileSystem.writeAsStringAsync(fileName, csvContent, { encoding: 'utf8' });
        await shareAsync(fileName, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' });
    } catch (error) {
        Alert.alert("Error", "Export Failed");
    }
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
      if (Platform.OS === 'android') setShowDatePicker(false);
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
    const isSpecial = item.sourceType === 'special';
    let displayTotal = 0;
    let currencySymbol = '₭';

    if (isSpecial) {
        displayTotal = item.amount || 0;
        currencySymbol = item.currency === 'THB' ? '฿' : '₭';
    } else {
        const correctTotalLAK = getCorrectTotalLAK(item);
        displayTotal = item.currency === 'THB' 
            ? Math.ceil(correctTotalLAK / (item.exchangeRateUsed || FIXED_EXCHANGE_RATE)) 
            : correctTotalLAK;
        currencySymbol = item.currency === 'THB' ? '฿' : '₭';
    }

    return (
      <View style={[styles.card, isSpecial && { borderLeftWidth: 5, borderLeftColor: SPECIAL_COLOR }]}>
        <TouchableOpacity style={styles.cardHeader} onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}>
            <View>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 5}}>
                    {isSpecial && <View style={styles.specialTag}><Text style={styles.specialTagText}>ຂາຍພິເສດ</Text></View>}
                    <Text style={styles.billId}>#{item.id ? item.id.slice(-4) : '...'}</Text>
                </View>
                <Text style={styles.dateText}>{new Date(item.date).toLocaleTimeString('lo-LA')}</Text>
            </View>
            <View style={{alignItems: 'flex-end'}}>
                <Text style={[styles.amountText, isSpecial && {color: SPECIAL_COLOR}]}>+{formatNumber(displayTotal)} {currencySymbol}</Text>
                <Text style={styles.paymentText}>{item.paymentMethod || 'CASH'}</Text>
            </View>
        </TouchableOpacity>

        {expandedId === item.id && (
            <View style={styles.details}>
                <View style={[styles.expandedContent, {padding: 15}]}>
                    
                    {isSpecial ? (
                        <View>
                            <Text style={styles.label}>ລາຍລະອຽດ:</Text>
                            <Text style={styles.value}>{item.description || '-'}</Text>
                        </View>
                    ) : (
                        item.items?.map((prod: any, idx: number) => (
                            <View key={idx} style={styles.itemRow}>
                                <Text style={styles.itemName}>{prod.name} x{prod.quantity}</Text>
                                <Text style={styles.itemPrice}>
                                    {formatNumber(prod.price * prod.quantity)} {prod.priceCurrency === 'THB' ? '฿' : '₭'}
                                </Text>
                            </View>
                        ))
                    )}
                    
                    {!isSpecial && item.discount > 0 && (
                        <View style={styles.itemRow}>
                            <Text style={[styles.itemName, {color: 'red'}]}>ສ່ວນຫຼຸດ</Text>
                            <Text style={[styles.itemPrice, {color: 'red'}]}>-{formatNumber(item.discount)}</Text>
                        </View>
                    )}

                    <View style={styles.divider} />

                    <View style={styles.actionRow}>
                        {isSpecial && hasPermission('canEditProduct') && (
                            <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
                                <Ionicons name="pencil" size={18} color="white" />
                                <Text style={styles.btnText}>ແກ້ໄຂ</Text>
                            </TouchableOpacity>
                        )}

                        {hasPermission('canDeleteProduct') && (
                            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                                <Ionicons name="trash-outline" size={18} color="white" />
                                <Text style={styles.btnText}>ລຶບ</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        )}
      </View>
    );
  };

  if (!loading && !hasPermission('accessReports')) {
      return (
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F9FA'}}>
              <Ionicons name="lock-closed-outline" size={50} color="#ccc" />
              <Text style={{fontFamily: 'Lao-Bold', fontSize: 18, color: '#666', marginTop: 10}}>
                  ທ່ານບໍ່ມີສິດເຂົ້າເຖິງໜ້ານີ້
              </Text>
          </View>
      );
  }

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
        
      {/* Date Filter Bar */}
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
        ListEmptyComponent={
            <View style={{alignItems: 'center', marginTop: 50}}>
                <Ionicons name="document-text-outline" size={50} color="#ddd" />
                <Text style={styles.emptyText}>ບໍ່ພົບປະຫວັດການຂາຍໃນຊ່ວງເວລານີ້</Text>
            </View>
        }
        renderItem={renderItem}
      />

      {/* Modal ແກ້ໄຂ */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>ແກ້ໄຂລາຍການພິເສດ</Text>
                    
                    <Text style={styles.label}>ລາຍລະອຽດ:</Text>
                    <TextInput 
                        style={styles.input} 
                        value={editDescription} 
                        onChangeText={setEditDescription} 
                        placeholder="ໃສ່ລາຍລະອຽດ..."
                    />

                    <Text style={styles.label}>ຈຳນວນເງິນ:</Text>
                    <TextInput 
                        style={styles.input} 
                        value={editAmount} 
                        onChangeText={setEditAmount} 
                        placeholder="0"
                        keyboardType="numeric"
                    />

                    <View style={styles.modalBtnRow}>
                        <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#ccc'}]} onPress={() => setShowEditModal(false)}>
                            <Text style={styles.btnText}>ຍົກເລີກ</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.modalBtn, {backgroundColor: COLORS.primary}]} onPress={handleSaveEdit}>
                            <Text style={styles.btnText}>ບັນທຶກ</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Date Picker */}
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
                            style={{backgroundColor: 'white'}}
                            themeVariant="light"
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
  specialTag: { backgroundColor: SPECIAL_COLOR, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  specialTagText: { color: 'white', fontSize: 10, fontFamily: 'Lao-Bold' },
  details: { backgroundColor: 'white' },
  expandedContent: { backgroundColor: '#f9f9f9', padding: 10 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  itemName: { fontFamily: 'Lao-Regular', fontSize: 14, color: '#333' },
  itemPrice: { fontFamily: 'Lao-Bold', fontSize: 14, color: '#333' },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 15 },
  editBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 5 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF5252', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 5 },
  btnText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 12 },
  label: { fontFamily: 'Lao-Bold', fontSize: 14, color: '#666', marginBottom: 2 },
  value: { fontFamily: 'Lao-Regular', fontSize: 16, color: '#333', marginBottom: 10 },
  emptyText: { textAlign: 'center', marginTop: 10, color: '#999', fontFamily: 'Lao-Regular' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  dateContainer: { backgroundColor: 'white', padding: 20, borderRadius: 15, width: '90%', alignItems: 'center' },
  closeBtn: { marginTop: 15, padding: 10, backgroundColor: '#f0f0f0', borderRadius: 10, width: '100%', alignItems: 'center' },
  closeBtnText: { fontFamily: 'Lao-Bold', color: '#333' },
  modalContent: { backgroundColor: 'white', width: '85%', padding: 20, borderRadius: 15 },
  modalTitle: { fontFamily: 'Lao-Bold', fontSize: 18, marginBottom: 15, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 15, fontFamily: 'Lao-Regular', fontSize: 16 },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  modalBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' }
});