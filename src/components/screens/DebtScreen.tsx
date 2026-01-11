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

interface DebtItem {
  id: string;
  title: string;       // ຊື່ລາຍການໜີ້ (ເຊັ່ນ: ຢືມທະນາຄານ)
  totalAmount: number; // ຍອດກູ້ຢືມທັງໝົດ
  paidAmount: number;  // ຍອດທີ່ຈ່າຍໄປແລ້ວ
  interestRate: number;// ອັດຕາດອກເບ້ຍ (%)
  term: number;        // ໄລຍະເວລາ (ເດືອນ)
  startDate: string;   // ວັນທີເລີ່ມກູ້
  dueDate: string;     // ວັນທີຄົບກຳນົດ
  history?: Record<string, any>; // ປະຫວັດການຊຳລະ
}

export default function DebtScreen() {
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  
  // Form States (Add/Edit)
  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [term, setTerm] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Payment State
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState('');

  // 1. ດຶງຂໍ້ມູນໜີ້ສິນ
  useEffect(() => {
    const debtRef = ref(db, 'debts'); // 🟢 ດຶງຈາກ Path 'debts' ໃຫ້ຕົງກັບ Web App
    const unsubscribe = onValue(debtRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.keys(data).map(key => ({ 
            id: key, 
            ...data[key],
            paidAmount: data[key].paidAmount || 0 // ກັນໄວ້ຖ້າຍັງບໍ່ມີຄ່າ
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
      Alert.alert('ຂໍ້ມູນບໍ່ຄົບ', 'ກະລຸນາໃສ່ຊື່ລາຍການ ແລະ ຍອດເງິນກູ້');
      return;
    }

    const newDebt = {
      title,
      totalAmount: parseFloat(totalAmount.replace(/,/g, '')),
      paidAmount: 0,
      interestRate: parseFloat(interestRate) || 0,
      term: parseInt(term) || 0,
      startDate: new Date().toISOString(),
      dueDate: dueDate.toISOString(),
      createdAt: new Date().toISOString()
    };

    try {
      await push(ref(db, 'debts'), newDebt);
      setModalVisible(false);
      resetForm();
      Alert.alert('ສຳເລັດ', 'ບັນທຶກລາຍການໜີ້ໃໝ່ຮຽບຮ້ອຍ');
    } catch (error) {
      Alert.alert('Error', 'ບັນທຶກບໍ່ໄດ້');
    }
  };

  // 3. ບັນທຶກການຊຳລະຄືນ
  const handlePayment = async () => {
    if (!selectedDebtId || !payAmount) return;
    
    const amount = parseFloat(payAmount.replace(/,/g, ''));
    const debt = debts.find(d => d.id === selectedDebtId);
    
    if (!debt) return;

    const newPaidAmount = (debt.paidAmount || 0) + amount;
    
    // ບັນທຶກປະຫວັດການຈ່າຍ
    const paymentRecord = {
        amount,
        date: new Date().toISOString(),
        type: 'PAYMENT'
    };

    try {
        // ອັບເດດຍອດຈ່າຍລວມ
        await update(ref(db, `debts/${selectedDebtId}`), { paidAmount: newPaidAmount });
        // ເພີ່ມປະຫວັດ
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
    setTotalAmount('');
    setInterestRate('');
    setTerm('');
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
            {/* Header Card */}
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardDate}>ຄົບກຳນົດ: {formatDate(new Date(item.dueDate))}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Ionicons name="trash-outline" size={20} color="#999" />
                </TouchableOpacity>
            </View>

            {/* Amount Info */}
            <View style={styles.amountRow}>
                <View>
                    <Text style={styles.label}>ຍອດກູ້ຢືມ</Text>
                    <Text style={styles.amountTotal}>{formatNumber(item.totalAmount)} ₭</Text>
                </View>
                <View style={{alignItems: 'flex-end'}}>
                    <Text style={styles.label}>ຍອດຄົງເຫຼືອ</Text>
                    <Text style={styles.amountRemaining}>{formatNumber(remaining)} ₭</Text>
                </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${Math.min(progress * 100, 100)}%` }]} />
            </View>
            <View style={styles.progressTextRow}>
                <Text style={styles.progressText}>ຊຳລະແລ້ວ {Math.round(progress * 100)}%</Text>
                <Text style={styles.progressText}>{formatNumber(item.paidAmount)} ₭</Text>
            </View>

            {/* Actions */}
            <View style={styles.actionRow}>
                <View style={styles.infoBadge}>
                    <Ionicons name="time-outline" size={14} color="#666" />
                    <Text style={styles.infoText}>{item.term} ເດືອນ</Text>
                </View>
                <View style={styles.infoBadge}>
                    <Ionicons name="trending-up-outline" size={14} color="#666" />
                    <Text style={styles.infoText}>{item.interestRate}% / ປີ</Text>
                </View>
                
                <TouchableOpacity 
                    style={styles.payBtn} 
                    onPress={() => { setSelectedDebtId(item.id); setPaymentModalVisible(true); }}
                >
                    <Ionicons name="wallet-outline" size={16} color="white" />
                    <Text style={styles.payBtnText}>ຊຳລະ</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
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

      {/* FAB Add Button */}
      <TouchableOpacity style={styles.fab} onPress={() => { resetForm(); setModalVisible(true); }}>
        <Ionicons name="add" size={30} color="white" />
        <Text style={styles.fabText}>ເພີ່ມໜີ້ສິນ</Text>
      </TouchableOpacity>

      {/* Modal Add Debt */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>ເພີ່ມລາຍການໜີ້ໃໝ່</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color="#666" /></TouchableOpacity>
                </View>

                <ScrollView>
                    <Text style={styles.inputLabel}>ຊື່ລາຍການ (ເຊັ່ນ: ກູ້ຢືມທະນາຄານ)</Text>
                    <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="ພິມຊື່ລາຍການ..." />

                    <Text style={styles.inputLabel}>ຍອດເງິນກູ້ (ກີບ)</Text>
                    <TextInput style={styles.input} value={totalAmount} onChangeText={setTotalAmount} keyboardType="numeric" placeholder="0" />

                    <View style={{flexDirection: 'row', gap: 10}}>
                        <View style={{flex: 1}}>
                            <Text style={styles.inputLabel}>ດອກເບ້ຍ (%) / ປີ</Text>
                            <TextInput style={styles.input} value={interestRate} onChangeText={setInterestRate} keyboardType="numeric" placeholder="0" />
                        </View>
                        <View style={{flex: 1}}>
                            <Text style={styles.inputLabel}>ໄລຍະເວລາ (ເດືອນ)</Text>
                            <TextInput style={styles.input} value={term} onChangeText={setTerm} keyboardType="numeric" placeholder="0" />
                        </View>
                    </View>

                    <Text style={styles.inputLabel}>ວັນທີຄົບກຳນົດ</Text>
                    <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
                        <Text style={{fontFamily: 'Lao-Bold', color: COLORS.text}}>{formatDate(dueDate)}</Text>
                        <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.saveBtn} onPress={handleSaveDebt}>
                        <Text style={styles.saveBtnText}>ບັນທຶກຂໍ້ມູນ</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
      </Modal>
      {showDatePicker && (<DateTimePicker value={dueDate} mode="date" display="default" onChange={onDateChange} />)}

      {/* Modal Payment */}
      <Modal visible={paymentModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, {height: 'auto', paddingBottom: 30}]}>
                <Text style={styles.modalTitle}>ບັນທຶກການຊຳລະ</Text>
                <Text style={styles.inputLabel}>ຈຳນວນເງິນທີ່ຈ່າຍ (ກີບ)</Text>
                <TextInput 
                    style={[styles.input, {fontSize: 20, textAlign: 'center', color: COLORS.success}]} 
                    value={payAmount} 
                    onChangeText={(t) => setPayAmount(formatNumber(t.replace(/,/g, '')))} 
                    keyboardType="numeric" 
                    placeholder="0" 
                    autoFocus
                />
                
                <View style={{flexDirection: 'row', gap: 10, marginTop: 20}}>
                    <TouchableOpacity style={[styles.saveBtn, {backgroundColor: '#eee', flex: 1}]} onPress={() => setPaymentModalVisible(false)}>
                        <Text style={[styles.saveBtnText, {color: '#666'}]}>ຍົກເລີກ</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.saveBtn, {backgroundColor: COLORS.success, flex: 1, marginTop: 0}]} onPress={handlePayment}>
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
  
  headerContainer: { backgroundColor: 'white', padding: 20, paddingBottom: 15, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, elevation: 3 },
  headerTitle: { fontSize: 20, fontFamily: 'Lao-Bold', color: COLORS.text },
  headerSub: { fontSize: 12, fontFamily: 'Lao-Regular', color: '#666' },

  card: { backgroundColor: 'white', borderRadius: 15, marginBottom: 15, padding: 15, elevation: 2, borderWidth: 1, borderColor: '#f0f0f0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  cardTitle: { fontSize: 16, fontFamily: 'Lao-Bold', color: COLORS.text },
  cardDate: { fontSize: 12, fontFamily: 'Lao-Regular', color: '#999', marginTop: 2 },

  amountRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  label: { fontSize: 12, fontFamily: 'Lao-Regular', color: '#888' },
  amountTotal: { fontSize: 16, fontFamily: 'Lao-Bold', color: COLORS.text },
  amountRemaining: { fontSize: 16, fontFamily: 'Lao-Bold', color: COLORS.danger },

  progressContainer: { height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden', marginBottom: 5 },
  progressBar: { height: '100%', backgroundColor: COLORS.success },
  progressTextRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  progressText: { fontSize: 11, fontFamily: 'Lao-Regular', color: COLORS.success },

  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f5f5f5', paddingTop: 10 },
  infoBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f9f9f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  infoText: { fontSize: 12, fontFamily: 'Lao-Regular', color: '#666' },
  payBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.success, paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20 },
  payBtnText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 12 },

  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, elevation: 5 },
  fabText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 16, marginLeft: 8 },

  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { marginTop: 10, color: '#ccc', fontFamily: 'Lao-Regular' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 20, padding: 20, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: 'Lao-Bold', color: COLORS.text, textAlign: 'center' },
  
  inputLabel: { fontSize: 13, fontFamily: 'Lao-Bold', color: '#555', marginBottom: 5, marginTop: 10 },
  input: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#eee', fontFamily: 'Lao-Bold' },
  dateInput: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f9f9f9', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#eee', alignItems: 'center' },
  
  saveBtn: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 16 }
});