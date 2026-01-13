import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { CartItem, COLORS, formatNumber, Product } from '../../types';

const { width } = Dimensions.get('window');
const ORANGE_THEME = '#FF8F00';

interface POSScreenProps {
  products: Product[];
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
  onCheckout: (details: any) => void;
  openEditProductModal?: (product: Product) => void;
  onOpenScan?: () => void;
  onOpenAddProduct?: () => void;
}

// Helper Functions
const formatInputNumber = (val: string) => {
    const numericValue = val.replace(/[^0-9]/g, '');
    if (!numericValue) return '';
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const parseInputNumber = (val: string) => {
    return parseFloat(val.replace(/,/g, '')) || 0;
};

export default function POSScreen({
  products,
  cart,
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  onCheckout,
  onOpenScan,
  onOpenAddProduct
}: POSScreenProps) {
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  
  const [isCartVisible, setCartVisible] = useState(false);
  const [orderSource, setOrderSource] = useState<'shop' | 'online'>('shop');
  const [currency, setCurrency] = useState<'LAK' | 'THB'>('LAK');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QR'>('CASH');
  
  const [amountReceived, setAmountReceived] = useState('');
  const [editableTotal, setEditableTotal] = useState(''); 
  const [exchangeRate] = useState(680); 
  
  const [orderDate, setOrderDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [isReceiptVisible, setReceiptVisible] = useState(false);
  const [lastOrderDetails, setLastOrderDetails] = useState<any>(null);

  useEffect(() => {
    const uniqueCats = ['All', ...new Set(products.map(p => p.category || 'ອື່ນໆ'))];
    setCategories(uniqueCats);

    const filtered = products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.barcode && p.barcode.includes(searchQuery));
      const matchCat = selectedCategory === 'All' || (p.category || 'ອື່ນໆ') === selectedCategory;
      return matchSearch && matchCat;
    });
    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, products]);

  const calculateBaseTotalLAK = () => {
    return cart.reduce((sum, item) => {
        let itemTotalLAK = 0;
        if (item.priceCurrency === 'THB') {
            itemTotalLAK = item.price * exchangeRate * item.quantity;
        } else {
            itemTotalLAK = item.price * item.quantity;
        }
        return sum + itemTotalLAK;
    }, 0);
  };

  const getDisplayTotal = () => {
    const baseTotalLAK = calculateBaseTotalLAK();
    if (currency === 'LAK') return baseTotalLAK;
    return Math.ceil(baseTotalLAK / exchangeRate); 
  };

  useEffect(() => {
    const total = getDisplayTotal();
    setEditableTotal(formatNumber(total)); 
    setAmountReceived(''); 
  }, [cart, currency]);

  const finalTotal = parseInputNumber(editableTotal); 
  const systemTotal = getDisplayTotal(); 
  const discount = systemTotal - finalTotal; 
  
  const receivedVal = parseInputNumber(amountReceived);
  const change = receivedVal - finalTotal;

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setOrderDate(selectedDate);
  };

  const handlePayment = () => {
    if (paymentMethod === 'CASH' && receivedVal < finalTotal) {
        Alert.alert("ແຈ້ງເຕືອນ", "ເງິນທີ່ຮັບມາບໍ່ພຽງພໍ!");
        return;
    }

    const orderData = {
        items: cart,
        originalTotal: systemTotal,
        total: finalTotal,
        discount: discount > 0 ? discount : 0,
        currency,
        source: orderSource,
        paymentMethod,
        amountReceived: receivedVal,
        change: change,
        exchangeRateUsed: exchangeRate,
        date: orderDate.toISOString()
    };

    onCheckout(orderData);
    setLastOrderDetails(orderData);
    
    setCartVisible(false);
    setTimeout(() => setReceiptVisible(true), 500);
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <TouchableOpacity activeOpacity={0.8} onPress={() => addToCart(item)} style={styles.cardContent}>
        <View style={[styles.currencyTag, item.priceCurrency === 'THB' ? {backgroundColor: ORANGE_THEME} : {backgroundColor: COLORS.primary}]}>
            <Text style={styles.currencyText}>{item.priceCurrency || 'LAK'}</Text>
        </View>
        <Image source={item.imageUrl ? { uri: item.imageUrl } : { uri: 'https://via.placeholder.com/150' }} style={styles.productImage} />
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>{formatNumber(item.price)} {item.priceCurrency === 'THB' ? '฿' : '₭'}</Text>
            <TouchableOpacity style={styles.addBtnSmall} onPress={() => addToCart(item)}>
                <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ListHeaderComponent={
            <View>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#999" />
                    <TextInput style={styles.searchInput} placeholder="ຄົ້ນຫາສິນຄ້າ..." value={searchQuery} onChangeText={setSearchQuery} />
                </View>
                <View style={styles.actionButtons}>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.primary, marginRight: 10 }]} onPress={onOpenScan}><Ionicons name="qr-code-outline" size={20} color="white" /><Text style={styles.actionBtnText}>ສະແກນ</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.primary }]} onPress={onOpenAddProduct}><Ionicons name="add-circle-outline" size={20} color="white" /><Text style={styles.actionBtnText}>ເພີ່ມສິນຄ້າ</Text></TouchableOpacity>
                </View>
                <FlatList horizontal data={categories} keyExtractor={i => i} showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 15, marginBottom: 10}} renderItem={({item}) => (
                    <TouchableOpacity style={[styles.catChip, selectedCategory === item && styles.activeCatChip]} onPress={() => setSelectedCategory(item)}>
                        <Text style={[styles.catText, selectedCategory === item && styles.activeCatText]}>{item}</Text>
                    </TouchableOpacity>
                )} />
            </View>
        }
        data={filteredProducts} keyExtractor={item => item.id!} numColumns={2} contentContainerStyle={{ paddingBottom: 200 }} columnWrapperStyle={{ paddingHorizontal: 10 }} renderItem={renderProductItem}
      />

      {cart.length > 0 && (
        <TouchableOpacity style={styles.floatingCartBar} activeOpacity={0.9} onPress={() => setCartVisible(true)}>
            <View style={styles.cartIconWrapper}><Ionicons name="cart" size={24} color="white" /><View style={styles.badge}><Text style={styles.badgeText}>{cart.reduce((a,b)=>a+b.quantity,0)}</Text></View></View>
            <View style={styles.cartTextWrapper}><Text style={styles.cartTotalLabel}>ຍອດລວມ (ກີບ):</Text><Text style={styles.cartTotalValue}>{formatNumber(calculateBaseTotalLAK())} ₭</Text></View>
            <View style={styles.viewCartBtn}><Text style={styles.viewCartText}>ເບິ່ງກະຕ່າ</Text><Ionicons name="chevron-forward" size={16} color={COLORS.primary} /></View>
        </TouchableOpacity>
      )}

      {/* Cart Modal */}
      <Modal visible={isCartVisible} animationType="slide" transparent={true}>
        {/* 🟢 2. Wrap ດ້ວຍ TouchableWithoutFeedback ເພື່ອປິດຄີບອດເມື່ອກົດບ່ອນອື່ນ */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                style={styles.modalOverlay}
            >
                <View style={styles.modalContent}>
                    
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>ກະຕ່າສິນຄ້າ ({cart.length})</Text>
                        <TouchableOpacity onPress={() => setCartVisible(false)}>
                            <Ionicons name="close-circle" size={30} color="#ccc" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.toggleRow}>
                        <TouchableOpacity style={[styles.toggleBtn, orderSource === 'shop' ? {backgroundColor: COLORS.primary} : styles.inactiveBtn]} onPress={() => setOrderSource('shop')}>
                            <Text style={[styles.toggleText, orderSource === 'shop' ? {color:'white'} : {color:'#666'}]}>ໜ້າຮ້ານ</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.toggleBtn, orderSource === 'online' ? {backgroundColor: ORANGE_THEME} : styles.inactiveBtn]} onPress={() => setOrderSource('online')}>
                            <Text style={[styles.toggleText, orderSource === 'online' ? {color:'white'} : {color:'#666'}]}>Online</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.dateBadge} onPress={() => setShowDatePicker(true)}>
                            <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
                            <Text style={styles.dateText}>{orderDate.toLocaleDateString('en-GB')}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{flex: 1}}>
                        <FlatList 
                            data={cart}
                            keyExtractor={item => item.id!}
                            keyboardShouldPersistTaps="handled" // 🟢 ອະນຸຍາດໃຫ້ກົດປຸ່ມໄດ້ເຖິງວ່າຄີບອດຄ້າງຢູ່
                            renderItem={({item}) => (
                                <View style={styles.cartItem}>
                                    <Image source={item.imageUrl ? { uri: item.imageUrl } : { uri: 'https://via.placeholder.com/50' }} style={styles.itemThumb} />
                                    <View style={{flex: 1, marginLeft: 10}}>
                                        <Text style={styles.itemName}>{item.name}</Text>
                                        <Text style={styles.itemPrice}>{formatNumber(item.price)} {item.priceCurrency === 'THB' ? '฿' : '₭'}</Text>
                                    </View>
                                    <View style={styles.qtyBox}>
                                        <TouchableOpacity onPress={() => updateQuantity(item.id!, -1)}><Text style={styles.qtySign}>-</Text></TouchableOpacity>
                                        <Text style={styles.qtyVal}>{item.quantity}</Text>
                                        <TouchableOpacity onPress={() => updateQuantity(item.id!, 1)}><Text style={styles.qtySign}>+</Text></TouchableOpacity>
                                    </View>
                                    <TouchableOpacity onPress={() => removeFromCart(item.id!)} style={{marginLeft: 15}}>
                                        <Ionicons name="trash-outline" size={24} color={ORANGE_THEME} /> 
                                    </TouchableOpacity>
                                </View>
                            )}
                        />
                    </View>

                    <View style={styles.paymentSection}>
                        <View style={styles.currencyRow}>
                            <TouchableOpacity style={[styles.currencyBtn, currency === 'LAK' ? {backgroundColor: COLORS.primary} : styles.inactiveBorderBtn]} onPress={() => setCurrency('LAK')}>
                                <Text style={[styles.currencyBtnText, currency === 'LAK' ? {color:'white'} : {color: COLORS.primary}]}>₭ ເງິນກີບ</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.currencyBtn, currency === 'THB' ? {backgroundColor: ORANGE_THEME} : styles.inactiveBorderBtn]} onPress={() => setCurrency('THB')}>
                                <Text style={[styles.currencyBtnText, currency === 'THB' ? {color:'white'} : {color: ORANGE_THEME}]}>฿ ເງິນບາດ</Text>
                            </TouchableOpacity>
                        </View>

                        {/* 🟢 3. ຍອດຊຳລະ (ຍ້າຍ Rate ມາເບື້ອງຂວາ) */}
                        <View style={styles.totalDisplayRow}>
                            <Text style={styles.totalLabel}>ຍອດຕ້ອງຊຳລະ:</Text>
                            
                            <View style={{alignItems: 'flex-end'}}>
                                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                    <TextInput 
                                        style={[styles.totalInput, {color: currency === 'LAK' ? COLORS.primary : ORANGE_THEME}]}
                                        value={editableTotal}
                                        onChangeText={(text) => setEditableTotal(formatInputNumber(text))}
                                        keyboardType="number-pad"
                                        selectTextOnFocus={true} 
                                        returnKeyType="done" // 🟢 2. ເພີ່ມປຸ່ມ Done
                                    />
                                    <Text style={[styles.currencySuffix, {color: currency === 'LAK' ? COLORS.primary : ORANGE_THEME}]}>
                                        {currency === 'LAK' ? '₭' : '฿'}
                                    </Text>
                                    <Ionicons name="pencil" size={14} color="#ccc" style={{marginLeft: 5}} />
                                </View>
                                {/* 🟢 1. ຍ້າຍ Rate ມາຢູ່ກ້ອງນີ້ */}
                                {currency === 'THB' && (
                                    <Text style={{fontSize: 10, color: '#999', marginTop: 2}}>Rate: 1 ฿ = {formatNumber(exchangeRate)} ₭</Text>
                                )}
                            </View>
                        </View>

                        <View style={styles.methodRow}>
                            <TouchableOpacity style={[styles.methodBtn, paymentMethod === 'CASH' ? {borderColor: COLORS.primary, backgroundColor: '#E0F2F1'} : styles.inactiveMethod]} onPress={() => setPaymentMethod('CASH')}>
                                <Ionicons name="cash-outline" size={24} color={paymentMethod === 'CASH' ? COLORS.primary : '#999'} />
                                <Text style={[styles.methodText, paymentMethod === 'CASH' && {color: COLORS.primary}]}>ເງິນສົດ</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.methodBtn, paymentMethod === 'QR' ? {borderColor: ORANGE_THEME, backgroundColor: '#FFF3E0'} : styles.inactiveMethod]} onPress={() => setPaymentMethod('QR')}>
                                <Ionicons name="qr-code-outline" size={24} color={paymentMethod === 'QR' ? ORANGE_THEME : '#999'} />
                                <Text style={[styles.methodText, paymentMethod === 'QR' && {color: ORANGE_THEME}]}>QR</Text> 
                            </TouchableOpacity>
                        </View>

                        {paymentMethod === 'CASH' && (
                            <View style={styles.cashSection}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>ຮັບເງິນມາ:</Text>
                                    <TextInput 
                                        style={styles.cashInput} 
                                        keyboardType="number-pad" 
                                        placeholder="0" 
                                        value={amountReceived}
                                        onChangeText={(text) => setAmountReceived(formatInputNumber(text))} 
                                        selectTextOnFocus={true}
                                        returnKeyType="done" // 🟢 2. ເພີ່ມປຸ່ມ Done
                                    />
                                </View>
                                <View style={styles.changeGroup}>
                                    <Text style={styles.inputLabel}>ເງິນທອນ:</Text>
                                    <Text style={[styles.changeValue, change < 0 ? {color: ORANGE_THEME} : {color: COLORS.primary}]}>
                                        {formatNumber(change > 0 ? change : 0)} {currency === 'LAK' ? '₭' : '฿'}
                                    </Text>
                                </View>
                            </View>
                        )}

                        <TouchableOpacity 
                            style={[styles.payBigBtn, { backgroundColor: COLORS.primary }]} 
                            onPress={handlePayment}
                        >
                            <Text style={styles.payBigText}>{paymentMethod === 'QR' ? 'ຊຳລະເງິນ (QR)' : 'ຊຳລະເງິນ'}</Text>
                        </TouchableOpacity>
                    </View>

                    {showDatePicker && (
                        <View style={styles.embeddedDatePickerOverlay}>
                            <View style={styles.embeddedDatePicker}>
                                <Text style={{fontFamily: 'Lao-Bold', marginBottom: 10, textAlign:'center'}}>ເລືອກວັນທີ</Text>
                                <DateTimePicker 
                                    value={orderDate} 
                                    mode="date" 
                                    display="inline" 
                                    onChange={onDateChange}
                                    textColor="black"
                                    themeVariant="light"
                                    style={{backgroundColor: 'white'}}
                                />
                                <TouchableOpacity onPress={() => setShowDatePicker(false)} style={styles.closeDateBtn}>
                                    <Text style={styles.closeDateText}>ຕົກລົງ</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                </View>
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Receipt Modal */}
      <Modal visible={isReceiptVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={styles.receiptContainer}>
                <View style={styles.receiptHeader}>
                    <Ionicons name="checkmark-circle" size={60} color={COLORS.success} />
                    <Text style={styles.receiptTitle}>ຊຳລະເງິນສຳເລັດ!</Text>
                    <Text style={styles.receiptDate}>{new Date(lastOrderDetails?.date || new Date()).toLocaleString('lo-LA')}</Text>
                </View>
                
                <View style={styles.receiptBody}>
                    <View style={styles.receiptRow}><Text>ຍອດລວມ:</Text><Text style={styles.receiptValue}>{formatNumber(lastOrderDetails?.originalTotal)} {lastOrderDetails?.currency === 'THB' ? '฿' : '₭'}</Text></View>
                    {lastOrderDetails?.discount > 0 && (
                        <View style={styles.receiptRow}><Text style={{color:'red'}}>ສ່ວນຫຼຸດ:</Text><Text style={{color:'red'}}>-{formatNumber(lastOrderDetails?.discount)}</Text></View>
                    )}
                    <View style={[styles.receiptRow, {borderTopWidth:1, borderColor:'#eee', paddingTop:5}]}><Text style={{fontFamily:'Lao-Bold'}}>ຍອດສຸດທິ:</Text><Text style={{fontFamily:'Lao-Bold', fontSize:18}}>{formatNumber(lastOrderDetails?.total)} {lastOrderDetails?.currency === 'THB' ? '฿' : '₭'}</Text></View>
                    
                    <View style={styles.receiptRow}><Text>ຮັບເງິນ:</Text><Text style={styles.receiptValue}>{formatNumber(lastOrderDetails?.amountReceived)}</Text></View>
                    <View style={[styles.receiptRow, {borderTopWidth:1, borderTopColor:'#eee', paddingTop:10, marginTop:10}]}>
                        <Text style={{fontFamily:'Lao-Bold'}}>ເງິນທອນ:</Text>
                        <Text style={[styles.receiptValue, {color: COLORS.primary, fontSize: 20}]}>{formatNumber(lastOrderDetails?.change)}</Text>
                    </View>
                </View>

                <View style={styles.receiptActions}>
                    <TouchableOpacity style={styles.printBtn} onPress={() => { Alert.alert("Print", "Printing..."); setReceiptVisible(false); clearCart(); }}>
                        <Ionicons name="print" size={20} color="white" />
                        <Text style={styles.printText}>ພິມໃບບິນ</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.closeReceiptBtn} onPress={() => { setReceiptVisible(false); clearCart(); }}>
                        <Text style={styles.closeReceiptText}>ປິດ</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F9FA', position: 'relative' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', margin: 15, paddingHorizontal: 15, height: 50, borderRadius: 10, elevation: 2 },
  searchInput: { flex: 1, marginLeft: 10, fontFamily: 'Lao-Regular', fontSize: 16 },
  actionButtons: { flexDirection: 'row', paddingHorizontal: 15, marginBottom: 15 },
  actionBtn: { flex: 1, flexDirection: 'row', height: 45, borderRadius: 10, justifyContent: 'center', alignItems: 'center', gap: 8, elevation: 2 },
  actionBtnText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 14 },
  catChip: { paddingHorizontal: 20, paddingVertical: 8, backgroundColor: 'white', borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#eee' },
  activeCatChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catText: { fontFamily: 'Lao-Regular', color: '#666' },
  activeCatText: { color: 'white', fontFamily: 'Lao-Bold' },
  productCard: { width: '50%', padding: 5 },
  cardContent: { backgroundColor: 'white', borderRadius: 12, padding: 10, elevation: 2, alignItems: 'center' },
  productImage: { width: '100%', height: 120, borderRadius: 10, backgroundColor: '#f0f0f0', marginBottom: 10, resizeMode: 'cover' },
  productInfo: { width: '100%' },
  productName: { fontFamily: 'Lao-Bold', fontSize: 14, color: '#333', marginBottom: 5 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productPrice: { fontFamily: 'Lao-Bold', fontSize: 14, color: COLORS.primary },
  addBtnSmall: { backgroundColor: COLORS.primary, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  currencyTag: { position: 'absolute', top: 10, left: 10, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, zIndex: 1 },
  currencyText: { color: 'white', fontSize: 10, fontFamily: 'Lao-Bold' },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { fontFamily: 'Lao-Regular', color: '#999', marginTop: 10 },
  floatingCartBar: { position: 'absolute', bottom: 90, left: 15, right: 15, backgroundColor: '#333', borderRadius: 50, height: 60, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, elevation: 20, zIndex: 9999, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  cartIconWrapper: { position: 'relative', paddingRight: 15, borderRightWidth: 1, borderRightColor: '#555' },
  badge: { position: 'absolute', top: -5, right: 5, backgroundColor: COLORS.primary, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: 'white', fontSize: 10, fontFamily: 'Lao-Bold' },
  cartTextWrapper: { flex: 1, paddingLeft: 15 },
  cartTotalLabel: { color: '#ccc', fontSize: 10, fontFamily: 'Lao-Regular' },
  cartTotalValue: { color: 'white', fontSize: 16, fontFamily: 'Lao-Bold' },
  viewCartBtn: { backgroundColor: 'white', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 5 },
  viewCartText: { color: COLORS.primary, fontFamily: 'Lao-Bold', fontSize: 12 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#F5F9FA', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, height: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 20, fontFamily: 'Lao-Bold', color: '#333' },
  
  toggleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  toggleBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginRight: 10 },
  inactiveBtn: { backgroundColor: '#ddd' },
  toggleText: { fontFamily: 'Lao-Bold', fontSize: 14 },
  dateBadge: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'white', padding: 8, borderRadius: 10, borderWidth: 1, borderColor: COLORS.primary },
  dateText: { color: COLORS.primary, fontFamily: 'Lao-Bold', fontSize: 12 },

  itemThumb: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#eee' },
  itemName: { fontFamily: 'Lao-Bold', fontSize: 14, color: '#333' },
  itemPrice: { fontFamily: 'Lao-Regular', fontSize: 12, color: '#666' },
  qtyBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 8, paddingHorizontal: 5 },
  qtySign: { fontSize: 20, paddingHorizontal: 10, color: '#666' },
  qtyVal: { fontSize: 16, fontFamily: 'Lao-Bold', paddingHorizontal: 5 },
  cartItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 15 },

  divider: { height: 1, backgroundColor: '#ddd', marginVertical: 10 },
  
  paymentSection: { marginTop: 10, paddingBottom: 20 },
  currencyRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  currencyBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  inactiveBorderBtn: { borderWidth: 1, borderColor: '#ccc', backgroundColor: 'white' },
  currencyBtnText: { fontFamily: 'Lao-Bold', fontSize: 16 },

  totalDisplayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  totalLabel: { fontSize: 16, fontFamily: 'Lao-Regular', color: '#666' },
  totalValue: { fontSize: 24, fontFamily: 'Lao-Bold' },
  totalInput: { fontSize: 24, fontFamily: 'Lao-Bold', textAlign: 'right', minWidth: 100 },
  currencySuffix: { fontSize: 20, fontFamily: 'Lao-Bold', marginLeft: 5 },

  methodRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  methodBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#eee', backgroundColor: 'white' },
  inactiveMethod: { backgroundColor: 'white', borderColor: '#eee' },
  methodText: { fontFamily: 'Lao-Bold', fontSize: 16, color: '#999' },

  cashSection: { marginBottom: 20 },
  inputGroup: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  inputLabel: { fontSize: 16, fontFamily: 'Lao-Regular', color: '#333' },
  cashInput: { backgroundColor: 'white', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, width: 150, padding: 10, textAlign: 'right', fontSize: 18, fontFamily: 'Lao-Bold' },
  changeGroup: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0f0f0', padding: 15, borderRadius: 10 },
  changeValue: { fontSize: 20, fontFamily: 'Lao-Bold' },

  payBigBtn: { padding: 18, borderRadius: 15, alignItems: 'center', elevation: 3, marginBottom: 20 },
  payBigText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 20 },

  embeddedDatePickerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  embeddedDatePicker: { backgroundColor: 'white', padding: 20, borderRadius: 15, width: '90%', alignItems: 'center' },
  closeDateBtn: { marginTop: 15, padding: 10, backgroundColor: '#f0f0f0', borderRadius: 10, width: '100%', alignItems: 'center' },
  closeDateText: { fontFamily: 'Lao-Bold', color: COLORS.primary },

  receiptContainer: { width: '85%', backgroundColor: 'white', borderRadius: 20, padding: 25, alignItems: 'center', alignSelf: 'center', marginTop: 'auto', marginBottom: 'auto', elevation: 10 },
  receiptHeader: { alignItems: 'center', marginBottom: 20 },
  receiptTitle: { fontSize: 22, fontFamily: 'Lao-Bold', color: COLORS.success, marginTop: 10 },
  receiptDate: { color: '#999', fontSize: 12 },
  receiptBody: { width: '100%', marginBottom: 20 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  receiptValue: { fontFamily: 'Lao-Bold', fontSize: 16 },
  receiptActions: { flexDirection: 'row', gap: 10, width: '100%' },
  printBtn: { flex: 1, backgroundColor: COLORS.primary, padding: 12, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 },
  printText: { color: 'white', fontFamily: 'Lao-Bold' },
  closeReceiptBtn: { flex: 1, backgroundColor: '#f0f0f0', padding: 12, borderRadius: 10, alignItems: 'center' },
  closeReceiptText: { color: '#333', fontFamily: 'Lao-Bold' }
});