import { useCameraPermissions } from 'expo-camera';
import { useFonts } from 'expo-font';
import * as ImagePicker from 'expo-image-picker';
import { onValue, push, ref, remove, update } from 'firebase/database';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  SafeAreaView,
  StyleSheet,
  Text,
  View
} from 'react-native';

import { db } from '../../src/firebase';

// Import Types & Helpers
import { CartItem, COLORS, formatNumber, Product, SaleRecord, SIDEBAR_WIDTH } from '../../src/types';

// Import Screens
import CustomerScreen from '../../src/components/screens/CustomerScreen'; // 🟢 Import ໜ້າລູກຄ້າ
import ExpenseScreen from '../../src/components/screens/ExpenseScreen';
import HomeScreen from '../../src/components/screens/HomeScreen';
import OrderTrackingScreen from '../../src/components/screens/OrderTrackingScreen';
import POSScreen from '../../src/components/screens/POSScreen';
import ProductsScreen from '../../src/components/screens/ProductsScreen';
import ReportScreen from '../../src/components/screens/ReportScreen';
import ShiftScreen from '../../src/components/screens/ShiftScreen';

// Import UI Components
import Footer from '../../src/components/ui/Footer';
import Header from '../../src/components/ui/Header';
import Sidebar from '../../src/components/ui/Sidebar';

// Import Modals
import ProductModal from '../../src/components/modals/ProductModal';
import ScannerModal from '../../src/components/modals/ScannerModal';

export default function App() {
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
  const [currentTab, setCurrentTab] = useState<string>('home'); 
  const [menuVisible, setMenuVisible] = useState(false);
  
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

  // --- Modals States ---
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMode, setScanMode] = useState<'sell' | 'edit'>('sell');
  const [editingProduct, setEditingProduct] = useState<Product>({
      name: '', price: 0, stock: 0, priceCurrency: 'LAK', imageUrl: '', barcode: ''
  });

  // ============================================================
  // Firebase Listeners
  // ============================================================
  useEffect(() => {
    const productsRef = ref(db, 'products');
    const unsubscribeProducts = onValue(productsRef, (snapshot) => {
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

    return () => { unsubscribeProducts(); unsubscribeSales(); };
  }, []);

  // ============================================================
  // Logic Functions
  // ============================================================

  const toggleMenu = (show: boolean) => {
    if (show) { 
        setMenuVisible(true); 
        Animated.timing(slideAnim, { toValue: 0, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }).start(); 
    } else { 
        Animated.timing(slideAnim, { toValue: -SIDEBAR_WIDTH, duration: 300, easing: Easing.in(Easing.ease), useNativeDriver: true }).start(() => setMenuVisible(false)); 
    }
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

  const handleCheckout = async (paymentDetails: any) => {
    if (cart.length === 0) return;
    const { paymentMethod, amountReceived, change, date, source, currency, totalPaid, baseTotalLAK } = paymentDetails;
    try {
      const orderData = { 
          items: cart, subTotal: baseTotalLAK, discount: 0, total: baseTotalLAK, currency, totalPaid, 
          amountReceived: paymentMethod === 'CASH' ? amountReceived : totalPaid, 
          change: paymentMethod === 'CASH' ? change : 0, paymentMethod, source, 
          date: new Date(date).toISOString(), status: 'ສຳເລັດ', createdAt: new Date().toISOString() 
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
    } catch (error) { Alert.alert('Error', 'ເກີດຂໍ້ຜິດພາດ'); }
  };

  const openScanner = async (mode: 'sell' | 'edit' = 'sell') => {
    if (!permission?.granted) { const { granted } = await requestPermission(); if (!granted) return; }
    setScanMode(mode);
    setIsScanning(true);
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (isScanning === false) return; 
    if (scanMode === 'edit') { 
        setEditingProduct({ ...editingProduct, barcode: data }); 
        setIsScanning(false); setProductModalVisible(true); 
        return; 
    }
    const product = products.find(p => p.barcode === data);
    if (product) { addToCart(product); setIsScanning(false); } 
    else { setIsScanning(false); Alert.alert('❌ ບໍ່ພົບສິນຄ້າ', `Barcode: ${data}`); }
  };

  const saveProduct = async () => { 
      if (!editingProduct.name || !editingProduct.price) { Alert.alert('ຂໍ້ມູນບໍ່ຄົບ'); return; } 
      try { 
          if (editingProduct.id) { await update(ref(db, `products/${editingProduct.id}`), editingProduct); } 
          else { await push(ref(db, `products`), editingProduct); } 
          setProductModalVisible(false); 
      } catch (error) { Alert.alert('Error', 'ບັນທຶກບໍ່ໄດ້'); } 
  };

  const deleteProduct = (id: string) => {
      Alert.alert('ຢືນຢັນການລຶບ', 'ທ່ານຕ້ອງການລຶບສິນຄ້ານີ້ແທ້ບໍ່?', [
          { text: 'ຍົກເລີກ', style: 'cancel' },
          { 
              text: 'ລຶບ', 
              style: 'destructive', 
              onPress: async () => {
                  try {
                      await remove(ref(db, `products/${id}`));
                  } catch (error) {
                      Alert.alert('Error', 'ລຶບບໍ່ໄດ້');
                  }
              } 
          }
      ]);
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

  const removeFromCart = (id: string) => { setCart(prev => prev.filter(item => item.id !== id)); };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalLAK = cart.filter(i => i.priceCurrency !== 'THB').reduce((sum, i) => sum + (i.price * i.quantity), 0);

  if (!fontsLoaded || loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  // ============================================================
  // Render Content Switcher
  // ============================================================
  const renderContent = () => {
    switch (currentTab) {
        case 'home': 
            return <HomeScreen salesHistory={salesHistory} products={products} />;
        
        case 'pos': 
            return (
                <POSScreen 
                    products={products} cart={cart} addToCart={addToCart}
                    openEditProductModal={(p) => { setEditingProduct(p); setProductModalVisible(true); }} 
                    openAddProductModal={() => { setEditingProduct({ name: '', price: 0, stock: 1, priceCurrency: 'LAK', imageUrl: '', barcode: '' }); setProductModalVisible(true); }}
                    openScanner={openScanner} totalItems={totalItems} totalLAK={totalLAK}
                    formatNumber={formatNumber} updateQuantity={updateQuantity}
                    removeFromCart={removeFromCart} onCheckout={handleCheckout}
                />
            );
        
        case 'products':
            return (
                <ProductsScreen 
                    products={products}
                    onAddProduct={() => { 
                        setEditingProduct({ name: '', price: 0, stock: 0, priceCurrency: 'LAK', imageUrl: '', barcode: '' }); 
                        setProductModalVisible(true); 
                    }}
                    onEditProduct={(p) => { 
                        setEditingProduct(p); 
                        setProductModalVisible(true); 
                    }}
                    onDeleteProduct={deleteProduct}
                />
            );

        case 'expense': return <ExpenseScreen />;
        case 'report':
        case 'history': return <ReportScreen salesHistory={salesHistory} />;
        case 'orders': return <OrderTrackingScreen />; 
        case 'shifts':
        case 'shift': return <ShiftScreen />; 
        
        // 🟢 Case ສຳລັບໜ້າລູກຄ້າ
        case 'customers': return <CustomerScreen />;

        default: return (
            <View style={styles.center}>
                <Text style={{fontFamily: 'Lao-Bold', fontSize: 18}}>Coming Soon: {currentTab}</Text>
            </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header onMenuPress={() => toggleMenu(true)} />
      <View style={{flex: 1, backgroundColor: COLORS.background}}>
          {renderContent()}
      </View>
      <Footer currentTab={currentTab} onTabChange={(tab) => setCurrentTab(tab)} />
      <Sidebar 
        visible={menuVisible} slideAnim={slideAnim} onClose={() => toggleMenu(false)}
        currentTab={currentTab} onNavigate={(tab) => { setCurrentTab(tab); toggleMenu(false); }}
      />
      <ProductModal 
        visible={productModalVisible} onClose={() => setProductModalVisible(false)} 
        product={editingProduct} setProduct={setEditingProduct} onSave={saveProduct} 
        onPickImage={async () => {
            let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true }); 
            if (!result.canceled) { setEditingProduct({ ...editingProduct, imageUrl: `data:image/jpeg;base64,${result.assets[0].base64}` }); }
        }} 
        onScan={() => openScanner('edit')}
      />
      <ScannerModal visible={isScanning} onClose={() => setIsScanning(false)} onScanned={handleBarCodeScanned} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});