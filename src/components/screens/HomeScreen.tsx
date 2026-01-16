import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker'; // 🟢 Import ປະຕິທິນ
import { onValue, ref } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { db } from '../../firebase';
import { COLORS, formatDate, formatNumber, Product, SaleRecord } from '../../types';

const { width } = Dimensions.get('window');
const ORANGE_COLOR = '#FF7043';
const ORANGE_BG = '#FFF3E0';

interface HomeScreenProps {
  salesHistory: SaleRecord[];
  products: Product[];
  onQuickAddProduct: () => void;
  onQuickScan: () => void;
  onQuickCustomer: () => void;
}

// 🟢 ເພີ່ມ 'custom' ເຂົ້າໄປໃນ Type
type FilterType = 'day' | 'week' | 'month' | 'year' | 'custom';

export default function HomeScreen({ 
  salesHistory, 
  products,
  onQuickAddProduct,
  onQuickScan,
  onQuickCustomer
}: HomeScreenProps) {
  
  const [filterType, setFilterType] = useState<FilterType>('day');
  const [currentDate, setCurrentDate] = useState(new Date());

  // 🟢 State ສຳລັບ Custom Filter
  const [customStartDate, setCustomStartDate] = useState(new Date());
  const [customEndDate, setCustomEndDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end'>('start');
  
  const [expensesData, setExpensesData] = useState<any[]>([]);
  const [filteredTotal, setFilteredTotal] = useState(0);
  const [filteredOrders, setFilteredOrders] = useState(0);
  const [filteredExpenses, setFilteredExpenses] = useState(0);

  useEffect(() => {
    const expenseRef = ref(db, 'expenses');
    const unsubscribe = onValue(expenseRef, (snapshot) => {
      if (snapshot.exists()) setExpensesData(Object.values(snapshot.val()));
      else setExpensesData([]);
    });
    return () => unsubscribe();
  }, []);

  const getDateRange = () => {
    let start = new Date(currentDate);
    let end = new Date(currentDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    switch (filterType) {
      case 'week':
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        start.setDate(1);
        end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'year':
        start.setMonth(0, 1);
        end.setMonth(11, 31);
        end.setHours(23, 59, 59, 999);
        break;
      // 🟢 Logic ສຳລັບ Custom Range
      case 'custom':
        start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        break;
    }
    return { start, end };
  };

  useEffect(() => {
    const { start, end } = getDateRange();
    
    const fSales = salesHistory.filter(sale => {
      const d = new Date(sale.date);
      return d >= start && d <= end && sale.status !== 'ຍົກເລີກ';
    });

    const fExp = expensesData.filter(exp => {
      const d = new Date(exp.date);
      return d >= start && d <= end;
    });

    setFilteredTotal(fSales.reduce((sum, sale) => sum + sale.total, 0));
    setFilteredOrders(fSales.length);
    setFilteredExpenses(fExp.reduce((sum, exp) => sum + exp.amount, 0));

  }, [salesHistory, expensesData, filterType, currentDate, customStartDate, customEndDate]);

  const handleNavigateDate = (dir: 'prev' | 'next') => {
    if (filterType === 'custom') return; // ຖ້າເປັນ Custom ບໍ່ໃຫ້ກົດເລື່ອນ
    
    const newDate = new Date(currentDate);
    const val = dir === 'next' ? 1 : -1;
    if (filterType === 'day') newDate.setDate(newDate.getDate() + val);
    else if (filterType === 'week') newDate.setDate(newDate.getDate() + (val * 7));
    else if (filterType === 'month') newDate.setMonth(newDate.getMonth() + val);
    else if (filterType === 'year') newDate.setFullYear(newDate.getFullYear() + val);
    setCurrentDate(newDate);
  };

  const getDateLabel = () => {
    const { start, end } = getDateRange();
    if (filterType === 'custom') {
        return `${formatDate(start)} - ${formatDate(end)}`;
    }
    return formatDate(start); 
  };

  // 🟢 Handle ເປີດປະຕິທິນ
  const openDatePicker = (mode: 'start' | 'end') => {
    setDatePickerMode(mode);
    setShowDatePicker(true);
  };

  // 🟢 Handle ເລືອກວັນທີ
  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) {
        if (datePickerMode === 'start') {
            setCustomStartDate(selectedDate);
            // ຖ້າວັນເລີ່ມ ຫຼາຍກວ່າ ວັນຈົບ, ໃຫ້ດັນວັນຈົບໄປເທົ່າກັນ
            if (selectedDate > customEndDate) setCustomEndDate(selectedDate);
        } else {
            // ຖ້າວັນຈົບ ນ້ອຍກວ່າ ວັນເລີ່ມ, ບໍ່ໃຫ້ເລືອກ (ຫຼືໃຫ້ເທົ່າກັນ)
            if (selectedDate < customStartDate) {
                setCustomEndDate(customStartDate);
            } else {
                setCustomEndDate(selectedDate);
            }
        }
    }
  };

  const profit = filteredTotal - filteredExpenses;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* --- Filter Section --- */}
      <View style={styles.filterSection}>
        <View style={styles.filterTabs}>
          {['day', 'week', 'month', 'year', 'custom'].map((type) => (
            <TouchableOpacity 
                key={type} 
                style={[styles.filterTab, filterType === type && styles.activeTab]} 
                onPress={() => setFilterType(type as FilterType)}
            >
              <Text style={[styles.filterText, filterType === type && styles.activeText]}>
                  {type === 'day' ? 'ມື້' : type === 'week' ? 'ອາທິດ' : type === 'month' ? 'ເດືອນ' : type === 'year' ? 'ປີ' : 'ກຳນົດເອງ'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 🟢 Nav Row ປັບປຸງໃໝ່ */}
        <View style={styles.navRow}>
            {filterType !== 'custom' ? (
                <>
                    <TouchableOpacity onPress={() => handleNavigateDate('prev')} style={styles.navBtn}>
                        <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                    <Text style={styles.dateLabel}>{getDateLabel()}</Text>
                    <TouchableOpacity onPress={() => handleNavigateDate('next')} style={styles.navBtn}>
                        <Ionicons name="chevron-forward" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                </>
            ) : (
                // 🟢 UI ສຳລັບ Custom Date
                <View style={styles.customDateContainer}>
                    <TouchableOpacity style={styles.datePickBtn} onPress={() => openDatePicker('start')}>
                        <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                        <Text style={styles.datePickText}>{formatDate(customStartDate)}</Text>
                    </TouchableOpacity>
                    <Text style={{marginHorizontal: 5}}>-</Text>
                    <TouchableOpacity style={styles.datePickBtn} onPress={() => openDatePicker('end')}>
                        <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                        <Text style={styles.datePickText}>{formatDate(customEndDate)}</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
      </View>

      {/* --- Stats Grid --- */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
          <View style={styles.iconCircleWhite}><Ionicons name="cash" size={24} color={COLORS.primary} /></View>
          <View><Text style={styles.statLabelWhite}>ຍອດຂາຍ</Text><Text style={styles.statValueWhite}>{formatNumber(filteredTotal)} ₭</Text></View>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#E0F2F1', borderWidth: 1, borderColor: COLORS.primary }]}>
          <View style={[styles.iconCircle, { backgroundColor: 'white' }]}><Ionicons name="trending-up" size={24} color={COLORS.primary} /></View>
          <View>
              <Text style={[styles.statLabel, {color: COLORS.primary}]}>ກຳໄລ</Text>
              <Text style={[styles.statValue, { color: profit >= 0 ? COLORS.primary : ORANGE_COLOR }]}>
                  {profit >= 0 ? '+' : ''}{formatNumber(profit)}
              </Text>
          </View>
        </View>

        <View style={[styles.statCard, { backgroundColor: COLORS.secondary }]}>
          <View style={styles.iconCircleWhite}><Ionicons name="receipt" size={24} color={COLORS.secondaryDark} /></View>
          <View><Text style={styles.statLabelWhite}>ອໍເດີ</Text><Text style={styles.statValueWhite}>{filteredOrders}</Text></View>
        </View>

        <View style={[styles.statCard, { backgroundColor: 'white', borderWidth: 1, borderColor: '#eee' }]}>
          <View style={[styles.iconCircle, { backgroundColor: ORANGE_BG }]}><Ionicons name="wallet-outline" size={24} color={ORANGE_COLOR} /></View>
          <View><Text style={styles.statLabel}>ລາຍຈ່າຍ</Text><Text style={[styles.statValue, { color: ORANGE_COLOR }]}>{formatNumber(filteredExpenses)}</Text></View>
        </View>
      </View>

      {/* --- Quick Menu --- */}
      <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>ເມນູດ່ວນ</Text>
      </View>
      
      <View style={styles.quickMenu}>
          <TouchableOpacity style={styles.quickMenuItem} onPress={onQuickAddProduct}>
              <View style={styles.quickMenuIcon}>
                <Ionicons name="add-circle-outline" size={28} color={COLORS.primary} />
              </View>
              <Text style={styles.quickMenuText}>ເພີ່ມສິນຄ້າ</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickMenuItem} onPress={onQuickScan}>
              <View style={styles.quickMenuIcon}>
                <Ionicons name="qr-code-outline" size={28} color={COLORS.primary} />
              </View>
              <Text style={styles.quickMenuText}>ສະແກນ</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickMenuItem} onPress={onQuickCustomer}>
              <View style={styles.quickMenuIcon}>
                <Ionicons name="people-outline" size={28} color={COLORS.primary} />
              </View>
              <Text style={styles.quickMenuText}>ລູກຄ້າ</Text>
          </TouchableOpacity>
      </View>

      {/* 🟢 Date Picker Component */}
      {showDatePicker && (
        Platform.OS === 'ios' ? (
            <Modal transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.datePickerContainer}>
                        <Text style={styles.pickerTitle}>
                            ເລືອກວັນທີ {datePickerMode === 'start' ? 'ເລີ່ມຕົ້ນ' : 'ສິ້ນສຸດ'}
                        </Text>
                        <DateTimePicker
                            value={datePickerMode === 'start' ? customStartDate : customEndDate}
                            mode="date"
                            display="inline"
                            onChange={onDateChange}
                            textColor={COLORS.primary}
                        />
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setShowDatePicker(false)}>
                            <Text style={styles.closeBtnText}>ຕົກລົງ</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        ) : (
            <DateTimePicker
                value={datePickerMode === 'start' ? customStartDate : customEndDate}
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
  container: { flex: 1, backgroundColor: COLORS.background },
  
  filterSection: { backgroundColor: 'white', paddingBottom: 10, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  filterTabs: { flexDirection: 'row', justifyContent: 'center', marginTop: 10, marginBottom: 10, gap: 5, flexWrap: 'wrap' },
  filterTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f0f0f0', marginBottom: 5 },
  activeTab: { backgroundColor: COLORS.primary },
  filterText: { fontFamily: 'Lao-Regular', color: '#666', fontSize: 12 },
  activeText: { color: 'white', fontFamily: 'Lao-Bold' },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, minHeight: 40 },
  navBtn: { padding: 5 },
  dateLabel: { fontFamily: 'Lao-Bold', fontSize: 16, color: COLORS.text },

  // 🟢 Styles ສຳລັບ Custom Date
  customDateContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' },
  datePickBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', padding: 8, borderRadius: 8, gap: 5 },
  datePickText: { fontFamily: 'Lao-Bold', color: COLORS.primary, fontSize: 14 },

  // Date Picker Modal (iOS)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  datePickerContainer: { backgroundColor: 'white', padding: 20, borderRadius: 15, width: '90%', alignItems: 'center' },
  pickerTitle: { fontFamily: 'Lao-Bold', fontSize: 16, marginBottom: 10, color: COLORS.primary },
  closeBtn: { marginTop: 15, padding: 10, width: '100%', alignItems: 'center', backgroundColor: COLORS.primary, borderRadius: 10 },
  closeBtnText: { color: 'white', fontFamily: 'Lao-Bold' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 15, justifyContent: 'space-between', gap: 12 },
  statCard: { width: '48%', padding: 15, borderRadius: 16, marginBottom: 0, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, shadowOffset: { width:0, height:2 }, flexDirection: 'column', justifyContent: 'space-between', minHeight: 130, gap: 10 },
  
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  iconCircleWhite: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  
  statLabel: { fontSize: 12, fontFamily: 'Lao-Regular', color: COLORS.textLight },
  statValue: { fontSize: 20, fontFamily: 'Lao-Bold', color: COLORS.text },
  statLabelWhite: { fontSize: 12, fontFamily: 'Lao-Regular', color: 'rgba(255,255,255,0.9)' },
  statValueWhite: { fontSize: 20, fontFamily: 'Lao-Bold', color: 'white' },

  sectionHeader: { marginTop: 10, paddingHorizontal: 20, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontFamily: 'Lao-Bold', color: COLORS.text },
  
  quickMenu: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'white', padding: 20, marginHorizontal: 15, borderRadius: 20, elevation: 3, marginBottom: 30, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  quickMenuItem: { alignItems: 'center', gap: 8 },
  quickMenuIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F0F9FA', justifyContent: 'center', alignItems: 'center' },
  quickMenuText: { fontSize: 12, fontFamily: 'Lao-Bold', color: '#555' }
});