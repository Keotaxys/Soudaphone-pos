import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, formatDate, formatNumber, SaleRecord } from '../../types';

interface ReportScreenProps {
  salesHistory: SaleRecord[];
  onDeleteSale: (id: string) => void;
}

export default function ReportScreen({ salesHistory, onDeleteSale }: ReportScreenProps) {
  
  if (salesHistory.length === 0) {
      return (
          <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>ຍັງບໍ່ມີຂໍ້ມູນການຂາຍ</Text>
          </View>
      );
  }

  return (
    <FlatList 
        data={salesHistory} 
        keyExtractor={item => item.id} 
        contentContainerStyle={{ padding: 15, paddingBottom: 100 }}
        renderItem={({ item }) => (
            <View style={styles.historyItem}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.historyDate}>{formatDate(item.date)}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                        <View style={[styles.paymentBadge, { backgroundColor: item.paymentMethod === 'QR' ? COLORS.blue : COLORS.success }]}>
                            <Text style={styles.paymentBadgeText}>{item.paymentMethod === 'QR' ? '📲 QR' : '💵 ເງິນສົດ'}</Text>
                        </View>
                        <Text style={styles.historyItems}> {item.items.length} ລາຍການ</Text>
                    </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.historyTotal}>{formatNumber(item.total)} {item.currency === 'THB' ? '฿' : '₭'}</Text>
                    {item.paymentMethod === 'CASH' && item.change && item.change > 0 ? (
                        <Text style={{ fontSize: 10, color: COLORS.success }}>ທອນ: {formatNumber(item.change)}</Text>
                    ) : null}
                    <TouchableOpacity onPress={() => onDeleteSale(item.id)} style={styles.deleteBtn}>
                        <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                        <Text style={{ color: COLORS.danger, fontSize: 12, fontFamily: 'Lao-Regular' }}>ລຶບ</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )}
    />
  );
}

const styles = StyleSheet.create({
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#888', marginTop: 10, fontFamily: 'Lao-Regular', fontSize: 16 },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: 'white', marginBottom: 10, borderRadius: 10, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2 },
  historyDate: { fontFamily: 'Lao-Bold', fontSize: 14, color: '#333' },
  historyItems: { fontFamily: 'Lao-Regular', fontSize: 12, color: '#888', marginLeft: 5 },
  historyTotal: { fontFamily: 'Lao-Bold', fontSize: 16, color: COLORS.primaryDark },
  paymentBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  paymentBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 5, padding: 5 }
});