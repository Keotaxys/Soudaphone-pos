import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CameraView, useCameraPermissions } from 'expo-camera'; // 🟢 1. Import Camera
import { useFonts } from 'expo-font';
import { get, onValue, push, ref, update } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, KeyboardAvoidingView, Modal, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, Vibration, View } from 'react-native';
import { db } from '../../src/firebase';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
  priceCurrency?: 'LAK' | 'THB';
  barcode?: string; // 🟢 ເພີ່ມ Barcode field
}

interface CartItem extends Product {
  quantity: number;
}

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const CARD_WIDTH = (width / COLUMN_COUNT) - 20; 

// 🎨 Theme Colors
const COLORS = {
  primary: '#4DB6AC',    
  primaryDark: '#009688', 
  secondary: '#FFB74D',  
  secondaryDark: '#F57C00', 
  background: '#F0F4F4', 
  cardBg: '#FFFFFF',
  text: '#424242',
  textLight: '#757575',
  danger: '#EF5350'
};

const formatNumber = (num: number | string) => {
  if (!num && num !== 0) return '';
  const parts = num.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join('.');
};

const formatDate = (date: Date) => {
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

  // 🟢 Camera Permission Hook
  const [permission, requestPermission] = useCameraPermissions();

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  
  // 🟢 State ສຳລັບກ້ອງ
  const [isScanning, setIsScanning] = useState(false);
  const [scanned, setScanned] = useState(false);

  const [saleSource, setSaleSource] = useState<'ໜ້າຮ້ານ' | 'Online'>('ໜ້າຮ້ານ');
  const [paymentCurrency, setPaymentCurrency] = useState<'LAK' | 'THB'>('LAK');
  const [manualTotal, setManualTotal] = useState<string>(''); 
  const [discount, setDiscount] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(700);
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const productsRef = ref(db, 'products');
    const unsubscribe = onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const productList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setProducts(productList as Product[]);
      } else {
        setProducts([]);
      }
      setLoading(false);
    });

    const settingsRef = ref(db, 'settings');
    get(settingsRef).then((snapshot) => {
        if(snapshot.exists()) {
            const data = snapshot.val();
            if (data.exchangeRateTHB) {
                setExchangeRate(Number(data.exchangeRateTHB));
            }
        }
    });

    return () => unsubscribe();
  }, []);

  const calculateTotalInCurrency = (targetCurrency: 'LAK' | 'THB') => {
    let total = 0;
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        if (item.priceCurrency !== 'THB') {
            if (targetCurrency === 'LAK') total += itemTotal;
            else total += itemTotal / exchangeRate;
        } else {
            if (targetCurrency === 'THB') total += itemTotal;
            else total += itemTotal * exchangeRate;
        }
    });
    return targetCurrency === 'LAK' ? Math.round(total) : parseFloat(total.toFixed(2));
  };

  useEffect(() => {
    if (modalVisible) {
        const total = calculateTotalInCurrency(paymentCurrency);
        setManualTotal(total.toString()); 
        setDiscount(0);
        setSelectedDate(new Date()); 
        setShowDatePicker(false);
    }
  }, [cart, modalVisible, paymentCurrency]);

  const handleCurrencyChange = (currency: 'LAK' | 'THB') => {
      setPaymentCurrency(currency);
  };

  const handleManualTotalChange = (text: string) => {
    const cleanText = text.replace(/,/g, '');
    setManualTotal(cleanText);
    const newTotal = parseFloat(cleanText) || 0;
    const originalSubtotal = calculateTotalInCurrency(paymentCurrency);
    setDiscount(originalSubtotal - newTotal);
  };

  const onChangeDate = (event: any, selected: Date | undefined) => {
    if (Platform.OS === 'android') {
        setShowDatePicker(false);
    }
    if (selected) {
        setSelectedDate(selected);
    }
  };

  const toggleDatePicker = () => {
      setShowDatePicker(!showDatePicker);
  };

  // 🟢 ຟັງຊັນເປີດກ້ອງ
  const openScanner = async () => {
    if (!permission?.granted) {
        const { granted } = await requestPermission();
        if (!granted) {
            Alert.alert('ຕ້ອງການສິດ', 'ກະລຸນາອະນຸຍາດໃຫ້ໃຊ້ກ້ອງຖ່າຍຮູບ');
            return;
        }
    }
    setIsScanning(true);
    setScanned(false);
  };

  // 🟢 ຟັງຊັນເມື່ອສະແກນເຈິ
  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    Vibration.vibrate(); // ສັ່ນເຕືອນຕຶດ!

    const product = products.find(p => p.barcode === data);
    
    if (product) {
        addToCart(product);
        Alert.alert(
            '✅ ເພີ່ມສິນຄ້າແລ້ວ', 
            `${product.name}\nລາຄາ: ${formatNumber(product.price)}`,
            [{ text: 'ສະແກນຕໍ່', onPress: () => setScanned(false) }, { text: 'ປິດ', onPress: () => setIsScanning(false) }]
        );
    } else {
        Alert.alert(
            '❌ ບໍ່ພົບສິນຄ້າ', 
            `ລະຫັດບາໂຄດ: ${data} ບໍ່ມີໃນລະບົບ`,
            [{ text: 'ລອງໃໝ່', onPress: () => setScanned(false) }, { text: 'ປິດ', onPress: () => setIsScanning(false) }]
        );
    }
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      Alert.alert('ສິນຄ້າໝົດ', 'ບໍ່ມີໃນສະຕັອກ');
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
            // ຖ້າເປັນການສະແກນ ບໍ່ຕ້ອງເຕືອນຊ້ຳໆ ກໍລະນີສິນຄ້າໝົດ
            return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const product = products.find(p => p.id === id);
        const maxStock = product ? product.stock : item.quantity;
        const newQty = Math.max(1, Math.min(maxStock, item.quantity + delta));
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      const finalTotal = parseFloat(manualTotal.replace(/,/g, '')) || 0;
      const subTotal = calculateTotalInCurrency(paymentCurrency);

      const orderData = {
        items: cart,
        subTotal: subTotal,
        discount: discount,
        total: finalTotal,
        currency: paymentCurrency, 
        source: saleSource,       
        date: selectedDate.toISOString(), 
        status: 'ສຳເລັດ',
        createdAt: new Date().toISOString()
      };

      await push(ref(db, 'sales'), orderData);

      const updates: any = {};
      cart.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (product) updates[`products/${item.id}/stock`] = product.stock - item.quantity;
      });
      await update(ref(db), updates);

      Alert.alert('✅ ສຳເລັດ', 'ຂາຍສິນຄ້າຮຽບຮ້ອຍແລ້ວ');
      setCart([]);
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'ເກີດຂໍ້ຜິດພາດ');
    }
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalLAK = cart.filter(i => i.priceCurrency !== 'THB').reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const totalTHB = cart.filter(i => i.priceCurrency === 'THB').reduce((sum, i) => sum + (i.price * i.quantity), 0);

  if (!fontsLoaded || loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Soudaphone POS</Text>
        <View style={{flexDirection: 'row', gap: 10}}>
            {/* 🟢 ປຸ່ມສະແກນບາໂຄດ */}
            <TouchableOpacity style={styles.iconBtn} onPress={openScanner}>
                <Ionicons name="barcode-outline" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}><Ionicons name="search" size={24} color={COLORS.text} /></TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={products}
        keyExtractor={item => item.id}
        numColumns={COLUMN_COUNT}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 10 }}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => addToCart(item)} activeOpacity={0.8}>
            <View style={styles.imageContainer}>
                {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.productImage} resizeMode="cover" />
                ) : (
                    <View style={styles.imagePlaceholder}><Text style={styles.placeholderText}>{item.name.charAt(0)}</Text></View>
                )}
                <View style={[styles.currencyBadge, { backgroundColor: item.priceCurrency === 'THB' ? COLORS.secondary : COLORS.primary }]}>
                    <Text style={styles.currencyText}>{item.priceCurrency || 'LAK'}</Text>
                </View>
                {item.stock <= 5 && <View style={styles.stockBadge}><Text style={styles.stockText}>{item.stock}</Text></View>}
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.price, { color: item.priceCurrency === 'THB' ? COLORS.secondaryDark : COLORS.primaryDark }]}>
                    {formatNumber(item.price)} {item.priceCurrency === 'THB' ? '฿' : '₭'}
                </Text>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}>
                <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      {cart.length > 0 && (
        <TouchableOpacity style={styles.bottomBar} onPress={() => setModalVisible(true)} activeOpacity={0.9}>
            <View style={styles.cartIconBadge}>
                <Ionicons name="cart" size={28} color="white" />
                <View style={styles.badge}><Text style={styles.badgeText}>{totalItems}</Text></View>
            </View>
            <View style={{flex: 1, marginLeft: 15}}>
                <Text style={styles.cartInfo}>ຍອດລວມທັງໝົດ</Text>
                <View style={{flexDirection: 'row', gap: 10}}>
                    {totalLAK > 0 && <Text style={styles.cartTotal}>{formatNumber(totalLAK)} ₭</Text>}
                    {totalTHB > 0 && <Text style={styles.cartTotal}>{formatNumber(totalTHB)} ฿</Text>}
                </View>
            </View>
            <View style={styles.viewCartBtn}>
                <Text style={styles.viewCartText}>ເບິ່ງກະຕ່າ</Text>
                <Ionicons name="chevron-up" size={20} color={COLORS.primaryDark} />
            </View>
        </TouchableOpacity>
      )}

      {/* Cart Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={styles.modalOverlay}
        >
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>ກະຕ່າສິນຄ້າ</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                        <Ionicons name="close-circle" size={30} color="#ccc" />
                    </TouchableOpacity>
                </View>

                <View style={{flexDirection: 'row', gap: 10, marginBottom: 15}}>
                    <View style={styles.sourceContainer}>
                        <TouchableOpacity 
                            style={[styles.sourceBtn, saleSource === 'ໜ້າຮ້ານ' && styles.sourceBtnActive]}
                            onPress={() => setSaleSource('ໜ້າຮ້ານ')}
                        >
                            <Ionicons name="storefront" size={16} color={saleSource === 'ໜ້າຮ້ານ' ? 'white' : COLORS.textLight} />
                            <Text style={[styles.sourceText, saleSource === 'ໜ້າຮ້ານ' && styles.sourceTextActive]}>ໜ້າຮ້ານ</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.sourceBtn, saleSource === 'Online' && styles.sourceBtnActive]}
                            onPress={() => setSaleSource('Online')}
                        >
                            <Ionicons name="globe" size={16} color={saleSource === 'Online' ? 'white' : COLORS.textLight} />
                            <Text style={[styles.sourceText, saleSource === 'Online' && styles.sourceTextActive]}>Online</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.datePickerBtn} onPress={toggleDatePicker}>
                        <Ionicons name="calendar" size={18} color={COLORS.primaryDark} />
                        <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
                    </TouchableOpacity>
                </View>

                {showDatePicker && (
                    <View style={{marginBottom: 15, alignItems: 'center', backgroundColor: COLORS.secondary, borderRadius: 12, padding: 10, overflow: 'hidden'}}>
                        <DateTimePicker
                            testID="dateTimePicker"
                            value={selectedDate}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'inline' : 'default'}
                            onChange={onChangeDate}
                            textColor="black"
                            themeVariant="light"
                            accentColor="white"
                            style={Platform.OS === 'ios' ? { width: width - 80, backgroundColor: COLORS.secondary } : undefined} 
                        />
                        {Platform.OS === 'ios' && (
                            <TouchableOpacity onPress={() => setShowDatePicker(false)} style={{marginTop: 5, padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 20}}>
                                <Text style={{color: 'white', fontWeight: 'bold'}}>ປິດປະຕິທິນ</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                <ScrollView style={styles.modalBody}>
                    {cart.map(item => (
                        <View key={item.id} style={styles.cartItem}>
                            {item.imageUrl ? (
                                <Image source={{ uri: item.imageUrl }} style={styles.cartItemImage} />
                            ) : (
                                <View style={[styles.cartItemImage, {backgroundColor: '#eee'}]} />
                            )}
                            <View style={{flex: 1, paddingHorizontal: 10}}>
                                <Text style={styles.cartItemName} numberOfLines={1}>{item.name}</Text>
                                <Text style={[styles.cartItemPrice, { color: item.priceCurrency === 'THB' ? COLORS.secondaryDark : COLORS.primaryDark }]}>
                                    {formatNumber(item.price)} {item.priceCurrency === 'THB' ? '฿' : '₭'}
                                </Text>
                            </View>
                            <View style={styles.qtyControls}>
                                <TouchableOpacity onPress={() => updateQuantity(item.id, -1)} style={styles.qtyBtn}><Ionicons name="remove" size={16} color="#555" /></TouchableOpacity>
                                <Text style={styles.qtyText}>{item.quantity}</Text>
                                <TouchableOpacity onPress={() => updateQuantity(item.id, 1)} style={styles.qtyBtn}><Ionicons name="add" size={16} color="#555" /></TouchableOpacity>
                            </View>
                            <TouchableOpacity onPress={() => removeFromCart(item.id)} style={{marginLeft: 10}}>
                                <Ionicons name="trash-outline" size={22} color={COLORS.danger} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>

                <View style={styles.modalFooter}>
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
                        
                        <TextInput 
                            style={[styles.totalInput, { color: paymentCurrency === 'THB' ? COLORS.secondaryDark : COLORS.primaryDark }]}
                            value={formatNumber(manualTotal)} 
                            onChangeText={handleManualTotalChange}
                            keyboardType="numeric"
                            selectTextOnFocus
                            returnKeyType="done"
                        />
                    </View>
                    
                    {discount !== 0 && (
                        <View style={{flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10}}>
                            <Text style={{color: COLORS.danger, fontSize: 12, fontFamily: 'Lao-Regular'}}>
                                ສ່ວນຫຼຸດ: {formatNumber(discount)} {paymentCurrency === 'THB' ? '฿' : '₭'}
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity style={styles.confirmBtn} onPress={handleCheckout}>
                        <Text style={styles.confirmBtnText}>
                            ຢືນຢັນຮັບເງິນ ({formatNumber(manualTotal || 0)})
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 🟢 Camera Scanner Modal */}
      <Modal animationType="slide" visible={isScanning} onRequestClose={() => setIsScanning(false)}>
        <View style={styles.scannerContainer}>
            <CameraView 
                style={StyleSheet.absoluteFillObject}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr", "ean13", "ean8", "code128"],
                }}
            />
            {/* Overlay */}
            <View style={styles.scannerOverlay}>
                <View style={styles.scannerHeader}>
                    <Text style={styles.scannerTitle}>ສະແກນບາໂຄດ</Text>
                    <TouchableOpacity onPress={() => setIsScanning(false)} style={styles.closeScannerBtn}>
                        <Ionicons name="close" size={30} color="white" />
                    </TouchableOpacity>
                </View>
                <View style={styles.scanFrame} />
                <Text style={styles.scanInstruction}>ວາງບາໂຄດໃຫ້ຢູ່ໃນກອບ</Text>
            </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    padding: 15, backgroundColor: 'white', marginTop: 30,
    borderBottomWidth: 1, borderBottomColor: '#E0E0E0'
  },
  headerTitle: { fontSize: 22, color: COLORS.primaryDark, fontFamily: 'Lao-Bold' }, 
  iconBtn: { padding: 5, marginLeft: 10 },
  card: { 
    width: CARD_WIDTH, backgroundColor: 'white', marginBottom: 15, 
    borderRadius: 16, overflow: 'hidden', elevation: 2, 
    shadowColor: COLORS.primary, shadowOpacity: 0.1, shadowRadius: 5 
  },
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
  addBtn: { 
    position: 'absolute', bottom: 10, right: 10, 
    backgroundColor: COLORS.secondary, 
    width: 36, height: 36, borderRadius: 18, 
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 2, elevation: 3
  },
  bottomBar: { 
    position: 'absolute', bottom: 20, left: 15, right: 15, 
    backgroundColor: COLORS.primaryDark, 
    borderRadius: 20, padding: 15, flexDirection: 'row', alignItems: 'center', 
    elevation: 10, shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 10 
  },
  cartIconBadge: { position: 'relative' },
  badge: { 
    position: 'absolute', top: -5, right: -5, 
    backgroundColor: COLORS.secondary, 
    width: 20, height: 20, borderRadius: 10, 
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.primaryDark 
  },
  badgeText: { color: 'white', fontSize: 10, fontFamily: 'Lao-Bold' },
  cartInfo: { color: '#E0F2F1', fontSize: 10, textTransform: 'uppercase', fontFamily: 'Lao-Regular' },
  cartTotal: { color: 'white', fontSize: 16, fontFamily: 'Lao-Bold' },
  viewCartBtn: { 
    backgroundColor: 'white', paddingHorizontal: 15, paddingVertical: 8, 
    borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 5 
  },
  viewCartText: { color: COLORS.primaryDark, fontSize: 12, fontFamily: 'Lao-Bold' },
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
  totalInput: { 
    fontSize: 24, fontFamily: 'Lao-Bold', 
    borderBottomWidth: 1, borderBottomColor: '#ddd', 
    minWidth: 100, textAlign: 'right', paddingVertical: 0 
  },
  currencyToggle: { flexDirection: 'row', gap: 5 },
  currencyBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  currencyBtnText: { fontFamily: 'Lao-Bold', fontSize: 12, color: '#888' },
  confirmBtn: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 15, alignItems: 'center' },
  confirmBtnText: { color: 'white', fontSize: 18, fontFamily: 'Lao-Bold' },

  // Scanner Styles
  scannerContainer: { flex: 1, backgroundColor: 'black' },
  scannerOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  scannerHeader: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scannerTitle: { color: 'white', fontSize: 20, fontFamily: 'Lao-Bold' },
  closeScannerBtn: { padding: 5 },
  scanFrame: { width: 250, height: 250, borderWidth: 2, borderColor: COLORS.secondary, borderRadius: 20, backgroundColor: 'transparent' },
  scanInstruction: { color: 'white', marginTop: 20, fontFamily: 'Lao-Regular' }
});