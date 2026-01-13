import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
// @ts-ignore
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
import { COLORS, formatNumber } from '../../types';

const ORANGE_COLOR = '#FF8F00';
type FilterType = 'day' | 'week' | 'month' | 'year';

// ອັດຕາແລກປ່ຽນຄົງທີ່ສຳລັບຄຳນວນຍ້ອນຫຼັງ (ຖ້າໃນບິນບໍ່ໄດ້ບັນທຶກໄວ້)
const FIXED_EXCHANGE_RATE = 680;

const formatDateLao = (date: Date) => {
  return date.toLocaleDateString('lo-LA', { day: 'numeric', month: 'long', year: 'numeric' });
};

export default function SalesHistoryScreen() {
  const [sales, setSales] = useState<any[]>([]);
  const [filteredSales, setFilteredSales] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<FilterType>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
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

    const filtered = sales.filter(item => {
      const d = new Date(item.date);
      return d >= start && d <= end;
    });
    setFilteredSales(filtered);
  }, [sales, filterType, currentDate]);

  const handleDelete = (id: string) => {
    Alert.alert('ຢືນຢັນ', 'ຕ້ອງການລຶບບິນນີ້ແທ້ບໍ່?', [
      { text: 'ຍົກເລີກ', style: 'cancel' },
      { text: 'ລຶບ', style: 'destructive', onPress: () => remove(ref(db, `sales/${id}`)) }
    ]);
  };

  const handleNavigateDate = (dir: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    const val = dir === 'next' ? 1 : -1;
    if (filterType === 'day') newDate.setDate(newDate.getDate() + val);
    else if (filterType === 'week') newDate.setDate(newDate.getDate() + (val * 7));
    else if (filterType === 'month') newDate.setMonth(newDate.getMonth() + val);
    else if (filterType === 'year') newDate.setFullYear(newDate.getFullYear() + val);
    setCurrentDate(newDate);
  };

  // 🟢 ຟັງຊັນຄຳນວນເງິນໃໝ່ (Recalculate Total)
  const getCorrectTotalLAK = (item: any) => {
    // 1. ຄຳນວນລາຄາສິນຄ້າທັງໝົດເປັນ ກີບ
    let subTotalLAK = 0;
    
    if (item.items && Array.isArray(item.items)) {
        item.items.forEach((prod: any) => {
            if (prod.priceCurrency === 'THB') {
                // ຖ້າເປັນບາດ ໃຫ້ຄູນ 680 (ຫຼື Rate ທີ່ບັນທຶກໄວ້)
                const rate = item.exchangeRateUsed || FIXED_EXCHANGE_RATE;
                subTotalLAK += (prod.price * prod.quantity * rate);
            } else {
                // ຖ້າເປັນກີບ ບວກເລີຍ
                subTotalLAK += (prod.price * prod.quantity);
            }
        });
    }

    // 2. ລົບສ່ວນຫຼຸດ
    const discount = item.discount || 0;
    const finalTotal = subTotalLAK - discount;

    return finalTotal;
  };

  const renderItem = ({ item }: { item: any }) => {
    // ຄຳນວນຍອດເງິນທີ່ຖືກຕ້ອງ
    const correctTotalLAK = getCorrectTotalLAK(item);
    
    // ກວດສອບວ່າບິນນີ້ຈ່າຍເປັນສະກຸນເງິນຫຍັງ
    // ຖ້າຈ່າຍເປັນ THB ເຮົາຈະເອົາ TotalLAK ຫານ Rate
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
                {/* 🟢 ສະແດງຍອດເງິນທີ່ຄຳນວນໃໝ່ຖືກຕ້ອງ */}
                <Text style={styles.amountText}>+{formatNumber(displayTotal)} {currencySymbol}</Text>
                <Text style={styles.paymentText}>{item.paymentMethod || 'CASH'}</Text>
            </View>
        </TouchableOpacity>

        {expandedId === item.id && (
            <View style={styles.details}>
                {/* 🟢 Header ສີເຫຼືອງໃນ Expanded View */}
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
                    
                    {/* Items List */}
                    {item.items?.map((prod: any, idx: number) => (
                        <View key={idx} style={styles.itemRow}>
                            <Text style={styles.itemName}>{prod.name} x{prod.quantity}</Text>
                            <Text style={styles.itemPrice}>
                                {formatNumber(prod.price * prod.quantity)} {prod.priceCurrency === 'THB' ? '฿' : '₭'}
                            </Text>
                        </View>
                    ))}

                    {/* Discount */}
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

                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                        <Ionicons name="trash-outline" size={18} color={ORANGE_COLOR} />
                        <Text style={[styles.deleteText, {color: ORANGE_COLOR}]}>ລຶບບິນນີ້</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ປະຫວັດການຂາຍ</Text>
        <View style={styles.dateNav}>
             <TouchableOpacity onPress={() => handleNavigateDate('prev')}><Ionicons name="chevron-back" size={20} color="#666" /></TouchableOpacity>
             <TouchableOpacity onPress={() => setShowDatePicker(true)}><Text style={styles.dateLabel}>{formatDateLao(currentDate)}</Text></TouchableOpacity>
             <TouchableOpacity onPress={() => handleNavigateDate('next')}><Ionicons name="chevron-forward" size={20} color="#666" /></TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
         {['day', 'week', 'month', 'year'].map((t) => (
            <TouchableOpacity key={t} style={[styles.filterChip, filterType === t && styles.activeFilter]} onPress={() => setFilterType(t as FilterType)}>
                <Text style={[styles.filterText, filterType === t && {color: 'white'}]}>{t === 'day' ? 'ມື້' : t === 'week' ? 'ອາທິດ' : t === 'month' ? 'ເດືອນ' : 'ປີ'}</Text>
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
                            value={currentDate} 
                            mode="date" 
                            display="inline" 
                            onChange={(e, d) => { setShowDatePicker(false); if(d) setCurrentDate(d); }} 
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
            <DateTimePicker value={currentDate} mode="date" onChange={(e, d) => { setShowDatePicker(false); if(d) setCurrentDate(d); }} />
        )
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F9FA' },
  header: { padding: 20, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontFamily: 'Lao-Bold', color: COLORS?.text || '#333' },
  dateNav: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f9f9f9', padding: 5, borderRadius: 10 },
  dateLabel: { fontFamily: 'Lao-Bold', fontSize: 13 },
  filterBar: { flexDirection: 'row', backgroundColor: 'white', padding: 10, justifyContent: 'center', gap: 10 },
  filterChip: { paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f0f0f0' },
  activeFilter: { backgroundColor: COLORS?.primary || '#008B94' },
  filterText: { fontFamily: 'Lao-Regular', fontSize: 12, color: '#666' },
  
  card: { backgroundColor: 'white', borderRadius: 12, marginBottom: 10, overflow: 'hidden', elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
  billId: { fontFamily: 'Lao-Bold', fontSize: 14, color: '#333' },
  dateText: { fontFamily: 'Lao-Regular', fontSize: 12, color: '#888' },
  amountText: { fontFamily: 'Lao-Bold', fontSize: 16, color: COLORS?.primary || '#008B94' },
  paymentText: { fontFamily: 'Lao-Regular', fontSize: 12, color: '#666' },
  
  // Expanded Styles
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