import React, { useState, useEffect } from 'react';
import { View, Alert, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

// --- Imports ---
import { db } from '../../src/firebase';
import { ref, onValue, push, set, remove, update } from 'firebase/database';
import { Product, CartItem, SaleRecord } from '../../src/types';

// Screens
import CustomerScreen from '../../src/components/screens/CustomerScreen';
import DebtScreen from '../../src/components/screens/DebtScreen';
import ExpenseScreen from '../../src/components/screens/ExpenseScreen';
import HomeScreen from '../../src/components/screens/HomeScreen';
import LoginScreen from '../../src/components/screens/LoginScreen';
import OrderTrackingScreen from '../../src/components/screens/OrderTrackingScreen';
import POSScreen from '../../src/components/screens/POSScreen';
import ProductsScreen from '../../src/components/screens/ProductsScreen';
import ShiftScreen from '../../src/components/screens/ShiftScreen';
import SalesHistoryScreen from '../../src/components/screens/SalesHistoryScreen';
import ReportDashboard from '../../src/components/screens/ReportDashboard';

// UI Components
import Footer from '../../src/components/ui/Footer';
import Header from '../../src/components/ui/Header';
import Sidebar from '../../src/components/ui/Sidebar';

// Modals
import ProductModal from '../../src/components/modals/ProductModal';
// 🟢 Import Scanner Modal
import ScannerModal from '../../src/components/modals/ScannerModal';

const POSScreenAny = POSScreen as any;
const ProductsScreenAny = ProductsScreen as any;
const HomeScreenAny = HomeScreen as any;
const HeaderAny = Header as any;
const SidebarAny = Sidebar as any;
const FooterAny = Footer as any;
const ProductModalAny = ProductModal as any;
const LoginScreenAny = LoginScreen as any;
const ScannerModalAny = ScannerModal as any;

const emptyProduct: Product = {
  id: '', name: '', price: 0, stock: 0, priceCurrency: 'LAK', category: '', barcode: ''
};

export default function App() {
  const [fontsLoaded] = useFonts({
    'Lao-Bold': require('../../assets/fonts/NotoSansLao-Bold.ttf'), 
    'Lao-Regular': require('../../assets/fonts/NotoSansLao-Regular.ttf'),
  });

  const [activeTab, setActiveTab] = useState<string>('Home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>([]);
  
  const [isProductModalVisible, setProductModalVisible] = useState(false);
  const [tempProduct, setTempProduct] = useState<Product>(emptyProduct);
  
  // 🟢 State ສຳລັບ Scanner
  const [isScannerVisible, setScannerVisible] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return; 
    const productsRef = ref(db, 'products');
    const unsubscribe = onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const loadedProducts: Product[] = [];
        for (const key in data) loadedProducts.push({ id: key, ...data[key] });
        setProducts(loadedProducts);
      } else {
        setProducts([]);
      }
    }, (error) => {
      if (!error.message.includes("permission_denied")) console.error(error);
    });
    return () => unsubscribe();
  }, [isLoggedIn]); 

  // --- Handlers ---
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => { setCart(prev => prev.filter(item => item.id !== productId)); };
  
  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const clearCart = () => setCart([]);

  const handleCheckout = (paymentDetails: any) => {
    const { paymentMethod, amountReceived, discount = 0 } = paymentDetails || {};
    const subTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subTotal - (discount || 0);

    const newSaleRef = push(ref(db, 'sales'));
    const newSale: SaleRecord = {
      id: newSaleRef.key!,
      items: [...cart],
      subTotal, discount: discount || 0, total,
      amountReceived: amountReceived || 0, change: (amountReceived || 0) - total,
      currency: 'LAK', paymentMethod: paymentMethod || 'CASH',
      source: 'POS', date: new Date().toISOString(), status: 'COMPLETED', createdAt: new Date().toISOString()
    };
    
    set(newSaleRef, newSale).then(() => {
        Alert.alert("Success", "ການຂາຍສຳເລັດ!");
        setCart([]);
    }).catch(err => Alert.alert("Error", "ບັນທຶກບໍ່ໄດ້: " + err.message));
  };

  const handleAddProduct = (p: Product) => { const newRef = push(ref(db, 'products')); set(newRef, { ...p, id: newRef.key }); };
  const handleEditProduct = (p: Product) => { if(p.id) update(ref(db, `products/${p.id}`), p); };
  const handleDeleteProduct = (id: string) => { remove(ref(db, `products/${id}`)); };

  const openAddProductModal = () => { setTempProduct(emptyProduct); setProductModalVisible(true); };
  const openEditProductModal = (p: Product) => { setTempProduct(p); setProductModalVisible(true); };
  const onSaveProductFromModal = () => {
    if (!tempProduct.name || !tempProduct.price) { Alert.alert("Error", "ກະລຸນາໃສ່ຂໍ້ມູນໃຫ້ຄົບ"); return; }
    if (tempProduct.id) handleEditProduct(tempProduct); else handleAddProduct(tempProduct);
    setProductModalVisible(false);
  };

  // 🟢 ຈັດການເມື່ອສະແກນບາໂຄດໄດ້ (ຈາກໜ້າ Home)
  const handleScanSuccess = (code: string) => {
    setScannerVisible(false);
    const foundProduct = products.find(p => p.barcode === code);
    
    if (foundProduct) {
        // ຖ້າເຈີສິນຄ້າ ໃຫ້ໄປໜ້າ POS ແລະ ເພີ່ມລົງກະຕ່າ
        addToCart(foundProduct);
        setActiveTab('POS');
        Alert.alert("ສຳເລັດ", `ເພີ່ມ ${foundProduct.name} ລົງກະຕ່າແລ້ວ`);
    } else {
        Alert.alert("ບໍ່ພົບສິນຄ້າ", `ລະຫັດ: ${code} ບໍ່ມີໃນລະບົບ`);
    }
  };

  // Render Logic
  const renderScreen = () => {
    const tabName = activeTab.toLowerCase();
    switch (tabName) {
      case 'home': return (
        // 🟢 ສົ່ງ Props ໃຫ້ HomeScreen ໃຊ້ງານປຸ່ມດ່ວນ
        <HomeScreenAny 
            salesHistory={salesHistory} 
            products={products} 
            onQuickAddProduct={openAddProductModal} // ເປີດ Modal ເພີ່ມສິນຄ້າ
            onQuickScan={() => setScannerVisible(true)} // ເປີດ Modal ສະແກນ
            onQuickCustomer={() => setActiveTab('Customers')} // ໄປໜ້າລູກຄ້າ
        />
      );
      case 'pos': return <POSScreenAny products={products} cart={cart} addToCart={addToCart} removeFromCart={removeFromCart} updateQuantity={updateQuantity} clearCart={clearCart} onCheckout={handleCheckout} openEditProductModal={openEditProductModal} />;
      case 'products': return <ProductsScreenAny products={products} onAddProduct={openAddProductModal} onEditProduct={openEditProductModal} onDeleteProduct={handleDeleteProduct} />;
      case 'customers': return <CustomerScreen />;
      case 'orders': return <OrderTrackingScreen />;
      case 'reports': return <ReportDashboard />; 
      case 'history': return <SalesHistoryScreen />;
      case 'expenses': return <ExpenseScreen />;
      case 'debts': return <DebtScreen />;
      case 'shift': return <ShiftScreen />;
      default: return <HomeScreenAny salesHistory={salesHistory} products={products} />;
    }
  };

  if (!fontsLoaded) return <View style={{flex: 1, justifyContent: 'center'}}><ActivityIndicator size="large" color="#008B94"/></View>;
  if (!isLoggedIn) return <LoginScreenAny onLoginSuccess={() => setIsLoggedIn(true)} />;

  const TABS = ['Home', 'POS', 'Products', 'Customers', 'Orders', 'Reports', 'Expenses', 'Debts', 'Shift'];

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 0, backgroundColor: '#008B94' }} edges={['top']} />
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <StatusBar style="light" backgroundColor="#008B94" />
        
        <HeaderAny toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} user={{ name: 'Admin', role: 'Manager' }} />

        <View style={styles.mainContainer}>
          {isSidebarOpen && (
            <View style={styles.sidebarOverlay}>
               <SidebarAny activeTab={activeTab} onTabChange={(tab: string) => { setActiveTab(tab); setIsSidebarOpen(false); }} tabs={TABS} onClose={() => setIsSidebarOpen(false)} />
               <View style={styles.transparentCloseArea} onTouchEnd={() => setIsSidebarOpen(false)} />
            </View>
          )}

          <View style={styles.contentWrapper}>
            {renderScreen()}
          </View>
        </View>

        <FooterAny status="Online" version="1.0.0" currentTab={activeTab.toLowerCase()} onTabChange={(tab: string) => setActiveTab(tab)} />

        {/* Product Modal */}
        <ProductModalAny visible={isProductModalVisible} onClose={() => setProductModalVisible(false)} product={tempProduct} setProduct={setTempProduct} onSave={onSaveProductFromModal} onPickImage={() => {}} onScan={() => {}} />
        
        {/* 🟢 Scanner Modal */}
        <ScannerModalAny visible={isScannerVisible} onClose={() => setScannerVisible(false)} onScan={handleScanSuccess} />

      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F9FA' },
  mainContainer: { flex: 1, position: 'relative' },
  sidebarOverlay: { position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, zIndex: 999, flexDirection: 'row' },
  transparentCloseArea: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  contentWrapper: { flex: 1, backgroundColor: '#fff', marginHorizontal: 10, marginTop: 10, marginBottom: 0, borderRadius: 10, overflow: 'hidden' }
});