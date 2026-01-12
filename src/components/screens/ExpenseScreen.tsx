import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
// @ts-ignore
import * as FileSystem from 'expo-file-system/legacy';
import { shareAsync } from 'expo-sharing';
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

// ສີສົ້ມ (ໃຊ້ສະເພາະບາງຈຸດ)
const ORANGE_COLOR = '#F57C00';
const ORANGE_BG = '#FFF3E0';

const EXPENSE_CATEGORIES = [
    'ຄ່າເຊົ່າ', 'ປັບປຸງສະຖານທີ່', 'ໄຟຟ້າ', 'ນ້ຳປະປາ', 'ອິນເຕີເນັດ',
    'ພະນັກງານ', 'ດອກເບ້ຍເງິນກູ້', 'ດອກເບ້ຍບັດເຄຣດິດ', 'ຂົນສົ່ງ',
    'ພາຫະນະຮັບໃຊ້', 'ຖົງ ແລະ ເຄື່ອງແພັກ', 'ໂຄສະນາ ແລະ ການຕະຫຼາດ',
    'ບໍລິການອອນລາຍ', 'ສັ່ງສິນຄ້າ'
];

export default function ExpenseScreen() {
    
    const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const [id, setId] = useState<string | null>(null);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('ສັ່ງສິນຄ້າ'); 
    const [selectedDate, setSelectedDate] = useState(new Date());
    
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);

    useEffect(() => {
        const expenseRef = ref(db, 'expenses');
        const unsubscribe = onValue(expenseRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const list = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
                list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setExpenses(list as ExpenseRecord[]);
            } else {
                setExpenses([]);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleDownloadTemplate = async () => {
        const csvContent = "Category,Amount,Description,Date(YYYY-MM-DD)\nຄ່າເຊົ່າ,500000,ຈ່າຍຄ່າເຊົ່າຮ້ານ,2024-01-01\n";
        const fileName = `${FileSystem.documentDirectory}expense_template.csv`;
        try {
            await FileSystem.writeAsStringAsync(fileName, csvContent, { encoding: 'utf8' });
            await shareAsync(fileName, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' });
        } catch (error) { Alert.alert("Error", "ບໍ່ສາມາດດາວໂຫລດ Template ໄດ້"); }
    };

    const handleExport = async () => {
        let csvContent = "Date,Category,Amount,Description\n";
        expenses.forEach(item => {
            csvContent += `${new Date(item.date).toLocaleDateString()},${item.category},${item.amount},${item.description || ''}\n`;
        });
        const fileName = `${FileSystem.documentDirectory}expenses_export_${new Date().getTime()}.csv`;
        try {
            await FileSystem.writeAsStringAsync(fileName, csvContent, { encoding: 'utf8' });
            await shareAsync(fileName, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' });
        } catch (error) { Alert.alert("Error", "ບໍ່ສາມາດ Export ໄດ້"); }
    };

    const handleImport = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: ['text/csv', 'application/vnd.ms-excel', '*/*'] });
            if (result.canceled) return;
            const fileUri = result.assets[0].uri;
            const fileContent = await FileSystem.readAsStringAsync(fileUri);
            const rows = fileContent.split('\n');
            let successCount = 0;
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i].split(',');
                if (row.length >= 2) {
                    const cat = row[0]?.trim() || 'ອື່ນໆ';
                    const amt = parseFloat(row[1]?.trim());
                    const desc = row[2]?.trim() || '';
                    const dateText = row[3]?.trim();
                    if (!isNaN(amt) && amt > 0) {
                        await push(ref(db, 'expenses'), {
                            category: cat, amount: amt, description: desc,
                            date: dateText ? new Date(dateText).toISOString() : new Date().toISOString(),
                            createdAt: new Date().toISOString()
                        });
                        successCount++;
                    }
                }
            }
            Alert.alert("ສຳເລັດ", `ນຳເຂົ້າຂໍ້ມູນສຳເລັດ ${successCount} ລາຍການ`);
        } catch (error) { Alert.alert("Error", "ເກີດຂໍ້ຜິດພາດໃນການນຳເຂົ້າຟາຍ"); }
    };

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
                await update(ref(db, `expenses/${id}`), expenseData);
                Alert.alert('ສຳເລັດ', 'ແກ້ໄຂລາຍຈ່າຍແລ້ວ');
            } else {
                await push(ref(db, 'expenses'), expenseData);
                Alert.alert('ສຳເລັດ', 'ບັນທຶກລາຍຈ່າຍແລ້ວ');
            }
            resetForm();
            Keyboard.dismiss();
        } catch (error) { Alert.alert('Error', 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ'); }
    };

    const handleDelete = (deleteId: string) => {
        Alert.alert('ຢືນຢັນການລຶບ', 'ທ່ານຕ້ອງການລຶບລາຍການນີ້ແທ້ບໍ່?', [
            { text: 'ຍົກເລີກ', style: 'cancel' },
            { text: 'ລຶບ', style: 'destructive', onPress: async () => { try { await remove(ref(db, `expenses/${deleteId}`)); if (id === deleteId) resetForm(); } catch (error) { Alert.alert('Error', 'ລຶບບໍ່ໄດ້'); } } }
        ]);
    };

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
        setCategory('ສັ່ງສິນຄ້າ');
        setSelectedDate(new Date());
    };

    const onDateChange = (event: any, date?: Date) => {
        if (Platform.OS === 'android') setShowDatePicker(false);
        if (date) setSelectedDate(date);
    };

    return (
        <View style={styles.container}>
            <View style={styles.formCard}>
                <View style={styles.actionRowTop}>
                    <Text style={styles.headerTitle}>{id ? '✏️ ແກ້ໄຂ' : '➕ ເພີ່ມລາຍຈ່າຍ'}</Text>
                    <View style={{flexDirection: 'row', gap: 5}}>
                        <TouchableOpacity style={styles.iconBtn} onPress={handleDownloadTemplate}>
                            <Ionicons name="download-outline" size={18} color={COLORS.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconBtn} onPress={handleImport}>
                            <Ionicons name="cloud-upload-outline" size={18} color={COLORS.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconBtn} onPress={handleExport}>
                            <Ionicons name="share-outline" size={18} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                </View>
                
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

                <TextInput style={styles.input} placeholder="ລາຍລະອຽດ (ຕົວຢ່າງ: ສັ່ງເຄື່ອງຈາກຈີນ)" value={description} onChangeText={setDescription} />

                <View style={styles.amountContainer}>
                    <Text style={[styles.currencyLabel, {color: ORANGE_COLOR}]}>₭</Text>
                    <TextInput style={[styles.amountInput, {color: ORANGE_COLOR}]} placeholder="0" keyboardType="numeric" value={formatNumber(amount)} onChangeText={(t) => setAmount(t.replace(/,/g, ''))} />
                </View>

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
                                <Text style={[styles.itemAmount, {color: ORANGE_COLOR}]}>- {formatNumber(item.amount)}</Text>
                                <View style={{ flexDirection: 'row', gap: 10, marginTop: 5 }}>
                                    <TouchableOpacity onPress={() => handleEdit(item)}>
                                        {/* 🟢 ປ່ຽນສີໄອຄອນສໍ ເປັນສີ Teal (COLORS.primary) */}
                                        <Ionicons name="pencil" size={18} color={COLORS.primary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDelete(item.id!)}>
                                        <Ionicons name="trash-outline" size={18} color={ORANGE_COLOR} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}
                />
            </View>

            {showDatePicker && (<DateTimePicker value={selectedDate} mode="date" display="default" onChange={onDateChange} />)}

            <Modal visible={showCategoryPicker} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>ເລືອກໝວດໝູ່</Text>
                        <FlatList
                            data={EXPENSE_CATEGORIES}
                            keyExtractor={(item) => item}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.categoryItem} onPress={() => { setCategory(item); setShowCategoryPicker(false); }}>
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
    formCard: { backgroundColor: 'white', margin: 15, padding: 15, borderRadius: 15, elevation: 3, shadowColor: COLORS.primary, shadowOpacity: 0.1 },
    actionRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    headerTitle: { fontFamily: 'Lao-Bold', fontSize: 18, color: COLORS.primaryDark },
    iconBtn: { padding: 8, backgroundColor: '#E0F2F1', borderRadius: 8 },
    row: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    dateBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', padding: 10, borderRadius: 8, gap: 5 },
    dateText: { fontFamily: 'Lao-Bold', color: '#555' },
    categoryBtn: { flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f0f0f0', padding: 10, borderRadius: 8 },
    categoryText: { fontFamily: 'Lao-Regular', color: '#333' },
    input: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee', fontFamily: 'Lao-Regular', marginBottom: 10 },
    amountContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: ORANGE_BG, borderRadius: 8, paddingHorizontal: 15, borderWidth: 1, borderColor: '#FFE0B2' },
    currencyLabel: { fontSize: 18, fontFamily: 'Lao-Bold', marginRight: 10 },
    amountInput: { flex: 1, fontSize: 20, fontFamily: 'Lao-Bold', paddingVertical: 10 },
    actionRow: { flexDirection: 'row', marginTop: 15, gap: 10 },
    saveBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    saveBtnText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 16 },
    cancelBtn: { width: 50, backgroundColor: '#eee', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    listContainer: { flex: 1, paddingHorizontal: 15 },
    listHeader: { fontFamily: 'Lao-Bold', fontSize: 16, color: '#666', marginBottom: 10 },
    expenseItem: { flexDirection: 'row', backgroundColor: 'white', padding: 12, borderRadius: 12, marginBottom: 10, alignItems: 'center' },
    dateBox: { backgroundColor: '#f0f0f0', padding: 8, borderRadius: 8, alignItems: 'center', minWidth: 50 },
    dayText: { fontFamily: 'Lao-Bold', fontSize: 18, color: COLORS.primary },
    monthText: { fontSize: 10, color: '#888' },
    itemCategory: { fontSize: 12, color: COLORS.primary, fontFamily: 'Lao-Bold', marginBottom: 2 },
    itemDesc: { fontSize: 14, color: '#333', fontFamily: 'Lao-Regular' },
    itemAmount: { fontSize: 16, fontFamily: 'Lao-Bold' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '80%', maxHeight: '60%', backgroundColor: 'white', borderRadius: 20, padding: 20 },
    modalTitle: { fontFamily: 'Lao-Bold', fontSize: 18, textAlign: 'center', marginBottom: 15 },
    categoryItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', flexDirection: 'row', justifyContent: 'space-between' },
    categoryItemText: { fontFamily: 'Lao-Regular', fontSize: 16, color: '#333' },
    closeModalBtn: { marginTop: 15, padding: 10, alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 10 }
});