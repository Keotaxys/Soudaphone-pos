import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { CartItem, COLORS, formatNumber, Product } from '../../types';

const { width, height } = Dimensions.get('window');
const ORANGE_COLOR = '#EF6C00'; // ສີສົ້ມເຂັ້ມສຳລັບ Online/QR/THB

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
  
  // Cart & Payment State
  const [isCartVisible, setCartVisible] = useState(false);
  const [orderSource, setOrderSource] = useState<'shop' | 'online'>('shop');
  const [currency, setCurrency] = useState<'LAK' | 'THB'>('LAK');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QR'>('CASH');
  const [amountReceived, setAmountReceived] = useState(''); // ເງິນຮັບມາ
  const [exchangeRate] = useState(680); // ອັດຕາແລກປ່ຽນສົມມຸດ (ປັບໄດ້)

  // Receipt Modal State
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

  // Calculations
  const totalAmountLAK = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalAmountTHB = Math.ceil(totalAmountLAK / exchangeRate); // ຄຳນວນເງິນບາດ
  const displayTotal = currency === 'LAK' ? totalAmountLAK : totalAmountTHB;
  
  // Logic ເງິນທອນ
  const receivedVal = parseFloat(amountReceived.replace(/,/g, '')) || 0;
  const change = receivedVal - displayTotal;

  const handlePayment = () => {
    if (paymentMethod === 'CASH' && receivedVal < displayTotal) {
        Alert.alert("ແຈ້ງເຕືອນ", "ເງິນທີ່ຮັບມາບໍ່ພຽງພໍ!");
        return;
    }

    const orderData = {
        items: cart,
        total: totalAmountLAK,
        currency,
        source: orderSource,
        paymentMethod,
        amountReceived: currency === 'LAK' ? receivedVal : receivedVal * exchangeRate,
        change: currency === 'LAK' ? change : change * exchangeRate,
        date: new Date().toISOString()
    };

    // ບັນທຶກລົງ Firebase
    onCheckout(orderData);
    
    // ເກັບຂໍ້ມູນເພື່ອໂຊໃບບິນ
    setLastOrderDetails(orderData);
    
    // ປິດກະຕ່າ ແລ້ວເປີດໃບບິນ
    setCartVisible(false);
    setTimeout(() => setReceiptVisible(true), 500);
    setAmountReceived('');
  };

  // --- Render Item ---
  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <TouchableOpacity activeOpacity={0.8} onPress={() => addToCart(item)} style={styles.cardContent}>
        <View style={[styles.currencyTag, item.priceCurrency === 'THB' ? {backgroundColor: '#FF9800'} : {backgroundColor: COLORS.primary}]}>
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
      {/* ... (Search, Header, List ເໝືອນເດີມ) ... */}
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
            <View style={styles.cartTextWrapper}><Text style={styles.cartTotalLabel}>ຍອດລວມ:</Text><Text style={styles.cartTotalValue}>{formatNumber(totalAmountLAK)} ₭</Text></View>
            <View style={styles.viewCartBtn}><Text style={styles.viewCartText}>ເບິ່ງກະຕ່າ</Text><Ionicons name="chevron-forward" size={16} color={COLORS.primary} /></View>
        </TouchableOpacity>
      )}

      {/* 🟢 Cart Modal (ແກ້ໄຂຕາມຮູບ) */}
      <Modal visible={isCartVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                
                {/* Header */}
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>ກະຕ່າສິນຄ້າ ({cart.length})</Text>
                    <TouchableOpacity onPress={() => setCartVisible(false)}>
                        <Ionicons name="close-circle" size={30} color="#ccc" />
                    </TouchableOpacity>
                </View>

                {/* 1. Source Toggle (Shop/Online) */}
                <View style={styles.toggleRow}>
                    <TouchableOpacity style={[styles.toggleBtn, orderSource === 'shop' ? {backgroundColor: COLORS.primary} : styles.inactiveBtn]} onPress={() => setOrderSource('shop')}>
                        <Text style={[styles.toggleText, orderSource === 'shop' ? {color:'white'} : {color:'#666'}]}>ໜ້າຮ້ານ</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.toggleBtn, orderSource === 'online' ? {backgroundColor: ORANGE_COLOR} : styles.inactiveBtn]} onPress={() => setOrderSource('online')}>
                        <Text style={[styles.toggleText, orderSource === 'online' ? {color:'white'} : {color:'#666'}]}>Online</Text>
                    </TouchableOpacity>
                    
                    {/* Date Display */}
                    <View style={styles.dateBadge}>
                        <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
                        <Text style={styles.dateText}>{new Date().toLocaleDateString('en-GB')}</Text>
                    </View>
                </View>

                {/* List Items */}
                <View style={{height: 200}}>
                    <FlatList 
                        data={cart}
                        keyExtractor={item => item.id!}
                        renderItem={({item}) => (
                            <View style={styles.cartItem}>
                                <Image source={item.imageUrl ? { uri: item.imageUrl } : { uri: 'https://via.placeholder.com/50' }} style={styles.itemThumb} />
                                <View style={{flex: 1, marginLeft: 10}}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    <Text style={styles.itemPrice}>{formatNumber(item.price)} ₭</Text>
                                </View>
                                <View style={styles.qtyBox}>
                                    <TouchableOpacity onPress={() => updateQuantity(item.id!, -1)}><Text style={styles.qtySign}>-</Text></TouchableOpacity>
                                    <Text style={styles.qtyVal}>{item.quantity}</Text>
                                    <TouchableOpacity onPress={() => updateQuantity(item.id!, 1)}><Text style={styles.qtySign}>+</Text></TouchableOpacity>
                                </View>
                                <TouchableOpacity onPress={() => removeFromCart(item.id!)} style={{marginLeft: 15}}>
                                    <Ionicons name="trash-outline" size={24} color={ORANGE_COLOR} /> 
                                </TouchableOpacity>
                            </View>
                        )}
                    />
                </View>

                <View style={styles.divider} />

                {/* 2. Currency Toggle */}
                <View style={styles.currencyRow}>
                    <TouchableOpacity style={[styles.currencyBtn, currency === 'LAK' ? {backgroundColor: COLORS.primary} : styles.inactiveBorderBtn]} onPress={() => setCurrency('LAK')}>
                        <Text style={[styles.currencyBtnText, currency === 'LAK' ? {color:'white'} : {color: COLORS.primary}]}>₭ ເງິນກີບ</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.currencyBtn, currency === 'THB' ? {backgroundColor: ORANGE_COLOR} : styles.inactiveBorderBtn]} onPress={() => setCurrency('THB')}>
                        <Text style={[styles.currencyBtnText, currency === 'THB' ? {color:'white'} : {color: ORANGE_COLOR}]}>฿ ເງິນບາດ</Text>
                    </TouchableOpacity>
                </View>

                {/* Total Display */}
                <View style={styles.totalDisplayRow}>
                    <Text style={styles.totalLabel}>ຍອດຕ້ອງຊຳລະ:</Text>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Text style={[styles.totalValue, {color: currency === 'LAK' ? COLORS.primary : ORANGE_COLOR}]}>
                            {formatNumber(displayTotal)} {currency === 'LAK' ? '₭' : '฿'}
                        </Text>
                        <Ionicons name="pencil" size={16} color="#999" style={{marginLeft: 5}} />
                    </View>
                </View>

                {/* 3. Payment Method Toggle */}
                <View style={styles.methodRow}>
                    <TouchableOpacity style={[styles.methodBtn, paymentMethod === 'CASH' ? {borderColor: COLORS.primary, backgroundColor: '#E0F2F1'} : styles.inactiveMethod]} onPress={() => setPaymentMethod('CASH')}>
                        <Ionicons name="cash-outline" size={24} color={paymentMethod === 'CASH' ? COLORS.primary : '#999'} />
                        <Text style={[styles.methodText, paymentMethod === 'CASH' && {color: COLORS.primary}]}>ເງິນສົດ</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.methodBtn, paymentMethod === 'QR' ? {borderColor: ORANGE_COLOR, backgroundColor: '#FFF3E0'} : styles.inactiveMethod]} onPress={() => setPaymentMethod('QR')}>
                        <Ionicons name="qr-code-outline" size={24} color={paymentMethod === 'QR' ? ORANGE_COLOR : '#999'} />
                        <Text style={[styles.methodText, paymentMethod === 'QR' && {color: ORANGE_COLOR}]}>QR OnePay</Text>
                    </TouchableOpacity>
                </View>

                {/* 4. Cash Input (Show only if Cash) */}
                {paymentMethod === 'CASH' && (
                    <View style={styles.cashSection}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>ຮັບເງິນມາ:</Text>
                            <TextInput 
                                style={styles.cashInput} 
                                keyboardType="number-pad" 
                                placeholder="0" 
                                value={amountReceived}
                                onChangeText={setAmountReceived}
                            />
                        </View>
                        <View style={styles.changeGroup}>
                            <Text style={styles.inputLabel}>ເງິນທອນ:</Text>
                            <Text style={[styles.changeValue, change < 0 ? {color:'red'} : {color: COLORS.success}]}>
                                {formatNumber(change > 0 ? change : 0)} {currency === 'LAK' ? '₭' : '฿'}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Pay Button */}
                <TouchableOpacity 
                    style={[styles.payBigBtn, { backgroundColor: (orderSource === 'online' || paymentMethod === 'QR' || currency === 'THB') ? ORANGE_COLOR : COLORS.primary }]}
                    onPress={handlePayment}
                >
                    <Text style={styles.payBigText}>{paymentMethod === 'QR' ? 'ຊຳລະເງິນ (QR)' : 'ຊຳລະເງິນ'}</Text>
                </TouchableOpacity>

            </View>
        </View>
      </Modal>

      {/* 🟢 Receipt Modal (ໃບບິນ) */}
      <Modal visible={isReceiptVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={styles.receiptContainer}>
                <View style={styles.receiptHeader}>
                    <Ionicons name="checkmark-circle" size={60} color={COLORS.success} />
                    <Text style={styles.receiptTitle}>ຊຳລະເງິນສຳເລັດ!</Text>
                    <Text style={styles.receiptDate}>{new Date().toLocaleString('lo-LA')}</Text>
                </View>
                
                <View style={styles.receiptBody}>
                    <View style={styles.receiptRow}><Text>ຍອດລວມ:</Text><Text style={styles.receiptValue}>{formatNumber(lastOrderDetails?.total)} ₭</Text></View>
                    <View style={styles.receiptRow}><Text>ຮັບເງິນ:</Text><Text style={styles.receiptValue}>{formatNumber(lastOrderDetails?.amountReceived)} {lastOrderDetails?.currency === 'THB' ? '฿' : '₭'}</Text></View>
                    <View style={[styles.receiptRow, {borderTopWidth:1, borderTopColor:'#eee', paddingTop:10, marginTop:10}]}>
                        <Text style={{fontFamily:'Lao-Bold'}}>ເງິນທອນ:</Text>
                        <Text style={[styles.receiptValue, {color: COLORS.primary, fontSize: 20}]}>{formatNumber(lastOrderDetails?.change)} {lastOrderDetails?.currency === 'THB' ? '฿' : '₭'}</Text>
                    </View>
                </View>

                <View style={styles.receiptActions}>
                    <TouchableOpacity style={styles.printBtn} onPress={() => { Alert.alert("Print", "Connecting to printer..."); setReceiptVisible(false); clearCart(); }}>
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

  // 🟢 Modal Overlay Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#F5F9FA', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, height: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontFamily: 'Lao-Bold', color: '#333' },
  
  toggleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
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
  
  divider: { height: 1, backgroundColor: '#ddd', marginVertical: 15 },
  
  currencyRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  currencyBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  inactiveBorderBtn: { borderWidth: 1, borderColor: '#ccc', backgroundColor: 'white' },
  currencyBtnText: { fontFamily: 'Lao-Bold', fontSize: 16 },

  totalDisplayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  totalLabel: { fontSize: 16, fontFamily: 'Lao-Regular', color: '#666' },
  totalValue: { fontSize: 24, fontFamily: 'Lao-Bold' },

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

  payBigBtn: { padding: 18, borderRadius: 15, alignItems: 'center', elevation: 3 },
  payBigText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 20 },

  // Receipt Modal
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