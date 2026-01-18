import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { onValue, push, ref, remove, update } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { COLORS, formatDate, formatNumber } from '../../types';
import CurrencyInput from '../ui/CurrencyInput';

const DEBT_CATEGORIES = ['ເງິນກູ້', 'ບັດເຄດິດ', 'ຢືມເພື່ອນ', 'ຜ່ອນສິນຄ້າ', 'ອື່ນໆ'];
const ORANGE_COLOR = '#F57C00';

// Currency Helper
const formatInputNumber = (val: string) => {
    const numericValue = val.replace(/[^0-9]/g, '');
    if (!numericValue) return '';
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const parseCurrency = (value: any) => {
    if (!value) return 0;
    const strVal = String(value).replace(/,/g, '').replace(/ /g, '');
    const num = parseFloat(strVal);
    return isNaN(num) ? 0 : num;
};

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
  [key: string]: any; 
}

export default function DebtScreen() {
  const { hasPermission } = useAuth();

  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);

  // Form States
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(DEBT_CATEGORIES[0]);
  const [totalAmount, setTotalAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateMode, setDateMode] = useState<'due' | 'payment'>('due');

  const [selectedDebt, setSelectedDebt] = useState<DebtItem | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date());

  // 1. Fetch Data
  useEffect(() => {
    if (!hasPermission('accessFinancial')) return;

    const debtRef = ref(db, 'debts');
    const unsubscribe = onValue(debtRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.keys(data).map(key => {
            const item = data[key];
            const total = parseCurrency(item.originalAmount || item.totalAmount || item.amount);
            const remaining = parseCurrency(item.remainingBalance);
            let paid = parseCurrency(item.paidAmount || item.paid);
            if (paid === 0 && total > 0 && item.remainingBalance !== undefined) {
                paid = total - remaining;
            }
            return { 
                id: key, 
                ...item, 
                title: item.name || item.title || 'ບໍ່ລະບຸຊື່',
                category: item.category || 'ອື່ນໆ',
                totalAmount: total,
                paidAmount: paid,
                interestRate: parseCurrency(item.interestRate),
                monthlyPayment: parseCurrency(item.monthlyPayment),
                dueDate: item.dueDate || new Date().toISOString()
            };
        });
        setDebts(list.reverse() as DebtItem[]);
      } else {
        setDebts([]);
      }
    }, (error) => {
        console.error("Debt Load Error:", error);
    });
    return () => unsubscribe();
  }, []);

  // 2. History Logic
  useEffect(() => {
    if (selectedDebt && historyModalVisible) {
        const currentDebt = debts.find(d => d.id === selectedDebt.id);
        if (currentDebt && currentDebt.history) {
            const list = Object.keys(currentDebt.history).map(key => ({
                id: key,
                ...currentDebt.history![key]
            }));
            list.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setHistoryList(list);
        } else {
            setHistoryList([]);
        }
    }
  }, [debts, selectedDebt, historyModalVisible]);

  // Save Debt
  const handleSaveDebt = async () => {
    if (!title || !totalAmount) {
      Alert.alert('ຂໍ້ມູນບໍ່ຄົບ', 'ກະລຸນາໃສ່ຊື່ ແລະ ຈຳນວນເງິນ');
      return;
    }
    const amountNum = parseCurrency(totalAmount);
    const debtData = {
      title,
      category,
      totalAmount: amountNum,
      remainingBalance: amountNum,
      paidAmount: 0,
      interestRate: parseCurrency(interestRate),
      monthlyPayment: parseCurrency(monthlyPayment),
      dueDate: dueDate.toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      if (currentId) {
          const oldDebt = debts.find(d => d.id === currentId);
          const oldPaid = oldDebt?.paidAmount || 0;
          const newRemaining = amountNum - oldPaid;
          await update(ref(db, `debts/${currentId}`), {
              ...debtData,
              remainingBalance: newRemaining,
              paidAmount: oldPaid
          });
          Alert.alert('ສຳເລັດ', 'ແກ້ໄຂຂໍ້ມູນຮຽບຮ້ອຍ');
      } else {
          await push(ref(db, 'debts'), { ...debtData, createdAt: new Date().toISOString() });
          Alert.alert('ສຳເລັດ', 'ບັນທຶກໜີ້ສິນໃໝ່ຮຽບຮ້ອຍ');
      }
      setModalVisible(false);
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'ບັນທຶກບໍ່ໄດ້');
    }
  };

  const openEditModal = (item: DebtItem) => {
      setCurrentId(item.id);
      setTitle(item.title);
      setCategory(item.category);
      setTotalAmount(formatNumber(item.totalAmount));
      setInterestRate(item.interestRate.toString());
      setMonthlyPayment(formatNumber(item.monthlyPayment));
      setDueDate(new Date(item.dueDate));
      setModalVisible(true);
  };

  const handlePayment = async () => {
    if (!selectedDebt || !payAmount) return;
    const amount = parseCurrency(payAmount);
    const currentDebt = debts.find(d => d.id === selectedDebt.id) || selectedDebt;
    const newPaidAmount = (currentDebt.paidAmount || 0) + amount;
    const newRemaining = currentDebt.totalAmount - newPaidAmount;
    
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
        await update(ref(db, `debts/${currentDebt.id}`), { 
            paidAmount: newPaidAmount,
            remainingBalance: newRemaining
        });
        await push(ref(db, `debts/${currentDebt.id}/history`), paymentRecord);
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
    setCurrentId(null);
    setTitle('');
    setCategory(DEBT_CATEGORIES[0]);
    setTotalAmount('');
    setInterestRate('');
    setMonthlyPayment('');
    setDueDate(new Date());
  };

  const toggleDatePicker = (mode: 'due' | 'payment') => {
    Keyboard.dismiss(); 
    setDateMode(mode);
    setShowDatePicker(true);
  };

  const onDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) {
        if (dateMode === 'due') setDueDate(date);
        else setPaymentDate(date);
    }
  };

  const renderItem = ({ item }: { item: DebtItem }) => {
    const total = item.totalAmount > 0 ? item.totalAmount : 1;
    const paid = item.paidAmount || 0;
    const progress = paid / total;
    const remaining = total - paid;

    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={{flex: 1}}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.categoryBadge}>{item.category}</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={() => openEditModal(item)} style={styles.iconBtn}>
                        <Ionicons name="pencil" size={18} color={COLORS.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconBtn}>
                        <Ionicons name="trash-outline" size={18} color={ORANGE_COLOR} />
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.amountRow}>
                <Text style={styles.label}>ຍອດກູ້ຢືມ:</Text>
                <Text style={styles.amountTotal}>{formatNumber(item.totalAmount)} ກີບ</Text>
            </View>
            <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${Math.min(progress * 100, 100)}%` }]} />
            </View>
            <View style={styles.progressInfo}>
                <Text style={styles.progressText}>ຊຳລະແລ້ວ ({Math.round(progress * 100)}%)</Text>
                <Text style={styles.remainingText}>{formatNumber(remaining)} ກີບ</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.footerRow}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 5}}>
                    <Ionicons name="calendar-outline" size={14} color="#666" />
                    <Text style={styles.dueDateText}>ກຳນົດ: {formatDate(new Date(item.dueDate))}</Text>
                </View>
                <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.historyBtn} onPress={() => { setSelectedDebt(item); setHistoryModalVisible(true); }}>
                        <Ionicons name="time-outline" size={16} color="#555" />
                        <Text style={styles.historyText}>ປະຫວັດ</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.payBtn} onPress={() => { setSelectedDebt(item); setPayAmount(''); setPaymentModalVisible(true); }}>
                        <Ionicons name="wallet-outline" size={16} color="white" />
                        <Text style={styles.payBtnText}>ຊຳລະ</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
  };

  // Security Check (Last Step)
  if (!hasPermission('accessFinancial')) {
      return (
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F9FA'}}>
              <Ionicons name="lock-closed-outline" size={50} color="#ccc" />
              <Text style={{fontFamily: 'Lao-Bold', fontSize: 18, color: '#666', marginTop: 10}}>
                  ທ່ານບໍ່ມີສິດເຂົ້າເຖິງຂໍ້ມູນການເງິນ
              </Text>
          </View>
      );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={{flex: 1}}>
            <Text style={styles.headerTitle}>ໜີ້ຕ້ອງສົ່ງ (Payables)</Text>
            <Text style={styles.headerSub}>ຈັດການເງິນກູ້ ແລະ ການຜ່ອນຊຳລະ</Text>
        </View>
        <TouchableOpacity style={styles.headerAddBtn} onPress={() => { resetForm(); setModalVisible(true); }}>
            <Ionicons name="add-circle" size={32} color={COLORS.primary} />
            <Text style={styles.headerAddText}>ເພີ່ມ</Text>
        </TouchableOpacity>
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
        <Text style={styles.fabText}>ເພີ່ມໜີ້</Text>
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{currentId ? 'ແກ້ໄຂຂໍ້ມູນ' : 'ເພີ່ມໜີ້ສິນໃໝ່'}</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color="#666" /></TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={styles.inputLabel}>ຊື່ໜີ້ສິນ *</Text>
                    <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="ເງິນກູ້ທະນາຄານ..." />
                    <Text style={styles.inputLabel}>ໝວດໝູ່ *</Text>
                    <View style={styles.categoryRow}>
                        {DEBT_CATEGORIES.map((cat) => (
                            <TouchableOpacity key={cat} style={[styles.catChip, category === cat && styles.activeCatChip]} onPress={() => setCategory(cat)}>
                                <Text style={[styles.catText, category === cat && {color: 'white'}]}>{cat}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Text style={styles.inputLabel}>ຈຳນວນເງິນຕົ້ນ *</Text>
                    <CurrencyInput style={styles.input} value={totalAmount} onChangeValue={setTotalAmount} placeholder="0" />
                    <View style={{flexDirection: 'row', gap: 10}}>
                        <View style={{flex: 1}}>
                            <Text style={styles.inputLabel}>ດອກເບ້ຍ (%)</Text>
                            <TextInput style={styles.input} value={interestRate} onChangeText={setInterestRate} keyboardType="numeric" placeholder="0" />
                        </View>
                        <View style={{flex: 1}}>
                            <Text style={styles.inputLabel}>ຜ່ອນ/ເດືອນ</Text>
                            <CurrencyInput style={styles.input} value={monthlyPayment} onChangeValue={setMonthlyPayment} placeholder="0" />
                        </View>
                    </View>
                    <Text style={styles.inputLabel}>ກຳນົດຊຳລະ</Text>
                    <TouchableOpacity style={styles.dateInput} onPress={() => toggleDatePicker('due')}>
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

      {/* Payment Modal */}
      <Modal visible={paymentModalVisible} animationType="fade" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>ບັນທຶກການຊຳລະໜີ້</Text>
                    <TouchableOpacity onPress={() => setPaymentModalVisible(false)}><Ionicons name="close" size={24} color="#666" /></TouchableOpacity>
                </View>
                <ScrollView>
                    <Text style={styles.inputLabel}>ຈຳນວນເງິນຊຳລະ *</Text>
                    <CurrencyInput style={[styles.inputLarge, { color: COLORS.primary }]} value={payAmount} onChangeValue={setPayAmount} placeholder="0" />
                    <View style={styles.modalActions}>
                        <TouchableOpacity style={[styles.saveBtn, {backgroundColor: COLORS.primary}]} onPress={handlePayment}>
                            <Text style={styles.saveBtnText}>ບັນທຶກການຊຳລະ</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* History Modal */}
      <Modal visible={historyModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>ປະຫວັດການຊຳລະ</Text>
                    <TouchableOpacity onPress={() => setHistoryModalVisible(false)}><Ionicons name="close" size={24} color="#666" /></TouchableOpacity>
                </View>
                <FlatList
                    data={historyList}
                    keyExtractor={item => item.id}
                    renderItem={({item}) => (
                        <View style={styles.historyItem}>
                            <Text style={styles.historyDate}>{formatDate(new Date(item.date))}</Text>
                            <Text style={styles.historyAmount}>+ {formatNumber(item.amount)}</Text>
                        </View>
                    )}
                />
            </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerContainer}>
                <DateTimePicker value={dateMode === 'due' ? dueDate : paymentDate} mode="date" display="inline" onChange={onDateChange} themeVariant="light" />
                <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.datePickerBtnText}>ຕົກລົງ</Text>
                </TouchableOpacity>
            </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerContainer: { backgroundColor: 'white', padding: 20, paddingBottom: 15, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, elevation: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontFamily: 'Lao-Bold', color: COLORS.text },
  headerSub: { fontSize: 12, fontFamily: 'Lao-Regular', color: '#666' },
  headerAddBtn: { alignItems: 'center' },
  headerAddText: { fontSize: 10, fontFamily: 'Lao-Bold', color: COLORS.primary },

  card: { backgroundColor: 'white', borderRadius: 8, marginBottom: 15, padding: 15, elevation: 2, borderTopWidth: 5, borderTopColor: COLORS.primary },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 },
  cardTitle: { fontSize: 16, fontFamily: 'Lao-Bold', color: COLORS.text, flex: 1 },
  categoryBadge: { fontSize: 12, fontFamily: 'Lao-Regular', color: '#888', marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 10 },
  iconBtn: { padding: 5 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 5 },
  label: { fontSize: 13, fontFamily: 'Lao-Regular', color: '#666' },
  amountTotal: { fontSize: 18, fontFamily: 'Lao-Bold', color: COLORS.text },
  progressContainer: { height: 6, backgroundColor: '#f0f0f0', borderRadius: 3, overflow: 'hidden', marginVertical: 5 },
  progressBar: { height: '100%', backgroundColor: COLORS.primary }, 
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  progressText: { fontSize: 11, color: COLORS.primary, fontFamily: 'Lao-Bold' },
  remainingText: { fontSize: 12, color: ORANGE_COLOR, fontFamily: 'Lao-Bold' },
  divider: { height: 1, backgroundColor: '#f5f5f5', marginBottom: 10 },
  detailsGrid: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 6, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 11, color: '#888', fontFamily: 'Lao-Regular' },
  detailValue: { fontSize: 13, color: '#333', fontFamily: 'Lao-Bold', marginTop: 2 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12 },
  dueDateText: { fontSize: 12, color: '#666', fontFamily: 'Lao-Regular' },
  actionButtons: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  historyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 8, backgroundColor: '#f5f5f5', borderRadius: 8 },
  historyText: { fontSize: 12, color: '#555', fontFamily: 'Lao-Regular' },
  payBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.primary, paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
  payBtnText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 13 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { marginTop: 10, color: '#ccc', fontFamily: 'Lao-Regular' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 15, padding: 20, elevation: 5, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: 'Lao-Bold', color: COLORS.text },
  inputLabel: { fontSize: 13, fontFamily: 'Lao-Bold', color: '#555', marginBottom: 5, marginTop: 10 },
  input: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee', fontFamily: 'Lao-Bold' },
  inputLarge: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#eee', fontFamily: 'Lao-Bold', fontSize: 20, textAlign: 'right' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#eee' },
  activeCatChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catText: { fontSize: 12, fontFamily: 'Lao-Regular', color: '#666' },
  dateInput: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 30, marginBottom: 20 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', backgroundColor: '#f5f5f5' },
  cancelBtnText: { color: '#666', fontFamily: 'Lao-Bold' },
  saveBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', backgroundColor: COLORS.primary },
  saveBtnText: { color: 'white', fontFamily: 'Lao-Bold' },
  
  datePickerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  datePickerContainer: { backgroundColor: 'white', padding: 20, borderRadius: 20, width: '90%', alignItems: 'center' },
  datePickerBtn: { marginTop: 10, padding: 10, width: '100%', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 10 },
  datePickerBtnText: { fontFamily: 'Lao-Bold', color: COLORS.primary },

  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  historyDate: { fontFamily: 'Lao-Bold', fontSize: 14, color: COLORS.text },
  historyAmount: { fontFamily: 'Lao-Bold', fontSize: 16, color: COLORS.success },

  // 🟢 FAB Styles (ແກ້ໄຂທີ່ຂາດໄປ)
  fab: { 
    position: 'absolute', 
    bottom: 20, 
    right: 20, 
    backgroundColor: COLORS.primary, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    borderRadius: 30, 
    elevation: 5,
    zIndex: 999 
  },
  fabText: { 
    color: 'white', 
    fontFamily: 'Lao-Bold', 
    fontSize: 16, 
    marginLeft: 8 
  },
});