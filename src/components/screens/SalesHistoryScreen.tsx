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
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView
} from 'react-native';
import { db } from '../../firebase';
import { COLORS, formatDate, formatNumber } from '../../types';

const ORANGE_COLOR = '#F57C00';
type FilterType = 'day' | 'week' | 'month' | 'year';

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
        // ແປງຂໍ້ມູນ ແລະ sort ຈາກໃໝ່ -> ເກົ່າ
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
      const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
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

  // Export Functions (Excel/PDF) - ຫຍໍ້ໄວ້ເພື່ອປະຢັດເນື້ອທີ່
  const generatePDF = async () => { /* ... Logic PDF ເດີມ ... */ };
  const generateExcel = async () => { /* ... Logic Excel ເດີມ ... */ };

  const handleNavigateDate = (dir: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    const val = dir === 'next' ? 1 : -1;
    if (filterType === 'day') newDate.setDate(newDate.getDate() + val);
    else if (filterType === 'week') newDate.setDate(newDate.getDate() + (val * 7));
    else if (filterType === 'month') newDate.setMonth(newDate.getMonth() + val);
    else if (filterType === 'year') newDate.setFullYear(newDate.getFullYear() + val);
    setCurrentDate(newDate);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ປະຫວັດການຂາຍ</Text>
        <View style={styles.dateNav}>
             <TouchableOpacity onPress={() => handleNavigateDate('prev')}><Ionicons name="chevron-back" size={20} color="#666" /></TouchableOpacity>
             <TouchableOpacity onPress={() => setShowDatePicker(true)}><Text style={styles.dateLabel}>{formatDate(currentDate)}</Text></TouchableOpacity>
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

      {/* List */}
      <FlatList
        data={filteredSales}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 15 }}
        ListEmptyComponent={<Text style={styles.emptyText}>ບໍ່ພົບປະຫວັດການຂາຍ</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity style={styles.cardHeader} onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                <View>
                    <Text style={styles.billId}>ບິນ #{item.id.slice(-4)}</Text>
                    <Text style={styles.dateText}>{new Date(item.date).toLocaleTimeString('lo-LA')}</Text>
                </View>
                <View style={{alignItems: 'flex-end'}}>
                    <Text style={styles.amountText}>+{formatNumber(item.total)} ₭</Text>
                    <Text style={styles.paymentText}>{item.paymentMethod}</Text>
                </View>
            </TouchableOpacity>

            {expandedId === item.id && (
                <View style={styles.details}>
                    <View style={styles.divider} />
                    {item.items?.map((prod: any, idx: number) => (
                        <View key={idx} style={styles.itemRow}>
                            <Text style={styles.itemName}>{prod.name} x{prod.quantity}</Text>
                            <Text style={styles.itemPrice}>{formatNumber(prod.price * prod.quantity)}</Text>
                        </View>
                    ))}
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                        <Ionicons name="trash-outline" size={18} color={ORANGE_COLOR} />
                        <Text style={[styles.deleteText, {color: ORANGE_COLOR}]}>ລຶບບິນນີ້</Text>
                    </TouchableOpacity>
                </View>
            )}
          </View>
        )}
      />

      {showDatePicker && (
        Platform.OS === 'ios' ? (
            <View style={styles.modalOverlay}>
                <View style={styles.dateContainer}>
                    <DateTimePicker value={currentDate} mode="date" display="inline" onChange={(e, d) => { setShowDatePicker(false); if(d) setCurrentDate(d); }} />
                </View>
            </View>
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
  
  card: { backgroundColor: 'white', borderRadius: 12, marginBottom: 10, padding: 15, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  billId: { fontFamily: 'Lao-Bold', fontSize: 14, color: '#333' },
  dateText: { fontFamily: 'Lao-Regular', fontSize: 12, color: '#888' },
  amountText: { fontFamily: 'Lao-Bold', fontSize: 16, color: COLORS?.primary || '#008B94' },
  paymentText: { fontFamily: 'Lao-Regular', fontSize: 12, color: '#666' },
  
  details: { marginTop: 10 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 8 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  itemName: { fontFamily: 'Lao-Regular', fontSize: 13, color: '#444' },
  itemPrice: { fontFamily: 'Lao-Bold', fontSize: 13, color: '#333' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', gap: 5, marginTop: 5 },
  deleteText: { fontFamily: 'Lao-Bold', fontSize: 12 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999', fontFamily: 'Lao-Regular' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  dateContainer: { backgroundColor: 'white', padding: 20, borderRadius: 15 }
});