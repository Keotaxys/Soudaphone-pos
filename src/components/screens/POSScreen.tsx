import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker'; // 🟢 Import ປະຕິທິນ
import React, { useState, useEffect } from 'react';
import {
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { COLORS, Product, CartItem } from '../../types';
import { useExchangeRate } from '../../../hooks/useExchangeRate';

interface POSScreenProps {
  products: Product[];
  cart: CartItem[];
  addToCart: (product: Product) => void;
  openEditProductModal: (product: Product) => void;
  openAddProductModal: () => void;
  openScanner: () => void;
  totalItems: number;
  totalLAK: number;
  updateQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  onCheckout: (paymentDetails: any) => void;
  formatNumber: (num: number | string | undefined) => string;
}

export default function POSScreen({
  products, cart, addToCart, openEditProductModal,
  openAddProductModal, openScanner, totalItems, totalLAK,
  updateQuantity, removeFromCart, onCheckout,
  formatNumber
}: POSScreenProps) {

  const exchangeRate = useExchangeRate();
  const currentRate = exchangeRate > 0 ? exchangeRate : 680; 

  const [searchQuery, setSearchQuery] = useState('');
  const [cartModalVisible, setCartModalVisible] = useState(false);
  
  // Checkout States
  const [paymentCurrency, setPaymentCurrency] = useState<'LAK' | 'THB'>('LAK');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QR'>('CASH');
  const [source, setSource] = useState<'ໜ້າຮ້ານ' | 'Online'>('ໜ້າຮ້ານ');
  
  // 🟢 State ສຳລັບວັນທີ
  const [checkoutDate, setCheckoutDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // State ສຳລັບແກ້ໄຂລາຄາ
  const [customTotal, setCustomTotal] = useState<string>('');
  const [isEditingTotal, setIsEditingTotal] = useState(false);

  // Filter Products
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.barcode && p.barcode.includes(searchQuery))
  );

  // Calculate Base Totals
  const calculateTotalBase = () => {
    return cart.reduce((sum, item) => {
        let priceLAK = item.price;
        if (item.priceCurrency === 'THB') {
            priceLAK = item.price * currentRate;
        }
        return sum + (priceLAK * item.quantity);
    }, 0);
  };

  const totalBaseLAK = calculateTotalBase();
  const totalBaseTHB = totalBaseLAK / currentRate;

  const getFinalTotal = () => {
      if (customTotal !== '') {
          return parseFloat(customTotal.replace(/,/g, ''));
      }
      return paymentCurrency === 'LAK' ? totalBaseLAK : totalBaseTHB;
  };

  const finalTotal = getFinalTotal();

  useEffect(() => {
      if (cart.length === 0) {
          setCustomTotal('');
          setCartModalVisible(false);
          setCheckoutDate(new Date()); // Reset ວັນທີເມື່ອກະຕ່າວ່າງ
      }
  }, [cart]);

  const handleCheckout = () => {
      const finalAmountLAK = paymentCurrency === 'LAK' ? finalTotal : finalTotal * currentRate;
      
      onCheckout({
          paymentMethod,
          amountReceived: finalAmountLAK, 
          change: 0,
          date: checkoutDate.toISOString(), // 🟢 ສົ່ງວັນທີທີ່ເລືອກໄປບັນທຶກ
          source,
          currency: paymentCurrency,
          totalPaid: finalTotal,
          baseTotalLAK: finalAmountLAK
      });
      setCartModalVisible(false);
      setCustomTotal('');
  };

  return (
    <View style={styles.container}>
      
      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.scanBtn} onPress={openScanner}>
            <Ionicons name="barcode-outline" size={24} color="white" />
            <Text style={styles.btnText}>ສະແກນ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addBtn} onPress={openAddProductModal}>
            <Ionicons name="add-circle-outline" size={24} color="white" />
            <Text style={styles.btnText}>ເພີ່ມສິນຄ້າ</Text>
        </TouchableOpacity>
      </View>

      {/* Product Grid */}
      <FlatList
        data={filteredProducts}
        keyExtractor={item => item.id!}
        numColumns={2}
        contentContainerStyle={{ padding: 10, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.productCard} 
            onPress={() => addToCart(item)}
            onLongPress={() => openEditProductModal(item)}
          >
            <View style={styles.imageContainer}>
                <Image 
                    source={item.imageUrl ? { uri: item.imageUrl } : { uri: 'https://via.placeholder.com/150' }} 
                    style={styles.productImage} 
                />
                <View style={[styles.currencyTag, { backgroundColor: item.priceCurrency === 'LAK' ? COLORS.primary : COLORS.secondary }]}>
                    <Text style={styles.currencyText}>{item.priceCurrency}</Text>
                </View>
                {item.stock <= 0 && (
                    <View style={styles.outOfStockOverlay}>
                        <Text style={styles.outOfStockText}>ໝົດ</Text>
                    </View>
                )}
            </View>
            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.productPrice, { color: item.priceCurrency === 'LAK' ? COLORS.primary : COLORS.secondary }]}>
                    {formatNumber(item.price)} {item.priceCurrency === 'LAK' ? '₭' : '฿'}
                </Text>
            </View>
            <TouchableOpacity style={[styles.addIcon, { backgroundColor: item.priceCurrency === 'LAK' ? COLORS.primary : COLORS.secondary }]} onPress={() => addToCart(item)}>
                <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      {/* Floating Cart Button */}
      {totalItems > 0 && (
          <TouchableOpacity style={styles.cartFloat} onPress={() => setCartModalVisible(true)}>
              <View style={styles.cartIconBadge}>
                  <Ionicons name="cart" size={24} color={COLORS.primary} />
                  <View style={styles.badge}><Text style={styles.badgeText}>{totalItems}</Text></View>
              </View>
              <Text style={styles.cartTotalText}>ລວມ: {formatNumber(totalBaseLAK)} ₭</Text>
          </TouchableOpacity>
      )}

      {/* Cart Modal */}
      <Modal visible={cartModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  
                  <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>ກະຕ່າສິນຄ້າ ({totalItems})</Text>
                      <TouchableOpacity onPress={() => setCartModalVisible(false)}>
                          <Ionicons name="close-circle" size={30} color="#ccc" />
                      </TouchableOpacity>
                  </View>

                  {/* 🟢 Controls Row: Source & Date */}
                  <View style={styles.controlsRow}>
                      {/* Source Toggle */}
                      <View style={styles.sourceGroup}>
                          <TouchableOpacity 
                            style={[styles.sourceBtn, source === 'ໜ້າຮ້ານ' && styles.activeSourceBtn]} 
                            onPress={() => setSource('ໜ້າຮ້ານ')}
                          >
                              <Text style={[styles.sourceText, source === 'ໜ້າຮ້ານ' && {color: 'white'}]}>ໜ້າຮ້ານ</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.sourceBtn, source === 'Online' && styles.activeSourceBtn]} 
                            onPress={() => setSource('Online')}
                          >
                              <Text style={[styles.sourceText, source === 'Online' && {color: 'white'}]}>Online</Text>
                          </TouchableOpacity>
                      </View>

                      {/* 🟢 Date Picker Button */}
                      <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
                          <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                          <Text style={styles.dateText}>{checkoutDate.toLocaleDateString('lo-LA')}</Text>
                      </TouchableOpacity>
                  </View>

                  {/* Cart List */}
                  <ScrollView style={styles.cartList}>
                      {cart.map((item) => (
                          <View key={item.id} style={styles.cartItem}>
                              <Image 
                                source={item.imageUrl ? { uri: item.imageUrl } : { uri: 'https://via.placeholder.com/150' }} 
                                style={styles.cartItemImg} 
                              />
                              <View style={{flex: 1, marginLeft: 10}}>
                                  <Text style={styles.cartItemName}>{item.name}</Text>
                                  <Text style={styles.cartItemPrice}>
                                      {formatNumber(item.price)} {item.priceCurrency === 'LAK' ? '₭' : '฿'}
                                  </Text>
                              </View>
                              <View style={styles.qtyControl}>
                                  <TouchableOpacity onPress={() => updateQuantity(item.id!, -1)} style={styles.qtyBtn}><Text>-</Text></TouchableOpacity>
                                  <Text style={styles.qtyText}>{item.quantity}</Text>
                                  <TouchableOpacity onPress={() => updateQuantity(item.id!, 1)} style={styles.qtyBtn}><Text>+</Text></TouchableOpacity>
                              </View>
                              <TouchableOpacity onPress={() => removeFromCart(item.id!)} style={{marginLeft: 10}}>
                                  <Ionicons name="trash-outline" size={24} color={COLORS.danger} />
                              </TouchableOpacity>
                          </View>
                      ))}
                  </ScrollView>

                  {/* Payment Section */}
                  <View style={styles.paymentSection}>
                      
                      {/* Currency Toggle */}
                      <View style={styles.row}>
                          <TouchableOpacity 
                            style={[styles.currencyBtn, paymentCurrency === 'LAK' && {backgroundColor: COLORS.primary, borderColor: COLORS.primary}]} 
                            onPress={() => { setPaymentCurrency('LAK'); setCustomTotal(''); }}
                          >
                              <Text style={[styles.btnTextSmall, paymentCurrency === 'LAK' ? {color: 'white'} : {color: '#666'}]}>₭ ເງິນກີບ</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.currencyBtn, paymentCurrency === 'THB' && {backgroundColor: COLORS.secondary, borderColor: COLORS.secondary}]} 
                            onPress={() => { setPaymentCurrency('THB'); setCustomTotal(''); }}
                          >
                              <Text style={[styles.btnTextSmall, paymentCurrency === 'THB' ? {color: 'white'} : {color: '#666'}]}>฿ ເງິນບາດ</Text>
                          </TouchableOpacity>
                      </View>

                      {/* Editable Total */}
                      <View style={styles.totalRow}>
                          <Text style={styles.totalLabel}>ຍອດຕ້ອງຊຳລະ:</Text>
                          <View style={{flexDirection: 'row', alignItems: 'center'}}>
                              {isEditingTotal ? (
                                  <TextInput 
                                      style={[styles.totalInput, { color: paymentCurrency === 'LAK' ? COLORS.primary : COLORS.secondary }]}
                                      value={customTotal}
                                      onChangeText={setCustomTotal}
                                      keyboardType="numeric"
                                      autoFocus
                                      onBlur={() => setIsEditingTotal(false)}
                                      placeholder={formatNumber(finalTotal)}
                                  />
                              ) : (
                                  <TouchableOpacity onPress={() => { setIsEditingTotal(true); setCustomTotal(finalTotal.toString()); }}>
                                      <Text style={[styles.totalValue, { color: paymentCurrency === 'LAK' ? COLORS.primary : COLORS.secondary }]}>
                                          {formatNumber(finalTotal)} {paymentCurrency === 'LAK' ? '₭' : '฿'} <Ionicons name="pencil" size={16} color="#999" />
                                      </Text>
                                  </TouchableOpacity>
                              )}
                          </View>
                      </View>

                      {/* Payment Method */}
                      <View style={styles.methodRow}>
                          <TouchableOpacity 
                              style={[styles.methodBtn, paymentMethod === 'CASH' && styles.activeMethodBtn]} 
                              onPress={() => setPaymentMethod('CASH')}
                          >
                              <Ionicons name="cash-outline" size={20} color={paymentMethod === 'CASH' ? 'white' : '#666'} />
                              <Text style={[styles.methodText, paymentMethod === 'CASH' && {color: 'white'}]}> ເງິນສົດ</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                              style={[styles.methodBtn, paymentMethod === 'QR' && styles.activeMethodBtn]} 
                              onPress={() => setPaymentMethod('QR')}
                          >
                              <Ionicons name="qr-code-outline" size={20} color={paymentMethod === 'QR' ? 'white' : '#666'} />
                              <Text style={[styles.methodText, paymentMethod === 'QR' && {color: 'white'}]}> QR Code</Text>
                          </TouchableOpacity>
                      </View>

                      {/* Checkout Button */}
                      <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
                          <Text style={styles.checkoutBtnText}>ຢືນຢັນການຊຳລະ</Text>
                      </TouchableOpacity>
                  </View>
              </View>
          </View>

          {/* 🟢 Date Picker Component */}
          {showDatePicker && (
              <DateTimePicker
                  value={checkoutDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) setCheckoutDate(selectedDate);
                  }}
              />
          )}
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  
  actionRow: { flexDirection: 'row', padding: 15, gap: 10 },
  scanBtn: { flex: 1, flexDirection: 'row', backgroundColor: COLORS.primary, padding: 12, borderRadius: 10, justifyContent: 'center', alignItems: 'center', gap: 5 },
  addBtn: { flex: 1, flexDirection: 'row', backgroundColor: COLORS.secondary, padding: 12, borderRadius: 10, justifyContent: 'center', alignItems: 'center', gap: 5 },
  btnText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 16 },

  productCard: { flex: 1, margin: 5, backgroundColor: 'white', borderRadius: 12, overflow: 'hidden', elevation: 2, position: 'relative' },
  imageContainer: { width: '100%', height: 140, backgroundColor: '#f0f0f0', position: 'relative' },
  productImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  currencyTag: { position: 'absolute', top: 5, left: 5, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  currencyText: { color: 'white', fontSize: 10, fontFamily: 'Lao-Bold' },
  outOfStockOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center' },
  outOfStockText: { color: COLORS.danger, fontFamily: 'Lao-Bold', fontSize: 18, transform: [{rotate: '-15deg'}] },
  
  productInfo: { padding: 10 },
  productName: { fontFamily: 'Lao-Regular', fontSize: 14, color: COLORS.text },
  productPrice: { fontFamily: 'Lao-Bold', fontSize: 16, marginTop: 2 },
  addIcon: { position: 'absolute', bottom: 10, right: 10, width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },

  cartFloat: { position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: 'white', borderRadius: 30, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOpacity: 0.2 },
  cartIconBadge: { flexDirection: 'row', alignItems: 'center' },
  badge: { backgroundColor: COLORS.danger, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginLeft: -10, marginTop: -10 },
  badgeText: { color: 'white', fontSize: 10, fontFamily: 'Lao-Bold' },
  cartTotalText: { fontFamily: 'Lao-Bold', fontSize: 18, color: COLORS.primary },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', height: '90%', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontFamily: 'Lao-Bold', fontSize: 18, color: COLORS.text },
  
  // 🟢 Controls Row Styles
  controlsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10, alignItems: 'center' },
  sourceGroup: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 8, padding: 2 },
  sourceBtn: { paddingVertical: 6, paddingHorizontal: 15, borderRadius: 6 },
  activeSourceBtn: { backgroundColor: COLORS.primary },
  sourceText: { fontFamily: 'Lao-Bold', fontSize: 13, color: '#666' },
  
  // 🟢 Date Button Styles
  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#f9f9f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  dateText: { fontFamily: 'Lao-Bold', color: COLORS.primary, fontSize: 13 },

  cartList: { flex: 1, padding: 15 },
  cartItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f9f9f9' },
  cartItemImg: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#eee' },
  cartItemName: { fontFamily: 'Lao-Bold', fontSize: 14, color: COLORS.text },
  cartItemPrice: { fontFamily: 'Lao-Regular', fontSize: 12, color: '#666' },
  qtyControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 8, marginLeft: 'auto' },
  qtyBtn: { padding: 8, width: 30, alignItems: 'center' },
  qtyText: { fontFamily: 'Lao-Bold', paddingHorizontal: 10 },

  paymentSection: { padding: 20, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#FAFAFA' },
  row: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  currencyBtn: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  btnTextSmall: { fontFamily: 'Lao-Bold', fontSize: 14 },
  
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  totalLabel: { fontFamily: 'Lao-Regular', fontSize: 16, color: '#666' },
  totalValue: { fontFamily: 'Lao-Bold', fontSize: 24 },
  totalInput: { fontFamily: 'Lao-Bold', fontSize: 24, borderBottomWidth: 1, borderBottomColor: '#ccc', minWidth: 100, textAlign: 'right' },

  methodRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  methodBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#eee', backgroundColor: 'white' },
  activeMethodBtn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  methodText: { fontFamily: 'Lao-Bold', color: '#666' },

  checkoutBtn: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 12, alignItems: 'center' },
  checkoutBtnText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 18 },
});