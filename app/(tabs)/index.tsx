import React, { useState, useEffect } from 'react';
import { View, SafeAreaView, Alert, Dimensions, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// --- Imports ---
import { db } from '../../src/firebase';
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

// 🟢 Default Product
const emptyProduct: Product = {
  id: '', name: '', price: 0, stock: 0, priceCurrency: 'LAK', category: '', barcode: ''
};

export default function App() {
  // --- 1. State Management ---
  const [activeTab, setActiveTab] = useState<string>('Home');
  // 🟢 ແກ້ໄຂ: ຕັ້ງເປັນ false ໄວ້ກ່ອນ ເພື່ອບໍ່ໃຫ້ບັງໜ້າຈໍໃນມືຖື
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>([]);
  
  // Modal States
  const [isProductModalVisible, setProductModalVisible] = useState(false);
  const [tempProduct, setTempProduct] = useState<Product>(emptyProduct);

  // --- 2. Initial Dummy Data ---
  useEffect(() => {
    setProducts([
      { id: '1', name: 'Pepsi', price: 10000, stock: 50, priceCurrency: 'LAK', category: 'Drink' },
      { id: '2', name: 'Beer Lao', price: 15000, stock: 24, priceCurrency: 'LAK', category: 'Alcohol' },
    ]);
  }, []);

  // --- 3. Handlers (Cart & Checkout) ---
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

    const newSale: SaleRecord = {
      id: Date.now().toString(),
      items: [...cart],
      subTotal, discount: discount || 0, total,
      amountReceived: amountReceived || 0, change: (amountReceived || 0) - total,
      currency: 'LAK', paymentMethod: paymentMethod || 'CASH',
      source: 'POS', date: new Date().toISOString(), status: 'COMPLETED', createdAt: new Date().toISOString()
    };
    setSalesHistory(prev => [newSale, ...prev]);
    setCart([]);
    Alert.alert("Success", "ການຂາຍສຳເລັດ!");
  };

  // Product Handlers
  const handleAddProduct = (newProduct: Product) => setProducts(prev => [...prev, { ...newProduct, id: Date.now().toString() }]);
  const handleEditProduct = (updatedProduct: Product) => setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  const handleDeleteProduct = (productId: string) => setProducts(prev => prev.filter(p => p.id !== productId));

  // Modal Handlers
  const openAddProductModal = () => { setTempProduct(emptyProduct); setProductModalVisible(true); };
  const openEditProductModal = (product: Product) => { setTempProduct(product); setProductModalVisible(true); };
  const onSaveProductFromModal = () => {
    if (!tempProduct.name || !tempProduct.price) { Alert.alert("Error", "ກະລຸນາໃສ່ຂໍ້ມູນໃຫ້ຄົບ"); return; }
    tempProduct.id ? handleEditProduct(tempProduct) : handleAddProduct(tempProduct);
    setProductModalVisible(false);
  };

  // --- 4. Render Screen Logic ---
  const renderScreen = () => {
    // ປ່ຽນເປັນ lowercase ໃຫ້ໝົດເພື່ອຄວາມຊົວ
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

  if (!isLoggedIn) {
    return <LoginScreenAny onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  const TABS = ['Home', 'POS', 'Products', 'Customers', 'Orders', 'Reports', 'Expenses', 'Debts', 'Shift'];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#008B94" />
      
      {/* Header */}
      <HeaderAny toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} user={{ name: 'Admin', role: 'Manager' }} />

      {/* Main Layout */}
      <View style={styles.mainContainer}>
        {/* Sidebar (Render ແບບ Overlay ຫຼື ປິດໄປເລີຍຖ້າເປັນມືຖື) */}
        {isSidebarOpen && (
          <View style={styles.sidebarWrapper}>
             <SidebarAny activeTab={activeTab} onTabChange={(tab: string) => {
               setActiveTab(tab);
               setIsSidebarOpen(false); // ເລືອກແລ້ວປິດ Sidebar ອັດຕະໂນມັດ
             }} tabs={TABS} />
          </View>
        )}

        {/* Content Area */}
        <View style={styles.contentArea}>
          {renderScreen()}
        </View>
      </View>

      {/* Footer */}
      <FooterAny 
        status="Online" 
        version="1.0.0" 
        currentTab={activeTab.toLowerCase()} // ສົ່ງເປັນຕົວນ້ອຍ
        onTabChange={(tab: string) => setActiveTab(tab)}
      />

      {/* Modal */}
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
  container: {
    flex: 1,
    backgroundColor: '#F5F9FA', // ສີພື້ນຫຼັງ
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'row', // ລວງນອນ
    position: 'relative',
  },
  sidebarWrapper: {
    width: 250,
    backgroundColor: 'white',
    height: '100%',
    position: 'absolute', // ໃຫ້ Sidebar ລອຍຢູ່ທາງເທິງ
    zIndex: 100, // ໃຫ້ຢູ່ເທິງສຸດ
    top: 0,
    left: 0,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 80, // ເພື່ອບໍ່ໃຫ້ Footer ບັງເນື້ອຫາ
  }
});