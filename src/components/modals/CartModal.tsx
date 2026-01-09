import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CartItem, COLORS, formatDate, formatNumber } from '../../types';

interface CartModalProps {
  visible: boolean;
  onClose: () => void;
  cart: CartItem[];
  updateQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  onCheckout: (details: any) => void;
  total: number;
  currency: 'LAK' | 'THB';
}

// 🟢 ແກ້ໄຂບ່ອນນີ້: ຕ້ອງມີຄຳວ່າ "export default"
export default function CartModal({ 
  visible, onClose, cart, updateQuantity, removeFromCart, onCheckout, total, currency 
}: CartModalProps) {
  
  // Local State ສຳລັບການຊຳລະເງິນ
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QR'>('CASH');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saleSource, setSaleSource] = useState<'ໜ້າຮ້ານ' | 'Online'>('ໜ້າຮ້ານ');

  // Reset ເມື່ອເປີດ Modal
  useEffect(() => {
    if (visible) {
      setAmountReceived('');
      setPaymentMethod('CASH');
      setSelectedDate(new Date());
    }
  }, [visible]);

  const received = parseFloat(amountReceived.replace(/,/g, '')) || 0;
  const change = received - total;

  const handleConfirm = () => {
    onCheckout({
      paymentMethod,
      amountReceived: received,
      change,
      date: selectedDate,
      source: saleSource
    });
  };

  const onChangeDate = (event: any, selected: Date | undefined) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selected) setSelectedDate(selected);
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>ກະຕ່າສິນຄ້າ</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close-circle" size={30} color="#ccc" /></TouchableOpacity>
          </View>

          {/* Source & Date Selector */}
          <View style={{flexDirection: 'row', gap: 10, marginBottom: 15}}>
             <View style={styles.sourceContainer}>
                <TouchableOpacity style={[styles.sourceBtn, saleSource === 'ໜ້າຮ້ານ' && styles.sourceBtnActive]} onPress={() => setSaleSource('ໜ້າຮ້ານ')}><Ionicons name="storefront" size={16} color={saleSource === 'ໜ້າຮ້ານ' ? 'white' : COLORS.textLight} /><Text style={[styles.sourceText, saleSource === 'ໜ້າຮ້ານ' && styles.sourceTextActive]}>ໜ້າຮ້ານ</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.sourceBtn, saleSource === 'Online' && styles.sourceBtnActive]} onPress={() => setSaleSource('Online')}><Ionicons name="globe" size={16} color={saleSource === 'Online' ? 'white' : COLORS.textLight} /><Text style={[styles.sourceText, saleSource === 'Online' && styles.sourceTextActive]}>Online</Text></TouchableOpacity>
             </View>
             <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowDatePicker(!showDatePicker)}>
                <Ionicons name="calendar" size={18} color={COLORS.primaryDark} />
                <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
             </TouchableOpacity>
          </View>

          {showDatePicker && (
             <DateTimePicker value={selectedDate} mode="date" display="default" onChange={onChangeDate} />
          )}

          <ScrollView style={styles.modalBody}>
            {cart.map(item => (
              <View key={item.id} style={styles.cartItem}>
                {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.cartItemImage} /> : <View style={[styles.cartItemImage, {backgroundColor: '#eee'}]} />}
                <View style={{flex: 1, paddingHorizontal: 10}}>
                  <Text style={styles.cartItemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.cartItemPrice}>{formatNumber(item.price)} {item.priceCurrency === 'THB' ? '฿' : '₭'}</Text>
                </View>
                <View style={styles.qtyControls}>
                  <TouchableOpacity onPress={() => updateQuantity(item.id, -1)} style={styles.qtyBtn}><Ionicons name="remove" size={16} color="#555" /></TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => updateQuantity(item.id, 1)} style={styles.qtyBtn}><Ionicons name="add" size={16} color="#555" /></TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => removeFromCart(item.id)} style={{marginLeft: 10}}><Ionicons name="trash-outline" size={22} color={COLORS.danger} /></TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          <View style={styles.modalFooter}>
            <View style={styles.paymentMethodContainer}>
                <TouchableOpacity style={[styles.paymentMethodBtn, paymentMethod === 'CASH' && styles.paymentMethodActive]} onPress={() => setPaymentMethod('CASH')}>
                    <Ionicons name="cash-outline" size={20} color={paymentMethod === 'CASH' ? 'white' : COLORS.textLight} />
                    <Text style={[styles.paymentMethodText, paymentMethod === 'CASH' && {color: 'white'}]}>ເງິນສົດ</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.paymentMethodBtn, paymentMethod === 'QR' && styles.paymentMethodActive]} onPress={() => setPaymentMethod('QR')}>
                    <Ionicons name="qr-code-outline" size={20} color={paymentMethod === 'QR' ? 'white' : COLORS.textLight} />
                    <Text style={[styles.paymentMethodText, paymentMethod === 'QR' && {color: 'white'}]}>QR Code</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.totalRow}>
               <Text style={styles.totalLabel}>ຍອດຕ້ອງຊຳລະ:</Text>
               <Text style={styles.totalValue}>{formatNumber(total)} {currency === 'THB' ? '฿' : '₭'}</Text>
            </View>

            {paymentMethod === 'CASH' && (
                <View style={styles.cashContainer}>
                    <View style={{flex: 1}}>
                        <Text style={styles.cashLabel}>ຮັບເງິນມາ:</Text>
                        <TextInput style={styles.cashInput} placeholder="0" keyboardType="numeric" value={formatNumber(amountReceived)} onChangeText={(t) => setAmountReceived(t.replace(/,/g, ''))} />
                    </View>
                    <View style={{flex: 1, alignItems: 'flex-end'}}>
                        <Text style={styles.cashLabel}>ເງິນທອນ:</Text>
                        <Text style={[styles.changeText, change < 0 ? {color: COLORS.danger} : {color: COLORS.success}]}>{formatNumber(change < 0 ? 0 : change)}</Text>
                    </View>
                </View>
            )}

            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmBtnText}>ຢືນຢັນຮັບເງິນ ({formatNumber(total)})</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 25, borderTopRightRadius: 25, height: '90%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 20, color: '#333', fontFamily: 'Lao-Bold' },
  modalBody: { flex: 1 },
  modalFooter: { borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 20 },
  
  sourceContainer: { flex: 1, flexDirection: 'row', backgroundColor: '#f5f5f5', padding: 4, borderRadius: 10 },
  sourceBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8, gap: 5 },
  sourceBtnActive: { backgroundColor: COLORS.primary },
  sourceText: { fontFamily: 'Lao-Regular', color: COLORS.textLight },
  sourceTextActive: { fontFamily: 'Lao-Bold', color: 'white' },
  datePickerBtn: { backgroundColor: '#f0f4f4', paddingHorizontal: 15, justifyContent: 'center', alignItems: 'center', borderRadius: 10, flexDirection: 'row', gap: 5, borderWidth: 1, borderColor: '#e0e0e0' },
  dateText: { fontFamily: 'Lao-Bold', color: COLORS.primaryDark, fontSize: 12 },

  cartItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, backgroundColor: '#f9f9f9', padding: 10, borderRadius: 12 },
  cartItemImage: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#ddd' },
  cartItemName: { fontSize: 14, color: '#333', fontFamily: 'Lao-Regular' },
  cartItemPrice: { fontSize: 14, fontFamily: 'Lao-Bold' },
  qtyControls: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  qtyBtn: { padding: 5, width: 30, alignItems: 'center' },
  qtyText: { fontSize: 14, fontFamily: 'Lao-Bold', width: 20, textAlign: 'center' },

  paymentMethodContainer: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  paymentMethodBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#eee', gap: 5 },
  paymentMethodActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  paymentMethodText: { fontFamily: 'Lao-Bold', fontSize: 14, color: COLORS.text },
  
  cashContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, padding: 10, backgroundColor: '#f9f9f9', borderRadius: 10 },
  cashLabel: { fontFamily: 'Lao-Regular', fontSize: 12, color: '#888', marginBottom: 5 },
  cashInput: { fontSize: 20, fontFamily: 'Lao-Bold', color: '#333', borderBottomWidth: 1, borderBottomColor: '#ddd', minWidth: 100, paddingVertical: 0 },
  changeText: { fontSize: 20, fontFamily: 'Lao-Bold' },
  
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  totalLabel: { fontSize: 16, color: '#888', fontFamily: 'Lao-Regular' },
  totalValue: { fontSize: 24, fontFamily: 'Lao-Bold', color: COLORS.primaryDark },
  
  confirmBtn: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 15, alignItems: 'center' },
  confirmBtnText: { color: 'white', fontSize: 18, fontFamily: 'Lao-Bold' }
});