import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { onValue, ref, remove } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { db } from '../../firebase';
import { COLORS, formatDate, formatNumber, SaleRecord } from '../../types';

type FilterType = 'day' | 'week' | 'month' | 'year';

export default function ReportScreen() {
    // --- Data States ---
    const [allSales, setAllSales] = useState<SaleRecord[]>([]);
    const [filteredSales, setFilteredSales] = useState<SaleRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // --- Filter States ---
    const [filterType, setFilterType] = useState<FilterType>('day');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // 1. ດຶງຂໍ້ມູນທັງໝົດມາໄວ້ໃນ State
    useEffect(() => {
        const salesRef = ref(db, 'sales');
        const unsubscribe = onValue(salesRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
                setAllSales(list as SaleRecord[]);
            } else { setAllSales([]); }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // 2. ກັ່ນຕອງຂໍ້ມູນເມື່ອວັນທີ ຫຼື ປະເພດ Filter ປ່ຽນແປງ
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

        const filtered = allSales.filter(sale => {
            const d = new Date(sale.date);
            return d >= start && d <= end;
        });

        setFilteredSales(filtered.reverse());
    }, [allSales, filterType, currentDate]);

    // Navigation Helpers
    const handleNavigate = (dir: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        const val = dir === 'next' ? 1 : -1;
        if (filterType === 'day') newDate.setDate(newDate.getDate() + val);
        else if (filterType === 'week') newDate.setDate(newDate.getDate() + (val * 7));
        else if (filterType === 'month') newDate.setMonth(newDate.getMonth() + val);
        else if (filterType === 'year') newDate.setFullYear(newDate.getFullYear() + val);
        setCurrentDate(newDate);
    };

    const getDateLabel = () => {
        if (filterType === 'day') return formatDate(currentDate);
        if (filterType === 'month') return currentDate.toLocaleDateString('lo-LA', { month: 'long', year: 'numeric' });
        if (filterType === 'year') return currentDate.getFullYear().toString();
        return "ຊ່ວງເວລານີ້";
    };

    const handleDelete = (id: string) => {
        Alert.alert('ຢືນຢັນ', 'ລຶບບິນນີ້ແທ້ບໍ່?', [
            { text: 'ຍົກເລີກ' },
            { text: 'ລຶບ', style: 'destructive', onPress: async () => await remove(ref(db, `sales/${id}`)) }
        ]);
    };

    return (
        <View style={styles.container}>
            {/* --- Filter Bar --- */}
            <View style={styles.filterSection}>
                <View style={styles.tabRow}>
                    {['day', 'week', 'month', 'year'].map((t) => (
                        <TouchableOpacity 
                            key={t} 
                            style={[styles.tab, filterType === t && styles.activeTab]}
                            onPress={() => setFilterType(t as FilterType)}
                        >
                            <Text style={[styles.tabText, filterType === t && styles.activeTabText]}>
                                {t === 'day' ? 'ມື້' : t === 'week' ? 'ອາທິດ' : t === 'month' ? 'ເດືອນ' : 'ປີ'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.navRow}>
                    <TouchableOpacity onPress={() => handleNavigate('prev')}><Ionicons name="chevron-back" size={24} color={COLORS.primary} /></TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                        <Text style={styles.dateLabel}>{getDateLabel()}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleNavigate('next')}><Ionicons name="chevron-forward" size={24} color={COLORS.primary} /></TouchableOpacity>
                </View>
            </View>

            {/* --- Sales List --- */}
            <FlatList
                data={filteredSales}
                keyExtractor={(item) => item.id!}
                contentContainerStyle={{ padding: 15, paddingBottom: 100 }}
                renderItem={({ item }) => {
                    const isExpanded = expandedId === item.id;
                    return (
                        <View style={styles.card}>
                            <TouchableOpacity style={styles.cardHeader} onPress={() => setExpandedId(isExpanded ? null : item.id!)}>
                                <View style={styles.headerLeft}>
                                    <View style={[styles.iconCircle, { backgroundColor: item.paymentMethod === 'CASH' ? '#E8F5E9' : '#E3F2FD' }]}>
                                        <Ionicons name={item.paymentMethod === 'CASH' ? "cash-outline" : "qr-code-outline"} size={20} color={item.paymentMethod === 'CASH' ? COLORS.success : COLORS.primary} />
                                    </View>
                                    <View>
                                        <Text style={styles.billId}>ບິນ #{item.id?.slice(-5).toUpperCase()}</Text>
                                        <Text style={styles.billTime}>{new Date(item.date).toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' })}</Text>
                                    </View>
                                </View>
                                <View style={styles.headerRight}>
                                    <Text style={styles.billTotal}>{formatNumber(item.total)} ₭</Text>
                                    <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={18} color="#ccc" />
                                </View>
                            </TouchableOpacity>

                            {isExpanded && (
                                <View style={styles.details}>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoText}>📍 ແຫຼ່ງ: {item.source || 'ໜ້າຮ້ານ'}</Text>
                                        <Text style={styles.infoText}>💰 ຊຳລະ: {item.paymentMethod}</Text>
                                    </View>
                                    <View style={styles.itemList}>
                                        {item.items.map((prod, i) => (
                                            <View key={i} style={styles.prodLine}>
                                                <Text style={styles.prodName}>{prod.name} x{prod.quantity}</Text>
                                                <Text style={styles.prodPrice}>{formatNumber(prod.price * prod.quantity)}</Text>
                                            </View>
                                        ))}
                                    </View>
                                    <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(item.id!)}>
                                        <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                                        <Text style={styles.delBtnText}>ລຶບບິນ</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    );
                }}
                ListEmptyComponent={<Text style={styles.emptyText}>ບໍ່ມີລາຍການຂາຍໃນຊ່ວງເວລານີ້</Text>}
            />

            {showDatePicker && (
                <DateTimePicker value={currentDate} mode="date" display="default" onChange={(e, d) => { setShowDatePicker(false); if(d) setCurrentDate(d); }} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    filterSection: { backgroundColor: 'white', paddingBottom: 15, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, elevation: 5 },
    tabRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 10, marginBottom: 15 },
    tab: { paddingHorizontal: 20, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f0f0f0' },
    activeTab: { backgroundColor: COLORS.primary },
    tabText: { fontFamily: 'Lao-Regular', color: '#666', fontSize: 12 },
    activeTabText: { color: 'white', fontFamily: 'Lao-Bold' },
    navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 30 },
    dateLabel: { fontFamily: 'Lao-Bold', fontSize: 16, color: COLORS.text },

    card: { backgroundColor: 'white', borderRadius: 15, marginBottom: 10, overflow: 'hidden', marginHorizontal: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconCircle: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
    billId: { fontFamily: 'Lao-Bold', fontSize: 14 },
    billTime: { fontFamily: 'Lao-Regular', fontSize: 11, color: '#999' },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    billTotal: { fontFamily: 'Lao-Bold', fontSize: 16, color: COLORS.primary },

    details: { padding: 15, backgroundColor: '#fcfcfc', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    infoText: { fontFamily: 'Lao-Regular', fontSize: 12, color: '#666' },
    itemList: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 },
    prodLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    prodName: { fontFamily: 'Lao-Regular', fontSize: 13, color: '#444' },
    prodPrice: { fontFamily: 'Lao-Bold', fontSize: 13 },
    delBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: 10, gap: 5 },
    delBtnText: { color: COLORS.danger, fontFamily: 'Lao-Bold', fontSize: 12 },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#ccc', fontFamily: 'Lao-Regular' }
});