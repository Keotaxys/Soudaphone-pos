import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { Image, Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CartItem, COLORS, formatDate, formatNumber } from '../../types';

interface CartModalProps {
  visible: boolean;
  onClose: () => void;
  cart: CartItem[];
  updateQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  onCheckout: (details: any) => void;
  total: number; // ຍອດລວມເລີ່ມຕົ້ນ
}

export default function CartModal({ 
  visible, onClose, cart, updateQuantity, removeFromCart, onCheckout, total 
}: CartModalProps) {
  
  // --- States ---
  // 1. ການຊຳລະ ແລະ ສະກຸນເງິນ
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QR'>('CASH');
  const [currency, setCurrency] = useState<'LAK' | 'THB'>('LAK'); 
  
  // 2. ການແກ້ໄຂຍອດເງິນ (Discount/Override)
  const [finalTotal, setFinalTotal] = useState<number>(total); // ຍອດເງິນສຸດທ້າຍ (ທີ່ອາດຈະຖືກແກ້)
  const [isEditingTotal, setIsEditingTotal] = useState(false);
  const [tempTotalString, setTempTotalString] = useState('');

  // 3. ການຮັບເງິນ ແລະ ວັນທີ
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saleSource, setSaleSource] = useState<'ໜ້າຮ້ານ' | 'Online'>('ໜ້າຮ້ານ');

  // --- Effects ---
  // Reset ຄ່າເມື່ອເປີດ Modal ຫຼື ຍອດລວມປ່ຽນ
  useEffect(() => {
    if (visible) {
      setFinalTotal(total); // Reset ກັບໄປຫາຍອດຈິງ
      setAmountReceived('');
      setPaymentMethod('CASH');
      setSelectedDate(new Date());
      setIsEditingTotal(false);
    }
  }, [visible, total]);

  // --- Calculations ---
  const received = parseFloat(amountReceived.replace(/,/g, '')) || 0;
  const change = received - finalTotal; // ຄິດໄລ່ເງິນທອນຈາກຍອດທີ່ (ອາດຈະ) ຖືກແກ້ໄຂແລ້ວ

  // --- Handlers ---
  const handleConfirm = () => {
    onCheckout({
      paymentMethod,
      currency,
      total: finalTotal, // ສົ່ງຍອດທີ່ແກ້ໄຂແລ້ວໄປ
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

  // ຟັງຊັນເລີ່ມແກ້ໄຂຍອດເງິນ
  const startEditingTotal = () => {
    setTempTotalString(finalTotal.toString());
    setIsEditingTotal(true);
  };

  // ຟັງຊັນບັນທຶກຍອດເງິນໃໝ່
  const saveNewTotal = () => {
    const newAmount = parseFloat(tempTotalString.replace(/,/g, ''));
    if (!isNaN(newAmount) && newAmount >= 0) {
        setFinalTotal(newAmount);
    } else {
        setFinalTotal(total); // ຖ້າໃສ່ເລກຜິດ ໃຫ້ກັບໄປຄ່າເດີມ
    }
    setIsEditingTotal(false);
    Keyboard.dismiss();
  };

  // ກຳນົດສີ Theme ຕາມສະກຸນເງິນ
  const activeColor = currency === 'LAK' ? COLORS.success : COLORS.secondary; // Green vs Orange

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          
          {/* --- HEADER --- */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>ກະຕ່າສິນຄ້າ ({cart.length})</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close-circle" size={30} color="#ccc" /></TouchableOpacity>
          </View>

          {/* --- SETTINGS ROW (Source & Date) --- */}
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

          {showDatePicker && (<DateTimePicker value={selectedDate} mode="date" display="default" onChange={onChangeDate} />)}

          {/* --- CART ITEMS LIST --- */}
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

          {/* --- FOOTER (Payment Section) --- */}
          <View style={styles.modalFooter}>
            
            {/* 1. Currency Selector (LAK/THB) */}
            <View style={styles.currencySelector}>
                <TouchableOpacity 
                    style={[styles.currencyBtn, currency === 'LAK' ? {backgroundColor: COLORS.success, borderColor: COLORS.success} : {borderColor: '#ddd'}]}
                    onPress={() => setCurrency('LAK')}
                >
                    <Text style={[styles.currencyText, currency === 'LAK' ? {color: 'white'} : {color: '#888'}]}>₭ ເງິນກີບ</Text>
                    {currency === 'LAK' && <Ionicons name="checkmark-circle" size={16} color="white" style={{marginLeft: 5}}/>}
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.currencyBtn, currency === 'THB' ? {backgroundColor: COLORS.secondary, borderColor: COLORS.secondary} : {borderColor: '#ddd'}]}
                    onPress={() => setCurrency('THB')}
                >
                    <Text style={[styles.currencyText, currency === 'THB' ? {color: 'white'} : {color: '#888'}]}>฿ ເງິນບາດ</Text>
                    {currency === 'THB' && <Ionicons name="checkmark-circle" size={16} color="white" style={{marginLeft: 5}}/>}
                </TouchableOpacity>
            </View>

            {/* 2. Total Amount (Editable) */}
            <View style={styles.totalRow}>
               <Text style={styles.totalLabel}>ຍອດຕ້ອງຊຳລະ:</Text>
               
               {isEditingTotal ? (
                   <View style={styles.editTotalContainer}>
                       <TextInput 
                           style={[styles.editTotalInput, {color: activeColor}]} 
                           value={tempTotalString}
                           onChangeText={setTempTotalString}
                           keyboardType="numeric"
                           autoFocus
                           onBlur={saveNewTotal}
                           onSubmitEditing={saveNewTotal}
                       />
                       <TouchableOpacity onPress={saveNewTotal}><Ionicons name="checkmark" size={24} color={COLORS.success} /></TouchableOpacity>
                   </View>
               ) : (
                   <TouchableOpacity style={styles.totalDisplayBtn} onPress={startEditingTotal}>
                       <Text style={[styles.totalValue, {color: activeColor}]}>
                           {formatNumber(finalTotal)} {currency === 'THB' ? '฿' : '₭'}
                       </Text>
                       <Ionicons name="pencil" size={16} color="#ccc" style={{marginLeft: 8}} />
                   </TouchableOpacity>
               )}
            </View>

            {/* 3. Payment Method & Cash Input */}
            <View style={{flexDirection:'row', gap: 10, marginBottom: 15}}>
                 {/* Payment Type */}
                 <View style={{flexDirection: 'row', backgroundColor:'#f5f5f5', borderRadius: 10, padding: 4}}>
                    <TouchableOpacity style={[styles.miniMethodBtn, paymentMethod === 'CASH' && {backgroundColor: 'white', shadowOpacity: 0.1}]} onPress={() => setPaymentMethod('CASH')}>
                        <Ionicons name="cash-outline" size={18} color={paymentMethod === 'CASH' ? activeColor : '#888'} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.miniMethodBtn, paymentMethod === 'QR' && {backgroundColor: 'white', shadowOpacity: 0.1}]} onPress={() => setPaymentMethod('QR')}>
                        <Ionicons name="qr-code-outline" size={18} color={paymentMethod === 'QR' ? activeColor : '#888'} />
                    </TouchableOpacity>
                 </View>

                 {/* Cash Input Field */}
                 {paymentMethod === 'CASH' && (
                     <View style={styles.cashInputWrapper}>
                        <Text style={{fontSize: 12, color: '#888', marginRight: 5}}>ຮັບ:</Text>
                        <TextInput 
                            style={styles.cashInputCompact} 
                            placeholder="0" 
                            keyboardType="numeric" 
                            value={formatNumber(amountReceived)} 
                            onChangeText={(t) => setAmountReceived(t.replace(/,/g, ''))} 
                        />
                     </View>
                 )}
            </View>

            {/* 4. Change Display (If Cash) */}
            {paymentMethod === 'CASH' && (
                <View style={{flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 15}}>
                    <Text style={{fontFamily: 'Lao-Regular', color:'#888', marginRight: 10}}>ເງິນທອນ:</Text>
                    <Text style={[styles.changeText, change < 0 ? {color: COLORS.danger} : {color: COLORS.success}]}>
                        {formatNumber(change < 0 ? 0 : change)} {currency === 'THB' ? '฿' : '₭'}
                    </Text>
                </View>
            )}

            {/* 5. Confirm Button */}
            <TouchableOpacity style={[styles.confirmBtn, {backgroundColor: activeColor}]} onPress={handleConfirm}>
              <Text style={styles.confirmBtnText}>ຢືນຢັນການຊຳລະ</Text>
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
  modalFooter: { borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 15 },
  
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

  // Styles for Footer Updates
  currencySelector: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  currencyBtn: { flex: 1, flexDirection: 'row', paddingVertical: 10, borderWidth: 1, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  currencyText: { fontFamily: 'Lao-Bold', fontSize: 14 },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  totalLabel: { fontSize: 16, color: '#888', fontFamily: 'Lao-Regular' },
  totalDisplayBtn: { flexDirection: 'row', alignItems: 'center', padding: 5, borderRadius: 5, backgroundColor: '#f9f9f9' },
  totalValue: { fontSize: 24, fontFamily: 'Lao-Bold' },
  
  editTotalContainer: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#ddd' },
  editTotalInput: { fontSize: 24, fontFamily: 'Lao-Bold', minWidth: 100, textAlign: 'right', padding: 0 },

  miniMethodBtn: { padding: 10, paddingHorizontal: 20, borderRadius: 8 },
  cashInputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 10, paddingHorizontal: 10,  },
  cashInputCompact: { flex: 1, fontSize: 18, fontFamily: 'Lao-Bold', color: '#333', paddingVertical: 8 },
  changeText: { fontSize: 20, fontFamily: 'Lao-Bold' },
  
  confirmBtn: { padding: 18, borderRadius: 15, alignItems: 'center' },
  confirmBtnText: { color: 'white', fontSize: 18, fontFamily: 'Lao-Bold' }
});