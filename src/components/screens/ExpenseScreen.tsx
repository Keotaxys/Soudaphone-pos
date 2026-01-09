import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, formatNumber } from '../../types';

// ຂໍ້ມູນສົມມຸດ (Dummy Data)
const DUMMY_EXPENSES = [
    { id: '1', title: 'ຄ່າໄຟຟ້າ', amount: 150000, date: '2025-01-05' },
    { id: '2', title: 'ຊື້ຖົງຢາງ', amount: 25000, date: '2025-01-06' },
    { id: '3', title: 'ຄ່ານ້ຳກ້ອນ', amount: 10000, date: '2025-01-07' },
];

export default function ExpenseScreen() {
  const [expenses, setExpenses] = useState(DUMMY_EXPENSES);

  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);

  return (
    <View style={styles.container}>
      {/* 🔴 Header Summary */}
      <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>ລາຍຈ່າຍລວມເດືອນນີ້</Text>
          <Text style={styles.summaryValue}>{formatNumber(totalExpense)} ₭</Text>
      </View>

      <View style={styles.listHeader}>
          <Text style={styles.listTitle}>ລາຍການລາຍຈ່າຍ</Text>
          <TouchableOpacity>
              <Text style={{color: COLORS.primary, fontFamily: 'Lao-Bold'}}>ເບິ່ງທັງໝົດ</Text>
          </TouchableOpacity>
      </View>

      <FlatList 
        data={expenses}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
            <View style={styles.expenseItem}>
                <View style={styles.iconBox}>
                    <Ionicons name="receipt-outline" size={24} color={COLORS.danger} />
                </View>
                <View style={{flex: 1, marginLeft: 10}}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemDate}>{item.date}</Text>
                </View>
                <Text style={styles.itemAmount}>-{formatNumber(item.amount)}</Text>
            </View>
        )}
      />

      {/* FAB Add Button */}
      <TouchableOpacity style={styles.fab} onPress={() => alert('Coming Soon: ຟັງຊັນເພີ່ມລາຍຈ່າຍ')}>
          <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  summaryCard: { backgroundColor: COLORS.danger, padding: 20, borderRadius: 15, alignItems: 'center', marginBottom: 20, elevation: 5 },
  summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontFamily: 'Lao-Regular' },
  summaryValue: { color: 'white', fontSize: 28, fontFamily: 'Lao-Bold', marginTop: 5 },
  
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  listTitle: { fontSize: 16, fontFamily: 'Lao-Bold', color: '#333' },
  
  expenseItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10 },
  iconBox: { width: 40, height: 40, backgroundColor: '#FFEBEE', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  itemTitle: { fontSize: 14, fontFamily: 'Lao-Bold', color: '#333' },
  itemDate: { fontSize: 12, color: '#888' },
  itemAmount: { fontSize: 16, fontFamily: 'Lao-Bold', color: COLORS.danger },
  
  fab: { position: 'absolute', bottom: 20, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.danger, justifyContent: 'center', alignItems: 'center', elevation: 5 },
});