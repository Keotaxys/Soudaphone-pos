import { Ionicons } from '@expo/vector-icons';
import { onValue, push, ref, update } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { db } from '../../firebase';
import { COLORS, formatNumber } from '../../types';

const ORANGE_THEME = '#FF8F00';

export default function DebtsReceivableScreen() {
  const [debts, setDebts] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    const rRef = ref(db, 'debts_receivable');
    return onValue(rRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.keys(data).map(k => ({ id: k, ...data[k] })).reverse();
        setDebts(list);
      } else {
        setDebts([]);
      }
    });
  }, []);

  const handleAddDebt = () => {
    if (!name || !amount) return Alert.alert("ແຈ້ງເຕືອນ", "ກະລຸນາໃສ່ຊື່ ແລະ ຈຳນວນເງິນໃຫ້ຄົບຖ້ວນ");
    push(ref(db, 'debts_receivable'), {
      customer: name,
      amount: parseFloat(amount),
      remaining: parseFloat(amount),
      note,
      date: new Date().toISOString(),
      status: 'PENDING',
      history: []
    }).then(() => { setModalVisible(false); setName(''); setAmount(''); setNote(''); });
  };

  const handlePay = (item: any) => {
    Alert.prompt(
      "ຊຳລະໜີ້", 
      `ຍອດຄົງເຫຼືອ: ${formatNumber(item.remaining)}`, 
      [
        { text: "ຍົກເລີກ" },
        { 
          text: "ຢືນຢັນ", 
          // 🟢 ແກ້ໄຂ: ໃສ່ type string ໃຫ້ val
          onPress: (val: string | undefined) => {
            const pay = parseFloat(val || '0');
            if (pay > 0 && pay <= item.remaining) {
               const newRemaining = item.remaining - pay;
               const history = item.history || [];
               history.push({ date: new Date().toISOString(), amount: pay });
               update(ref(db, `debts_receivable/${item.id}`), {
                   remaining: newRemaining,
                   status: newRemaining === 0 ? 'PAID' : 'PENDING',
                   history
               });
            } else {
                if(pay > item.remaining) Alert.alert("ຜິດພາດ", "ຍອດຊຳລະເກີນໜີ້ຄົງເຫຼືອ");
            }
          }
        }
      ], 
      'plain-text'
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ໜີ້ຕ້ອງຮັບ (Customer Debts)</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={24} color="white" />
            <Text style={styles.addBtnText}>ສ້າງລາຍການ</Text>
        </TouchableOpacity>
      </View>

      <FlatList 
        data={debts}
        keyExtractor={item => item.id}
        contentContainerStyle={{padding: 15}}
        renderItem={({item}) => (
            <View style={styles.card}>
                <View style={{flex: 1}}>
                    <Text style={styles.name}>{item.customer}</Text>
                    <Text style={styles.date}>{new Date(item.date).toLocaleDateString('en-GB')}</Text>
                    <Text style={styles.note}>{item.note}</Text>
                </View>
                <View style={{alignItems: 'flex-end'}}>
                    <Text style={styles.amount}>{formatNumber(item.remaining)} ₭</Text>
                    <Text style={[styles.status, {color: item.remaining === 0 ? COLORS.primary : ORANGE_THEME}]}>
                        {item.remaining === 0 ? 'ຊຳລະຄົບແລ້ວ' : 'ລໍຖ້າຊຳລະ'}
                    </Text>
                    {item.remaining > 0 && (
                        <TouchableOpacity style={styles.payBtn} onPress={() => handlePay(item)}>
                            <Text style={styles.payBtnText}>ຮັບຊຳລະ</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        )}
      />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>ເພີ່ມລາຍການໜີ້ຕ້ອງຮັບ</Text>
                <TextInput style={styles.input} placeholder="ຊື່ລູກຄ້າ" value={name} onChangeText={setName} />
                <TextInput style={styles.input} placeholder="ຈຳນວນເງິນ" keyboardType="numeric" value={amount} onChangeText={setAmount} />
                <TextInput style={styles.input} placeholder="ໝາຍເຫດ" value={note} onChangeText={setNote} />
                <View style={{flexDirection: 'row', gap: 10, marginTop: 10}}>
                    <TouchableOpacity style={[styles.modalBtn, {backgroundColor:'#ccc'}]} onPress={() => setModalVisible(false)}><Text>ຍົກເລີກ</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.modalBtn, {backgroundColor: COLORS.primary}]} onPress={handleAddDebt}><Text style={{color:'white'}}>ບັນທຶກ</Text></TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F9FA' },
  header: { padding: 20, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  title: { fontSize: 20, fontFamily: 'Lao-Bold', color: '#333' },
  addBtn: { flexDirection: 'row', backgroundColor: COLORS.primary, padding: 8, borderRadius: 8, alignItems: 'center', gap: 5 },
  addBtnText: { color: 'white', fontFamily: 'Lao-Bold' },
  card: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', elevation: 1 },
  name: { fontFamily: 'Lao-Bold', fontSize: 16 },
  date: { fontSize: 12, color: '#888' },
  note: { fontSize: 12, color: '#666', marginTop: 5 },
  amount: { fontFamily: 'Lao-Bold', fontSize: 18, color: COLORS.primary },
  status: { fontSize: 12, marginBottom: 5 },
  payBtn: { backgroundColor: ORANGE_THEME, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5 },
  payBtnText: { color: 'white', fontSize: 12, fontFamily: 'Lao-Bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 10, width: '80%' },
  modalTitle: { fontFamily: 'Lao-Bold', fontSize: 18, marginBottom: 15, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 5, marginBottom: 10 },
  modalBtn: { flex: 1, padding: 12, borderRadius: 5, alignItems: 'center' }
});