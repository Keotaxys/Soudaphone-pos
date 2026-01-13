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
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);

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
    setProductModalVisible(false);
  };

  const handleEditProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    setProductModalVisible(false);
    setEditingProduct(undefined);
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const openAddProductModal = () => {
    setEditingProduct(undefined);
    setProductModalVisible(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setProductModalVisible(true);
  };

  // --- 4. Render Screen Logic ---
  const renderScreen = () => {
    switch (activeTab) {
      case 'Home': 
        return <HomeScreen salesHistory={salesHistory} products={products} />;
      
      case 'POS': 
        return (
          // @ts-ignore: Ignore missing clearCart prop in POSScreen definition
          <POSScreen 
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
      
      case 'Products': 
        return (
          <ProductsScreen 
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
      
      default: return <HomeScreen salesHistory={salesHistory} products={products} />;
    }
  };

  if (!isLoggedIn) {
    // @ts-ignore: Ignore missing props in LoginScreen
    return <LoginScreen onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  const TABS = ['Home', 'POS', 'Products', 'Customers', 'Orders', 'Reports', 'Expenses', 'Debts', 'Shift'];

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <StatusBar style="dark" />
      
      {/* Header */}
      {/* @ts-ignore: Ignore missing toggleSidebar in Header */}
      <Header 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        user={{ name: 'Admin', role: 'Manager' }} 
      />

      <View className="flex-1 flex-row">
        {/* Sidebar */}
        {isSidebarOpen && (
          // @ts-ignore: Ignore missing activeTab in Sidebar
          <Sidebar 
            activeTab={activeTab}
            onTabChange={(tab: string) => setActiveTab(tab)} 
            tabs={TABS}
          />
        )}

        {/* Main Content */}
        <View className="flex-1 bg-white m-2 rounded-lg shadow-sm overflow-hidden">
          {renderScreen()}
        </View>
      </View>

      {/* Footer */}
      {/* @ts-ignore: Ignore missing props in Footer */}
      <Footer status="Online" version="1.0.0" />

      {/* Global Modals */}
      {/* @ts-ignore: Ignore missing onSubmit in ProductModal */}
      <ProductModal 
        visible={isProductModalVisible}
        onClose={() => setProductModalVisible(false)}
        onSubmit={editingProduct ? handleEditProduct : handleAddProduct}
        initialData={editingProduct}
      />
    </SafeAreaView>
  );
}