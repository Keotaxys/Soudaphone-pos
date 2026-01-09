import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useRef, useState } from 'react';
import { Image, Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CartItem, COLORS, formatDate, formatNumber } from '../../types';

interface CartModalProps {
  visible: boolean;
  onClose: () => void;
  cart: CartItem[];
  updateQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  onCheckout: (details: any) => void;
  total: number; // ຍອດເງິນກີບ (LAK)
  exchangeRate: number; // 🟢 ເພີ່ມ: ອັດຕາແລກປ່ຽນ (ເຊັ່ນ: 750)
}

export default function CartModal({ 
  visible, onClose, cart, updateQuantity, removeFromCart, onCheckout, total, exchangeRate 
}: CartModalProps) {
  
  const editTotalInputRef = useRef<TextInput>(null);
  const cashInputRef = useRef<TextInput>(null);

  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QR'>('CASH');
  const [currency, setCurrency] = useState<'LAK' | 'THB'>('LAK'); 
  
  // finalTotal ຈະເກັບຄ່າຕາມສະກຸນເງິນທີ່ເລືອກຢູ່ (ຖ້າເລືອກບາດ ກໍຈະເປັນເລກບາດ)
  const [finalTotal, setFinalTotal] = useState<number>(total); 
  const [isEditingTotal, setIsEditingTotal] = useState(false);
  const [tempTotalString, setTempTotalString] = useState('');
  const [amountReceived, setAmountReceived] = useState<string>('');
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saleSource, setSaleSource] = useState<'ໜ້າຮ້ານ' | 'Online'>('ໜ້າຮ້ານ');

  // --- Reset ເມື່ອເປີດ Modal ---
  useEffect(() => {
    if (visible) {
      setCurrency('LAK'); // ເລີ່ມຕົ້ນເປັນກີບສະເໝີ
      setFinalTotal(total); // ໃຊ້ຍອດກີບເປັນຫຼັກ
      setAmountReceived('');
      setPaymentMethod('CASH');
      setSelectedDate(new Date());
      setIsEditingTotal(false);
    }
  }, [visible, total]);

  // --- 🟢 Logic ການປ່ຽນສະກຸນເງິນ ແລະ ຄິດໄລ່ອັດຕາແລກປ່ຽນ ---
  const handleCurrencyChange = (newCurrency: 'LAK' | 'THB') => {
    if (newCurrency === currency) return; // ຖ້າກົດອັນເກົ່າບໍ່ຕ້ອງເຮັດຫຍັງ

    let newTotal = 0;
    
    // ສູດຄິດໄລ່:
    if (newCurrency === 'THB') {
        // ກີບ -> ບາດ (ຫານ)
        // ຕົວຢ່າງ: total 100,000 / rate 750 = 134 ບາດ (ໃຊ້ Math.ceil ປັດຂຶ້ນເພື່ອບໍ່ໃຫ້ຂາດທຶນ)
        newTotal = Math.ceil(finalTotal / (exchangeRate || 1));
    } else {
        // ບາດ -> ກີບ (ຄູນ)
        newTotal = Math.floor(finalTotal * (exchangeRate || 1));
    }

    setCurrency(newCurrency);
    setFinalTotal(newTotal);
    // Reset ເງິນຮັບມາ ເພາະສະກຸນເງິນປ່ຽນ
    setAmountReceived('');
  };

  const received = parseFloat(amountReceived.replace(/,/g, '')) || 0;
  const change = received - finalTotal; 

  // --- Ref Select All Function ---
  const handleFocusSelectAll = (ref: React.RefObject<TextInput | null>, valueLength: number) => {
    setTimeout(() => {
        ref.current?.setNativeProps({ selection: { start: 0, end: valueLength } });
    }, 50);
  };

  const handleConfirm = () => {
    // ເວລາບັນທຶກ ຖ້າເປັນບາດ ຕ້ອງສົ່ງຂໍ້ມູນໄປວ່າຈ່າຍເປັນບາດ ແລະ rate ເທົ່າໃດ
    onCheckout({
      paymentMethod,
      currency,
      totalPaid: finalTotal, // ຍອດທີ່ຈ່າຍຈິງ (ຕາມສະກຸນເງິນ)
      baseTotalLAK: currency === 'THB' ? finalTotal * exchangeRate : finalTotal, // ແປງກັບເປັນກີບເພື່ອບັນທຶກຍອດຂາຍລວມ
      exchangeRateUsed: exchangeRate,
      amountReceived: received,
      change,
      date: selectedDate,
      source: saleSource
    });
  };

  // ... (ສ່ວນ DatePicker ຄືເກົ່າ)
  const onChangeDate = (event: any, selected: Date | undefined) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selected) setSelectedDate(selected);
  };

  // ... (ສ່ວນ Edit Total Logic ຄືເກົ່າ)
  const startEditingTotal = () => {
    setTempTotalString(finalTotal.toString()); 
    setIsEditingTotal(true);
  };

  const saveNewTotal = () => {
    const cleanNum = tempTotalString.replace(/,/g, '');
    const newAmount = parseFloat(cleanNum);
    if (!isNaN(newAmount) && newAmount >= 0) {
        setFinalTotal(newAmount);
    } else {
        setFinalTotal(total); 
    }
    setIsEditingTotal(false);
    Keyboard.dismiss();
  };

  const activeColor = currency === 'LAK' ? COLORS.success : COLORS.secondary; 

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>ກະຕ່າສິນຄ້າ ({cart.length})</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close-circle" size={30} color="#ccc" /></TouchableOpacity>
          </View>

          {/* ... (ສ່ວນ Source & Date ຄືເກົ່າ) ... */}
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

          {/* ... (ສ່ວນ ScrollView Cart Items ຄືເກົ່າ) ... */}
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
            
            {/* 🟢 Currency Selector ໃຊ້ handleCurrencyChange */}
            <View style={styles.currencySelector}>
                <TouchableOpacity 
                    style={[styles.currencyBtn, currency === 'LAK' ? {backgroundColor: COLORS.success, borderColor: COLORS.success} : {borderColor: '#ddd'}]}
                    onPress={() => handleCurrencyChange('LAK')}
                >
                    <Text style={[styles.currencyText, currency === 'LAK' ? {color: 'white'} : {color: '#888'}]}>₭ ເງິນກີບ</Text>
                    {currency === 'LAK' && <Ionicons name="checkmark-circle" size={16} color="white" style={{marginLeft: 5}}/>}
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.currencyBtn, currency === 'THB' ? {backgroundColor: COLORS.secondary, borderColor: COLORS.secondary} : {borderColor: '#ddd'}]}
                    onPress={() => handleCurrencyChange('THB')}
                >
                    <Text style={[styles.currencyText, currency === 'THB' ? {color: 'white'} : {color: '#888'}]}>฿ ເງິນບາດ</Text>
                    {currency === 'THB' && <Ionicons name="checkmark-circle" size={16} color="white" style={{marginLeft: 5}}/>}
                </TouchableOpacity>
            </View>

            <View style={styles.totalRow}>
               <Text style={styles.totalLabel}>ຍອດຕ້ອງຊຳລະ:</Text>
               {isEditingTotal ? (
                   <View style={styles.editTotalContainer}>
                       <TextInput 
                           ref={editTotalInputRef}
                           style={[styles.editTotalInput, {color: activeColor}]} 
                           value={formatNumber(tempTotalString)} 
                           onChangeText={(t) => setTempTotalString(t.replace(/,/g, ''))}
                           keyboardType="numeric"
                           autoFocus
                           // 🟢 ແກ້ໄຂ Type ໃຫ້ຖືກຕ້ອງແລ້ວ
                           onFocus={() => handleFocusSelectAll(editTotalInputRef, formatNumber(tempTotalString).length)}
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
            
            {/* 🟢 ສະແດງ Rate ໃຫ້ເຫັນເພື່ອຄວາມຊັດເຈນ */}
            {currency === 'THB' && (
                <View style={{alignItems: 'flex-end', marginTop: -10, marginBottom: 10}}>
                    <Text style={{fontSize: 10, color: '#888'}}>Rate: {exchangeRate}</Text>
                </View>
            )}

            <View style={{flexDirection:'row', gap: 10, marginBottom: 15}}>
                 <View style={{flexDirection: 'row', backgroundColor:'#f5f5f5', borderRadius: 10, padding: 4}}>
                    <TouchableOpacity style={[styles.miniMethodBtn, paymentMethod === 'CASH' && {backgroundColor: 'white', shadowOpacity: 0.1}]} onPress={() => setPaymentMethod('CASH')}>
                        <Ionicons name="cash-outline" size={18} color={paymentMethod === 'CASH' ? activeColor : '#888'} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.miniMethodBtn, paymentMethod === 'QR' && {backgroundColor: 'white', shadowOpacity: 0.1}]} onPress={() => setPaymentMethod('QR')}>
                        <Ionicons name="qr-code-outline" size={18} color={paymentMethod === 'QR' ? activeColor : '#888'} />
                    </TouchableOpacity>
                 </View>

                 {paymentMethod === 'CASH' && (
                     <View style={styles.cashInputWrapper}>
                        <Text style={{fontSize: 12, color: '#888', marginRight: 5}}>ຮັບ:</Text>
                        <TextInput 
                            ref={cashInputRef}
                            style={styles.cashInputCompact} 
                            placeholder="0" 
                            keyboardType="numeric" 
                            // 🟢 ແກ້ໄຂ Type ໃຫ້ຖືກຕ້ອງແລ້ວ
                            onFocus={() => handleFocusSelectAll(cashInputRef, formatNumber(amountReceived).length)}
                            value={formatNumber(amountReceived)} 
                            onChangeText={(t) => setAmountReceived(t.replace(/,/g, ''))} 
                        />
                     </View>
                 )}
            </View>

            {paymentMethod === 'CASH' && (
                <View style={{flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 15}}>
                    <Text style={{fontFamily: 'Lao-Regular', color:'#888', marginRight: 10}}>ເງິນທອນ:</Text>
                    <Text style={[styles.changeText, change < 0 ? {color: COLORS.danger} : {color: COLORS.success}]}>
                        {formatNumber(change < 0 ? 0 : change)} {currency === 'THB' ? '฿' : '₭'}
                    </Text>
                </View>
            )}

            <TouchableOpacity style={[styles.confirmBtn, {backgroundColor: activeColor}]} onPress={handleConfirm}>
              <Text style={styles.confirmBtnText}>ຢືນຢັນການຊຳລະ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ... styles ທາງລຸ່ມແມ່ນຄືເກົ່າ ...
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

  currencySelector: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  currencyBtn: { flex: 1, flexDirection: 'row', paddingVertical: 10, borderWidth: 1, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  currencyText: { fontFamily: 'Lao-Bold', fontSize: 14 },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  totalLabel: { fontSize: 16, color: '#888', fontFamily: 'Lao-Regular' },
  totalDisplayBtn: { flexDirection: 'row', alignItems: 'center', padding: 5, borderRadius: 5, backgroundColor: '#f9f9f9' },
  totalValue: { fontSize: 24, fontFamily: 'Lao-Bold' },
  
  editTotalContainer: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#ddd', flex: 1, justifyContent: 'flex-end', gap: 10 },
  editTotalInput: { fontSize: 24, fontFamily: 'Lao-Bold', minWidth: 120, textAlign: 'right', padding: 0 },

  miniMethodBtn: { padding: 10, paddingHorizontal: 20, borderRadius: 8 },
  cashInputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 10, paddingHorizontal: 10,  },
  cashInputCompact: { flex: 1, fontSize: 18, fontFamily: 'Lao-Bold', color: '#333', paddingVertical: 8 },
  changeText: { fontSize: 20, fontFamily: 'Lao-Bold' },
  
  confirmBtn: { padding: 18, borderRadius: 15, alignItems: 'center' },
  confirmBtnText: { color: 'white', fontSize: 18, fontFamily: 'Lao-Bold' }
});