import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { printAsync } from 'expo-print';
import { onValue, ref } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useExchangeRate } from '../../../hooks/useExchangeRate';
import { db } from '../../firebase';
import { CartItem, COLORS, Product } from '../../types';
// 🟢 Import Component ໃໝ່
import CurrencyInput from '../ui/CurrencyInput';

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

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ທັງໝົດ');
  const [cartModalVisible, setCartModalVisible] = useState(false);
  
  // Checkout States
  const [paymentCurrency, setPaymentCurrency] = useState<'LAK' | 'THB'>('LAK');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QR'>('CASH');
  const [source, setSource] = useState<'ໜ້າຮ້ານ' | 'Online'>('ໜ້າຮ້ານ');
  const [checkoutDate, setCheckoutDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Custom Total & Change Logic
  const [receivedAmount, setReceivedAmount] = useState(''); // ເງິນທີ່ຮັບມາ
  const [customTotal, setCustomTotal] = useState<string>(''); // ຍອດລວມທີ່ແກ້ໄຂໄດ້
  const [isEditingTotal, setIsEditingTotal] = useState(false);

  // Success & Print States
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);
  
  // Bill Settings State
  const [billSettings, setBillSettings] = useState({
      shopName: 'Soudaphone POS',
      address: 'ນະຄອນຫຼວງວຽງຈັນ',
      phone: '',
      footerText: 'ຂອບໃຈທີ່ອຸດໜູນ',
      logo: ''
  });

  useEffect(() => {
      const settingsRef = ref(db, 'billSettings');
      const unsubscribe = onValue(settingsRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
              setBillSettings(data);
          }
      });
      return () => unsubscribe();
  }, []);

  const categories = ['ທັງໝົດ', ...Array.from(new Set(products.map(p => p.category || 'ອື່ນໆ')))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.barcode && p.barcode.includes(searchQuery));
    const matchesCategory = selectedCategory === 'ທັງໝົດ' || (p.category || 'ອື່ນໆ') === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
  const totalBaseTHB = Math.ceil(totalBaseLAK / currentRate);

  const getFinalTotal = () => {
      if (customTotal !== '') {
          return parseFloat(customTotal.replace(/,/g, ''));
      }
      return paymentCurrency === 'LAK' ? totalBaseLAK : totalBaseTHB;
  };

  const finalTotal = getFinalTotal();
  const changeAmount = (parseFloat(receivedAmount.replace(/,/g, '') || '0') - finalTotal);

  useEffect(() => {
      if (cart.length === 0) {
          setCustomTotal('');
          setReceivedAmount('');
          setCartModalVisible(false);
          setCheckoutDate(new Date());
      }
  }, [cart]);

  const handleCheckout = () => {
      const finalAmountLAK = paymentCurrency === 'LAK' ? finalTotal : Math.ceil(finalTotal * currentRate);
      
      const orderDetails = {
          items: [...cart], 
          paymentMethod,
          amountReceived: parseFloat(receivedAmount.replace(/,/g, '') || '0'), 
          change: changeAmount > 0 ? changeAmount : 0,
          date: checkoutDate.toISOString(),
          source,
          currency: paymentCurrency,
          totalPaid: finalTotal,
          baseTotalLAK: finalAmountLAK
      };

      onCheckout(orderDetails);
      setLastOrder(orderDetails);
      setCartModalVisible(false);
      setCustomTotal('');
      setReceivedAmount('');
      setTimeout(() => setShowSuccessModal(true), 500); 
  };

  const printReceipt = async () => {
    if (!lastOrder) return;

    const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; font-size: 12px; padding: 5px; }
            .header { text-align: center; margin-bottom: 10px; }
            .logo { width: 60px; height: 60px; border-radius: 50%; margin-bottom: 5px; }
            .title { font-size: 20px; font-weight: bold; margin-bottom: 2px; }
            .subtitle { font-size: 12px; color: #555; }
            .line { border-bottom: 1px dashed #000; margin: 5px 0; }
            .row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; font-size: 11px; }
            .header-row { font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 5px; }
            .col-1 { width: 8%; text-align: center; } 
            .col-2 { width: 37%; } 
            .col-3 { width: 20%; text-align: right; } 
            .col-4 { width: 10%; text-align: center; } 
            .col-5 { width: 25%; text-align: right; } 
            .total-section { margin-top: 10px; text-align: right; }
            .total-row { font-size: 16px; font-weight: bold; margin-top: 5px; }
            .footer { text-align: center; margin-top: 20px; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            ${billSettings.logo ? `<img src="${billSettings.logo}" class="logo" />` : ''}
            <div class="title">${billSettings.shopName}</div>
            <div class="subtitle">${billSettings.address}</div>
            <div class="subtitle">ໂທ: ${billSettings.phone}</div>
            <div style="margin-top: 5px;">ວັນທີ: ${new Date(lastOrder.date).toLocaleString('lo-LA')}</div>
            <div>No: #${new Date(lastOrder.date).getTime().toString().slice(-6)}</div>
          </div>
          <div class="line"></div>
          <div class="row header-row">
            <div class="col-1">ລ/ດ</div>
            <div class="col-2">ລາຍການ</div>
            <div class="col-3">ລາຄາ</div>
            <div class="col-4">ຈນ</div>
            <div class="col-5">ລວມ</div>
          </div>
          ${lastOrder.items.map((item: any, index: number) => `
            <div class="row">
              <div class="col-1">${index + 1}</div>
              <div class="col-2">${item.name}</div>
              <div class="col-3">${formatNumber(item.price)}</div>
              <div class="col-4">${item.quantity}</div>
              <div class="col-5">${formatNumber(item.price * item.quantity)}</div>
            </div>
          `).join('')}
          <div class="line"></div>
          <div class="total-section">
            <div>ຊຳລະໂດຍ: ${lastOrder.paymentMethod}</div>
            <div class="total-row">
              ລວມທັງໝົດ: ${formatNumber(lastOrder.totalPaid)} ${lastOrder.currency === 'LAK' ? '₭' : '฿'}
            </div>
            <div>ຮັບເງິນ: ${formatNumber(lastOrder.amountReceived)}</div>
            <div>ເງິນທອນ: ${formatNumber(lastOrder.change)}</div>
          </div>
          <div class="footer">
            <div class="line"></div>
            ${billSettings.footerText}<br/>
            Thank You
          </div>
        </body>
      </html>
    `;

    try {
        await printAsync({ html });
        setShowSuccessModal(false); 
    } catch (error) { }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
      const currentDate = selectedDate || checkoutDate;
      setShowDatePicker(Platform.OS === 'ios'); 
      setCheckoutDate(currentDate);
  };

  const ListHeader = () => (
    <View style={styles.headerContainer}>
        <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
                style={styles.searchInput}
                placeholder="ຄົ້ນຫາສິນຄ້າ (ຊື່ ຫຼື ບາໂຄດ)..."
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color="#ccc" />
                </TouchableOpacity>
            )}
        </View>

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

        <View style={styles.categoryContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 10}}>
                {categories.map((cat, index) => (
                    <TouchableOpacity 
                        key={index} 
                        style={[
                            styles.categoryChip, 
                            selectedCategory === cat && styles.activeCategoryChip
                        ]}
                        onPress={() => setSelectedCategory(cat)}
                    >
                        <Text style={[
                            styles.categoryText, 
                            selectedCategory === cat && styles.activeCategoryText
                        ]}>
                            {cat}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredProducts}
        keyExtractor={item => item.id!}
        numColumns={2}
        ListHeaderComponent={ListHeader} 
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
            <View style={{alignItems: 'center', marginTop: 50}}>
                <Text style={{fontFamily: 'Lao-Regular', color: '#999'}}>ບໍ່ພົບສິນຄ້າ</Text>
            </View>
        }
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
            {/* 🟢 ປຸ່ມບວກເປັນສີ Teal ທັງໝົດ */}
            <TouchableOpacity style={[styles.addIcon, { backgroundColor: COLORS.primary }]} onPress={() => addToCart(item)}>
                <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      {totalItems > 0 && (
          <TouchableOpacity style={styles.cartFloat} onPress={() => setCartModalVisible(true)}>
              <View style={styles.cartIconBadge}>
                  <Ionicons name="cart" size={24} color={COLORS.primary} />
                  <View style={styles.badge}><Text style={styles.badgeText}>{totalItems}</Text></View>
              </View>
              <Text style={styles.cartTotalText}>ລວມ: {formatNumber(Math.ceil(totalBaseLAK))} ₭</Text>
          </TouchableOpacity>
      )}

      {/* Cart Modal */}
      <Modal visible={cartModalVisible} animationType="slide" transparent={true}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
              <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>ກະຕ່າສິນຄ້າ ({totalItems})</Text>
                      <TouchableOpacity onPress={() => setCartModalVisible(false)}>
                          <Ionicons name="close-circle" size={30} color="#ccc" />
                      </TouchableOpacity>
                  </View>

                  <View style={styles.controlsRow}>
                      <View style={styles.sourceGroup}>
                          <TouchableOpacity 
                            style={[styles.sourceBtn, source === 'ໜ້າຮ້ານ' && { backgroundColor: COLORS.primary }]} 
                            onPress={() => setSource('ໜ້າຮ້ານ')}
                          >
                              <Text style={[styles.sourceText, source === 'ໜ້າຮ້ານ' && {color: 'white'}]}>ໜ້າຮ້ານ</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.sourceBtn, source === 'Online' && { backgroundColor: COLORS.secondary }]} 
                            onPress={() => setSource('Online')}
                          >
                              <Text style={[styles.sourceText, source === 'Online' && {color: 'white'}]}>Online</Text>
                          </TouchableOpacity>
                      </View>
                      <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
                          <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                          <Text style={styles.dateText}>{checkoutDate.toLocaleDateString('lo-LA')}</Text>
                      </TouchableOpacity>
                  </View>

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

                  <View style={styles.paymentSection}>
                      <View style={styles.row}>
                          <TouchableOpacity 
                            style={[styles.currencyBtn, paymentCurrency === 'LAK' && {backgroundColor: COLORS.primary, borderColor: COLORS.primary}]} 
                            onPress={() => { setPaymentCurrency('LAK'); setCustomTotal(''); setReceivedAmount(''); }}
                          >
                              <Text style={[styles.btnTextSmall, paymentCurrency === 'LAK' ? {color: 'white'} : {color: '#666'}]}>₭ ເງິນກີບ</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.currencyBtn, paymentCurrency === 'THB' && {backgroundColor: COLORS.secondary, borderColor: COLORS.secondary}]} 
                            onPress={() => { setPaymentCurrency('THB'); setCustomTotal(''); setReceivedAmount(''); }}
                          >
                              <Text style={[styles.btnTextSmall, paymentCurrency === 'THB' ? {color: 'white'} : {color: '#666'}]}>฿ ເງິນບາດ</Text>
                          </TouchableOpacity>
                      </View>

                      <View style={styles.totalRow}>
                          <Text style={styles.totalLabel}>ຍອດຕ້ອງຊຳລະ:</Text>
                          <View style={{flexDirection: 'row', alignItems: 'center'}}>
                              {isEditingTotal ? (
                                  // 🟢 ໃຊ້ CurrencyInput ແທນ TextInput
                                  <CurrencyInput 
                                      style={[styles.totalInput, { color: paymentCurrency === 'LAK' ? COLORS.primary : COLORS.secondary }]}
                                      value={customTotal}
                                      onChangeValue={setCustomTotal}
                                      autoFocus
                                      onBlur={() => setIsEditingTotal(false)}
                                      placeholder={Math.ceil(finalTotal).toString()}
                                  />
                              ) : (
                                  <TouchableOpacity onPress={() => { setIsEditingTotal(true); setCustomTotal(Math.ceil(finalTotal).toString()); }}>
                                      <Text style={[styles.totalValue, { color: paymentCurrency === 'LAK' ? COLORS.primary : COLORS.secondary }]}>
                                          {formatNumber(Math.ceil(finalTotal))} {paymentCurrency === 'LAK' ? '₭' : '฿'} <Ionicons name="pencil" size={16} color="#999" />
                                      </Text>
                                  </TouchableOpacity>
                              )}
                          </View>
                      </View>

                      {/* 🟢 ສ່ວນຮັບເງິນ ແລະ ເງິນທອນ */}
                      <View style={styles.receivedRow}>
                          <View style={{flex: 1}}>
                            <Text style={styles.receivedLabel}>ຮັບເງິນ:</Text>
                            {/* 🟢 ໃຊ້ CurrencyInput ແທນ TextInput */}
                            <CurrencyInput 
                                style={styles.receivedInput} 
                                value={receivedAmount} 
                                onChangeValue={setReceivedAmount} 
                                placeholder="0" 
                            />
                          </View>
                          <View style={{flex: 1, alignItems: 'flex-end'}}>
                            <Text style={styles.receivedLabel}>ເງິນທອນ:</Text>
                            <Text style={[styles.changeValue, { color: changeAmount < 0 ? COLORS.danger : COLORS.success }]}>
                                {formatNumber(changeAmount > 0 ? changeAmount : 0)}
                            </Text>
                          </View>
                      </View>

                      <View style={styles.methodRow}>
                          <TouchableOpacity 
                              style={[styles.methodBtn, paymentMethod === 'CASH' && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]} 
                              onPress={() => setPaymentMethod('CASH')}
                          >
                              <Ionicons name="cash-outline" size={20} color={paymentMethod === 'CASH' ? 'white' : '#666'} />
                              <Text style={[styles.methodText, paymentMethod === 'CASH' && {color: 'white'}]}> ເງິນສົດ</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                              style={[styles.methodBtn, paymentMethod === 'QR' && { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary }]} 
                              onPress={() => setPaymentMethod('QR')}
                          >
                              <Ionicons name="qr-code-outline" size={20} color={paymentMethod === 'QR' ? 'white' : '#666'} />
                              <Text style={[styles.methodText, paymentMethod === 'QR' && {color: 'white'}]}> QR Code</Text>
                          </TouchableOpacity>
                      </View>

                      <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
                          <Text style={styles.checkoutBtnText}>ຢືນຢັນການຊຳລະ</Text>
                      </TouchableOpacity>
                  </View>
              </View>
          </KeyboardAvoidingView>

          {showDatePicker && (
              Platform.OS === 'ios' ? (
                  <View style={styles.iosDatePickerOverlay}>
                      <View style={styles.iosDatePickerContent}>
                          <DateTimePicker
                              value={checkoutDate}
                              mode="date"
                              display="inline"
                              onChange={onDateChange}
                              style={{ height: 300, width: '100%' }}
                          />
                          <TouchableOpacity style={styles.iosDateDoneBtn} onPress={() => setShowDatePicker(false)}>
                              <Text style={styles.iosDateDoneText}>ຕົກລົງ</Text>
                          </TouchableOpacity>
                      </View>
                  </View>
              ) : (
                  <DateTimePicker
                      value={checkoutDate}
                      mode="date"
                      display="default"
                      onChange={(event, date) => {
                          setShowDatePicker(false);
                          if(date) setCheckoutDate(date);
                      }}
                  />
              )
          )}
      </Modal>

      {/* Success & Print Modal */}
      <Modal visible={showSuccessModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={styles.successCard}>
                <View style={styles.successIcon}>
                    <Ionicons name="checkmark-circle" size={60} color={COLORS.success} />
                </View>
                <Text style={styles.successTitle}>ຂາຍສຳເລັດ!</Text>
                <Text style={styles.successSub}>ບັນທຶກຂໍ້ມູນການຂາຍຮຽບຮ້ອຍແລ້ວ</Text>
                
                <View style={{marginTop: 20, width: '100%', gap: 10}}>
                    <TouchableOpacity style={styles.printBtn} onPress={printReceipt}>
                        <Ionicons name="print-outline" size={20} color="white" />
                        <Text style={styles.printBtnText}>ພິມໃບບິນ</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.closeBtn} onPress={() => setShowSuccessModal(false)}>
                        <Text style={styles.closeBtnText}>ປິດ</Text>
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
  headerContainer: { backgroundColor: COLORS.background, paddingBottom: 5 },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', margin: 10, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#eee' },
  searchInput: { flex: 1, marginLeft: 10, fontFamily: 'Lao-Regular', fontSize: 16 },
  
  categoryContainer: { marginBottom: 5 },
  categoryChip: { paddingHorizontal: 15, paddingVertical: 8, backgroundColor: 'white', borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#eee' },
  activeCategoryChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  categoryText: { fontFamily: 'Lao-Regular', color: '#666' },
  activeCategoryText: { color: 'white', fontFamily: 'Lao-Bold' },

  actionRow: { flexDirection: 'row', paddingHorizontal: 10, paddingBottom: 10, gap: 10 },
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
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%', width: '100%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontFamily: 'Lao-Bold', fontSize: 18, color: COLORS.text },
  
  controlsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10, alignItems: 'center' },
  sourceGroup: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 8, padding: 2 },
  sourceBtn: { paddingVertical: 6, paddingHorizontal: 15, borderRadius: 6 },
  sourceText: { fontFamily: 'Lao-Bold', fontSize: 13, color: '#666' },
  
  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#f9f9f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  dateText: { fontFamily: 'Lao-Bold', color: COLORS.primary, fontSize: 13 },

  cartList: { padding: 15 }, 
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
  
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  totalLabel: { fontFamily: 'Lao-Regular', fontSize: 16, color: '#666' },
  totalValue: { fontFamily: 'Lao-Bold', fontSize: 24 },
  totalInput: { fontFamily: 'Lao-Bold', fontSize: 24, borderBottomWidth: 1, borderBottomColor: '#ccc', minWidth: 100, textAlign: 'right' },

  // Received & Change Styles
  receivedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 15 },
  receivedLabel: { fontSize: 14, color: '#666', fontFamily: 'Lao-Bold', marginBottom: 5 },
  receivedInput: { backgroundColor: 'white', borderRadius: 10, borderWidth: 1, borderColor: '#ccc', padding: 10, fontSize: 18, fontFamily: 'Lao-Bold', textAlign: 'right' },
  changeValue: { fontSize: 20, fontFamily: 'Lao-Bold', marginTop: 5 },

  methodRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  methodBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#eee', backgroundColor: 'white' },
  methodText: { fontFamily: 'Lao-Bold', color: '#666' },

  checkoutBtn: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 12, alignItems: 'center' },
  checkoutBtnText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 18 },

  iosDatePickerOverlay: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'white', paddingBottom: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, shadowColor: '#000', shadowOffset: {width: 0, height: -2}, shadowOpacity: 0.2, shadowRadius: 5 },
  iosDatePickerContent: { alignItems: 'center' },
  iosDateDoneBtn: { padding: 15, width: '100%', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#eee' },
  iosDateDoneText: { color: COLORS.primary, fontFamily: 'Lao-Bold', fontSize: 18 },

  successCard: { backgroundColor: 'white', width: '80%', padding: 20, borderRadius: 20, alignItems: 'center', elevation: 5 },
  successIcon: { marginBottom: 10 },
  successTitle: { fontSize: 22, fontFamily: 'Lao-Bold', color: COLORS.success, marginBottom: 5 },
  successSub: { fontSize: 14, fontFamily: 'Lao-Regular', color: '#666', marginBottom: 20 },
  printBtn: { flexDirection: 'row', backgroundColor: COLORS.primary, padding: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', width: '100%' },
  printBtnText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 16, marginLeft: 5 },
  closeBtn: { padding: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', width: '100%', backgroundColor: '#f0f0f0' },
  closeBtnText: { color: '#666', fontFamily: 'Lao-Bold', fontSize: 16 }
});