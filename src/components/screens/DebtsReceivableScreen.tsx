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
// 🟢 1. ໃຊ້ SafeAreaView ຈາກ library ນີ້
import { SafeAreaView } from 'react-native-safe-area-context';

import { db } from '../../firebase';
// 🟢 2. Import Hook
import { useAuth } from '../../hooks/useAuth';
import { COLORS, formatDate, formatNumber } from '../../types';
import CurrencyInput from '../ui/CurrencyInput';

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
  customer: string;
  totalAmount: number;
  paidAmount: number;
  remaining: number;
  note: string;
  date: string;
  currency: 'LAK' | 'THB';
  history?: Record<string, any>;
  [key: string]: any; 
}

export default function DebtsReceivableScreen() {
  // 🟢 3. ເອີ້ນໃຊ້ Hook (ໄວ້ເທິງສຸດ)
  const { hasPermission } = useAuth();

  // --- State Declarations ---
  const [debts, setDebts] = useState<DebtItem[]>([]);
  
  // Modals
  const [modalVisible, setModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  
  // Data Lists
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [selectedDebt, setSelectedDebt] = useState<DebtItem | null>(null);

  // Form States
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [customer, setCustomer] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date());
  const [currency, setCurrency] = useState<'LAK' | 'THB'>('LAK'); 
  
  const [payAmount, setPayAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date());

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateMode, setDateMode] = useState<'due' | 'payment'>('due');

  // 🟢 4. useEffect: Fetch Data
  useEffect(() => {
    // ຖ້າບໍ່ມີສິດ ໃຫ້ຢຸດການດຶງຂໍ້ມູນ (ແຕ່ Hook ຍັງເຮັດວຽກ)
    if (!hasPermission('accessFinancial')) return;

    const debtRef = ref(db, 'debts_receivable');
    const unsubscribe = onValue(debtRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.keys(data).map(key => {
            const item = data[key];
            return { 
                id: key, 
                ...item,
                currency: item.currency || 'LAK',
                remaining: item.remaining !== undefined ? item.remaining : (item.totalAmount - (item.paidAmount || 0))
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
  }, [hasPermission]); // 🛑 ໃສ່ hasPermission ໃນ dependency array

  // 🟢 5. useEffect: History Logic
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

  // --- Functions ---
  const handleSaveDebt = async () => {
    if (!customer || !amount) {
      Alert.alert('ຂໍ້ມູນບໍ່ຄົບ', 'ກະລຸນາໃສ່ຊື່ລູກຄ້າ ແລະ ຈຳນວນເງິນ');
      return;
    }

    const total = parseCurrency(amount);

    const debtData = {
      customer,
      totalAmount: total,
      paidAmount: 0,
      remaining: total,
      note,
      currency,
      date: date.toISOString(),
      status: 'PENDING',
      updatedAt: new Date().toISOString()
    };

    try {
      if (currentId) {
          const oldDebt = debts.find(d => d.id === currentId);
          const oldPaid = oldDebt?.paidAmount || 0;
          const newRemaining = total - oldPaid;
          
          await update(ref(db, `debts_receivable/${currentId}`), {
              ...debtData,
              paidAmount: oldPaid,
              remaining: newRemaining
          });
          Alert.alert('ສຳເລັດ', 'ແກ້ໄຂຂໍ້ມູນຮຽບຮ້ອຍ');
      } else {
          await push(ref(db, 'debts_receivable'), { ...debtData, createdAt: new Date().toISOString(), history: [] });
          Alert.alert('ສຳເລັດ', 'ເພີ່ມລາຍການໜີ້ຕ້ອງຮັບຮຽບຮ້ອຍ');
      }
      setModalVisible(false);
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'ບັນທຶກບໍ່ໄດ້');
    }
  };

  const openEditModal = (item: DebtItem) => {
      setCurrentId(item.id);
      setCustomer(item.customer);
      setAmount(formatNumber(item.totalAmount));
      setNote(item.note);
      setCurrency(item.currency);
      setDate(new Date(item.date));
      setModalVisible(true);
  };

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

    const paymentRecord = {
        amount: payVal,
        date: paymentDate.toISOString(),
        type: 'PAYMENT'
    };

    try {
        await update(ref(db, `debts_receivable/${selectedDebt.id}`), { 
            paidAmount: newPaid,
            remaining: newRemaining,
            status
        });
        await push(ref(db, `debts_receivable/${selectedDebt.id}/history`), paymentRecord);
        
        setPaymentModalVisible(false);
        setPayAmount('');
        setPaymentDate(new Date());
        Alert.alert('ສຳເລັດ', 'ບັນທຶກການຮັບຊຳລະຮຽບຮ້ອຍ');
    } catch (error) {
        Alert.alert('Error', 'ເກີດຂໍ້ຜິດພາດ');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('ຢືນຢັນ', 'ຕ້ອງການລຶບລາຍການນີ້ບໍ່?', [
        { text: 'ຍົກເລີກ', style: 'cancel' },
        { text: 'ລຶບ', style: 'destructive', onPress: async () => await remove(ref(db, `debts_receivable/${id}`)) }
    ]);
  };

  const resetForm = () => {
    setCurrentId(null);
    setCustomer('');
    setAmount('');
    setNote('');
    setCurrency('LAK');
    setDate(new Date());
  };

  const toggleDatePicker = (mode: 'due' | 'payment') => {
    Keyboard.dismiss(); 
    setDateMode(mode);
    setShowDatePicker(true);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) {
        if (dateMode === 'due') setDate(selectedDate);
        else setPaymentDate(selectedDate);
    }
  };

  const openPaymentModal = (item: DebtItem) => {
      setSelectedDebt(item); setPayAmount(''); setPaymentDate(new Date());
      setPaymentModalVisible(true);
      setShowDatePicker(false);
  };

  const openHistoryModal = (item: DebtItem) => {
      setSelectedDebt(item);
      if (item.history) {
          const list = Object.keys(item.history).map(key => ({
              id: key,
              ...item.history![key]
          }));
          list.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setHistoryList(list);
      } else {
          setHistoryList([]);
      }
      setHistoryModalVisible(true);
  };

  const getSymbol = (curr: string) => curr === 'THB' ? '฿' : '₭';

  const renderItem = ({ item }: { item: DebtItem }) => {
    const progress = (item.paidAmount || 0) / item.totalAmount;
    const symbol = getSymbol(item.currency);
    
    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={{flex: 1}}>
                    <Text style={styles.cardTitle}>{item.customer}</Text>
                    <Text style={styles.dateText}>{formatDate(new Date(item.date))}</Text>
                    {item.note ? <Text style={styles.noteText}>{item.note}</Text> : null}
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
                <Text style={styles.label}>ຍອດໜີ້ລວມ:</Text>
                <Text style={styles.amountTotal}>{formatNumber(item.totalAmount)} {symbol}</Text>
            </View>

            <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${Math.min(progress * 100, 100)}%` }]} />
            </View>
            <View style={styles.progressInfo}>
                <Text style={styles.progressText}>ຮັບແລ້ວ {formatNumber(item.paidAmount || 0)}</Text>
                <Text style={styles.remainingText}>ຄ້າງຮັບ {formatNumber(item.remaining)} {symbol}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.footerRow}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 5}}>
                    <View style={[styles.currencyTag, item.currency === 'THB' ? {backgroundColor: ORANGE_COLOR} : {backgroundColor: COLORS.primary}]}>
                        <Text style={styles.currencyTagText}>{item.currency}</Text>
                    </View>
                    <Text style={[styles.statusText, {color: item.remaining === 0 ? COLORS.primary : ORANGE_COLOR}]}>
                        {item.remaining === 0 ? 'ຊຳລະຄົບແລ້ວ' : 'ລໍຖ້າຊຳລະ'}
                    </Text>
                </View>
                
                <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.historyBtn} onPress={() => openHistoryModal(item)}>
                        <Ionicons name="time-outline" size={16} color="#555" />
                        <Text style={styles.historyText}>ປະຫວັດ</Text>
                    </TouchableOpacity>
                    {item.remaining > 0 && (
                        <TouchableOpacity style={styles.payBtn} onPress={() => openPaymentModal(item)}>
                            <Ionicons name="download-outline" size={16} color="white" />
                            <Text style={styles.payBtnText}>ຮັບຊຳລະ</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
  };

  // 🟢 6. ຍ້າຍການກວດສອບສິດມາໄວ້ບ່ອນນີ້! (ລຸ່ມສຸດ ຫຼັງ Hooks ທັງໝົດ)
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

  // Return ໜ້າຈໍຫຼັກ
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={{flex: 1}}>
            <Text style={styles.headerTitle}>ໜີ້ຕ້ອງຮັບ (Receivables)</Text>
            <Text style={styles.headerSub}>ຕິດຕາມລູກຄ້າທີ່ຕິດໜີ້ຮ້ານ</Text>
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
                <Ionicons name="people-outline" size={60} color="#ddd" />
                <Text style={styles.emptyText}>ບໍ່ມີລາຍການໜີ້ຕ້ອງຮັບ</Text>
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
                    <Text style={styles.modalTitle}>{currentId ? 'ແກ້ໄຂຂໍ້ມູນ' : 'ເພີ່ມໜີ້ຕ້ອງຮັບ'}</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color="#666" /></TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={styles.inputLabel}>ຊື່ລູກຄ້າ *</Text>
                    <TextInput style={styles.input} value={customer} onChangeText={setCustomer} placeholder="ຊື່ລູກຄ້າ..." />

                    <Text style={styles.inputLabel}>ສະກຸນເງິນ *</Text>
                    <View style={styles.currencyRow}>
                        <TouchableOpacity style={[styles.currencyOption, currency === 'LAK' && styles.currencyActive]} onPress={() => setCurrency('LAK')}>
                            <Text style={[styles.currencyText, currency === 'LAK' && {color:'white'}]}>₭ ເງິນກີບ (LAK)</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.currencyOption, currency === 'THB' && {borderColor: ORANGE_COLOR}, currency === 'THB' && {backgroundColor: ORANGE_COLOR}]} onPress={() => setCurrency('THB')}>
                            <Text style={[styles.currencyText, currency === 'THB' && {color:'white'}, currency !== 'THB' && {color: ORANGE_COLOR}]}>฿ ເງິນບາດ (THB)</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.inputLabel}>ຈຳນວນເງິນ ({currency}) *</Text>
                    <CurrencyInput 
                        style={styles.input} 
                        value={amount} 
                        onChangeValue={setAmount} 
                        placeholder="0" 
                    />

                    <Text style={styles.inputLabel}>ລາຍລະອຽດ / ໝາຍເຫດ</Text>
                    <TextInput style={styles.input} value={note} onChangeText={setNote} placeholder="ເຊັ່ນ: ຄ່າສິນຄ້າ..." />

                    <Text style={styles.inputLabel}>ວັນທີ</Text>
                    <TouchableOpacity style={styles.dateInput} onPress={() => toggleDatePicker('due')}>
                        <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                        <Text style={{fontFamily: 'Lao-Bold', color: COLORS.text}}>{formatDate(date)}</Text>
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
                    <Text style={styles.modalTitle}>ຮັບຊຳລະໜີ້</Text>
                    <TouchableOpacity onPress={() => setPaymentModalVisible(false)}><Ionicons name="close" size={24} color="#666" /></TouchableOpacity>
                </View>

                <ScrollView>
                    {selectedDebt && (
                        <View style={{marginBottom: 20}}>
                            <Text style={{fontFamily: 'Lao-Regular', color: '#666'}}>ຈາກລູກຄ້າ: <Text style={{fontFamily:'Lao-Bold', color: COLORS.text}}>{selectedDebt.customer}</Text></Text>
                            <Text style={{fontFamily: 'Lao-Regular', color: '#666'}}>ຍອດຄ້າງຮັບ: <Text style={{fontFamily:'Lao-Bold', color: selectedDebt.currency === 'THB' ? ORANGE_COLOR : COLORS.primary}}>{formatNumber(selectedDebt.remaining)} {getSymbol(selectedDebt.currency)}</Text></Text>
                        </View>
                    )}

                    <Text style={styles.inputLabel}>ວັນທີຮັບ *</Text>
                    <TouchableOpacity style={styles.dateInput} onPress={() => toggleDatePicker('payment')}>
                        <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                        <Text style={{fontFamily: 'Lao-Bold', color: COLORS.text}}>{formatDate(paymentDate)}</Text>
                    </TouchableOpacity>

                    <Text style={styles.inputLabel}>ຈຳນວນເງິນ ({selectedDebt ? getSymbol(selectedDebt.currency) : ''}) *</Text>
                    <CurrencyInput 
                        style={[styles.inputLarge, { color: COLORS.primary }]} 
                        value={payAmount} 
                        onChangeValue={setPayAmount} 
                        placeholder="0" 
                    />

                    <View style={styles.modalActions}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setPaymentModalVisible(false)}>
                            <Text style={styles.cancelBtnText}>ຍົກເລີກ</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.saveBtn, {backgroundColor: COLORS.primary}]} onPress={handlePayment}>
                            <Text style={styles.saveBtnText}>ຢືນຢັນ</Text>
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
                    <Text style={styles.modalTitle}>ປະຫວັດການຮັບຊຳລະ</Text>
                    <TouchableOpacity onPress={() => setHistoryModalVisible(false)}>
                        <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                </View>
                
                {selectedDebt && (
                    <View style={{marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee'}}>
                        <Text style={{fontFamily: 'Lao-Bold', fontSize: 16, color: COLORS.text}}>{selectedDebt.customer}</Text>
                        <Text style={{fontFamily: 'Lao-Regular', fontSize: 12, color: '#666'}}>ຍອດທັງໝົດ: {formatNumber(selectedDebt.totalAmount)} {getSymbol(selectedDebt.currency)}</Text>
                    </View>
                )}

                <FlatList
                    data={historyList}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{paddingBottom: 20}}
                    ListEmptyComponent={
                        <View style={{alignItems: 'center', marginTop: 30}}>
                            <Text style={{fontFamily: 'Lao-Regular', color: '#999'}}>ຍັງບໍ່ມີປະຫວັດການຊຳລະ</Text>
                        </View>
                    }
                    renderItem={({item}) => (
                        <View style={styles.historyItem}>
                            <Text style={styles.historyDate}>{formatDate(new Date(item.date))}</Text>
                            <Text style={styles.historyAmount}>+ {formatNumber(item.amount)} {selectedDebt ? getSymbol(selectedDebt.currency) : ''}</Text>
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
                <DateTimePicker value={dateMode === 'due' ? date : paymentDate} mode="date" display="inline" onChange={onDateChange} themeVariant="light" />
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
  dateText: { fontSize: 12, color: '#888' },
  noteText: { fontSize: 12, color: '#666', marginTop: 2, fontFamily: 'Lao-Regular' },
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
  
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12 },
  statusText: { fontSize: 12, fontFamily: 'Lao-Bold' },
  actionButtons: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  historyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 8, backgroundColor: '#f5f5f5', borderRadius: 8 },
  historyText: { fontSize: 12, color: '#555', fontFamily: 'Lao-Regular' },
  payBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.primary, paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
  payBtnText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 13 },
  
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, elevation: 5 },
  fabText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 16, marginLeft: 8 },
  
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { marginTop: 10, color: '#ccc', fontFamily: 'Lao-Regular' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 15, padding: 20, elevation: 5, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: 'Lao-Bold', color: COLORS.text },
  inputLabel: { fontSize: 13, fontFamily: 'Lao-Bold', color: '#555', marginBottom: 5, marginTop: 10 },
  input: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee', fontFamily: 'Lao-Bold' },
  inputLarge: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#eee', fontFamily: 'Lao-Bold', fontSize: 20, textAlign: 'right' },
  dateInput: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 30, marginBottom: 20 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', backgroundColor: '#f5f5f5' },
  cancelBtnText: { color: '#666', fontFamily: 'Lao-Bold' },
  saveBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', backgroundColor: COLORS.primary },
  saveBtnText: { color: 'white', fontFamily: 'Lao-Bold' },
  
  // Currency Selector Styles
  currencyRow: { flexDirection: 'row', gap: 10, marginBottom: 5 },
  currencyOption: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: COLORS.primary },
  currencyActive: { backgroundColor: COLORS.primary },
  currencyText: { fontFamily: 'Lao-Bold', fontSize: 12, color: COLORS.primary },
  currencyTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 5 },
  currencyTagText: { color: 'white', fontSize: 10, fontFamily: 'Lao-Bold' },

  datePickerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  datePickerContainer: { backgroundColor: 'white', padding: 20, borderRadius: 20, width: '90%', alignItems: 'center' },
  datePickerBtn: { marginTop: 10, padding: 10, width: '100%', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 10 },
  datePickerBtnText: { fontFamily: 'Lao-Bold', color: COLORS.primary },

  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  historyDate: { fontFamily: 'Lao-Bold', fontSize: 14, color: COLORS.text },
  historyAmount: { fontFamily: 'Lao-Bold', fontSize: 16, color: COLORS.success }
});