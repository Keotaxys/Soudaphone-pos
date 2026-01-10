import { Ionicons } from '@expo/vector-icons';
import { onValue, push, ref, update } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView, StyleSheet, Text,
    TextInput, TouchableOpacity, View
} from 'react-native';
import { db } from '../../firebase';
import { COLORS, formatNumber, ShiftRecord } from '../../types';

const LAK_DENOMS = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500];
const THB_DENOMS = [1000, 500, 100, 50, 20];

export default function ShiftScreen() {
  const [activeShift, setActiveShift] = useState<ShiftRecord | null>(null);
  const [lakCounts, setLakCounts] = useState<{ [key: number]: string }>({});
  const [thbCounts, setThbCounts] = useState<{ [key: number]: string }>({});
  const [startingLAK, setStartingLAK] = useState('0');
  const [startingTHB, setStartingTHB] = useState('0');

  useEffect(() => {
    const shiftsRef = ref(db, 'shifts');
    const unsubscribe = onValue(shiftsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        const openShift = list.find(s => s.status === 'OPEN');
        setActiveShift(openShift || null);
      }
    });
    return () => unsubscribe();
  }, []);

  const calculateTotal = (denoms: number[], counts: { [key: number]: string }) => {
    return denoms.reduce((sum, d) => sum + (d * (parseInt(counts[d]) || 0)), 0);
  };

  const handleOpenShift = async () => {
    const newShift: ShiftRecord = {
      startTime: new Date().toISOString(),
      status: 'OPEN',
      startingCashLAK: parseInt(startingLAK) || 0,
      startingCashTHB: parseInt(startingTHB) || 0,
      denominationsLAK: [],
      denominationsTHB: []
    };
    try {
      await push(ref(db, 'shifts'), newShift);
      Alert.alert('🔔 ສຳເລັດ', 'ເປີດກະຂາຍຮຽບຮ້ອຍແລ້ວ');
    } catch (e) { Alert.alert('Error', 'ເປີດກະບໍ່ໄດ້'); }
  };

  const handleCloseShift = async () => {
    if (!activeShift) return;
    const actualLAK = calculateTotal(LAK_DENOMS, lakCounts);
    const actualTHB = calculateTotal(THB_DENOMS, thbCounts);

    Alert.alert('ຢືນຢັນການປິດກະ', `ຍອດເງິນສົດທີ່ນັບໄດ້:\nLAK: ${formatNumber(actualLAK)}\nTHB: ${formatNumber(actualTHB)}`, [
      { text: 'ຍົກເລີກ' },
      { text: 'ປິດກະ', style: 'destructive', onPress: async () => {
          await update(ref(db, `shifts/${activeShift.id}`), {
            endTime: new Date().toISOString(),
            status: 'CLOSED',
            actualCashLAK: actualLAK,
            actualCashTHB: actualTHB
          });
          setLakCounts({}); setThbCounts({});
          Alert.alert('✅ ສຳເລັດ', 'ປິດກະຂາຍ ແລະ ບັນທຶກຍອດຮຽບຮ້ອຍ');
      }}
    ]);
  };

  const renderDenomInput = (val: number, counts: any, setCounts: any, symbol: string) => (
    <View key={val} style={styles.denomRow}>
      <Text style={styles.denomValue}>{formatNumber(val)} {symbol}</Text>
      <TextInput
        style={styles.denomInput}
        keyboardType="numeric"
        placeholder="0"
        value={counts[val] || ''}
        onChangeText={(t) => setCounts({ ...counts, [val]: t })}
      />
      <Text style={styles.denomTotal}>{formatNumber(val * (parseInt(counts[val]) || 0))}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {!activeShift ? (
          <View style={styles.openShiftCard}>
            <Ionicons name="play-circle" size={60} color={COLORS.primary} />
            <Text style={styles.title}>ເລີ່ມຕົ້ນເປີດກະຂາຍ</Text>
            <Text style={styles.label}>ເງິນຕັ້ງຕົ້ນ (ກີບ)</Text>
            <TextInput style={styles.mainInput} keyboardType="numeric" value={startingLAK} onChangeText={setStartingLAK} />
            <Text style={styles.label}>ເງິນຕັ້ງຕົ້ນ (ບາດ)</Text>
            <TextInput style={styles.mainInput} keyboardType="numeric" value={startingTHB} onChangeText={setStartingTHB} />
            <TouchableOpacity style={styles.primaryBtn} onPress={handleOpenShift}>
              <Text style={styles.btnText}>ເປີດກະດຽວນີ້</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={styles.activeStatusHeader}>
              <View>
                <Text style={styles.activeTitle}>🟢 ກຳລັງຂາຍ</Text>
                <Text style={styles.activeSub}>ເລີ່ມແຕ່: {new Date(activeShift.startTime).toLocaleTimeString()}</Text>
              </View>
              <TouchableOpacity style={styles.closeShiftBtn} onPress={handleCloseShift}>
                <Text style={styles.closeShiftBtnText}>ປິດກະຂາຍ</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>💵 ນັບເງິນສົດ (ກີບ)</Text>
            <View style={styles.denomCard}>
              {LAK_DENOMS.map(v => renderDenomInput(v, lakCounts, setLakCounts, '₭'))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>ລວມເງິນກີບ:</Text>
                <Text style={styles.totalValueLAK}>{formatNumber(calculateTotal(LAK_DENOMS, lakCounts))} ₭</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>฿ ນັບເງິນສົດ (ບາດ)</Text>
            <View style={styles.denomCard}>
              {THB_DENOMS.map(v => renderDenomInput(v, thbCounts, setThbCounts, '฿'))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>ລວມເງິນບາດ:</Text>
                <Text style={styles.totalValueTHB}>{formatNumber(calculateTotal(THB_DENOMS, thbCounts))} ฿</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  openShiftCard: { backgroundColor: 'white', padding: 30, borderRadius: 20, alignItems: 'center', elevation: 5 },
  title: { fontFamily: 'Lao-Bold', fontSize: 20, marginVertical: 20 },
  label: { fontFamily: 'Lao-Bold', alignSelf: 'flex-start', color: COLORS.textLight, marginTop: 10 },
  mainInput: { width: '100%', backgroundColor: '#f9f9f9', padding: 15, borderRadius: 12, marginTop: 5, fontSize: 18, fontFamily: 'Lao-Bold' },
  primaryBtn: { backgroundColor: COLORS.primary, width: '100%', padding: 18, borderRadius: 15, marginTop: 30, alignItems: 'center' },
  btnText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 18 },
  
  activeStatusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, backgroundColor: 'white', padding: 15, borderRadius: 15 },
  activeTitle: { fontFamily: 'Lao-Bold', fontSize: 18, color: COLORS.success },
  activeSub: { fontFamily: 'Lao-Regular', fontSize: 12, color: '#999' },
  closeShiftBtn: { backgroundColor: COLORS.danger, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
  closeShiftBtnText: { color: 'white', fontFamily: 'Lao-Bold' },

  sectionTitle: { fontFamily: 'Lao-Bold', fontSize: 16, marginTop: 20, marginBottom: 10, color: COLORS.primaryDark },
  denomCard: { backgroundColor: 'white', borderRadius: 15, padding: 15, elevation: 2 },
  denomRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', paddingBottom: 5 },
  denomValue: { flex: 1, fontFamily: 'Lao-Bold', color: COLORS.text },
  denomInput: { width: 60, backgroundColor: '#f0f0f0', textAlign: 'center', padding: 5, borderRadius: 5, fontFamily: 'Lao-Bold' },
  denomTotal: { flex: 1, textAlign: 'right', fontFamily: 'Lao-Bold', color: COLORS.primary },
  
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingTop: 15, borderTopWidth: 2, borderTopColor: '#eee' },
  totalLabel: { fontFamily: 'Lao-Bold', fontSize: 16 },
  totalValueLAK: { fontFamily: 'Lao-Bold', fontSize: 18, color: COLORS.secondaryDark },
  totalValueTHB: { fontFamily: 'Lao-Bold', fontSize: 18, color: '#2ecc71' }
}); 