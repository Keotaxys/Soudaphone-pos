import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
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
import { useExchangeRate } from '../../../hooks/useExchangeRate';
import { CartItem, COLORS, formatNumber, Product } from '../../types';

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
}

export default function POSScreen({
  products, cart, addToCart, openEditProductModal,
  openAddProductModal, openScanner, totalItems, totalLAK,
  updateQuantity, removeFromCart, onCheckout
}: POSScreenProps) {

  const exchangeRate = useExchangeRate();
  const currentRate = exchangeRate > 0 ? exchangeRate : 680; 

  const [searchQuery, setSearchQuery] = useState('');
  const [cartModalVisible, setCartModalVisible] = useState(false);
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  
  // Checkout States
  const [paymentCurrency, setPaymentCurrency] = useState<'LAK' | 'THB'>('LAK');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QR'>('CASH');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [source, setSource] = useState('ໜ້າຮ້ານ');
  const [checkoutDate, setCheckoutDate] = useState(new Date());

  // Filter Products
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.barcode && p.barcode.includes(searchQuery))
  );

  // Calculate Totals
  const totalBaseLAK = cart.reduce((sum, item) => {
      let priceLAK = item.price;
      if (item.priceCurrency === 'THB') {
          priceLAK = item.price * currentRate;
      }
      return sum + (priceLAK * item.quantity);
  }, 0);

  const totalTHB = totalBaseLAK / currentRate;

  // Change Calculation
  const amountNum = parseFloat(receivedAmount.replace(/,/g, '')) || 0;
  const totalToPay = paymentCurrency === 'LAK' ? totalBaseLAK : totalTHB;
  const change = amountNum - totalToPay;

  const handleConfirmCheckout = () => {
      onCheckout({
          paymentMethod,
          amountReceived: amountNum,
          change: change > 0 ? change : 0,
          date: checkoutDate.toISOString(),
          source,
          currency: paymentCurrency,
          totalPaid: totalToPay,
          baseTotalLAK: totalBaseLAK 
      });
      setCheckoutModalVisible(false);
      setCartModalVisible(false);
      setReceivedAmount('');
  };

  return (
    <View style={styles.container}>
      
      {/* --- Action Buttons (Scan & Add) --- */}
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

      {/* --- Product Grid --- */}
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
                <Image source={item.imageUrl ? { uri: item.imageUrl } : require('../../../../assets/icon.png')} style={styles.productImage} />
                {/* 🟢 ແກ້ໄຂ: Tag LAK ເປັນສີ Theme */}
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

      {/* --- Floating Cart Button --- */}
      {totalItems > 0 && (
          <TouchableOpacity style={styles.cartFloat} onPress={() => setCartModalVisible(true)}>
              <View style={styles.cartIconBadge}>
                  <Ionicons name="cart" size={24} color={COLORS.primary} />
                  <View style={styles.badge}><Text style={styles.badgeText}>{totalItems}</Text></View>
              </View>
              <Text style={styles.cartTotalText}>ລວມ: {formatNumber(totalBaseLAK)} ₭</Text>
          </TouchableOpacity>
      )}

      {/* --- Cart Modal --- */}
      <Modal visible={cartModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>ກະຕ່າສິນຄ້າ ({totalItems})</Text>
                      <TouchableOpacity onPress={() => setCartModalVisible(false)}>
                          <Ionicons name="close-circle" size={30} color="#ccc" />
                      </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.cartList}>
                      {cart.map((item) => (
                          <View key={item.id} style={styles.cartItem}>
                              <Image source={item.imageUrl ? { uri: item.imageUrl } : require('../../../../assets/icon.png')} style={styles.cartItemImg} />
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

                  {/* Payment Section in Cart */}
                  <View style={styles.paymentSection}>
                      <View style={styles.currencyToggle}>
                          <TouchableOpacity 
                            style={[styles.currencyBtn, paymentCurrency === 'LAK' && styles.activeCurrency]} 
                            onPress={() => setPaymentCurrency('LAK')}
                          >
                              <Text style={[styles.currencyBtnText, paymentCurrency === 'LAK' && {color: 'white'}]}>₭ ເງິນກີບ</Text>
                              {paymentCurrency === 'LAK' && <Ionicons name="checkmark-circle" size={16} color="white" style={{marginLeft: 5}} />}
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.currencyBtn, paymentCurrency === 'THB' && styles.activeCurrency]} 
                            onPress={() => setPaymentCurrency('THB')}
                          >
                              <Text style={[styles.currencyBtnText, paymentCurrency === 'THB' && {color: 'white'}]}>฿ ເງິນບາດ</Text>
                          </TouchableOpacity>
                      </View>

                      <View style={styles.totalRow}>
                          <Text style={styles.totalLabel}>ຍອດຕ້ອງຊຳລະ:</Text>
                          <Text style={styles.totalValue}>
                              {formatNumber(paymentCurrency === 'LAK' ? totalBaseLAK : totalTHB)} {paymentCurrency === 'LAK' ? '₭' : '฿'}
                          </Text>
                      </View>

                      {/* 🟢 ປຸ່ມຢືນຢັນການຊຳລະເປັນສີ Theme */}
                      <TouchableOpacity style={styles.checkoutBtn} onPress={() => setCheckoutModalVisible(true)}>
                          <Text style={styles.checkoutBtnText}>ຢືນຢັນການຊຳລະ</Text>
                      </TouchableOpacity>
                  </View>
              </View>
          </View>
      </Modal>

      {/* --- Checkout Modal (Final Step) --- */}
      <Modal visible={checkoutModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, {height: 'auto', paddingBottom: 30}]}>
                  <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>ຊຳລະເງິນ</Text>
                      <TouchableOpacity onPress={() => setCheckoutModalVisible(false)}>
                          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                      </TouchableOpacity>
                  </View>

                  <View style={{padding: 20}}>
                      <Text style={styles.label}>ຮູບແບບການຊຳລະ</Text>
                      <View style={{flexDirection: 'row', gap: 10, marginBottom: 20}}>
                          <TouchableOpacity 
                            style={[styles.methodBtn, paymentMethod === 'CASH' && styles.activeMethod]}
                            onPress={() => setPaymentMethod('CASH')}
                          >
                              <Ionicons name="cash-outline" size={24} color={paymentMethod === 'CASH' ? 'white' : COLORS.text} />
                              <Text style={{color: paymentMethod === 'CASH' ? 'white' : COLORS.text, fontFamily: 'Lao-Bold'}}>ເງິນສົດ</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.methodBtn, paymentMethod === 'QR' && styles.activeMethod]}
                            onPress={() => setPaymentMethod('QR')}
                          >
                              <Ionicons name="qr-code-outline" size={24} color={paymentMethod === 'QR' ? 'white' : COLORS.text} />
                              <Text style={{color: paymentMethod === 'QR' ? 'white' : COLORS.text, fontFamily: 'Lao-Bold'}}>QR Code</Text>
                          </TouchableOpacity>
                      </View>

                      {paymentMethod === 'CASH' && (
                          <View>
                              <Text style={styles.label}>ຮັບເງິນມາ</Text>
                              <TextInput 
                                style={styles.inputLarge} 
                                keyboardType="numeric" 
                                value={receivedAmount}
                                onChangeText={(t) => setReceivedAmount(formatNumber(t.replace(/,/g, '')))}
                                placeholder="0"
                              />
                              <View style={styles.changeRow}>
                                  <Text style={styles.changeLabel}>ເງິນທອນ:</Text>
                                  <Text style={[styles.changeValue, {color: change < 0 ? COLORS.danger : COLORS.success}]}>
                                      {formatNumber(change)} {paymentCurrency === 'LAK' ? '₭' : '฿'}
                                  </Text>
                              </View>
                          </View>
                      )}

                      <TouchableOpacity style={[styles.checkoutBtn, {marginTop: 20}]} onPress={handleConfirmCheckout}>
                          <Text style={styles.checkoutBtnText}>ບັນທຶກການຂາຍ</Text>
                      </TouchableOpacity>
                  </View>
              </View>
          </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  
  // Action Buttons
  actionRow: { flexDirection: 'row', padding: 15, gap: 10 },
  scanBtn: { flex: 1, flexDirection: 'row', backgroundColor: COLORS.primary, padding: 12, borderRadius: 10, justifyContent: 'center', alignItems: 'center', gap: 5 }, // 🟢 ປ່ຽນເປັນສີ Theme
  addBtn: { flex: 1, flexDirection: 'row', backgroundColor: COLORS.secondary, padding: 12, borderRadius: 10, justifyContent: 'center', alignItems: 'center', gap: 5 }, // 🟢 ສີສົ້ມຄືເກົ່າ
  btnText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 16 },

  // Product Grid
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

  // Floating Cart
  cartFloat: { position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: 'white', borderRadius: 30, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOpacity: 0.2 },
  cartIconBadge: { flexDirection: 'row', alignItems: 'center' },
  badge: { backgroundColor: COLORS.danger, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginLeft: -10, marginTop: -10 },
  badgeText: { color: 'white', fontSize: 10, fontFamily: 'Lao-Bold' },
  cartTotalText: { fontFamily: 'Lao-Bold', fontSize: 18, color: COLORS.primary },

  // Cart Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', height: '80%', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontFamily: 'Lao-Bold', fontSize: 18, color: COLORS.text },
  
  cartList: { flex: 1, padding: 15 },
  cartItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f9f9f9' },
  cartItemImg: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#eee' },
  cartItemName: { fontFamily: 'Lao-Bold', fontSize: 14, color: COLORS.text },
  cartItemPrice: { fontFamily: 'Lao-Regular', fontSize: 12, color: '#666' },
  qtyControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 8, marginLeft: 'auto' },
  qtyBtn: { padding: 8, width: 30, alignItems: 'center' },
  qtyText: { fontFamily: 'Lao-Bold', paddingHorizontal: 10 },

  // Payment Section
  paymentSection: { padding: 20, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#FAFAFA' },
  currencyToggle: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  currencyBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  activeCurrency: { backgroundColor: COLORS.primary, borderColor: COLORS.primary }, // 🟢 ສີ Theme
  currencyBtnText: { fontFamily: 'Lao-Bold', color: '#666' },
  
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  totalLabel: { fontFamily: 'Lao-Regular', fontSize: 16, color: '#666' },
  totalValue: { fontFamily: 'Lao-Bold', fontSize: 24, color: COLORS.primary }, // 🟢 ຕົວເລກສີ Theme

  checkoutBtn: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 12, alignItems: 'center' }, // 🟢 ປຸ່ມຢືນຢັນສີ Theme
  checkoutBtnText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 18 },

  // Checkout Modal Specifics
  label: { fontFamily: 'Lao-Bold', marginBottom: 10, color: COLORS.text },
  methodBtn: { flex: 1, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#eee', alignItems: 'center', gap: 5 },
  activeMethod: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  inputLarge: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 12, fontSize: 24, fontFamily: 'Lao-Bold', textAlign: 'center', borderWidth: 1, borderColor: '#eee' },
  changeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  changeLabel: { fontFamily: 'Lao-Regular', fontSize: 16, color: '#666' },
  changeValue: { fontFamily: 'Lao-Bold', fontSize: 20 }
});