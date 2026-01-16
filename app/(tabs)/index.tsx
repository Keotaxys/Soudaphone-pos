import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { onValue, push, ref, remove, set, update } from 'firebase/database';
import { db } from '../../src/firebase';
import { CartItem, Product, SaleRecord } from '../../src/types';

import CustomerScreen from '../../src/components/screens/CustomerScreen';
import DebtScreen from '../../src/components/screens/DebtScreen';
import DebtsReceivableScreen from '../../src/components/screens/DebtsReceivableScreen'; 
import SpecialSaleScreen from '../../src/components/screens/SpecialSaleScreen'; 

import ExpenseScreen from '../../src/components/screens/ExpenseScreen';
import HomeScreen from '../../src/components/screens/HomeScreen';
import LoginScreen from '../../src/components/screens/LoginScreen';
import OrderTrackingScreen from '../../src/components/screens/OrderTrackingScreen';
import POSScreen from '../../src/components/screens/POSScreen';
import ProductsScreen from '../../src/components/screens/ProductsScreen';
import ReportDashboard from '../../src/components/screens/ReportDashboard';
import SalesHistoryScreen from '../../src/components/screens/SalesHistoryScreen';
import ShiftScreen from '../../src/components/screens/ShiftScreen';

import Footer from '../../src/components/ui/Footer';
import Header from '../../src/components/ui/Header';
import Sidebar from '../../src/components/ui/Sidebar';

import EditShopModal from '../../src/components/modals/EditShopModal';
import ProductModal from '../../src/components/modals/ProductModal';
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
  const [isScannerVisible, setScannerVisible] = useState(false);

  const [shopInfo, setShopInfo] = useState({
    name: 'ຮ້ານ ສຸດາພອນ',
    id: 'ID: 8888 9999',
    logo: null as string | null
  });
  const [isEditShopVisible, setEditShopVisible] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return; 
    
    const productsRef = ref(db, 'products');
    const unsubProd = onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const loadedProducts: Product[] = [];
        for (const key in data) loadedProducts.push({ id: key, ...data[key] });
        setProducts(loadedProducts);
      } else {
        setProducts([]);
      }
    }, (error) => {
        if(!error.message.includes("permission_denied")) console.error(error);
    });

    const salesRef = ref(db, 'sales');
    const unsubSales = onValue(salesRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
            setSalesHistory(list);
        } else {
            setSalesHistory([]);
        }
    });

    const shopRef = ref(db, 'shopInfo');
    const unsubShop = onValue(shopRef, (snapshot) => {
      if (snapshot.exists()) {
        setShopInfo(snapshot.val());
      }
    });

    return () => {
        unsubProd();
        unsubSales();
        unsubShop();
    };
  }, [isLoggedIn]); 

  const addToCart = (product: Product) => {
    setCart(prev => {
        const existing = prev.find(item => item.id === product.id);
        if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
        return [...prev, { ...product, quantity: 1 }];
    });
  };
  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));
  const updateQuantity = (id: string, delta: number) => setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item).filter(i => i.quantity > 0));
  const clearCart = () => setCart([]);

  const handleCheckout = (paymentDetails: any) => {
    const { paymentMethod, amountReceived, discount = 0 } = paymentDetails || {};
    const subTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subTotal - (discount || 0);
    const newSaleRef = push(ref(db, 'sales'));
    const newSale: SaleRecord = {
      id: newSaleRef.key!, items: [...cart], subTotal, discount: discount || 0, total,
      amountReceived: amountReceived || 0, change: (amountReceived || 0) - total,
      currency: 'LAK', paymentMethod: paymentMethod || 'CASH', source: 'POS', date: new Date().toISOString(), status: 'COMPLETED', createdAt: new Date().toISOString()
    };
    set(newSaleRef, newSale).then(() => { Alert.alert("Success", "ການຂາຍສຳເລັດ!"); setCart([]); }).catch(err => Alert.alert("Error", err.message));
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

  const handleScanSuccess = (code: string) => {
    setScannerVisible(false);
    const foundProduct = products.find(p => p.barcode === code);
    if (foundProduct) { addToCart(foundProduct); setActiveTab('POS'); Alert.alert("ສຳເລັດ", `ເພີ່ມ ${foundProduct.name} ລົງກະຕ່າແລ້ວ`); } 
    else { Alert.alert("ບໍ່ພົບສິນຄ້າ", `ລະຫັດ: ${code} ບໍ່ມີໃນລະບົບ`); }
  };

  const handleSaveShopInfo = (name: string, id: string, logo: string | null) => {
      const newInfo = { name, id, logo };
      setShopInfo(newInfo);
      set(ref(db, 'shopInfo'), newInfo).catch(err => console.error(err));
  };

  const renderScreen = () => {
    const tabName = activeTab.toLowerCase();
    switch (tabName) {
      case 'home': return <HomeScreenAny salesHistory={salesHistory} products={products} onQuickAddProduct={openAddProductModal} onQuickScan={() => setScannerVisible(true)} onQuickCustomer={() => setActiveTab('Customers')} />;
      case 'pos': return (
          <POSScreenAny 
            products={products} 
            cart={cart} 
            addToCart={addToCart} 
            removeFromCart={removeFromCart} 
            updateQuantity={updateQuantity} 
            clearCart={clearCart} 
            onCheckout={handleCheckout} 
            openEditProductModal={openEditProductModal}
            onOpenScan={() => setScannerVisible(true)} 
            onOpenAddProduct={openAddProductModal} 
          />
      );
      case 'special_sale': return <SpecialSaleScreen products={products} />; 
      case 'debts_receivable': return <DebtsReceivableScreen />; 
      case 'debts_payable': return <DebtScreen />; 

      case 'products': return <ProductsScreenAny products={products} onAddProduct={openAddProductModal} onEditProduct={openEditProductModal} onDeleteProduct={handleDeleteProduct} />;
      case 'customers': return <CustomerScreen />;
      case 'orders': return <OrderTrackingScreen />;
      case 'reports': return <ReportDashboard />; 
      case 'history': return <SalesHistoryScreen />;
      case 'expenses': return <ExpenseScreen />;
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
        
        <HeaderAny 
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
            user={{ name: 'Admin', role: 'Manager' }} 
            shopName={shopInfo.name}
            shopId={shopInfo.id}
            shopLogo={shopInfo.logo}
            onEditPress={() => setEditShopVisible(true)}
            onLogout={() => setIsLoggedIn(false)}
        />

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

        <ProductModalAny visible={isProductModalVisible} onClose={() => setProductModalVisible(false)} product={tempProduct} setProduct={setTempProduct} onSave={onSaveProductFromModal} onPickImage={() => {}} onScan={() => {}} />
        <ScannerModalAny visible={isScannerVisible} onClose={() => setScannerVisible(false)} onScan={handleScanSuccess} />
        
        <EditShopModal 
            visible={isEditShopVisible}
            onClose={() => setEditShopVisible(false)}
            initialData={shopInfo}
            onSave={handleSaveShopInfo}
        />

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