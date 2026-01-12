import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { onValue, ref, remove } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
  Alert,
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

  const handleDelete = (id: string) => {
    Alert.alert('ຢືນຢັນການລຶບ', 'ທ່ານຕ້ອງການລຶບປະຫວັດການຂາຍນີ້ແທ້ບໍ່? ຂໍ້ມູນຈະຫາຍໄປຖາວອນ.', [
        { text: 'ຍົກເລີກ', style: 'cancel' },
        { text: 'ລຶບ', style: 'destructive', onPress: async () => await remove(ref(db, `sales/${id}`)) }
    ]);
  };

  const HeaderComponent = () => (
    <View>
        <View style={styles.header}>
            <Text style={styles.headerTitle}>ປະຫວັດການຂາຍ</Text>
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

        <View style={{flexDirection: 'row', padding: 15, gap: 10}}>
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
                                <Text style={styles.infoText}>📍 ແຫຼ່ງ: {item.source || 'ໜ້າຮ້ານ'}</Text>
                                <Text style={styles.infoText}>💰 ຊຳລະ: {item.paymentMethod}</Text>
                            </View>
                            <View style={styles.divider} />
                            {item.items && item.items.map((prod: any, idx: number) => (
                                <View key={idx} style={styles.prodRow}>
                                    <Text style={styles.prodName}>{prod.name} x{prod.quantity}</Text>
                                    <Text style={styles.prodPrice}>{formatNumber(prod.price * prod.quantity)}</Text>
                                </View>
                            ))}
                            <View style={styles.divider} />
                            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                                <Ionicons name="trash-outline" size={18} color="#F57C00" />
                                <Text style={[styles.deleteText, {color: '#F57C00'}]}>ລຶບບິນນີ້</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            );
        }}
        ListEmptyComponent={<Text style={styles.emptyText}>ບໍ່ມີຂໍ້ມູນການຂາຍ</Text>}
      />
      {showDatePicker && (<DateTimePicker value={currentDate} mode="date" display="default" onChange={(e, d) => { setShowDatePicker(false); if(d) setCurrentDate(d); }} />)}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 20, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 20, fontFamily: 'Lao-Bold', color: COLORS.text },
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
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  infoText: { fontFamily: 'Lao-Regular', fontSize: 12, color: '#666' },
  prodRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom