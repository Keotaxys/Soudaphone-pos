import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { onValue, push, ref, remove, update } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { db } from '../../firebase';
import { COLORS, formatDate, formatNumber } from '../../types';

// ໝວດໝູ່ໜີ້ສິນ
const DEBT_CATEGORIES = ['ເງິນກູ້', 'ບັດເຄດິດ', 'ຢືມເພື່ອນ', 'ຜ່ອນສິນຄ້າ', 'ອື່ນໆ'];

interface DebtItem {
  id: string;
  title: string;
  category: string;
  totalAmount: number;    // ເງິນຕົ້ນ
  paidAmount: number;     // ຈ່າຍແລ້ວ
  interestRate: number;   // ດອກເບ້ຍ (%)
  monthlyPayment: number; // ຜ່ອນ/ເດືອນ
  dueDate: string;        // ກຳນົດຊຳລະ
  history?: Record<string, any>;
}

export default function DebtScreen() {
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  
  // Form States
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(DEBT_CATEGORIES[0]);
  const [totalAmount, setTotalAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Payment State
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState('');

  // 1. ດຶງຂໍ້ມູນຈາກ Firebase (Realtime Database)
  useEffect(() => {
    const debtRef = ref(db, 'debts');
    const unsubscribe = onValue(debtRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.keys(data).map(key => ({ 
            id: key, 
            ...data[key],
            paidAmount: data[key].paidAmount || 0 
        }));
        setDebts(list.reverse() as DebtItem[]);
      } else {
        setDebts([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. ບັນທຶກໜີ້ສິນໃໝ່
  const handleSaveDebt = async () => {
    if (!title || !totalAmount) {
      Alert.alert('ຂໍ້ມູນບໍ່ຄົບ', 'ກະລຸນາໃສ່ຊື່ ແລະ ຈຳນວນເງິນຕົ້ນ');
      return;
    }

    const newDebt = {
      title,
      category,
      totalAmount: parseFloat(totalAmount.replace(/,/g, '')),
      paidAmount: 0,
      interestRate: parseFloat(interestRate) || 0,
      monthlyPayment: parseFloat(monthlyPayment.replace(/,/g, '')) || 0,
      dueDate: dueDate.toISOString(),
      createdAt: new Date().toISOString()
    };

    try {
      await push(ref(db, 'debts'), newDebt);
      setModalVisible(false);
      resetForm();
      Alert.alert('ສຳເລັດ', 'ບັນທຶກໜີ້ສິນໃໝ່ຮຽບຮ້ອຍ');
    } catch (error) {
      Alert.alert('Error', 'ບັນທຶກບໍ່ໄດ້');
    }
  };

  // 3. ບັນທຶກການຊຳລະ
  const handlePayment = async () => {
    if (!selectedDebtId || !payAmount) return;
    const amount = parseFloat(payAmount.replace(/,/g, ''));
    const debt = debts.find(d => d.id === selectedDebtId);
    if (!debt) return;

    const newPaidAmount = (debt.paidAmount || 0) + amount;
    
    if (newPaidAmount > debt.totalAmount) {
        Alert.alert('ຜິດພາດ', 'ຍອດຊຳລະເກີນກວ່າໜີ້ທີ່ຄ້າງຢູ່');
        return;
    }

    const paymentRecord = {
        amount,
        date: new Date().toISOString(),
        type: 'PAYMENT'
    };

    try {
        await update(ref(db, `debts/${selectedDebtId}`), { paidAmount: newPaidAmount });
        await push(ref(db, `debts/${selectedDebtId}/history`), paymentRecord);
        setPaymentModalVisible(false);
        setPayAmount('');
        Alert.alert('ສຳເລັດ', 'ບັນທຶກການຊຳລະຮຽບຮ້ອຍ');
    } catch (error) {
        Alert.alert('Error', 'ເກີດຂໍ້ຜິດພາດ');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('ຢືນຢັນ', 'ຕ້ອງການລຶບລາຍການນີ້ບໍ່?', [
        { text: 'ຍົກເລີກ', style: 'cancel' },
        { text: 'ລຶບ', style: 'destructive', onPress: async () => await remove(ref(db, `debts/${id}`)) }
    ]);
  };

  const resetForm = () => {
    setTitle('');
    setCategory(DEBT_CATEGORIES[0]);
    setTotalAmount('');
    setInterestRate('');
    setMonthlyPayment('');
    setDueDate(new Date());
  };

  const onDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) setDueDate(date);
  };

  const renderItem = ({ item }: { item: DebtItem }) => {
    const progress = item.totalAmount > 0 ? (item.paidAmount / item.totalAmount) : 0;
    const remaining = item.totalAmount - item.paidAmount;

    return (
        <View style={styles.card}>
            {/* Header: Title & Category */}
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.categoryText}>{item.category}</Text>
                </View>
                <TouchableOpacity>
                    <Text style={styles.editText}>ແກ້ໄຂ</Text>
                </TouchableOpacity>
            </View>

            {/* Total Amount */}
            <View style={styles.amountRow}>
                <Text style={styles.label}>ຍອດກູ້ຢືມ:</Text>
                <Text style={styles.amountTotal}>{formatNumber(item.totalAmount)} ກີບ</Text>
            </View>

            {/* Progress Section */}
            <View style={{marginTop: 10}}>
                <View style={styles.progressLabels}>
                    <Text style={styles.paidLabel}>ຊຳລະຕົ້ນແລ້ວ ({Math.round(progress * 100)}%)</Text>
                    <Text style={styles.remainLabel}>ຕົ້ນຄົງເຫຼືອ</Text>
                </View>
                
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: `${Math.min(progress * 100, 100)}%` }]} />
                </View>

                <View style={styles.progressValues}>
                    <Text style={styles.paidValue}>{formatNumber(item.paidAmount)} ກີບ</Text>
                    {/* 🟢 ສີສົ້ມຕາມທີ່ຕ້ອງການ */}
                    <Text style={styles.remainValue}>{formatNumber(remaining)} ກີບ</Text>
                </View>
            </View>

            {/* Details Box (Grey Background) */}
            <View style={styles.detailsBox}>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>ດອກເບ້ຍ (%):</Text>
                    <Text style={styles.detailValue}>{item.interestRate}% / ປີ</Text>
                </View>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>ຜ່ອນ/ເດືອນ:</Text>
                    <Text style={styles.detailValue}>{formatNumber(item.monthlyPayment)} ກີບ</Text>
                </View>
            </View>
            
            {/* Footer: Date & Actions */}
            <View style={styles.footerRow}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 5}}>
                    <Ionicons name="calendar-outline" size={14} color="#666" />
                    <Text style={styles.dueDateText}>ກຳນົດຈ່າຍ: {formatDate(new Date(item.dueDate))}</Text>
                </View>
                
                <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.historyBtn}>
                        <Ionicons name="time-outline" size={16} color="#555" />
                        <Text style={styles.historyText}>ປະຫວັດ</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                        <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.payBtn} 
                        onPress={() => { setSelectedDebtId(item.id); setPaymentModalVisible(true); }}
                    >
                        <Ionicons name="wallet-outline" size={16} color="white" />
                        <Text style={styles.payBtnText}>ຊຳລະ</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>ຕິດຕາມໜີ້ສິນ (Loans)</Text>
        <Text style={styles.headerSub}>ຈັດການເງິນກູ້, ດອກເບ້ຍ ແລະ ການຜ່ອນຊຳລະ</Text>
      </View>

      <FlatList
        data={debts}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 15, paddingBottom: 100 }}
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={60} color="#ddd" />
                <Text style={styles.emptyText}>ບໍ່ມີລາຍການໜີ້ສິນ</Text>
            </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => { resetForm(); setModalVisible(true); }}>
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.fabText}>ເພີ່ມໜີ້ໃໝ່</Text>
      </TouchableOpacity>

      {/* Add Debt Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>ເພີ່ມໜີ້ສິນໃໝ່</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color="#666" /></TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={styles.inputLabel}>ຊື່ໜີ້ສິນ *</Text>
                    <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="ເງິນກູ້ທະນາຄານ..." />

                    <Text style={styles.inputLabel}>ໝວດໝູ່ *</Text>
                    <View style={styles.categoryRow}>
                        {DEBT_CATEGORIES.map((cat) => (
                            <TouchableOpacity 
                                key={cat} 
                                style={[styles.catChip, category === cat && styles.activeCatChip]}
                                onPress={() => setCategory(cat)}
                            >
                                <Text style={[styles.catText, category === cat && {color: 'white'}]}>{cat}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.inputLabel}>ຈຳນວນເງິນຕົ້ນ *</Text>
                    <TextInput style={styles.input} value={totalAmount} onChangeText={setTotalAmount} keyboardType="numeric" placeholder="0" />

                    <View style={{flexDirection: 'row', gap: 10}}>
                        <View style={{flex: 1}}>
                            <Text style={styles.inputLabel}>ດອກເບ້ຍ (%)</Text>
                            <TextInput style={styles.input} value={interestRate} onChangeText={setInterestRate} keyboardType="numeric" placeholder="0" />
                        </View>
                        <View style={{flex: 1}}>
                            <Text style={styles.inputLabel}>ຜ່ອນ/ເດືອນ</Text>
                            <TextInput style={styles.input} value={monthlyPayment} onChangeText={setMonthlyPayment} keyboardType="numeric" placeholder="0" />
                        </View>
                    </View>

                    <Text style={styles.inputLabel}>ກຳນົດຊຳລະ</Text>
                    <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
                        <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                        <Text style={{fontFamily: 'Lao-Bold', color: COLORS.text}}>{formatDate(dueDate)}</Text>
                    </TouchableOpacity>

                    <View style={styles.modalActions}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                            <Text style={styles.cancelBtnText}>ຍົກເລີກ</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveDebt}>
                            <Text style={styles.saveBtnText}>ບັນທຶກ</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
      </Modal>
      {showDatePicker && (<DateTimePicker value={dueDate} mode="date" display="default" onChange={onDateChange} />)}

      {/* Payment Modal */}
      <Modal visible={paymentModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, {height: 'auto', paddingBottom: 30}]}>
                <Text style={styles.modalTitle}>ບັນທຶກການຊຳລະ</Text>
                <Text style={styles.inputLabel}>ຈຳນວນເງິນ (ກີບ)</Text>
                <TextInput 
                    style={[styles.input, {fontSize: 24, textAlign: 'center', color: COLORS.success, fontWeight: 'bold'}]} 
                    value={payAmount} 
                    onChangeText={(t) => setPayAmount(formatNumber(t.replace(/,/g, '')))} 
                    keyboardType="numeric" 
                    placeholder="0" 
                    autoFocus
                />
                
                <View style={{flexDirection: 'row', gap: 10, marginTop: 20}}>
                    <TouchableOpacity style={[styles.cancelBtn, {flex: 1, marginTop: 0}]} onPress={() => setPaymentModalVisible(false)}>
                        <Text style={styles.cancelBtnText}>ຍົກເລີກ</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.saveBtn, {flex: 1, marginTop: 0}]} onPress={handlePayment}>
                        <Text style={styles.saveBtnText}>ຢືນຢັນ</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  
  headerContainer: { backgroundColor: 'white', padding: 20, paddingBottom: 15, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, elevation: 2 },
  headerTitle: { fontSize: 20, fontFamily: 'Lao-Bold', color: COLORS.text },
  headerSub: { fontSize: 12, fontFamily: 'Lao-Regular', color: '#666' },

  // 🟢 Card Style (ປັບຕາມຮູບ)
  card: { 
    backgroundColor: 'white', 
    borderRadius: 8, 
    marginBottom: 15, 
    padding: 15, 
    elevation: 2, 
    // ຂອບຊ້າຍສີຟ້າ/Teal
    borderLeftWidth: 5, 
    borderLeftColor: COLORS.primary,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 },
  cardTitle: { fontSize: 16, fontFamily: 'Lao-Bold', color: COLORS.text },
  editText: { fontSize: 12, color: '#999', fontFamily: 'Lao-Regular' },
  categoryText: { fontSize: 12, color: '#888', fontFamily: 'Lao-Regular', marginTop: 2 },

  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 5 },
  label: { fontSize: 13, fontFamily: 'Lao-Regular', color: '#666' },
  amountTotal: { fontSize: 18, fontFamily: 'Lao-Bold', color: COLORS.text },

  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  paidLabel: { fontSize: 11, color: '#888', fontFamily: 'Lao-Regular' },
  remainLabel: { fontSize: 11, color: '#888', fontFamily: 'Lao-Regular' },

  progressContainer: { height: 6, backgroundColor: '#f0f0f0', borderRadius: 3, overflow: 'hidden', marginVertical: 5 },
  progressBar: { height: '100%', backgroundColor: COLORS.success },
  
  progressValues: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  paidValue: { fontSize: 13, color: COLORS.success, fontFamily: 'Lao-Bold' },
  remainValue: { fontSize: 13, color: '#F57C00', fontFamily: 'Lao-Bold' }, // 🟢 ສີສົ້ມ

  // 🟢 Grey Box Details
  detailsBox: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 6, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 11, color: '#888', fontFamily: 'Lao-Regular' },
  detailValue: { fontSize: 13, color: '#333', fontFamily: 'Lao-Bold', marginTop: 2 },

  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12 },
  dueDateText: { fontSize: 12, color: '#666', fontFamily: 'Lao-Regular' },
  
  actionButtons: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  historyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  historyText: { fontSize: 12, color: '#555', fontFamily: 'Lao-Regular' },
  deleteBtn: { padding: 5 },
  payBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.success, paddingVertical: 6, paddingHorizontal: 15, borderRadius: 6 },
  payBtnText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 13 },

  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: COLORS.success, flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, elevation: 5 },
  fabText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 16, marginLeft: 8 },

  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { marginTop: 10, color: '#ccc', fontFamily: 'Lao-Regular' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 15, padding: 20, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: 'Lao-Bold', color: COLORS.text },
  
  inputLabel: { fontSize: 13, fontFamily: 'Lao-Bold', color: '#555', marginBottom: 5, marginTop: 10 },
  input: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee', fontFamily: 'Lao-Bold' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#eee' },
  activeCatChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catText: { fontSize: 12, fontFamily: 'Lao-Regular', color: '#666' },
  
  dateInput: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 30 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', backgroundColor: '#f5f5f5' },
  cancelBtnText: { color: '#666', fontFamily: 'Lao-Bold' },
  saveBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', backgroundColor: COLORS.success },
  saveBtnText: { color: 'white', fontFamily: 'Lao-Bold' }
});