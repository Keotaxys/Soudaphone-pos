import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, View } from 'react-native';

// --- Imports ---
import { onValue, push, ref, remove, set, update } from 'firebase/database';
import { db } from '../../src/firebase';
import { CartItem, Product, SaleRecord } from '../../src/types';

// Screens
import CustomerScreen from '../../src/components/screens/CustomerScreen';
import DebtScreen from '../../src/components/screens/DebtScreen';
import ExpenseScreen from '../../src/components/screens/ExpenseScreen';
import HomeScreen from '../../src/components/screens/HomeScreen';
import LoginScreen from '../../src/components/screens/LoginScreen';
import OrderTrackingScreen from '../../src/components/screens/OrderTrackingScreen';
import POSScreen from '../../src/components/screens/POSScreen';
import ProductsScreen from '../../src/components/screens/ProductsScreen';
import ReportDashboard from '../../src/components/screens/ReportDashboard';
import ShiftScreen from '../../src/components/screens/ShiftScreen';

// UI Components
import Footer from '../../src/components/ui/Footer';
import Header from '../../src/components/ui/Header';
import Sidebar from '../../src/components/ui/Sidebar';

// Modals
import ProductModal from '../../src/components/modals/ProductModal';

// 🔥 Force Cast Components
const POSScreenAny = POSScreen as any;
const ProductsScreenAny = ProductsScreen as any;
const HomeScreenAny = HomeScreen as any;
const HeaderAny = Header as any;
const SidebarAny = Sidebar as any;
const FooterAny = Footer as any;
const ProductModalAny = ProductModal as any;
const LoginScreenAny = LoginScreen as any;

const emptyProduct: Product = {
  id: '', name: '', price: 0, stock: 0, priceCurrency: 'LAK', category: '', barcode: ''
};

export default function App() {
  // 🟢 1. Hooks ທັງໝົດຕ້ອງຢູ່ເທິງສຸດ (ຫ້າມມີ if return ຂັ້ນ)
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

  // 🟢 2. useEffect ກໍຕ້ອງຢູ່ເທິງ
  useEffect(() => {
    const productsRef = ref(db, 'products');
    const unsubscribe = onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const loadedProducts: Product[] = [];
        for (const key in data) {
          loadedProducts.push({ id: key, ...data[key] });
        }
        setProducts(loadedProducts);
      } else {
        setProducts([]);
      }
    }, (error) => {
      console.error("Error fetching products:", error);
    });
    return () => unsubscribe();
  }, []);

  // --- Handlers ---
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

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
    
    set(newSaleRef, newSale)
      .then(() => {
        Alert.alert("Success", "ການຂາຍສຳເລັດ!");
        setCart([]);
      })
      .catch(err => Alert.alert("Error", "ບັນທຶກການຂາຍບໍ່ໄດ້: " + err.message));
  };

  const handleAddProduct = (newProduct: Product) => {
    try {
      const productsRef = ref(db, 'products');
      const newRef = push(productsRef);
      const productWithId = { ...newProduct, id: newRef.key };
      set(newRef, productWithId);
    } catch (error) { Alert.alert("Error", "ເພີ່ມສິນຄ້າບໍ່ໄດ້"); }
  };

  const handleEditProduct = (updatedProduct: Product) => {
    try {
      if (!updatedProduct.id) return;
      const productRef = ref(db, `products/${updatedProduct.id}`);
      update(productRef, updatedProduct);
    } catch (error) { Alert.alert("Error", "ແກ້ໄຂສິນຄ້າບໍ່ໄດ້"); }
  };

  const handleDeleteProduct = (productId: string) => {
    try {
      const productRef = ref(db, `products/${productId}`);
      remove(productRef);
    } catch (error) { Alert.alert("Error", "ລຶບສິນຄ້າບໍ່ໄດ້"); }
  };

  const openAddProductModal = () => { setTempProduct(emptyProduct); setProductModalVisible(true); };
  const openEditProductModal = (product: Product) => { setTempProduct(product); setProductModalVisible(true); };
  
  const onSaveProductFromModal = () => {
    if (!tempProduct.name || !tempProduct.price) { Alert.alert("Error", "ກະລຸນາໃສ່ຂໍ້ມູນໃຫ້ຄົບ"); return; }
    if (tempProduct.id) { handleEditProduct(tempProduct); } else { handleAddProduct(tempProduct); }
    setProductModalVisible(false);
  };

  const renderScreen = () => {
    const tabName = activeTab.toLowerCase();
    switch (tabName) {
      case 'home': return <HomeScreenAny salesHistory={salesHistory} products={products} />;
      case 'pos': return (
          <POSScreenAny products={products} cart={cart} addToCart={addToCart} removeFromCart={removeFromCart} updateQuantity={updateQuantity} clearCart={clearCart} onCheckout={handleCheckout} openEditProductModal={openEditProductModal} />
        );
      case 'products': return (
          <ProductsScreenAny products={products} onAddProduct={openAddProductModal} onEditProduct={openEditProductModal} onDeleteProduct={handleDeleteProduct} />
        );
      case 'customers': return <CustomerScreen />;
      case 'orders': return <OrderTrackingScreen />;
      case 'reports': return <ReportDashboard />;
      case 'expenses': return <ExpenseScreen />;
      case 'debts': return <DebtScreen />;
      case 'shift': return <ShiftScreen />;
      default: return <HomeScreenAny salesHistory={salesHistory} products={products} />;
    }
  };

  // 🟢 3. Conditional Return (ເອົາມາໄວ້ລຸ່ມສຸດ ຫຼັງຈາກ Hooks ທຸກຢ່າງ)
  if (!fontsLoaded) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color="#008B94" />
      </View>
    );
  }

  if (!isLoggedIn) {
    return <LoginScreenAny onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  const TABS = ['Home', 'POS', 'Products', 'Customers', 'Orders', 'Reports', 'Expenses', 'Debts', 'Shift'];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#008B94" />
      
      <HeaderAny toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} user={{ name: 'Admin', role: 'Manager' }} />

      <View style={styles.mainContainer}>
        {isSidebarOpen && (
          <View style={styles.sidebarWrapper}>
             <SidebarAny activeTab={activeTab} onTabChange={(tab: string) => {
               setActiveTab(tab);
               setIsSidebarOpen(false);
             }} tabs={TABS} />
          </View>
        )}

        <View style={styles.contentArea}>
          {renderScreen()}
        </View>
      </View>

      <FooterAny 
        status="Online" 
        version="1.0.0" 
        currentTab={activeTab.toLowerCase()} 
        onTabChange={(tab: string) => setActiveTab(tab)}
      />

      <ProductModalAny 
        visible={isProductModalVisible}
        onClose={() => setProductModalVisible(false)}
        product={tempProduct}
        setProduct={setTempProduct}
        onSave={onSaveProductFromModal}
        onPickImage={() => {}}
        onScan={() => {}}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F9FA' },
  mainContainer: { flex: 1, flexDirection: 'row', position: 'relative' },
  sidebarWrapper: { width: 250, backgroundColor: 'white', height: '100%', position: 'absolute', zIndex: 100, top: 0, left: 0, elevation: 5 },
  contentArea: { flex: 1, backgroundColor: '#fff', margin: 10, borderRadius: 10, overflow: 'hidden', marginBottom: 80 }
});