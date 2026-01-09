import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFonts } from 'expo-font';
import * as ImagePicker from 'expo-image-picker';
import { get, onValue, push, ref, remove, update } from 'firebase/database';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Dimensions, Easing, FlatList, Image, KeyboardAvoidingView, Modal, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, Vibration, View } from 'react-native';
import { db } from '../../src/firebase';

interface Product {
  id?: string;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
  priceCurrency?: 'LAK' | 'THB';
  barcode?: string;
}

interface CartItem extends Product {
  quantity: number;
  id: string;
}

interface SaleRecord {
    id: string;
    date: string;
    total: number;
    items: CartItem[];
    currency: 'LAK' | 'THB';
    paymentMethod: 'CASH' | 'QR';
    amountReceived?: number;
    change?: number;
}

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const CARD_WIDTH = (width / COLUMN_COUNT) - 20; 
const SIDEBAR_WIDTH = width * 0.75;

// 🎨 Theme Colors (ກັບມາໃຊ້ສີຂຽວ/ສົ້ມ ທີ່ເຈົ້າມັກ)
const COLORS = {
  primary: '#4DB6AC',    // ຂຽວພາສເທວ (Header/Footer)
  primaryDark: '#009688', // ຂຽວເຂັ້ມ
  secondary: '#FFB74D',  // ສີສົ້ມ (Buttons/Highlights)
  secondaryDark: '#F57C00', 
  background: '#F0F4F4', 
  cardBg: '#FFFFFF',
  text: '#424242',
  textLight: '#757575',
  danger: '#EF5350',
  success: '#66BB6A',
  blue: '#42A5F5',
  white: '#FFFFFF'
};

const formatNumber = (num: number | string) => {
  if (!num && num !== 0) return '';
  const parts = num.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join('.');
};

const formatDate = (dateString: string | Date) => {
  const date = new Date(dateString);
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};

export default function App() {
  const [fontsLoaded] = useFonts({
    'Lao-Bold': require('../../assets/fonts/NotoSansLao-Bold.ttf'),
    'Lao-Regular': require('../../assets/fonts/NotoSansLao-Regular.ttf'),
  });

  const [permission, requestPermission] = useCameraPermissions();

  const [products, setProducts] = useState<Product[]>([]);
  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  
  const [currentTab, setCurrentTab] = useState<'home' | 'pos' | 'expense' | 'report'>('pos'); 

  const [scanMode, setScanMode] = useState<'sell' | 'edit'>('sell');
  const [saleSource, setSaleSource] = useState<'ໜ້າຮ້ານ' | 'Online'>('ໜ້າຮ້ານ');
  const [paymentCurrency, setPaymentCurrency] = useState<'LAK' | 'THB'>('LAK');
  const [manualTotal, setManualTotal] = useState<string>(''); 
  const [discount, setDiscount] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(700);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QR'>('CASH');
  const [amountReceived, setAmountReceived] = useState<string>(''); 

  const [productModalVisible, setProductModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product>({
      name: '', price: 0, stock: 0, priceCurrency: 'LAK', imageUrl: '', barcode: ''
  });

  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

  useEffect(() => {
    const productsRef = ref(db, 'products');
    const unsubscribe = onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const productList = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setProducts(productList as Product[]);
      } else { setProducts([]); }
      setLoading(false);
    });

    const salesRef = ref(db, 'sales');
    const unsubscribeSales = onValue(salesRef, (snapshot) => {
        if(snapshot.exists()){
            const data = snapshot.val();
            const salesList = Object.keys(data).map(key => ({ id: key, ...data[key] }));
            setSalesHistory(salesList.reverse() as SaleRecord[]);
        } else { setSalesHistory([]); }
    });

    const settingsRef = ref(db, 'settings');
    get(settingsRef).then((snapshot) => {
        if(snapshot.exists()) {
            const data = snapshot.val();
            if (data.exchangeRateTHB) setExchangeRate(Number(data.exchangeRateTHB));
        }
    });

    return () => { unsubscribe(); unsubscribeSales(); };
  }, []);

  const calculateTotalInCurrency = (targetCurrency: 'LAK' | 'THB') => {
    let total = 0;
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        if (item.priceCurrency !== 'THB') {
            if (targetCurrency === 'LAK') total += itemTotal; else total += itemTotal / exchangeRate;
        } else {
            if (targetCurrency === 'THB') total += itemTotal; else total += itemTotal * exchangeRate;
        }
    });
    return targetCurrency === 'LAK' ? Math.round(total) : parseFloat(total.toFixed(2));
  };

  useEffect(() => {
    if (modalVisible) {
        const total = calculateTotalInCurrency(paymentCurrency);
        setManualTotal(total.toString()); setDiscount(0); setSelectedDate(new Date()); setShowDatePicker(false); setAmountReceived(''); setPaymentMethod('CASH'); 
    }
  }, [cart, modalVisible, paymentCurrency]);

  const handleCurrencyChange = (currency: 'LAK' | 'THB') => { setPaymentCurrency(currency); };
  const handleManualTotalChange = (text: string) => {
    const cleanText = text.replace(/,/g, ''); setManualTotal(cleanText);
    const newTotal = parseFloat(cleanText) || 0;
    const originalSubtotal = calculateTotalInCurrency(paymentCurrency);
    setDiscount(originalSubtotal - newTotal);
  };
  const onChangeDate = (event: any, selected: Date | undefined) => { if (Platform.OS === 'android') setShowDatePicker(false); if (selected) setSelectedDate(selected); };
  const toggleDatePicker = () => setShowDatePicker(!showDatePicker);

  const openScanner = async (mode: 'sell' | 'edit' = 'sell') => {
    if (!permission?.granted) { const { granted } = await requestPermission(); if (!granted) { Alert.alert('ຕ້ອງການສິດ', 'ກະລຸນາອະນຸຍາດໃຫ້ໃຊ້ກ້ອງ'); return; } }
    setScanMode(mode);
    if (mode === 'edit') { setProductModalVisible(false); setTimeout(() => { setIsScanning(true); setScanned(false); }, 300); } else { setIsScanning(true); setScanned(false); }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return; setScanned(true); Vibration.vibrate();
    if (scanMode === 'edit') { setEditingProduct({ ...editingProduct, barcode: data }); setIsScanning(false); setTimeout(() => { setProductModalVisible(true); }, 300); return; }
    const product = products.find(p => p.barcode === data);
    if (product) { addToCart(product); Alert.alert('✅ ເພີ່ມສິນຄ້າແລ້ວ', `${product.name}`, [{ text: 'ສະແກນຕໍ່', onPress: () => setScanned(false) }, { text: 'ປິດ', onPress: () => setIsScanning(false) }]); } 
    else { Alert.alert('❌ ບໍ່ພົບສິນຄ້າ', `Barcode: ${data}`, [{ text: 'ລອງໃໝ່', onPress: () => setScanned(false) }, { text: 'ປິດ', onPress: () => setIsScanning(false) }]); }
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) { Alert.alert('ສິນຄ້າໝົດ'); return; }
    setCart(prev => { const existing = prev.find(item => item.id === product.id!); if (existing) { if (existing.quantity >= product.stock) return prev; return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item); } return [...prev, { ...product, quantity: 1 } as CartItem]; });
  };
  const removeFromCart = (id: string) => { setCart(prev => prev.filter(item => item.id !== id)); };
  const updateQuantity = (id: string, delta: number) => { setCart(prev => prev.map(item => { if (item.id === id) { const product = products.find(p => p.id === id); const maxStock = product ? product.stock : item.quantity; const newQty = Math.max(1, Math.min(maxStock, item.quantity + delta)); return { ...item, quantity: newQty }; } return item; })); };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const finalTotal = parseFloat(manualTotal.replace(/,/g, '')) || 0;
    const received = parseFloat(amountReceived.replace(/,/g, '')) || 0;
    if (paymentMethod === 'CASH' && received < finalTotal) { Alert.alert('ເງິນບໍ່ພໍ', `ຍັງຂາດ ${formatNumber(finalTotal - received)}`); return; }
    try {
      const subTotal = calculateTotalInCurrency(paymentCurrency);
      const orderData = { items: cart, subTotal, discount, total: finalTotal, amountReceived: paymentMethod === 'CASH' ? received : finalTotal, change: paymentMethod === 'CASH' ? received - finalTotal : 0, currency: paymentCurrency, paymentMethod, source: saleSource, date: selectedDate.toISOString(), status: 'ສຳເລັດ', createdAt: new Date().toISOString() };
      await push(ref(db, 'sales'), orderData);
      const updates: any = {};
      cart.forEach(item => { const product = products.find(p => p.id === item.id); if (product) updates[`products/${item.id}/stock`] = product.stock - item.quantity; });
      await update(ref(db), updates);
      Alert.alert('✅ ສຳເລັດ', 'ຂາຍສິນຄ້າຮຽບຮ້ອຍແລ້ວ'); setCart([]); setModalVisible(false);
    } catch (error) { Alert.alert('Error', 'ເກີດຂໍ້ຜິດພາດ'); }
  };

  const openAddProductModal = () => { setEditingProduct({ name: '', price: 0, stock: 1, priceCurrency: 'LAK', imageUrl: '', barcode: '' }); setProductModalVisible(true); };
  const openEditProductModal = (product: Product) => { setEditingProduct({ ...product }); setProductModalVisible(true); };
  const pickImage = async () => { let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true }); if (!result.canceled) { const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`; setEditingProduct({ ...editingProduct, imageUrl: base64Img }); } };
  const saveProduct = async () => { if (!editingProduct.name || !editingProduct.price) { Alert.alert('ຂໍ້ມູນບໍ່ຄົບ'); return; } try { if (editingProduct.id) { await update(ref(db, `products/${editingProduct.id}`), editingProduct); Alert.alert('ສຳເລັດ', 'ແກ້ໄຂແລ້ວ'); } else { await push(ref(db, `products`), editingProduct); Alert.alert('ສຳເລັດ', 'ເພີ່ມສິນຄ້າແລ້ວ'); } setProductModalVisible(false); } catch (error) { Alert.alert('Error', 'ບັນທຶກບໍ່ໄດ້'); } };
  const deleteProduct = (id: string) => { Alert.alert('ຢືນຢັນ', 'ລຶບສິນຄ້ານີ້ບໍ່?', [{ text: 'ຍົກເລີກ', style: 'cancel' }, { text: 'ລຶບ', style: 'destructive', onPress: async () => { try { await remove(ref(db, `products/${id}`)); } catch(e) { Alert.alert('Error'); } } }]); };
  const deleteSale = (id: string) => { Alert.alert('ຢືນຢັນ', 'ລຶບລາຍການນີ້ບໍ່?', [{ text: 'ຍົກເລີກ', style: 'cancel' }, { text: 'ລຶບ', style: 'destructive', onPress: async () => { try { await remove(ref(db, `sales/${id}`)); } catch(e) { Alert.alert('Error'); } } }]); };

  const toggleMenu = (show: boolean) => {
    if (show) { setMenuVisible(true); Animated.timing(slideAnim, { toValue: 0, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }).start(); } 
    else { Animated.timing(slideAnim, { toValue: -SIDEBAR_WIDTH, duration: 300, easing: Easing.in(Easing.ease), useNativeDriver: true }).start(() => setMenuVisible(false)); }
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalLAK = cart.filter(i => i.priceCurrency !== 'THB').reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const totalTHB = cart.filter(i => i.priceCurrency === 'THB').reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const finalTotalCalc = parseFloat(manualTotal.replace(/,/g, '')) || 0;
  const receivedCalc = parseFloat(amountReceived.replace(/,/g, '')) || 0;
  const changeCalc = receivedCalc - finalTotalCalc;

  if (!fontsLoaded || loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  const renderContent = () => {
    switch (currentTab) {
        case 'home':
            return (
                <ScrollView style={styles.contentContainer}>
                    <View style={styles.dashboardCard}>
                        <Text style={styles.dashLabel}>ຍອດຂາຍມື້ນີ້</Text>
                        <Text style={styles.dashValue}>{formatNumber(salesHistory.reduce((sum, s) => sum + s.total, 0))} ກີບ</Text>
                    </View>
                    <View style={[styles.dashboardCard, {backgroundColor: COLORS.secondary}]}>
                        <Text style={styles.dashLabel}>ຈຳນວນບິນ</Text>
                        <Text style={styles.dashValue}>{salesHistory.length} ບິນ</Text>
                    </View>
                    <View style={[styles.dashboardCard, {backgroundColor: COLORS.blue}]}>
                        <Text style={styles.dashLabel}>ສິນຄ້າຄົງເຫຼືອ</Text>
                        <Text style={styles.dashValue}>{products.reduce((sum, p) => sum + p.stock, 0)} ລາຍການ</Text>
                    </View>
                </ScrollView>
            );
        case 'pos':
            return (
                <View style={{flex: 1}}>
                    <View style={styles.toolsBar}>
                        <TouchableOpacity style={styles.toolBtn} onPress={() => openScanner('sell')}>
                            <Ionicons name="barcode-outline" size={24} color="white" />
                            <Text style={styles.toolText}>ສະແກນ</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.toolBtn} onPress={openAddProductModal}>
                            <Ionicons name="add-circle-outline" size={24} color="white" />
                            <Text style={styles.toolText}>ເພີ່ມສິນຄ້າ</Text>
                        </TouchableOpacity>
                    </View>

                    <FlatList 
                        key="pos-grid"
                        data={products}
                        keyExtractor={item => item.id!}
                        numColumns={COLUMN_COUNT}
                        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 10 }}
                        contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.card} onPress={() => addToCart(item)} onLongPress={() => openEditProductModal(item)} activeOpacity={0.8}>
                                <View style={styles.imageContainer}>
                                    {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.productImage} resizeMode="cover" /> : <View style={styles.imagePlaceholder}><Text style={styles.placeholderText}>{item.name.charAt(0)}</Text></View>}
                                    <View style={[styles.currencyBadge, { backgroundColor: item.priceCurrency === 'THB' ? COLORS.secondary : COLORS.primary }]}><Text style={styles.currencyText}>{item.priceCurrency || 'LAK'}</Text></View>
                                    {item.stock <= 5 && <View style={styles.stockBadge}><Text style={styles.stockText}>{item.stock}</Text></View>}
                                </View>
                                <View style={styles.cardContent}>
                                    <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
                                    <Text style={[styles.price, { color: item.priceCurrency === 'THB' ? COLORS.secondaryDark : COLORS.primaryDark }]}>{formatNumber(item.price)} {item.priceCurrency === 'THB' ? '฿' : '₭'}</Text>
                                </View>
                                <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}><Ionicons name="add" size={24} color="white" /></TouchableOpacity>
                            </TouchableOpacity>
                        )}
                    />
                    
                    {cart.length > 0 && (
                        <TouchableOpacity style={styles.floatingCart} onPress={() => setModalVisible(true)}>
                            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                <View style={styles.cartBadge}><Text style={{color:'white', fontWeight:'bold'}}>{totalItems}</Text></View>
                                <Text style={{color:'white', fontFamily:'Lao-Bold', fontSize: 16, marginLeft: 10}}>ເບິ່ງກະຕ່າ</Text>
                            </View>
                            <Text style={{color:'white', fontFamily:'Lao-Bold', fontSize: 18}}>{formatNumber(totalLAK)} ₭</Text>
                        </TouchableOpacity>
                    )}
                </View>
            );
        case 'expense':
            return (
                <View style={styles.center}>
                    <Ionicons name="wallet-outline" size={60} color="#ccc" />
                    <Text style={{color: '#888', marginTop: 10, fontFamily: 'Lao-Regular'}}>ໜ້າລາຍຈ່າຍ (ກຳລັງພັດທະນາ)</Text>
                </View>
            );
        case 'report':
            return (
                <FlatList key="report-list" data={salesHistory} keyExtractor={item => item.id} contentContainerStyle={{padding: 10, paddingBottom: 100}}
                    renderItem={({item}) => (
                        <View style={styles.historyItem}>
                            <View style={{flex: 1}}>
                                <Text style={styles.historyDate}>{formatDate(item.date)}</Text>
                                <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 5}}>
                                    <View style={[styles.paymentBadge, {backgroundColor: item.paymentMethod === 'QR' ? COLORS.blue : COLORS.success}]}>
                                        <Text style={styles.paymentBadgeText}>{item.paymentMethod === 'QR' ? '📲 QR' : '💵 ເງິນສົດ'}</Text>
                                    </View>
                                    <Text style={styles.historyItems}> {item.items.length} ລາຍການ</Text>
                                </View>
                            </View>
                            <View style={{alignItems: 'flex-end'}}>
                                <Text style={styles.historyTotal}>{formatNumber(item.total)} {item.currency === 'THB' ? '฿' : '₭'}</Text>
                                {item.paymentMethod === 'CASH' && item.change && item.change > 0 ? (
                                    <Text style={{fontSize: 10, color: COLORS.success}}>ທອນ: {formatNumber(item.change)}</Text>
                                ) : null}
                                <TouchableOpacity onPress={() => deleteSale(item.id)}><Text style={{color: COLORS.danger, fontSize: 12, fontFamily: 'Lao-Regular', marginTop: 5}}>ລຶບ</Text></TouchableOpacity>
                            </View>
                        </View>
                    )}
                />
            );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.topHeader}>
          <Text style={styles.appName}>Soudaphone POS</Text>
          <View style={{flexDirection: 'row', gap: 15}}>
             <Ionicons name="notifications-outline" size={24} color="white" />
             <Ionicons name="menu" size={24} color="white" onPress={() => toggleMenu(true)} />
          </View>
      </View>

      {/* Profile Section */}
      <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
             <Text style={styles.avatarText}>S</Text>
          </View>
          <View style={{justifyContent: 'center'}}>
              <Text style={styles.shopName}>ຮ້ານ ສຸດາພອນ</Text>
              <Text style={styles.shopId}>ID: 8888 9999</Text>
          </View>
          <TouchableOpacity style={styles.editProfileBtn}>
              <Text style={{fontSize: 12, color: '#666'}}>ແກ້ໄຂ</Text>
          </TouchableOpacity>
      </View>

      <View style={{flex: 1, backgroundColor: '#f2f2f2'}}>
          {renderContent()}
      </View>

      {/* Footer Navigation */}
      <View style={styles.footer}>
          <TouchableOpacity style={styles.navBtn} onPress={() => setCurrentTab('home')}>
              <Ionicons name="home" size={24} color={currentTab === 'home' ? COLORS.white : '#E0F2F1'} />
              <Text style={[styles.navText, currentTab === 'home' && styles.navTextActive]}>ໜ້າຫຼັກ</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navBtn} onPress={() => setCurrentTab('pos')}>
              <View style={styles.navIconCircle}>
                 <Ionicons name="cart" size={28} color={COLORS.primary} />
              </View>
              <Text style={[styles.navText, currentTab === 'pos' && styles.navTextActive]}>ຂາຍສິນຄ້າ</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navBtn} onPress={() => setCurrentTab('expense')}>
              <Ionicons name="wallet" size={24} color={currentTab === 'expense' ? COLORS.white : '#E0F2F1'} />
              <Text style={[styles.navText, currentTab === 'expense' && styles.navTextActive]}>ລາຍຈ່າຍ</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navBtn} onPress={() => setCurrentTab('report')}>
              <Ionicons name="bar-chart" size={24} color={currentTab === 'report' ? COLORS.white : '#E0F2F1'} />
              <Text style={[styles.navText, currentTab === 'report' && styles.navTextActive]}>ລາຍງານ</Text>
          </TouchableOpacity>
      </View>

      {/* Modals */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>ກະຕ່າສິນຄ້າ</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close-circle" size={30} color="#ccc" /></TouchableOpacity>
                </View>
                <View style={{flexDirection: 'row', gap: 10, marginBottom: 15}}>
                    <View style={styles.sourceContainer}>
                        <TouchableOpacity style={[styles.sourceBtn, saleSource === 'ໜ້າຮ້ານ' && styles.sourceBtnActive]} onPress={() => setSaleSource('ໜ້າຮ້ານ')}><Ionicons name="storefront" size={16} color={saleSource === 'ໜ້າຮ້ານ' ? 'white' : COLORS.textLight} /><Text style={[styles.sourceText, saleSource === 'ໜ້າຮ້ານ' && styles.sourceTextActive]}>ໜ້າຮ້ານ</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.sourceBtn, saleSource === 'Online' && styles.sourceBtnActive]} onPress={() => setSaleSource('Online')}><Ionicons name="globe" size={16} color={saleSource === 'Online' ? 'white' : COLORS.textLight} /><Text style={[styles.sourceText, saleSource === 'Online' && styles.sourceTextActive]}>Online</Text></TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.datePickerBtn} onPress={toggleDatePicker}><Ionicons name="calendar" size={18} color={COLORS.primaryDark} /><Text style={styles.dateText}>{formatDate(selectedDate)}</Text></TouchableOpacity>
                </View>
                {showDatePicker && (
                    <View style={{marginBottom: 15, alignItems: 'center', backgroundColor: COLORS.secondary, borderRadius: 12, padding: 10, overflow: 'hidden'}}>
                        <DateTimePicker testID="dateTimePicker" value={selectedDate} mode="date" display={Platform.OS === 'ios' ? 'inline' : 'default'} onChange={onChangeDate} textColor="black" themeVariant="light" accentColor="white" style={Platform.OS === 'ios' ? { width: width - 80, backgroundColor: COLORS.secondary } : undefined} />
                        {Platform.OS === 'ios' && (<TouchableOpacity onPress={() => setShowDatePicker(false)} style={{marginTop: 5, padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 20}}><Text style={{color: 'white', fontWeight: 'bold'}}>ປິດປະຕິທິນ</Text></TouchableOpacity>)}
                    </View>
                )}
                <ScrollView style={styles.modalBody}>
                    {cart.map(item => (
                        <View key={item.id} style={styles.cartItem}>
                            {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.cartItemImage} /> : <View style={[styles.cartItemImage, {backgroundColor: '#eee'}]} />}
                            <View style={{flex: 1, paddingHorizontal: 10}}>
                                <Text style={styles.cartItemName} numberOfLines={1}>{item.name}</Text>
                                <Text style={[styles.cartItemPrice, { color: item.priceCurrency === 'THB' ? COLORS.secondaryDark : COLORS.primaryDark }]}>{formatNumber(item.price)} {item.priceCurrency === 'THB' ? '฿' : '₭'}</Text>
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
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                            <Text style={styles.totalLabel}>ຍອດຕ້ອງຊຳລະ:</Text>
                            <View style={styles.currencyToggle}>
                                <TouchableOpacity onPress={() => handleCurrencyChange('LAK')} style={[styles.currencyBtn, paymentCurrency === 'LAK' && {backgroundColor: COLORS.primary}]}>
                                    <Text style={[styles.currencyBtnText, paymentCurrency === 'LAK' && {color: 'white'}]}>₭</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleCurrencyChange('THB')} style={[styles.currencyBtn, paymentCurrency === 'THB' && {backgroundColor: COLORS.secondary}]}>
                                    <Text style={[styles.currencyBtnText, paymentCurrency === 'THB' && {color: 'white'}]}>฿</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <TextInput style={[styles.totalInput, { color: paymentCurrency === 'THB' ? COLORS.secondaryDark : COLORS.primaryDark }]} value={formatNumber(manualTotal)} onChangeText={handleManualTotalChange} keyboardType="numeric" selectTextOnFocus returnKeyType="done" />
                    </View>
                    {discount !== 0 && (<View style={{flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10}}><Text style={{color: COLORS.danger, fontSize: 12, fontFamily: 'Lao-Regular'}}>ສ່ວນຫຼຸດ: {formatNumber(discount)} {paymentCurrency === 'THB' ? '฿' : '₭'}</Text></View>)}
                    {paymentMethod === 'CASH' && (
                        <View style={styles.cashContainer}>
                            <View style={{flex: 1}}>
                                <Text style={styles.cashLabel}>ຮັບເງິນມາ:</Text>
                                <TextInput style={styles.cashInput} placeholder="0" keyboardType="numeric" value={formatNumber(amountReceived)} onChangeText={(t) => setAmountReceived(t.replace(/,/g, ''))} />
                            </View>
                            <View style={{flex: 1, alignItems: 'flex-end'}}>
                                <Text style={styles.cashLabel}>ເງິນທອນ:</Text>
                                <Text style={[styles.changeText, changeCalc < 0 ? {color: COLORS.danger} : {color: COLORS.success}]}>{formatNumber(changeCalc < 0 ? 0 : changeCalc)}</Text>
                            </View>
                        </View>
                    )}
                    <TouchableOpacity style={styles.confirmBtn} onPress={handleCheckout}><Text style={styles.confirmBtnText}>ຢືນຢັນຮັບເງິນ ({formatNumber(manualTotal || 0)})</Text></TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal animationType="slide" transparent={true} visible={productModalVisible} onRequestClose={() => setProductModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{editingProduct.id ? 'ແກ້ໄຂສິນຄ້າ' : 'ເພີ່ມສິນຄ້າໃໝ່'}</Text>
                    <TouchableOpacity onPress={() => setProductModalVisible(false)}><Ionicons name="close-circle" size={30} color="#ccc" /></TouchableOpacity>
                </View>
                <ScrollView>
                    <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                        {editingProduct.imageUrl ? (
                            <Image source={{ uri: editingProduct.imageUrl }} style={{ width: 100, height: 100, borderRadius: 10 }} />
                        ) : (
                            <View style={{ alignItems: 'center' }}>
                                <Ionicons name="camera-outline" size={40} color="#ccc" />
                                <Text style={{ color: '#aaa', fontSize: 12 }}>ເລືອກຮູບ</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <Text style={styles.label}>ຊື່ສິນຄ້າ</Text>
                    <TextInput style={styles.input} value={editingProduct.name} onChangeText={(t) => setEditingProduct({ ...editingProduct, name: t })} placeholder="ໃສ່ຊື່ສິນຄ້າ..." />

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>ລາຄາ</Text>
                            <TextInput style={styles.input} value={formatNumber(editingProduct.price)} onChangeText={(t) => setEditingProduct({ ...editingProduct, price: parseFloat(t.replace(/,/g, '')) || 0 })} keyboardType="numeric" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>ສະກຸນເງິນ</Text>
                            <View style={{ flexDirection: 'row', height: 50, backgroundColor: '#f5f5f5', borderRadius: 8, alignItems: 'center', padding: 5 }}>
                                <TouchableOpacity onPress={() => setEditingProduct({ ...editingProduct, priceCurrency: 'LAK' })} style={{ flex: 1, alignItems: 'center', backgroundColor: editingProduct.priceCurrency === 'LAK' ? COLORS.primary : 'transparent', borderRadius: 6, paddingVertical: 8 }}>
                                    <Text style={{ color: editingProduct.priceCurrency === 'LAK' ? 'white' : '#888', fontWeight: 'bold' }}>₭</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setEditingProduct({ ...editingProduct, priceCurrency: 'THB' })} style={{ flex: 1, alignItems: 'center', backgroundColor: editingProduct.priceCurrency === 'THB' ? COLORS.secondary : 'transparent', borderRadius: 6, paddingVertical: 8 }}>
                                    <Text style={{ color: editingProduct.priceCurrency === 'THB' ? 'white' : '#888', fontWeight: 'bold' }}>฿</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>ຈຳນວນສະຕັອກ</Text>
                            <TextInput style={styles.input} value={formatNumber(editingProduct.stock)} onChangeText={(t) => setEditingProduct({ ...editingProduct, stock: parseInt(t.replace(/,/g, '')) || 0 })} keyboardType="numeric" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>ບາໂຄດ</Text>
                            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                <TextInput style={[styles.input, {flex: 1, marginBottom: 0}]} value={editingProduct.barcode || ''} onChangeText={(t) => setEditingProduct({ ...editingProduct, barcode: t })} placeholder="Scan..." />
                                <TouchableOpacity onPress={() => openScanner('edit')} style={{padding: 10, backgroundColor: COLORS.secondary, borderRadius: 8, marginLeft: 5}}>
                                    <Ionicons name="barcode-outline" size={24} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity style={[styles.confirmBtn, { marginTop: 20 }]} onPress={saveProduct}>
                        <Text style={styles.confirmBtnText}>ບັນທຶກ</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal animationType="slide" visible={isScanning} onRequestClose={() => setIsScanning(false)}>
        <View style={styles.scannerContainer}>
            <CameraView style={StyleSheet.absoluteFillObject} facing="back" onBarcodeScanned={scanned ? undefined : handleBarCodeScanned} barcodeScannerSettings={{ barcodeTypes: ["qr", "ean13", "ean8", "code128"], }} />
            <View style={styles.scannerOverlay}>
                <View style={styles.scannerHeader}>
                    <Text style={styles.scannerTitle}>ສະແກນບາໂຄດ</Text>
                    <TouchableOpacity onPress={() => { setIsScanning(false); }} style={styles.closeScannerBtn}><Ionicons name="close" size={30} color="white" /></TouchableOpacity>
                </View>
                <View style={styles.scanFrame} />
                <Text style={styles.scanInstruction}>ວາງບາໂຄດໃຫ້ຢູ່ໃນກອບ</Text>
            </View>
        </View>
      </Modal>

      {/* Sidebar Menu */}
      {menuVisible && (
        <View style={styles.sidebarOverlay}>
            <TouchableOpacity style={{flex: 1}} onPress={() => toggleMenu(false)} activeOpacity={1} />
            <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
                <View style={styles.sidebarHeader}>
                    <View style={styles.avatar}><Text style={{color: 'white', fontSize: 24, fontFamily: 'Lao-Bold'}}>S</Text></View>
                    <Text style={styles.sidebarTitle}>Soudaphone POS</Text>
                    <Text style={styles.sidebarSubtitle}>Admin</Text>
                </View>
                <ScrollView style={styles.menuContainer}>
                    <TouchableOpacity style={[styles.menuItem, currentTab === 'home' && styles.menuActive]} onPress={() => { setCurrentTab('home'); toggleMenu(false); }}><Ionicons name="home-outline" size={24} color={currentTab === 'home' ? COLORS.primaryDark : COLORS.text} /><Text style={[styles.menuText, currentTab === 'home' && styles.menuTextActive]}>ໜ້າຫຼັກ</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.menuItem, currentTab === 'pos' && styles.menuActive]} onPress={() => { setCurrentTab('pos'); toggleMenu(false); }}><Ionicons name="cart-outline" size={24} color={currentTab === 'pos' ? COLORS.primaryDark : COLORS.text} /><Text style={[styles.menuText, currentTab === 'pos' && styles.menuTextActive]}>ຂາຍສິນຄ້າ</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.menuItem, currentTab === 'report' && styles.menuActive]} onPress={() => { setCurrentTab('report'); toggleMenu(false); }}><Ionicons name="bar-chart-outline" size={24} color={currentTab === 'report' ? COLORS.primaryDark : COLORS.text} /><Text style={[styles.menuText, currentTab === 'report' && styles.menuTextActive]}>ລາຍງານ</Text></TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Info', 'Version 1.0.0')}><Ionicons name="settings-outline" size={24} color={COLORS.text} /><Text style={styles.menuText}>ຕັ້ງຄ່າ</Text></TouchableOpacity>
                </ScrollView>
            </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Header
  topHeader: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  appName: { color: 'white', fontSize: 20, fontFamily: 'Lao-Bold' },
  
  // Profile Section
  profileSection: { backgroundColor: 'white', padding: 15, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' },
  avatarContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', marginRight: 15, overflow: 'hidden' },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary },
  shopName: { fontSize: 16, fontFamily: 'Lao-Bold', color: '#333' },
  shopId: { fontSize: 14, color: '#666', fontFamily: 'Lao-Regular' },
  editProfileBtn: { position: 'absolute', right: 20, backgroundColor: '#f0f0f0', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20 },

  // Footer Navigation
  footer: { flexDirection: 'row', backgroundColor: COLORS.primary, height: 70, alignItems: 'center', justifyContent: 'space-around', paddingBottom: 10 },
  navBtn: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  navText: { color: '#E0F2F1', fontSize: 10, marginTop: 4, fontFamily: 'Lao-Regular' }, // ສີເທົາອ່ອນ ຫຼື ຂາວຈາງໆ
  navTextActive: { color: 'white', fontFamily: 'Lao-Bold' },
  navIconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', marginTop: -20, elevation: 5, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 3 },

  // Tools Bar (In POS)
  toolsBar: { flexDirection: 'row', padding: 10, gap: 10 },
  toolBtn: { flexDirection: 'row', backgroundColor: COLORS.secondary, padding: 10, borderRadius: 8, alignItems: 'center', gap: 5 },
  toolText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 12 },

  // Dashboard
  contentContainer: { padding: 15 },
  dashboardCard: { padding: 20, backgroundColor: COLORS.primary, borderRadius: 15, marginBottom: 15, alignItems: 'center' },
  dashLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontFamily: 'Lao-Regular', marginBottom: 5 },
  dashValue: { color: 'white', fontSize: 24, fontFamily: 'Lao-Bold' },

  // Floating Cart
  floatingCart: { position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: '#333', borderRadius: 50, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 10 },
  cartBadge: { backgroundColor: 'red', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

  // Standard Styles
  card: { width: CARD_WIDTH, backgroundColor: 'white', marginBottom: 15, borderRadius: 16, overflow: 'hidden', elevation: 2, shadowColor: COLORS.primary, shadowOpacity: 0.1, shadowRadius: 5 },
  imageContainer: { height: 130, width: '100%', backgroundColor: '#f0f0f0', position: 'relative' },
  productImage: { width: '100%', height: '100%' },
  imagePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 30, color: '#ccc', fontFamily: 'Lao-Bold' },
  currencyBadge: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  currencyText: { color: 'white', fontSize: 10, fontFamily: 'Lao-Bold' },
  stockBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: COLORS.danger, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  stockText: { color: 'white', fontSize: 10, fontFamily: 'Lao-Bold' },
  cardContent: { padding: 12 },
  title: { fontSize: 14, color: '#333', marginBottom: 4, fontFamily: 'Lao-Regular' },
  price: { fontSize: 16, fontFamily: 'Lao-Bold' },
  addBtn: { position: 'absolute', bottom: 10, right: 10, backgroundColor: COLORS.secondary, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 2, elevation: 3 },
  
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: 'white', marginBottom: 10, borderRadius: 10, elevation: 1 },
  historyDate: { fontFamily: 'Lao-Bold', fontSize: 14, color: '#333' },
  historyItems: { fontFamily: 'Lao-Regular', fontSize: 12, color: '#888', marginLeft: 5 },
  historyTotal: { fontFamily: 'Lao-Bold', fontSize: 16, color: COLORS.primaryDark },
  paymentBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  paymentBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  
  inventoryItem: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: 'white', marginBottom: 10, borderRadius: 10, elevation: 1 },
  invImage: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#eee' },
  invName: { fontFamily: 'Lao-Regular', fontSize: 14, color: '#333', marginBottom: 2 },
  invPrice: { fontFamily: 'Lao-Bold', fontSize: 12, color: COLORS.primaryDark },
  invStock: { fontFamily: 'Lao-Bold', fontSize: 16, color: COLORS.primary },
  fab: { position: 'absolute', bottom: 90, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 3 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 25, borderTopRightRadius: 25, height: '90%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 20, color: '#333', fontFamily: 'Lao-Bold' },
  modalBody: { flex: 1 },
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
  modalFooter: { borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 20 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  totalLabel: { fontSize: 16, color: '#888', fontFamily: 'Lao-Regular' },
  totalInput: { fontSize: 24, fontFamily: 'Lao-Bold', borderBottomWidth: 1, borderBottomColor: '#ddd', minWidth: 100, textAlign: 'right', paddingVertical: 0 },
  currencyToggle: { flexDirection: 'row', gap: 5 },
  currencyBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  currencyBtnText: { fontFamily: 'Lao-Bold', fontSize: 12, color: '#888' },
  confirmBtn: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 15, alignItems: 'center' },
  confirmBtnText: { color: 'white', fontSize: 18, fontFamily: 'Lao-Bold' },
  
  paymentMethodContainer: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  paymentMethodBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#eee', gap: 5 },
  paymentMethodActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  paymentMethodText: { fontFamily: 'Lao-Bold', fontSize: 14, color: COLORS.text },
  cashContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, padding: 10, backgroundColor: '#f9f9f9', borderRadius: 10 },
  cashLabel: { fontFamily: 'Lao-Regular', fontSize: 12, color: '#888', marginBottom: 5 },
  cashInput: { fontSize: 20, fontFamily: 'Lao-Bold', color: '#333', borderBottomWidth: 1, borderBottomColor: '#ddd', minWidth: 100, paddingVertical: 0 },
  changeText: { fontSize: 20, fontFamily: 'Lao-Bold' },

  scannerContainer: { flex: 1, backgroundColor: 'black' },
  scannerOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  scannerHeader: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scannerTitle: { color: 'white', fontSize: 20, fontFamily: 'Lao-Bold' },
  closeScannerBtn: { padding: 5 },
  scanFrame: { width: 250, height: 250, borderWidth: 2, borderColor: COLORS.secondary, borderRadius: 20, backgroundColor: 'transparent' },
  scanInstruction: { color: 'white', marginTop: 20, fontFamily: 'Lao-Regular' },

  // Edit Product Styles
  imagePicker: { width: 100, height: 100, backgroundColor: '#f0f0f0', borderRadius: 10, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 20 },
  label: { fontSize: 14, color: '#666', marginBottom: 5, fontFamily: 'Lao-Regular' },
  input: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, marginBottom: 15, fontFamily: 'Lao-Regular', fontSize: 16 },
  
  // Sidebar Styles
  sidebarOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, flexDirection: 'row' },
  sidebar: { width: SIDEBAR_WIDTH, backgroundColor: 'white', height: '100%', paddingTop: 50, shadowColor: '#000', shadowOffset: { width: 2, height: 0 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  sidebarHeader: { paddingHorizontal: 20, marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 20 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  sidebarTitle: { fontSize: 18, fontFamily: 'Lao-Bold', color: '#333' },
  sidebarSubtitle: { fontSize: 14, fontFamily: 'Lao-Regular', color: '#888' },
  menuContainer: { flex: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20 },
  menuActive: { backgroundColor: '#F0F4F4', borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  menuText: { fontSize: 16, fontFamily: 'Lao-Regular', marginLeft: 15, color: '#666' },
  menuTextActive: { color: COLORS.primaryDark, fontFamily: 'Lao-Bold' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 10 },
});