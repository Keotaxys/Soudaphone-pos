import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, View } from 'react-native';

// --- Imports ---
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

// 🟢 Default Product
const emptyProduct: Product = {
  id: '', 
  name: '', 
  price: 0, 
  stock: 0, 
  priceCurrency: 'LAK', 
  category: '', 
  barcode: ''
};

export default function App() {
  // --- 1. State Management ---
  const [activeTab, setActiveTab] = useState<string>('Home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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

  // --- 3. Handlers ---
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
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
      subTotal,
      discount: discount || 0,
      total,
      amountReceived: amountReceived || 0,
      change: (amountReceived || 0) - total,
      currency: 'LAK', 
      paymentMethod: paymentMethod || 'CASH',
      source: 'POS',
      date: new Date().toISOString(),
      status: 'COMPLETED',
      createdAt: new Date().toISOString()
    };

    setSalesHistory(prev => [newSale, ...prev]);
    setCart([]);
    Alert.alert("Success", "ການຂາຍສຳເລັດ!");
  };

  // Product Handlers
  const handleAddProduct = (newProduct: Product) => {
    setProducts(prev => [...prev, { ...newProduct, id: Date.now().toString() }]);
  };

  const handleEditProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  // Modal Handlers
  const openAddProductModal = () => {
    setTempProduct(emptyProduct);
    setProductModalVisible(true);
  };

  const openEditProductModal = (product: Product) => {
    setTempProduct(product);
    setProductModalVisible(true);
  };

  const onSaveProductFromModal = () => {
    if (!tempProduct.name || !tempProduct.price) {
      Alert.alert("Error", "ກະລຸນາໃສ່ຂໍ້ມູນໃຫ້ຄົບ");
      return;
    }
    if (tempProduct.id) {
      handleEditProduct(tempProduct);
    } else {
      handleAddProduct(tempProduct);
    }
    setProductModalVisible(false);
  };

  // --- 4. Render Screen Logic ---
  const renderScreen = () => {
    switch (activeTab) {
      case 'Home': case 'home':
        return <HomeScreenAny salesHistory={salesHistory} products={products} />;
      
      case 'POS': case 'pos':
        return (
          <POSScreenAny 
            products={products}
            cart={cart}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
            updateQuantity={updateQuantity}
            clearCart={clearCart} 
            onCheckout={handleCheckout}
            openEditProductModal={openEditProductModal}
          />
        );
      
      case 'Products': case 'products':
        return (
          <ProductsScreenAny 
            products={products}
            onAddProduct={openAddProductModal}
            onEditProduct={openEditProductModal}
            onDeleteProduct={handleDeleteProduct}
          />
        );
      
      case 'Customers': return <CustomerScreen />;
      case 'Orders': return <OrderTrackingScreen />;
      case 'Reports': return <ReportDashboard />;
      case 'Expenses': return <ExpenseScreen />;
      case 'Debts': return <DebtScreen />;
      case 'Shift': return <ShiftScreen />;
      
      default: return <HomeScreenAny salesHistory={salesHistory} products={products} />;
    }
  }; // 🟢 <--- ປິດ renderScreen (ຈຸດທີ່ມັກ Error)

  if (!isLoggedIn) {
    return <LoginScreenAny onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  const TABS = ['Home', 'POS', 'Products', 'Customers', 'Orders', 'Reports', 'Expenses', 'Debts', 'Shift'];

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <StatusBar style="dark" />
      
      <HeaderAny toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} user={{ name: 'Admin', role: 'Manager' }} />

      <View className="flex-1 flex-row">
        {isSidebarOpen && (
          <SidebarAny activeTab={activeTab} onTabChange={(tab: string) => setActiveTab(tab)} tabs={TABS} />
        )}

        <View className="flex-1 bg-white m-2 rounded-lg shadow-sm overflow-hidden">
          {renderScreen()}
        </View>
      </View>

      <FooterAny 
        status="Online" 
        version="1.0.0" 
        currentTab={activeTab}
        onTabChange={(tab: string) => {
          const formattedTab = tab.charAt(0).toUpperCase() + tab.slice(1);
          setActiveTab(formattedTab);
        }}
      />

      <ProductModalAny 
        visible={isProductModalVisible}
        onClose={() => setProductModalVisible(false)}
        product={tempProduct}
        setProduct={setTempProduct}
        onSave={onSaveProductFromModal}
        onPickImage={() => Alert.alert("Coming Soon", "ຟັງຊັນອັບໂຫລດຮູບ")}
        onScan={() => Alert.alert("Coming Soon", "ຟັງຊັນສະແກນບາໂຄດ")}
      />
    </SafeAreaView>
  );
} // 🟢 <--- ປິດ App