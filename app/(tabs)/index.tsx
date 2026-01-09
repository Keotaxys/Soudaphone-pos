import { useCameraPermissions } from 'expo-camera';
import { useFonts } from 'expo-font';
import * as ImagePicker from 'expo-image-picker';
import { get, onValue, push, ref, remove, update } from 'firebase/database';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Easing, SafeAreaView, StyleSheet, View } from 'react-native';
import { db } from '../../src/firebase';

// 🟢 Import Types & Helpers
import { CartItem, COLORS, formatNumber, Product, SaleRecord, SIDEBAR_WIDTH } from '../../src/types';

// 🟢 Import Components (Screens & UI)
import ExpenseScreen from '../../src/components/screens/ExpenseScreen';
import HomeScreen from '../../src/components/screens/HomeScreen';
import POSScreen from '../../src/components/screens/POSScreen';
import ReportScreen from '../../src/components/screens/ReportScreen';
import Footer from '../../src/components/ui/Footer';
import Header from '../../src/components/ui/Header';
import Sidebar from '../../src/components/ui/Sidebar';

// 🟢 Import Modals
import CartModal from '../../src/components/modals/CartModal';
import ProductModal from '../../src/components/modals/ProductModal';
import ScannerModal from '../../src/components/modals/ScannerModal';

export default function App() {
  // Load Fonts
  const [fontsLoaded] = useFonts({
    'Lao-Bold': require('../../assets/fonts/NotoSansLao-Bold.ttf'),
    'Lao-Regular': require('../../assets/fonts/NotoSansLao-Regular.ttf'),
  });

  const [permission, requestPermission] = useCameraPermissions();

  // --- Data States ---
  const [products, setProducts] = useState<Product[]>([]);
  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // --- UI & Navigation States ---
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<'home' | 'pos' | 'expense' | 'report'>('pos');
  const [menuVisible, setMenuVisible] = useState(false);
  
  // Animation ສຳລັບ Sidebar
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

  // --- Modals States ---
  const [modalVisible, setModalVisible] = useState(false); // Cart Modal
  const [productModalVisible, setProductModalVisible] = useState(false); // Product Modal
  const [isScanning, setIsScanning] = useState(false); // Scanner Modal
  
  // --- Sale & Logic States ---
  const [scanMode, setScanMode] = useState<'sell' | 'edit'>('sell');
  const [paymentCurrency, setPaymentCurrency] = useState<'LAK' | 'THB'>('LAK');
  const [exchangeRate, setExchangeRate] = useState(700);
  
  // --- Editing State ---
  const [editingProduct, setEditingProduct] = useState<Product>({
      name: '', price: 0, stock: 0, priceCurrency: 'LAK', imageUrl: '', barcode: ''
  });

  // ============================================================
  // 1. Firebase Listeners (ດຶງຂໍ້ມູນ)
  // ============================================================
  useEffect(() => {
    // ດຶງສິນຄ້າ
    const productsRef = ref(db, 'products');
    const unsubscribeProducts = onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const productList = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setProducts(productList as Product[]);
      } else { setProducts([]); }
      setLoading(false);
    });

    // ດຶງປະຫວັດການຂາຍ
    const salesRef = ref(db, 'sales');
    const unsubscribeSales = onValue(salesRef, (snapshot) => {
        if(snapshot.exists()){
            const data = snapshot.val();
            const salesList = Object.keys(data).map(key => ({ id: key, ...data[key] }));
            setSalesHistory(salesList.reverse() as SaleRecord[]);
        } else { setSalesHistory([]); }
    });

    // ດຶງການຕັ້ງຄ່າ
    const settingsRef = ref(db, 'settings');
    get(settingsRef).then((snapshot) => {
        if(snapshot.exists()) {
            const data = snapshot.val();
            if (data.exchangeRateTHB) setExchangeRate(Number(data.exchangeRateTHB));
        }
    });

    return () => { unsubscribeProducts(); unsubscribeSales(); };
  }, []);

  // ============================================================
  // 2. Logic Functions (ການເຮັດວຽກຕ່າງໆ)
  // ============================================================

  // Sidebar Logic
  const toggleMenu = (show: boolean) => {
    if (show) { 
        setMenuVisible(true); 
        Animated.timing(slideAnim, { toValue: 0, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }).start(); 
    } else { 
        Animated.timing(slideAnim, { toValue: -SIDEBAR_WIDTH, duration: 300, easing: Easing.in(Easing.ease), useNativeDriver: true }).start(() => setMenuVisible(false)); 
    }
  };

  // Cart Logic
  const calculateTotalInCurrency = (targetCurrency: 'LAK' | 'THB') => {
    let total = 0;
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        if (item.priceCurrency !== 'THB') { // ສິນຄ້າເປັນກີບ
            if (targetCurrency === 'LAK') total += itemTotal; else total += itemTotal / exchangeRate;
        } else { // ສິນຄ້າເປັນບາດ
            if (targetCurrency === 'THB') total += itemTotal; else total += itemTotal * exchangeRate;
        }
    });
    return targetCurrency === 'LAK' ? Math.round(total) : parseFloat(total.toFixed(2));
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) { Alert.alert('ສິນຄ້າໝົດ', 'ບໍ່ມີໃນສະຕັອກ'); return; }
    setCart(prev => { 
        const existing = prev.find(item => item.id === product.id!); 
        if (existing) { 
            if (existing.quantity >= product.stock) return prev; 
            return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item); 
        } 
        return [...prev, { ...product, quantity: 1 } as CartItem]; 
    });
  };

  const removeFromCart = (id: string) => { setCart(prev => prev.filter(item => item.id !== id)); };

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

  // Checkout Logic
  const handleCheckout = async (paymentDetails: any) => {
    if (cart.length === 0) return;
    
    // ຮັບຂໍ້ມູນຈາກ Modal
    const { paymentMethod, amountReceived, change, date, source } = paymentDetails;
    const finalTotal = calculateTotalInCurrency(paymentCurrency); // ໃຊ້ລາຄາທີ່ຄຳນວນໄດ້ເລີຍ (ບໍ່ລວມສ່ວນຫຼຸດ manual ໃນຕົວຢ່າງນີ້)

    if (paymentMethod === 'CASH' && amountReceived < finalTotal) { 
        Alert.alert('ເງິນບໍ່ພໍ', `ຍັງຂາດອີກ ${formatNumber(finalTotal - amountReceived)}`); 
        return; 
    }

    try {
      const orderData = { 
          items: cart, 
          subTotal: finalTotal, // ໃນທີ່ນີ້ subTotal = Total (ຖ້າບໍ່ມີ discount)
          discount: 0, 
          total: finalTotal, 
          amountReceived: paymentMethod === 'CASH' ? amountReceived : finalTotal, 
          change: paymentMethod === 'CASH' ? change : 0, 
          currency: paymentCurrency, 
          paymentMethod, 
          source, 
          date: date.toISOString(), 
          status: 'ສຳເລັດ', 
          createdAt: new Date().toISOString() 
      };

      await push(ref(db, 'sales'), orderData);
      
      // ຕັດສະຕັອກ
      const updates: any = {};
      cart.forEach(item => { 
          const product = products.find(p => p.id === item.id); 
          if (product) updates[`products/${item.id}/stock`] = product.stock - item.quantity; 
      });
      await update(ref(db), updates);
      
      Alert.alert('✅ ສຳເລັດ', 'ຂາຍສິນຄ້າຮຽບຮ້ອຍແລ້ວ'); 
      setCart([]); 
      setModalVisible(false);
    } catch (error) { Alert.alert('Error', 'ເກີດຂໍ້ຜິດພາດ'); }
  };

  const deleteSale = (id: string) => { 
      Alert.alert('ຢືນຢັນ', 'ຕ້ອງການລຶບລາຍການນີ້ບໍ່?', [{ text: 'ຍົກເລີກ', style: 'cancel' }, { text: 'ລຶບ', style: 'destructive', onPress: async () => { try { await remove(ref(db, `sales/${id}`)); } catch(e) { Alert.alert('Error', 'ລຶບບໍ່ໄດ້'); } } }]); 
  };

  // Product Management Logic
  const openAddProductModal = () => { setEditingProduct({ name: '', price: 0, stock: 1, priceCurrency: 'LAK', imageUrl: '', barcode: '' }); setProductModalVisible(true); };
  const openEditProductModal = (product: Product) => { setEditingProduct({ ...product }); setProductModalVisible(true); };
  
  const pickImage = async () => { 
      let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true }); 
      if (!result.canceled) { const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`; setEditingProduct({ ...editingProduct, imageUrl: base64Img }); } 
  };
  
  const saveProduct = async () => { 
      if (!editingProduct.name || !editingProduct.price) { Alert.alert('ຂໍ້ມູນບໍ່ຄົບ'); return; } 
      try { 
          if (editingProduct.id) { await update(ref(db, `products/${editingProduct.id}`), editingProduct); Alert.alert('ສຳເລັດ', 'ແກ້ໄຂແລ້ວ'); } 
          else { await push(ref(db, `products`), editingProduct); Alert.alert('ສຳເລັດ', 'ເພີ່ມສິນຄ້າແລ້ວ'); } 
          setProductModalVisible(false); 
      } catch (error) { Alert.alert('Error', 'ບັນທຶກບໍ່ໄດ້'); } 
  };
  
  const deleteProduct = (id: string) => { Alert.alert('ຢືນຢັນ', 'ລຶບສິນຄ້ານີ້ບໍ່?', [{ text: 'ຍົກເລີກ', style: 'cancel' }, { text: 'ລຶບ', style: 'destructive', onPress: async () => { try { await remove(ref(db, `products/${id}`)); } catch(e) { Alert.alert('Error'); } } }]); };

  // Scanner Logic
  const openScanner = async (mode: 'sell' | 'edit' = 'sell') => {
    if (!permission?.granted) { const { granted } = await requestPermission(); if (!granted) { Alert.alert('ຕ້ອງການສິດ', 'ກະລຸນາອະນຸຍາດໃຫ້ໃຊ້ກ້ອງ'); return; } }
    setScanMode(mode);
    if (mode === 'edit') { setProductModalVisible(false); setTimeout(() => { setIsScanning(true); }, 300); } 
    else { setIsScanning(true); }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (isScanning === false) return; // ກັນ Scan ຊ້ຳ
    
    if (scanMode === 'edit') { 
        setEditingProduct({ ...editingProduct, barcode: data }); 
        setIsScanning(false); 
        setTimeout(() => { setProductModalVisible(true); }, 300); 
        return; 
    }
    
    const product = products.find(p => p.barcode === data);
    if (product) { 
        addToCart(product); 
        setIsScanning(false);
        Alert.alert('✅ ເພີ່ມສິນຄ້າແລ້ວ', `${product.name}`); 
    } else { 
        setIsScanning(false);
        Alert.alert('❌ ບໍ່ພົບສິນຄ້າ', `Barcode: ${data}`); 
    }
  };

  // Totals Calculation
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalLAK = cart.filter(i => i.priceCurrency !== 'THB').reduce((sum, i) => sum + (i.price * i.quantity), 0);

  if (!fontsLoaded || loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  // ============================================================
  // 3. Render Content Switcher
  // ============================================================
  const renderContent = () => {
    switch (currentTab) {
        case 'home':
            return <HomeScreen salesHistory={salesHistory} products={products} />;
        case 'pos':
            return (
                <POSScreen 
                    products={products}
                    cart={cart}
                    addToCart={addToCart}
                    openEditProductModal={openEditProductModal}
                    openAddProductModal={openAddProductModal}
                    openScanner={openScanner}
                    setModalVisible={setModalVisible}
                    totalItems={totalItems}
                    totalLAK={totalLAK}
                    formatNumber={formatNumber}
                />
            );
        case 'expense':
            return <ExpenseScreen />;
        case 'report':
            return <ReportScreen salesHistory={salesHistory} onDeleteSale={deleteSale} />;
        default:
            return null;
    }
  };

  // ============================================================
  // 4. Main UI
  // ============================================================
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header onMenuPress={() => toggleMenu(true)} />

      {/* Main Content Area */}
      <View style={{flex: 1, backgroundColor: COLORS.background}}>
          {renderContent()}
      </View>

      {/* Footer Navigation */}
      <Footer currentTab={currentTab} onTabChange={setCurrentTab} />

      {/* --- Modals & Overlays --- */}
      
      {/* Sidebar Menu */}
      <Sidebar 
        visible={menuVisible}
        slideAnim={slideAnim}
        onClose={() => toggleMenu(false)}
        currentTab={currentTab}
        onNavigate={(tab) => {
            setCurrentTab(tab);
            toggleMenu(false);
        }}
      />

      {/* Product Management Modal */}
      <ProductModal 
        visible={productModalVisible} 
        onClose={() => setProductModalVisible(false)} 
        product={editingProduct} 
        setProduct={setEditingProduct} 
        onSave={saveProduct} 
        onPickImage={pickImage} 
        onScan={() => openScanner('edit')}
      />

      {/* Cart & Checkout Modal */}
      <CartModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        cart={cart} 
        updateQuantity={updateQuantity} 
        removeFromCart={removeFromCart} 
        onCheckout={handleCheckout} 
        total={calculateTotalInCurrency(paymentCurrency)} 
        currency={paymentCurrency} 
      />

      {/* Scanner Modal */}
      <ScannerModal 
        visible={isScanning} 
        onClose={() => setIsScanning(false)} 
        onScanned={handleBarCodeScanned} 
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});