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
import CurrencyInput from '../ui/CurrencyInput';

const ORANGE_COLOR = '#F57C00';

// Helper: ຈັດ Format ໃສ່ຈຸດເວລາພິມ
const formatInputNumber = (val: string) => {
    const numericValue = val.replace(/[^0-9]/g, '');
    if (!numericValue) return '';
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

interface DebtItem {
  id: string;
  creditor: string; // ຊື່ເຈົ້າໜີ້
  totalAmount: number;
  paidAmount: number;
  remaining: number;
  note: string;
  date: string;
  history?: Record<string, any>;
  [key: string]: any; 
}

export default function DebtScreen() {
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false); // 🟢 State ເປີດ/ປິດ Modal ເພີ່ມໜີ້
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  
  // Form States (ສຳລັບເພີ່ມໜີ້ໃໝ່)
  const [creditor, setCreditor] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date());
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<DebtItem | null>(null);
  const [payAmount, setPayAmount] = useState('');

  const parseCurrency = (value: any) => {
      if (!value) return 0;
      const strVal = String(value).replace(/,/g, '').replace(/ /g, '');
      const num = parseFloat(strVal);
      return isNaN(num) ? 0 : num;
  };

  // 1. ດຶງຂໍ້ມູນໜີ້ຕ້ອງສົ່ງ (Debts Payable)
  useEffect(() => {
    const debtRef = ref(db, 'debts'); // ໃຊ້ node 'debts' ສຳລັບໜີ້ຕ້ອງສົ່ງ
    return onValue(debtRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.keys(data).map(key => {
            const item = data[key];
            return { 
                id: key, 
                ...item,
                remaining: item.remaining || (item.totalAmount - (item.paidAmount || 0))
            };
        });
        setDebts(list.reverse() as DebtItem[]);
      } else {
        setDebts([]);
      }
    });
  }, []);

  // 🟢 2. ຟັງຊັນບັນທຶກໜີ້ໃໝ່
  const handleAddDebt = async () => {
    if (!creditor || !amount) {
      Alert.alert('ຂໍ້ມູນບໍ່ຄົບ', 'ກະລຸນາໃສ່ຊື່ເຈົ້າໜີ້ ແລະ ຈຳນວນເງິນ');
      return;
    }

    const total = parseCurrency(amount);

    const newDebt = {
      creditor,
      totalAmount: total,
      paidAmount: 0,
      remaining: total,
      note,
      date: date.toISOString(),
      status: 'PENDING',
      history: []
    };

    try {
        await push(ref(db, 'debts'), newDebt);
        Alert.alert('ສຳເລັດ', 'ເພີ່ມລາຍການໜີ້ຮຽບຮ້ອຍ');
        setModalVisible(false);
        // Reset Form
        setCreditor('');
        setAmount('');
        setNote('');
        setDate(new Date());
    } catch (error) {
        Alert.alert('Error', 'ບັນທຶກບໍ່ໄດ້');
    }
  };

  // 3. ຟັງຊັນຊຳລະໜີ້ (ຈ່າຍເງິນອອກ)
  const handlePayment = async () => {
    if (!selectedDebt || !payAmount) return;
    const payVal = parseCurrency(payAmount);
    
    if (payVal > selectedDebt.remaining) {
        Alert.alert('ຜິດພາດ', 'ຍອດຊຳລະເກີນໜີ້ຄົງເຫຼືອ');
        return;
    }

    const newPaid = (selectedDebt.paidAmount || 0) + payVal;
    const newRemaining = selectedDebt.totalAmount - newPaid;
    const status = newRemaining <= 0 ? 'PAID' : 'PENDING';

    const historyRecord = {
        date: new Date().toISOString(),
        amount: payVal,
        type: 'PAYMENT'
    };

    try {
        await update(ref(db, `debts/${selectedDebt.id}`), {
            paidAmount: newPaid,
            remaining: newRemaining,
            status
        });
        await push(ref(db, `debts/${selectedDebt.id}/history`), historyRecord);
        
        setPaymentModalVisible(false);
        setPayAmount('');
        Alert.alert("ສຳເລັດ", "ບັນທຶກການຈ່າຍໜີ້ແລ້ວ");
    } catch (err) {
        Alert.alert("Error", "ເກີດຂໍ້ຜິດພາດ");
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('ຢືນຢັນ', 'ຕ້ອງການລຶບລາຍການນີ້ບໍ່?', [
        { text: 'ຍົກເລີກ', style: 'cancel' },
        { text: 'ລຶບ', style: 'destructive', onPress: async () => await remove(ref(db, `debts/${id}`)) }
    ]);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const renderItem = ({ item }: { item: DebtItem }) => {
    const progress = (item.paidAmount || 0) / item.totalAmount;
    
    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.cardTitle}>{item.creditor}</Text>
                    <Text style={styles.dateText}>{formatDate(new Date(item.date))}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Ionicons name="trash-outline" size={20} color="#999" />
                </TouchableOpacity>
            </View>

            <View style={styles.amountRow}>
                <Text style={styles.label}>ຍອດໜີ້:</Text>
                <Text style={styles.amountTotal}>{formatNumber(item.totalAmount)} ກີບ</Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${Math.min(progress * 100, 100)}%` }]} />
            </View>
            <View style={styles.progressInfo}>
                <Text style={styles.progressText}>ຈ່າຍແລ້ວ {formatNumber(item.paidAmount || 0)}</Text>
                <Text style={styles.remainingText}>ຄ້າງ {formatNumber(item.remaining)}</Text>
            </View>

            {item.remaining > 0 && (
                <TouchableOpacity 
                    style={styles.payBtn} 
                    onPress={() => { setSelectedDebt(item); setPaymentModalVisible(true); }}
                >
                    <Text style={styles.payBtnText}>ຊຳລະໜີ້</Text>
                </TouchableOpacity>
            )}
        </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>ໜີ້ຕ້ອງສົ່ງ (Accounts Payable)</Text>
        <Text style={styles.headerSub}>ບັນທຶກລາຍການທີ່ເຮົາຕິດໜີ້ຜູ້ອື່ນ</Text>
      </View>

      <FlatList
        data={debts}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 15, paddingBottom: 100 }}
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Ionicons name="checkmark-circle-outline" size={60} color="#ddd" />
                <Text style={styles.emptyText}>ບໍ່ມີໜີ້ຕ້ອງສົ່ງ</Text>
            </View>
        }
      />

      {/* 🟢 3. ປຸ່ມເພີ່ມລາຍການ (Floating Button) */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={30} color="white" />
        <Text style={styles.fabText}>ເພີ່ມໜີ້</Text>
      </TouchableOpacity>

      {/* 🟢 Modal ເພີ່ມໜີ້ໃໝ່ */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>ເພີ່ມໜີ້ໃໝ່</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                        <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                </View>

                <ScrollView>
                    <Text style={styles.inputLabel}>ຊື່ເຈົ້າໜີ້ *</Text>
                    <TextInput 
                        style={styles.input} 
                        value={creditor} 
                        onChangeText={setCreditor} 
                        placeholder="ຕົວຢ່າງ: ຮ້ານຂາຍສົ່ງ A" 
                    />

                    <Text style={styles.inputLabel}>ຍອດໜີ້ (ກີບ) *</Text>
                    <CurrencyInput 
                        style={styles.input} 
                        value={amount} 
                        onChangeValue={setAmount} 
                        placeholder="0" 
                    />

                    <Text style={styles.inputLabel}>ວັນທີກູ້ຢືມ</Text>
                    <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
                        <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                        <Text style={{fontFamily: 'Lao-Bold', color: '#333'}}>{formatDate(date)}</Text>
                    </TouchableOpacity>

                    <Text style={styles.inputLabel}>ໝາຍເຫດ</Text>
                    <TextInput 
                        style={styles.input} 
                        value={note} 
                        onChangeText={setNote} 
                        placeholder="ລາຍລະອຽດເພີ່ມເຕີມ..." 
                    />

                    <TouchableOpacity style={styles.saveBtn} onPress={handleAddDebt}>
                        <Text style={styles.saveBtnText}>ບັນທຶກ</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal ຊຳລະໜີ້ */}
      <Modal visible={paymentModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>ຊຳລະໜີ້ຄືນ</Text>
                <Text style={{marginBottom: 10, color: '#666'}}>
                    ໃຫ້: <Text style={{fontFamily:'Lao-Bold'}}>{selectedDebt?.creditor}</Text>
                </Text>
                
                <Text style={styles.inputLabel}>ຈຳນວນເງິນທີ່ຈ່າຍ *</Text>
                <CurrencyInput 
                    style={styles.input} 
                    value={payAmount} 
                    onChangeValue={setPayAmount} 
                    placeholder="0" 
                />

                <View style={{flexDirection: 'row', gap: 10, marginTop: 15}}>
                    <TouchableOpacity style={[styles.cancelBtn, {flex: 1}]} onPress={() => setPaymentModalVisible(false)}>
                        <Text style={styles.cancelBtnText}>ຍົກເລີກ</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.saveBtn, {flex: 1, marginTop: 0}]} onPress={handlePayment}>
                        <Text style={styles.saveBtnText}>ຢືນຢັນ</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        Platform.OS === 'ios' ? (
            <Modal transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={{backgroundColor:'white', padding:20, borderRadius:10, width:'80%', alignItems:'center'}}>
                        <DateTimePicker value={date} mode="date" display="inline" onChange={onDateChange} />
                        <TouchableOpacity onPress={() => setShowDatePicker(false)} style={{marginTop:10, padding:10}}>
                            <Text style={{color: COLORS.primary, fontFamily:'Lao-Bold'}}>ຕົກລົງ</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        ) : (
            <DateTimePicker value={date} mode="date" onChange={onDateChange} />
        )
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerContainer: { backgroundColor: 'white', padding: 20, paddingBottom: 15, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, elevation: 2 },
  headerTitle: { fontSize: 20, fontFamily: 'Lao-Bold', color: COLORS.text },
  headerSub: { fontSize: 12, fontFamily: 'Lao-Regular', color: '#666' },
  
  card: { backgroundColor: 'white', borderRadius: 10, marginBottom: 10, padding: 15, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardTitle: { fontSize: 16, fontFamily: 'Lao-Bold', color: '#333' },
  dateText: { fontSize: 12, color: '#888' },
  
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  label: { fontSize: 14, color: '#666' },
  amountTotal: { fontSize: 16, fontFamily: 'Lao-Bold', color: COLORS.primary },
  
  progressContainer: { height: 6, backgroundColor: '#f0f0f0', borderRadius: 3, overflow: 'hidden', marginVertical: 5 },
  progressBar: { height: '100%', backgroundColor: COLORS.primary },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressText: { fontSize: 12, color: '#666' },
  remainingText: { fontSize: 12, color: ORANGE_COLOR, fontFamily: 'Lao-Bold' },
  
  payBtn: { backgroundColor: ORANGE_COLOR, padding: 8, borderRadius: 5, alignItems: 'center' },
  payBtnText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 12 },
  
  // 🟢 Floating Button Style
  fab: { 
    position: 'absolute', bottom: 20, right: 20, 
    backgroundColor: COLORS.primary, 
    flexDirection: 'row', alignItems: 'center', 
    paddingVertical: 12, paddingHorizontal: 20, 
    borderRadius: 30, elevation: 5 
  },
  fabText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 16, marginLeft: 5 },
  
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { marginTop: 10, color: '#ccc', fontFamily: 'Lao-Regular' },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 15, padding: 20, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: 'Lao-Bold', color: COLORS.text },
  
  inputLabel: { fontSize: 14, fontFamily: 'Lao-Bold', color: '#555', marginBottom: 5, marginTop: 10 },
  input: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee', fontFamily: 'Lao-Bold' },
  dateInput: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  
  saveBtn: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 16 },
  cancelBtn: { backgroundColor: '#eee', padding: 15, borderRadius: 8, alignItems: 'center' },
  cancelBtnText: { color: '#333', fontFamily: 'Lao-Bold', fontSize: 16 }
});