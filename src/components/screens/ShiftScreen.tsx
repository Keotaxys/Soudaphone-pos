import { Ionicons } from '@expo/vector-icons';
import { onValue, push, ref, update } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView, // ✅ Import ມາແລ້ວ
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
import { COLORS, formatNumber, ShiftRecord } from '../../types';

// ກຳນົດປະເພດໃບເງິນ
const LAK_DENOMS = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500];
const THB_DENOMS = [1000, 500, 100, 50, 20];

export default function ShiftScreen() {
  const [activeShift, setActiveShift] = useState<ShiftRecord | null>(null);
  
  // States ສຳລັບນັບໃບເງິນຕອນ "ເປີດກະ"
  const [openLakCounts, setOpenLakCounts] = useState<{ [key: number]: string }>({});
  const [openThbCounts, setOpenThbCounts] = useState<{ [key: number]: string }>({});
  
  // States ສຳລັບນັບໃບເງິນຕອນ "ປິດກະ"
  const [closeLakCounts, setCloseLakCounts] = useState<{ [key: number]: string }>({});
  const [closeThbCounts, setCloseThbCounts] = useState<{ [key: number]: string }>({});

  // 🟢 2. Fetch Active Shift
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
    const totalLAK = calculateTotal(LAK_DENOMS, openLakCounts);
    const totalTHB = calculateTotal(THB_DENOMS, openThbCounts);

    if (totalLAK === 0 && totalTHB === 0) {
      Alert.alert('ຄຳເຕືອນ', 'ກະລຸນານັບໃບບິນເງິນຕັ້ງຕົ້ນກ່ອນເປີດກະ');
      return;
    }

    const newShift = {
      startTime: new Date().toISOString(),
      status: 'OPEN',
      startingCashLAK: totalLAK,
      startingCashTHB: totalTHB,
      openDenominationsLAK: openLakCounts,
      openDenominationsTHB: openThbCounts,
      createdAt: new Date().toISOString()
    };

    try {
      await push(ref(db, 'shifts'), newShift);
      Alert.alert('🔔 ສຳເລັດ', 'ເປີດກະຂາຍຮຽບຮ້ອຍແລ້ວ');
    } catch (e) { Alert.alert('Error', 'ບໍ່ສາມາດເປີດກະໄດ້'); }
  };

  const handleCloseShift = async () => {
    if (!activeShift) return;
    const actualLAK = calculateTotal(LAK_DENOMS, closeLakCounts);
    const actualTHB = calculateTotal(THB_DENOMS, closeThbCounts);

    Alert.alert('ຢືນຢັນການປິດກະ', `ເງິນສົດທີ່ນັບໄດ້:\nກີບ: ${formatNumber(actualLAK)} ₭\nບາດ: ${formatNumber(actualTHB)} ฿`, [
      { text: 'ຍົກເລີກ' },
      { text: 'ຢືນຢັນປິດກະ', style: 'destructive', onPress: async () => {
          await update(ref(db, `shifts/${activeShift.id}`), {
            endTime: new Date().toISOString(),
            status: 'CLOSED',
            actualCashLAK: actualLAK,
            actualCashTHB: actualTHB,
            closeDenominationsLAK: closeLakCounts,
            closeDenominationsTHB: closeThbCounts
          });
          setCloseLakCounts({}); setCloseThbCounts({});
          Alert.alert('✅ ສຳເລັດ', 'ປິດກະຂາຍຮຽບຮ້ອຍ');
      }}
    ]);
  };

  const renderDenomRow = (val: number, counts: any, setCounts: any, symbol: string, totalColor: string) => (
    <View key={val} style={styles.denomRow}>
      <View style={styles.denomInfo}>
        <Text style={styles.denomLabel}>{formatNumber(val)} {symbol}</Text>
      </View>
      <TextInput
        style={styles.denomInput}
        keyboardType="numeric"
        placeholder="0"
        value={counts[val] || ''}
        onChangeText={(t) => setCounts({ ...counts, [val]: t })}
      />
      <Text style={[styles.denomSum, { color: totalColor }]}>{formatNumber(val * (parseInt(counts[val]) || 0))}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 🟢 ໃຊ້ KeyboardAvoidingView ຫຸ້ມ ScrollView */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
            keyboardShouldPersistTaps="handled"
        >
            {!activeShift ? (
            <View>
                <View style={styles.card}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="wallet" size={40} color={COLORS.primary} />
                    </View>
                    <Text style={styles.mainTitle}>ເລີ່ມຕົ້ນເປີດກະຂາຍ</Text>
                    <Text style={styles.subTitle}>ກະລຸນານັບເງິນສົດຕັ້ງຕົ້ນໃນລິ້ນຊັກ</Text>
                </View>

                <Text style={styles.sectionTitle}>💵 ໃບເງິນກີບ (LAK)</Text>
                <View style={styles.denomCard}>
                    {LAK_DENOMS.map(v => renderDenomRow(v, openLakCounts, setOpenLakCounts, '₭', COLORS.primary))}
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>ລວມເງິນກີບຕັ້ງຕົ້ນ:</Text>
                        <Text style={[styles.summaryValue, { color: COLORS.primary }]}>{formatNumber(calculateTotal(LAK_DENOMS, openLakCounts))} ₭</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>฿ ໃບເງິນບາດ (THB)</Text>
                <View style={styles.denomCard}>
                    {THB_DENOMS.map(v => renderDenomRow(v, openThbCounts, setOpenThbCounts, '฿', '#F57C00'))}
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>ລວມເງິນບາດຕັ້ງຕົ້ນ:</Text>
                        <Text style={[styles.summaryValue, {color: '#F57C00'}]}>{formatNumber(calculateTotal(THB_DENOMS, openThbCounts))} ฿</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.openBtn} onPress={handleOpenShift}>
                    <Text style={styles.openBtnText}>ເປີດກະດຽວນີ້</Text>
                </TouchableOpacity>
            </View>
            ) : (
            <View>
                <View style={styles.activeHeader}>
                    <View>
                        <Text style={styles.activeStatus}>🟢 ກຳລັງເປີດກະຂາຍ</Text>
                        <Text style={styles.activeTime}>ເລີ່ມ: {new Date(activeShift.startTime).toLocaleTimeString()}</Text>
                    </View>
                    <TouchableOpacity style={styles.closeBtn} onPress={handleCloseShift}>
                        <Text style={styles.closeBtnText}>ປິດກະຂາຍ</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>🧾 ນັບເງິນສົດກ່ອນປິດກະ (ກີບ)</Text>
                <View style={styles.denomCard}>
                    {LAK_DENOMS.map(v => renderDenomRow(v, closeLakCounts, setCloseLakCounts, '₭', COLORS.primary))}
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>ລວມເງິນກີບ:</Text>
                        <Text style={[styles.summaryValue, { color: COLORS.primary }]}>{formatNumber(calculateTotal(LAK_DENOMS, closeLakCounts))} ₭</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>💰 ນັບເງິນສົດກ່ອນປິດກະ (ບາດ)</Text>
                <View style={styles.denomCard}>
                    {THB_DENOMS.map(v => renderDenomRow(v, closeThbCounts, setCloseThbCounts, '฿', '#F57C00'))}
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>ລວມເງິນບາດ:</Text>
                        <Text style={[styles.summaryValue, { color: '#F57C00' }]}>{formatNumber(calculateTotal(THB_DENOMS, closeThbCounts))} ฿</Text>
                    </View>
                </View>
            </View>
            )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  card: { backgroundColor: 'white', padding: 25, borderRadius: 20, alignItems: 'center', marginBottom: 20, elevation: 2 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f0f9f9', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  mainTitle: { fontFamily: 'Lao-Bold', fontSize: 22, color: COLORS.text },
  subTitle: { fontFamily: 'Lao-Regular', fontSize: 14, color: COLORS.textLight, marginTop: 5 },
  
  sectionTitle: { fontFamily: 'Lao-Bold', fontSize: 16, color: COLORS.primaryDark, marginTop: 20, marginBottom: 12 },
  denomCard: { backgroundColor: 'white', borderRadius: 15, padding: 15, elevation: 1 },
  denomRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  denomInfo: { flex: 1.5 },
  denomLabel: { fontFamily: 'Lao-Bold', fontSize: 15, color: COLORS.text },
  denomInput: { flex: 1, backgroundColor: '#f9f9f9', borderRadius: 8, padding: 8, textAlign: 'center', fontFamily: 'Lao-Bold', borderWidth: 1, borderColor: '#eee' },
  denomSum: { flex: 2, textAlign: 'right', fontFamily: 'Lao-Bold', fontSize: 15 },
  
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingTop: 15, borderTopWidth: 2, borderTopColor: '#f0f0f0' },
  summaryLabel: { fontFamily: 'Lao-Bold', fontSize: 15 },
  summaryValue: { fontFamily: 'Lao-Bold', fontSize: 18 },
  
  openBtn: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 15, marginTop: 30, alignItems: 'center', elevation: 3 },
  openBtnText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 18 },

  activeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 20, borderRadius: 15, marginBottom: 20 },
  activeStatus: { fontFamily: 'Lao-Bold', fontSize: 18, color: '#2ecc71' },
  activeTime: { fontFamily: 'Lao-Regular', fontSize: 12, color: '#999' },
  closeBtn: { backgroundColor: COLORS.danger, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 10 },
  closeBtnText: { color: 'white', fontFamily: 'Lao-Bold' }
});