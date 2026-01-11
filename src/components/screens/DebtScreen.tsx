import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { onValue, push, ref, remove, update } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView
} from 'react-native';
import { db } from '../../firebase';
import { COLORS, formatDate, formatNumber } from '../../types';

// ໝວດໝູ່ໜີ້ສິນ
const DEBT_CATEGORIES = ['ເງິນກູ້', 'ບັດເຄດິດ', 'ຢືມເພື່ອນ', 'ຜ່ອນສິນຄ້າ', 'ອື່ນໆ'];

interface DebtItem {
  id: string;
  title: string;
  category: string;
  totalAmount: number;
  paidAmount: number;
  interestRate: number;
  monthlyPayment: number;
  dueDate: string;
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
  
  // Date Picker States
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateMode, setDateMode] = useState<'due' | 'payment'>('due');

  // Payment States
  const [selectedDebt, setSelectedDebt] = useState<DebtItem | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date());

  // 1. ດຶງຂໍ້ມູນຈາກ Firebase (🟢 ແກ້ໄຂ NaN ດ້ວຍການ Force Number)
  useEffect(() => {
    const debtRef = ref(db, 'debts');
    const unsubscribe = onValue(debtRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.keys(data).map(key => ({ 
            id: key, 
            ...data[key],
            // 🟢 ແປງເປັນຕົວເລກທັນທີເພື່ອປ້ອງກັນ Error NaN
            totalAmount: Number(data[key].totalAmount) || 0,
            paidAmount: Number(data[key].paidAmount) || 0,
            interestRate: Number(data[key].interestRate) || 0,
            monthlyPayment: Number(data[key].monthlyPayment) || 0,
        }));
        setDebts(list.reverse() as DebtItem[]);
      } else {
        setDebts([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. ບັນທຶກໜີ້ໃໝ່
  const handleSaveDebt = async () => {
    if (!title || !totalAmount) {
      Alert.alert('ຂໍ້ມູນບໍ່ຄົບ', 'ກະລຸນາໃສ່ຊື່ ແລະ ຈຳນວນເງິນ');
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
      Alert.alert('ສຳເລັດ', 'ບັນທຶກໜີ້ສິນຮຽບຮ້ອຍ');
    } catch (error) {
      Alert.alert('Error', 'ບັນທຶກບໍ່ໄດ້');
    }
  };

  // 3. ບັນທຶກການຊຳລະ
  const handlePayment = async () => {
    if (!selectedDebt || !payAmount) return;
    const amount = parseFloat(payAmount.replace(/,/g, ''));
    
    // ອັບເດດຂໍ້ມູນລ່າສຸດ
    const currentDebt = debts.find(d => d.id === selectedDebt.id) || selectedDebt;
    const newPaidAmount = (currentDebt.paidAmount || 0) + amount;
    
    if (newPaidAmount > currentDebt.totalAmount) {
        Alert.alert('ຜິດພາດ', 'ຍອດຊຳລະເກີນກວ່າໜີ້ທີ່ຄ້າງຢູ່');
        return;
    }

    const paymentRecord = {
        amount,
        date: paymentDate.toISOString(),
        type: 'PAYMENT'
    };

    try {
        await update(ref(db, `debts/${currentDebt.id}`), { paidAmount: newPaidAmount });
        await push(ref(db, `debts/${currentDebt.id}/history`), paymentRecord);
        setPaymentModalVisible(false);
        setPayAmount('');
        setPaymentDate(new Date());
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
    if (date) {
        if (dateMode === 'due') setDueDate(date);
        else setPaymentDate(date);
    }
  };

  const openPaymentModal = (item: DebtItem) => {
      setSelectedDebt(item);
      setPayAmount('');
      setPaymentDate(new Date());
      setPaymentModalVisible(true);
  };

  const renderItem = ({ item }: { item: DebtItem }) => {
    const progress = item.totalAmount > 0 ? (item.paidAmount / item.totalAmount) : 0;
    const remaining = item.totalAmount - item.paidAmount;

    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.categoryBadge}>{item.category}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Ionicons name="trash-outline" size={20} color="#ccc" />
                </TouchableOpacity>
            </View>

            <View style={styles.amountRow}>
                <Text style={styles.label}>ຍອດກູ້ຢືມ:</Text>
                <Text style={styles.amountTotal}>{formatNumber(item.totalAmount)} ກີບ</Text>
            </View>

            <View style={styles.progressContainer}>
                {/* 🟢 Progress Bar ໃຊ້ສີ Theme */}
                <View style={[styles.progressBar, { width: `${Math.min(progress * 100, 100)}%` }]} />
            </View>
            <View style={styles.progressInfo}>
                <Text style={styles.progressText}>ຊຳລະແລ້ວ ({Math.round(progress * 100)}%)</Text>
                <Text style={styles.remainingText}>{formatNumber(remaining)} ກີບ</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>ດອກເບ້ຍ (%)</Text>
                    <Text style={styles.detailValue}>{item.interestRate}% / ປີ</Text>
                </View>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>ຜ່ອນ/ເດືອນ</Text>
                    <Text style={styles.detailValue}>{formatNumber(item.monthlyPayment)} ກີບ</Text>
                </View>
            </View>
            
            <View style={styles.footerRow}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 5}}>
                    <Ionicons name="calendar-outline" size={14} color="#666" />
                    <Text style={styles.dueDateText}>ກຳນົດຈ່າຍ: {formatDate(new Date(item.dueDate))}</Text>
                </View>
                
                <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.historyBtn}>
                        <Ionicons name="time-outline" size={18} color="#666" />
                    </TouchableOpacity>
                    {/* 🟢 ປຸ່ມຊຳລະໃຊ້ສີ Theme */}
                    <TouchableOpacity style={styles.payBtn} onPress={() => openPaymentModal(item)}>
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

      {/* 🟢 FAB ໃຊ້ສີ Theme */}
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
                    <TouchableOpacity style={styles.dateInput} onPress={() => { setDateMode('due'); setShowDatePicker(true); }}>
                        <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                        <Text style={{fontFamily: 'Lao-Bold', color: COLORS.text}}>{formatDate(dueDate)}</Text>
                    </TouchableOpacity>

                    <View style={styles.modalActions}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                            <Text style={styles.cancelBtnText}>ຍົກເລີກ</Text>
                        </TouchableOpacity>
                        {/* 🟢 ປຸ່ມ Save ໃຊ້ສີ Theme */}
                        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveDebt}>
                            <Text style={styles.saveBtnText}>ບັນທຶກ</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Payment Modal */}
      <Modal visible={paymentModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, {height: 'auto', paddingBottom: 30}]}>
                <Text style={styles.modalTitle}>ບັນທຶກການຊຳລະ</Text>
                
                {selectedDebt && (
                    <View style={{marginBottom: 15}}>
                        <Text style={{fontFamily: 'Lao-Regular', color: '#666', textAlign:'center'}}>ຊຳລະໜີ້: <Text style={{fontFamily: 'Lao-Bold', color: COLORS.primary}}>{selectedDebt.title}</Text></Text>
                    </View>
                )}

                <ScrollView>
                    <Text style={styles.inputLabel}>ວັນທີຊຳລະ *</Text>
                    <TouchableOpacity style={styles.dateInput} onPress={() => { setDateMode('payment'); setShowDatePicker(true); }}>
                        <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                        <Text style={{fontFamily: 'Lao-Bold', color: COLORS.text}}>{formatDate(paymentDate)}</Text>
                    </TouchableOpacity>

                    <Text style={styles.inputLabel}>ຈຳນວນເງິນ (ກີບ) *</Text>
                    <TextInput 
                        style={[styles.input, {fontSize: 24, textAlign: 'center', color: COLORS.primary, fontWeight: 'bold'}]} 
                        value={payAmount} 
                        onChangeText={(t) => setPayAmount(formatNumber(t.replace(/,/g, '')))} 
                        keyboardType="numeric" 
                        placeholder="0" 
                        autoFocus
                    />

                    <View style={styles.modalActions}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setPaymentModalVisible(false)}>
                            <Text style={styles.cancelBtnText}>ຍົກເລີກ</Text>
                        </TouchableOpacity>
                        {/* 🟢 ປຸ່ມ Save ໃຊ້ສີ Theme */}
                        <TouchableOpacity style={styles.saveBtn} onPress={handlePayment}>
                            <Text style={styles.saveBtnText}>ຢືນຢັນ</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </View>
      </Modal>

      {showDatePicker && (
          <DateTimePicker 
            value={dateMode === 'due' ? dueDate : paymentDate} 
            mode="date" 
            display="default" 
            onChange={onDateChange} 
          />
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  
  headerContainer: { backgroundColor: 'white', padding: 20, paddingBottom: 15, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, elevation: 2 },
  headerTitle: { fontSize: 20, fontFamily: 'Lao-Bold', color: COLORS.text },
  headerSub: { fontSize: 12, fontFamily: 'Lao-Regular', color: '#666' },

  card: { backgroundColor: 'white', borderRadius: 8, marginBottom: 15, padding: 15, elevation: 2, borderLeftWidth: 5, borderLeftColor: COLORS.primary, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 },
  cardTitle: { fontSize: 16, fontFamily: 'Lao-Bold', color: COLORS.text },
  categoryBadge: { fontSize: 12, fontFamily: 'Lao-Regular', color: '#888', marginTop: 2 },

  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 5 },
  label: { fontSize: 13, fontFamily: 'Lao-Regular', color: '#666' },
  amountTotal: { fontSize: 18, fontFamily: 'Lao-Bold', color: COLORS.text },

  progressContainer: { height: 6, backgroundColor: '#f0f0f0', borderRadius: 3, overflow: 'hidden', marginVertical: 5 },
  // 🟢 Progress bar ເປັນສີ Theme (ຫຼື Success ກໍໄດ້ ແຕ່ເພື່ອຄວາມຄຸມໂທນລອງໃຊ້ Primary)
  progressBar: { height: '100%', backgroundColor: COLORS.primary }, 
  
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  progressText: { fontSize: 11, color: COLORS.primary, fontFamily: 'Lao-Bold' },
  remainingText: { fontSize: 12, color: '#F57C00', fontFamily: 'Lao-Bold' }, // ສີສົ້ມ

  divider: { height: 1, backgroundColor: '#f5f5f5', marginBottom: 10 },

  detailsGrid: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 6, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 11, color: '#888', fontFamily: 'Lao-Regular' },
  detailValue: { fontSize: 13, color: '#333', fontFamily: 'Lao-Bold', marginTop: 2 },

  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12 },
  dueDateText: { fontSize: 12, color: '#666', fontFamily: 'Lao-Regular' },
  
  actionButtons: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  historyBtn: { padding: 8, backgroundColor: '#f5f5f5', borderRadius: 8 },
  
  // 🟢 ປຸ່ມຊຳລະສີ Theme
  payBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.primary, paddingVertical: 6, paddingHorizontal: 15, borderRadius: 6 },
  payBtnText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 13 },

  // 🟢 FAB ສີ Theme
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, elevation: 5 },
  fabText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 16, marginLeft: 8 },

  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { marginTop: 10, color: '#ccc', fontFamily: 'Lao-Regular' },

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
  
  // 🟢 ປຸ່ມ Save ສີ Theme
  saveBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', backgroundColor: COLORS.primary },
  saveBtnText: { color: 'white', fontFamily: 'Lao-Bold' }
});