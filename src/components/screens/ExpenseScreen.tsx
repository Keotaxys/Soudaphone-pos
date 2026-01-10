import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { onValue, push, ref, remove, update } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { db } from '../../firebase';
import { COLORS, ExpenseRecord, formatDate, formatNumber } from '../../types';

// 🟢 ໝວດໝູ່ລາຍຈ່າຍ (ອ້າງອີງຈາກ Web App ຮູບ 7.png)
const EXPENSE_CATEGORIES = [
    'ສັ່ງສິນຄ້າ',
    'ຄ່ານ້ຳ/ຄ່າໄຟ',
    'ເງິນເດືອນພະນັກງານ',
    'ຄ່າເຊົ່າສະຖານທີ່',
    'ປັບປຸງສະຖານທີ່',
    'ອຸປະກອນສິ້ນເປືອງ',
    'ການຕະຫຼາດ/ໂຄສະນາ',
    'ອື່ນໆ'
];

export default function ExpenseScreen() {
    
    // --- State ຂໍ້ມູນ ---
    const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
    const [loading, setLoading] = useState(true);

    // --- State ຟອມບັນທຶກ ---
    const [id, setId] = useState<string | null>(null); // ຖ້າມີ ID ແປວ່າກຳລັງແກ້ໄຂ
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    
    // --- UI States ---
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);

    // 🟢 1. ດຶງຂໍ້ມູນຈາກ Firebase Realtime Database
    useEffect(() => {
        const expenseRef = ref(db, 'expenses');
        const unsubscribe = onValue(expenseRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const list = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
                // ລຽງວັນທີ ໃໝ່ -> ເກົ່າ
                list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setExpenses(list as ExpenseRecord[]);
            } else {
                setExpenses([]);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // 🟢 2. ຟັງຊັນບັນທຶກ (ເພີ່ມໃໝ່ ຫຼື ແກ້ໄຂ)
    const handleSave = async () => {
        if (!amount || !description) {
            Alert.alert('ຂໍ້ມູນບໍ່ຄົບ', 'ກະລຸນາໃສ່ຈຳນວນເງິນ ແລະ ລາຍລະອຽດ');
            return;
        }

        const expenseData = {
            date: selectedDate.toISOString(),
            category,
            description,
            amount: parseFloat(amount.replace(/,/g, '')),
            createdAt: new Date().toISOString()
        };

        try {
            if (id) {
                // ແກ້ໄຂ (Update)
                await update(ref(db, `expenses/${id}`), expenseData);
                Alert.alert('ສຳເລັດ', 'ແກ້ໄຂລາຍຈ່າຍແລ້ວ');
            } else {
                // ເພີ່ມໃໝ່ (Create)
                await push(ref(db, 'expenses'), expenseData);
                Alert.alert('ສຳເລັດ', 'ບັນທຶກລາຍຈ່າຍແລ້ວ');
            }
            resetForm();
            Keyboard.dismiss();
        } catch (error) {
            Alert.alert('Error', 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ');
        }
    };

    // 🟢 3. ຟັງຊັນລຶບ
    const handleDelete = (deleteId: string) => {
        Alert.alert('ຢືນຢັນການລຶບ', 'ທ່ານຕ້ອງການລຶບລາຍການນີ້ແທ້ບໍ່?', [
            { text: 'ຍົກເລີກ', style: 'cancel' },
            {
                text: 'ລຶບ',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await remove(ref(db, `expenses/${deleteId}`));
                        if (id === deleteId) resetForm(); // ຖ້າກຳລັງແກ້ໄຂອັນທີ່ລຶບ ໃຫ້ reset ຟອມ
                    } catch (error) {
                        Alert.alert('Error', 'ລຶບບໍ່ໄດ້');
                    }
                }
            }
        ]);
    };

    // 🟢 4. ຟັງຊັນກຽມແກ້ໄຂ (ເອົາຂໍ້ມູນໃສ່ຟອມ)
    const handleEdit = (item: ExpenseRecord) => {
        setId(item.id!);
        setAmount(item.amount.toString());
        setDescription(item.description);
        setCategory(item.category);
        setSelectedDate(new Date(item.date));
    };

    const resetForm = () => {
        setId(null);
        setAmount('');
        setDescription('');
        setCategory(EXPENSE_CATEGORIES[0]);
        setSelectedDate(new Date());
    };

    const onDateChange = (event: any, date?: Date) => {
        if (Platform.OS === 'android') setShowDatePicker(false);
        if (date) setSelectedDate(date);
    };

    return (
        <View style={styles.container}>
            {/* --- ສ່ວນຟອມບັນທຶກ (Form Section) --- */}
            <View style={styles.formCard}>
                <Text style={styles.headerTitle}>{id ? '✏️ ແກ້ໄຂລາຍຈ່າຍ' : '➕ ເພີ່ມລາຍຈ່າຍ'}</Text>
                
                {/* ວັນທີ & ໝວດໝູ່ */}
                <View style={styles.row}>
                    <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
                        <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                        <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.categoryBtn} onPress={() => setShowCategoryPicker(true)}>
                        <Text style={styles.categoryText} numberOfLines={1}>{category}</Text>
                        <Ionicons name="chevron-down" size={16} color="#666" />
                    </TouchableOpacity>
                </View>

                {/* ລາຍລະອຽດ */}
                <TextInput
                    style={styles.input}
                    placeholder="ລາຍລະອຽດ (ຕົວຢ່າງ: ຄ່າໄຟເດືອນ 1)"
                    value={description}
                    onChangeText={setDescription}
                />

                {/* ຈຳນວນເງິນ */}
                <View style={styles.amountContainer}>
                    <Text style={styles.currencyLabel}>₭</Text>
                    <TextInput
                        style={styles.amountInput}
                        placeholder="0"
                        keyboardType="numeric"
                        value={formatNumber(amount)}
                        onChangeText={(t) => setAmount(t.replace(/,/g, ''))}
                    />
                </View>

                {/* ປຸ່ມບັນທຶກ & ຍົກເລີກ */}
                <View style={styles.actionRow}>
                    {id && (
                        <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
                            <Ionicons name="close" size={24} color="white" />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                        style={[styles.saveBtn, { backgroundColor: id ? COLORS.secondary : COLORS.primary }]} 
                        onPress={handleSave}
                    >
                        <Text style={styles.saveBtnText}>{id ? 'ອັບເດດລາຍຈ່າຍ' : 'ບັນທຶກລາຍຈ່າຍ'}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* --- ລາຍການປະຫວັດ (List Section) --- */}
            <View style={styles.listContainer}>
                <Text style={styles.listHeader}>📜 ປະຫວັດລາຍຈ່າຍ</Text>
                <FlatList
                    data={expenses}
                    keyExtractor={item => item.id!}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    renderItem={({ item }) => (
                        <View style={styles.expenseItem}>
                            <View style={styles.dateBox}>
                                <Text style={styles.dayText}>{new Date(item.date).getDate()}</Text>
                                <Text style={styles.monthText}>{new Date(item.date).getMonth() + 1}/{new Date(item.date).getFullYear().toString().substr(2)}</Text>
                            </View>
                            
                            <View style={{ flex: 1, paddingHorizontal: 10 }}>
                                <Text style={styles.itemCategory}>{item.category}</Text>
                                <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>
                            </View>
                            
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.itemAmount}>- {formatNumber(item.amount)}</Text>
                                <View style={{ flexDirection: 'row', gap: 10, marginTop: 5 }}>
                                    <TouchableOpacity onPress={() => handleEdit(item)}>
                                        <Ionicons name="pencil" size={18} color={COLORS.secondary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDelete(item.id!)}>
                                        <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}
                />
            </View>

            {/* --- Date Picker Modal --- */}
            {showDatePicker && (
                <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                />
            )}

            {/* --- Category Picker Modal --- */}
            <Modal visible={showCategoryPicker} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>ເລືອກໝວດໝູ່</Text>
                        <FlatList
                            data={EXPENSE_CATEGORIES}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={styles.categoryItem} 
                                    onPress={() => { setCategory(item); setShowCategoryPicker(false); }}
                                >
                                    <Text style={[styles.categoryItemText, category === item && {color: COLORS.primary, fontFamily: 'Lao-Bold'}]}>{item}</Text>
                                    {category === item && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowCategoryPicker(false)}>
                            <Text style={{color: '#666', fontFamily: 'Lao-Bold'}}>ປິດ</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    
    // Form Styles
    formCard: { backgroundColor: 'white', margin: 15, padding: 15, borderRadius: 15, elevation: 3, shadowColor: COLORS.primary, shadowOpacity: 0.1 },
    headerTitle: { fontFamily: 'Lao-Bold', fontSize: 18, color: COLORS.primaryDark, marginBottom: 15 },
    row: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    dateBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', padding: 10, borderRadius: 8, gap: 5 },
    dateText: { fontFamily: 'Lao-Bold', color: '#555' },
    categoryBtn: { flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f0f0f0', padding: 10, borderRadius: 8 },
    categoryText: { fontFamily: 'Lao-Regular', color: '#333' },
    
    input: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee', fontFamily: 'Lao-Regular', marginBottom: 10 },
    amountContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3E0', borderRadius: 8, paddingHorizontal: 15, borderWidth: 1, borderColor: COLORS.secondary },
    currencyLabel: { fontSize: 18, fontFamily: 'Lao-Bold', color: COLORS.secondaryDark, marginRight: 10 },
    amountInput: { flex: 1, fontSize: 20, fontFamily: 'Lao-Bold', color: COLORS.secondaryDark, paddingVertical: 10 },
    
    actionRow: { flexDirection: 'row', marginTop: 15, gap: 10 },
    saveBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    saveBtnText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 16 },
    cancelBtn: { width: 50, backgroundColor: '#eee', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

    // List Styles
    listContainer: { flex: 1, paddingHorizontal: 15 },
    listHeader: { fontFamily: 'Lao-Bold', fontSize: 16, color: '#666', marginBottom: 10 },
    expenseItem: { flexDirection: 'row', backgroundColor: 'white', padding: 12, borderRadius: 12, marginBottom: 10, alignItems: 'center' },
    dateBox: { backgroundColor: '#f0f0f0', padding: 8, borderRadius: 8, alignItems: 'center', minWidth: 50 },
    dayText: { fontFamily: 'Lao-Bold', fontSize: 18, color: COLORS.primary },
    monthText: { fontSize: 10, color: '#888' },
    itemCategory: { fontSize: 12, color: COLORS.primary, fontFamily: 'Lao-Bold', marginBottom: 2 },
    itemDesc: { fontSize: 14, color: '#333', fontFamily: 'Lao-Regular' },
    itemAmount: { fontSize: 16, fontFamily: 'Lao-Bold', color: COLORS.danger },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '80%', maxHeight: '60%', backgroundColor: 'white', borderRadius: 20, padding: 20 },
    modalTitle: { fontFamily: 'Lao-Bold', fontSize: 18, textAlign: 'center', marginBottom: 15 },
    categoryItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', flexDirection: 'row', justifyContent: 'space-between' },
    categoryItemText: { fontFamily: 'Lao-Regular', fontSize: 16, color: '#333' },
    closeModalBtn: { marginTop: 15, padding: 10, alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 10 }
});