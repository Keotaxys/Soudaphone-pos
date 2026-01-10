import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { onValue, ref } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    FlatList,
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

interface HomeScreenProps {
    salesHistory: SaleRecord[];
    products: Product[];
}

// ປະເພດຂອງການກັ່ນຕອງ
type FilterType = 'day' | 'week' | 'month' | 'year' | 'custom';

export default function HomeScreen({ salesHistory, products }: HomeScreenProps) {

    // --- Filter States ---
    const [filterType, setFilterType] = useState<FilterType>('day');
    const [currentDate, setCurrentDate] = useState(new Date()); // ວັນທີປັດຈຸບັນທີ່ໃຊ້ເປັນຫຼັກ
    
    // ສຳລັບ Custom Range
    const [customStart, setCustomStart] = useState(new Date());
    const [customEnd, setCustomEnd] = useState(new Date());
    const [showCustomPicker, setShowCustomPicker] = useState(false);
    const [pickerMode, setPickerMode] = useState<'start' | 'end'>('start');
    const [showDatePicker, setShowDatePicker] = useState(false);

    // --- Dashboard Data States ---
    const [filteredTotal, setFilteredTotal] = useState(0);
    const [filteredOrders, setFilteredOrders] = useState(0);
    const [filteredExpenses, setFilteredExpenses] = useState(0);
    const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
    const [expensesData, setExpensesData] = useState<any[]>([]);

    // 🟢 1. ດຶງຂໍ້ມູນ Expenses ມາລໍຖ້າໄວ້ (Realtime)
    useEffect(() => {
        const expenseRef = ref(db, 'expenses');
        const unsubscribe = onValue(expenseRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setExpensesData(Object.values(data));
            } else {
                setExpensesData([]);
            }
        });
        return () => unsubscribe();
    }, []);

    // 🟢 2. ຄິດໄລ່ຊ່ວງວັນທີ (Start - End) ຕາມ Filter Type
    const getDateRange = () => {
        let start = new Date(currentDate);
        let end = new Date(currentDate);

        // Reset ເວລາເປັນ 00:00:00 ແລະ 23:59:59
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        switch (filterType) {
            case 'day':
                // ໃຊ້ມື້ນີ້ເລີຍ (start, end ຖືກຕັ້ງແລ້ວ)
                break;
            case 'week':
                // ຫາວັນຈັນຂອງອາທິດນີ້
                const day = start.getDay();
                const diff = start.getDate() - day + (day === 0 ? -6 : 1); // ປັບໃຫ້ວັນຈັນເປັນມື້ທຳອິດ
                start.setDate(diff);
                end.setDate(start.getDate() + 6);
                end.setHours(23, 59, 59, 999);
                break;
            case 'month':
                start.setDate(1); // ວັນທີ 1
                end = new Date(start.getFullYear(), start.getMonth() + 1, 0); // ວັນສຸດທ້າຍຂອງເດືອນ
                end.setHours(23, 59, 59, 999);
                break;
            case 'year':
                start.setMonth(0, 1); // 1 ມັງກອນ
                end.setMonth(11, 31); // 31 ທັນວາ
                end.setHours(23, 59, 59, 999);
                break;
            case 'custom':
                start = new Date(customStart);
                start.setHours(0, 0, 0, 0);
                end = new Date(customEnd);
                end.setHours(23, 59, 59, 999);
                break;
        }
        return { start, end };
    };

    // 🟢 3. ຟັງຊັນ Filter ຂໍ້ມູນຕາມຊ່ວງວັນທີ
    useEffect(() => {
        const { start, end } = getDateRange();

        // Filter Sales
        const filteredSales = salesHistory.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= start && saleDate <= end && sale.status !== 'ຍົກເລີກ';
        });

        // Filter Expenses
        const filteredExp = expensesData.filter(exp => {
            const expDate = new Date(exp.date);
            return expDate >= start && expDate <= end;
        });

        // Calculate Totals
        const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
        const totalExp = filteredExp.reduce((sum, exp) => sum + exp.amount, 0);

        setFilteredTotal(totalSales);
        setFilteredOrders(filteredSales.length);
        setFilteredExpenses(totalExp);

        // Check Low Stock (Static Check - ບໍ່ກ່ຽວກັບວັນທີ)
        const lowStock = products.filter(p => p.stock <= 5);
        setLowStockProducts(lowStock);

    }, [salesHistory, expensesData, filterType, currentDate, customStart, customEnd]);

    // 🟢 4. ຟັງຊັນປ່ຽນວັນທີ (Next / Prev)
    const handleNavigateDate = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        const val = direction === 'next' ? 1 : -1;

        if (filterType === 'day') newDate.setDate(newDate.getDate() + val);
        if (filterType === 'week') newDate.setDate(newDate.getDate() + (val * 7));
        if (filterType === 'month') newDate.setMonth(newDate.getMonth() + val);
        if (filterType === 'year') newDate.setFullYear(newDate.getFullYear() + val);
        
        setCurrentDate(newDate);
    };

    // 🟢 5. ຟັງຊັນສະແດງຂໍ້ຄວາມວັນທີ
    const getDateLabel = () => {
        if (filterType === 'custom') {
            return `${formatDate(customStart)} - ${formatDate(customEnd)}`;
        }
        const { start, end } = getDateRange();
        if (filterType === 'day') return formatDate(start);
        if (filterType === 'week') return `${formatDate(start)} - ${formatDate(end)}`;
        if (filterType === 'month') return start.toLocaleDateString('lo-LA', { month: 'long', year: 'numeric' });
        if (filterType === 'year') return start.getFullYear().toString();
        return '';
    };

    const handleCustomDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') setShowDatePicker(false);
        if (selectedDate) {
            if (pickerMode === 'start') setCustomStart(selectedDate);
            else setCustomEnd(selectedDate);
        }
    };

    const profit = filteredTotal - filteredExpenses;

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            
            {/* --- Filter Control Section --- */}
            <View style={styles.filterSection}>
                
                {/* 1. Filter Type Tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabs}>
                    {['day', 'week', 'month', 'year', 'custom'].map((type) => (
                        <TouchableOpacity
                            key={type}
                            style={[styles.filterTab, filterType === type && styles.activeTab]}
                            onPress={() => {
                                setFilterType(type as FilterType);
                                if (type === 'custom') setShowCustomPicker(true);
                            }}
                        >
                            <Text style={[styles.filterText, filterType === type && styles.activeText]}>
                                {type === 'day' ? 'ມື້' : type === 'week' ? 'ອາທິດ' : type === 'month' ? 'ເດືອນ' : type === 'year' ? 'ປີ' : 'ກຳນົດເອງ'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* 2. Date Navigation */}
                {filterType !== 'custom' ? (
                    <View style={styles.navRow}>
                        <TouchableOpacity onPress={() => handleNavigateDate('prev')} style={styles.navBtn}>
                            <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
                        </TouchableOpacity>
                        <Text style={styles.dateLabel}>{getDateLabel()}</Text>
                        <TouchableOpacity onPress={() => handleNavigateDate('next')} style={styles.navBtn}>
                            <Ionicons name="chevron-forward" size={24} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.customDateDisplay} onPress={() => setShowCustomPicker(true)}>
                        <Ionicons name="calendar" size={20} color={COLORS.primary} />
                        <Text style={styles.dateLabel}>{getDateLabel()}</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* --- Dashboard Stats --- */}
            <View style={styles.statsGrid}>
                {/* ຍອດຂາຍ */}
                <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
                    <View style={styles.iconCircleWhite}><Ionicons name="cash" size={24} color={COLORS.primary} /></View>
                    <View>
                        <Text style={styles.statLabelWhite}>ຍອດຂາຍລວມ</Text>
                        <Text style={styles.statValueWhite}>{formatNumber(filteredTotal)} ₭</Text>
                    </View>
                </View>

                {/* ກຳໄລ */}
                <View style={[styles.statCard, { backgroundColor: 'white', borderWidth: 1, borderColor: '#eee' }]}>
                    <View style={[styles.iconCircle, { backgroundColor: '#E0F2F1' }]}>
                        <Ionicons name="trending-up" size={24} color={COLORS.primaryDark} />
                    </View>
                    <View>
                        <Text style={styles.statLabel}>ກຳໄລສິດທິ</Text>
                        <Text style={[styles.statValue, { color: profit >= 0 ? COLORS.success : COLORS.danger }]}>
                            {profit >= 0 ? '+' : ''}{formatNumber(profit)}
                        </Text>
                    </View>
                </View>

                {/* ອໍເດີ */}
                <View style={[styles.statCard, { backgroundColor: COLORS.secondary }]}>
                    <View style={styles.iconCircleWhite}><Ionicons name="receipt" size={24} color={COLORS.secondaryDark} /></View>
                    <View>
                        <Text style={styles.statLabelWhite}>ອໍເດີທັງໝົດ</Text>
                        <Text style={styles.statValueWhite}>{filteredOrders} ບິນ</Text>
                    </View>
                </View>

                {/* ລາຍຈ່າຍ */}
                <View style={[styles.statCard, { backgroundColor: 'white', borderWidth: 1, borderColor: '#eee' }]}>
                    <View style={[styles.iconCircle, { backgroundColor: '#FFEBEE' }]}>
                        <Ionicons name="wallet-outline" size={24} color={COLORS.danger} />
                    </View>
                    <View>
                        <Text style={styles.statLabel}>ລາຍຈ່າຍ</Text>
                        <Text style={[styles.statValue, { color: COLORS.danger }]}>{formatNumber(filteredExpenses)}</Text>
                    </View>
                </View>
            </View>

            {/* --- Low Stock Warning --- */}
            {lowStockProducts.length > 0 && (
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="alert-circle" size={20} color={COLORS.secondaryDark} />
                        <Text style={styles.sectionTitle}>ສິນຄ້າໃກ້ໝົດ ({lowStockProducts.length})</Text>
                    </View>
                    <FlatList 
                        horizontal
                        data={lowStockProducts}
                        keyExtractor={item => item.id!}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingLeft: 5 }}
                        renderItem={({ item }) => (
                            <View style={styles.lowStockCard}>
                                <Text style={styles.lowStockName} numberOfLines={1}>{item.name}</Text>
                                <Text style={styles.lowStockValue}>ເຫຼືອ: {item.stock}</Text>
                            </View>
                        )}
                    />
                </View>
            )}

            {/* --- Custom Date Picker Modal --- */}
            <Modal visible={showCustomPicker} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.pickerContainer}>
                        <Text style={styles.pickerTitle}>ເລືອກຊ່ວງວັນທີ</Text>
                        
                        <View style={styles.pickerRow}>
                            <TouchableOpacity style={styles.dateInput} onPress={() => { setPickerMode('start'); setShowDatePicker(true); }}>
                                <Text style={styles.pickerLabel}>ເລີ່ມຕົ້ນ</Text>
                                <Text style={styles.pickerValue}>{formatDate(customStart)}</Text>
                            </TouchableOpacity>
                            <Ionicons name="arrow-forward" size={20} color="#ccc" />
                            <TouchableOpacity style={styles.dateInput} onPress={() => { setPickerMode('end'); setShowDatePicker(true); }}>
                                <Text style={styles.pickerLabel}>ສິ້ນສຸດ</Text>
                                <Text style={styles.pickerValue}>{formatDate(customEnd)}</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.confirmBtn} onPress={() => setShowCustomPicker(false)}>
                            <Text style={styles.confirmText}>ຕົກລົງ</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {showDatePicker && (
                <DateTimePicker
                    value={pickerMode === 'start' ? customStart : customEnd}
                    mode="date"
                    display="default"
                    onChange={handleCustomDateChange}
                />
            )}

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    
    // Filter Styles
    filterSection: { backgroundColor: 'white', paddingBottom: 10, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1 },
    filterTabs: { paddingHorizontal: 15, marginTop: 10, marginBottom: 10 },
    filterTab: { paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20, marginRight: 8, backgroundColor: '#f0f0f0' },
    activeTab: { backgroundColor: COLORS.primary },
    filterText: { fontFamily: 'Lao-Regular', color: '#666' },
    activeText: { color: 'white', fontFamily: 'Lao-Bold' },
    
    navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
    navBtn: { padding: 5 },
    dateLabel: { fontFamily: 'Lao-Bold', fontSize: 16, color: COLORS.text },
    customDateDisplay: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, padding: 10, backgroundColor: '#f9f9f9', marginHorizontal: 20, borderRadius: 10 },

    // Dashboard Grid
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 15, gap: 10, justifyContent: 'space-between' },
    statCard: { width: (width - 40) / 2, padding: 15, borderRadius: 16, marginBottom: 5, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, flexDirection: 'column', gap: 10 },
    iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    iconCircleWhite: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    statLabel: { fontSize: 12, fontFamily: 'Lao-Regular', color: COLORS.textLight },
    statValue: { fontSize: 18, fontFamily: 'Lao-Bold', color: COLORS.text },
    statLabelWhite: { fontSize: 12, fontFamily: 'Lao-Regular', color: 'rgba(255,255,255,0.9)' },
    statValueWhite: { fontSize: 18, fontFamily: 'Lao-Bold', color: 'white' },

    // Low Stock
    sectionContainer: { marginTop: 10, paddingHorizontal: 15, marginBottom: 20 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
    sectionTitle: { fontFamily: 'Lao-Bold', fontSize: 16, color: COLORS.text },
    lowStockCard: { backgroundColor: '#FFEBEE', padding: 10, borderRadius: 10, marginRight: 10, minWidth: 120, borderWidth: 1, borderColor: '#FFCDD2' },
    lowStockName: { fontFamily: 'Lao-Bold', color: '#C62828', fontSize: 12, marginBottom: 4 },
    lowStockValue: { fontFamily: 'Lao-Regular', color: '#C62828', fontSize: 10 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    pickerContainer: { width: '85%', backgroundColor: 'white', borderRadius: 20, padding: 20, elevation: 5 },
    pickerTitle: { fontFamily: 'Lao-Bold', fontSize: 18, textAlign: 'center', marginBottom: 20 },
    pickerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    dateInput: { flex: 1, alignItems: 'center', padding: 10, backgroundColor: '#f0f0f0', borderRadius: 10 },
    pickerLabel: { fontSize: 12, color: '#888' },
    pickerValue: { fontFamily: 'Lao-Bold', color: COLORS.primary, marginTop: 5 },
    confirmBtn: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 10, alignItems: 'center' },
    confirmText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 16 }
});