import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { CartItem, Product } from '../../types';

// 🟢 1. Import CurrencyInput ເຂົ້າມາ
import CurrencyInput from '../ui/CurrencyInput';

// Helper Function
const formatNumber = (num: number | string | undefined) => {
  if (num === undefined || num === null || num === '') return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

interface POSScreenProps {
  products: Product[];
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
  onCheckout: (paymentDetails: any) => void;
  openEditProductModal: (product: Product) => void;
}

const POSScreen: React.FC<POSScreenProps> = ({ 
  products, cart, addToCart, removeFromCart, updateQuantity, clearCart, onCheckout, openEditProductModal 
}) => {
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isPaymentModalVisible, setPaymentModalVisible] = useState(false);
  
  // Payment State
  const [amountReceived, setAmountReceived] = useState('');
  const [discount, setDiscount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QR'>('CASH');
  const [paymentCurrency, setPaymentCurrency] = useState<'LAK' | 'THB'>('LAK');

  // Categories
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category || 'General')))];

  // Filter Products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.barcode && p.barcode.includes(searchQuery));
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate Totals
  const subTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountVal = parseFloat(discount) || 0;
  const finalTotal = Math.max(0, subTotal - discountVal);
  const receivedVal = parseFloat(amountReceived) || 0;
  const change = Math.max(0, receivedVal - finalTotal);

  // Handlers
  const handlePayment = () => {
    if (cart.length === 0) {
      Alert.alert('Error', 'ກະຕ່າວ່າງເປົ່າ');
      return;
    }
    if (receivedVal < finalTotal) {
      Alert.alert('Error', 'ຈຳນວນເງິນທີ່ຮັບມາບໍ່ພຽງພໍ');
      return;
    }

    onCheckout({
      paymentMethod,
      amountReceived: receivedVal,
      discount: discountVal,
      currency: paymentCurrency
    });
    setPaymentModalVisible(false);
    setAmountReceived('');
    setDiscount('');
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity 
      style={styles.productCard} 
      onPress={() => addToCart(item)}
      onLongPress={() => openEditProductModal(item)}
    >
      <View style={styles.imagePlaceholder}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
        ) : (
          <Ionicons name="image-outline" size={30} color="#ccc" />
        )}
      </View>
      <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
      <Text style={styles.productPrice}>{formatNumber(item.price)} ₭</Text>
      <Text style={styles.productStock}>Stock: {item.stock}</Text>
    </TouchableOpacity>
  );

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <View style={{flex: 1}}>
        <Text style={styles.cartItemName}>{item.name}</Text>
        <Text style={styles.cartItemPrice}>{formatNumber(item.price)} ₭</Text>
      </View>
      
      <View style={styles.qtyControls}>
        <TouchableOpacity onPress={() => updateQuantity(item.id!, -1)} style={styles.qtyBtn}>
          <Ionicons name="remove" size={16} color="white" />
        </TouchableOpacity>
        <Text style={styles.qtyText}>{item.quantity}</Text>
        <TouchableOpacity onPress={() => updateQuantity(item.id!, 1)} style={styles.qtyBtn}>
          <Ionicons name="add" size={16} color="white" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => removeFromCart(item.id!)} style={{marginLeft: 10}}>
        <Ionicons name="trash-outline" size={20} color="#ff4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* --- Left Side: Products --- */}
      <View style={styles.leftPane}>
        {/* Search & Filter */}
        <View style={styles.filterSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput 
              style={styles.searchInput}
              placeholder="ຄົ້ນຫາສິນຄ້າ..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {categories.map((cat, index) => (
              <TouchableOpacity 
                key={index} 
                style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <FlatList 
          data={filteredProducts}
          keyExtractor={(item) => item.id!.toString()}
          renderItem={renderProductItem}
          numColumns={3}
          contentContainerStyle={styles.productList}
          columnWrapperStyle={{gap: 10}}
        />
      </View>

      {/* --- Right Side: Cart --- */}
      <View style={styles.rightPane}>
        <View style={styles.cartHeader}>
          <Text style={styles.cartTitle}>ກະຕ່າສິນຄ້າ ({cart.length})</Text>
          <TouchableOpacity onPress={clearCart}>
            <Text style={{color: '#ff4444'}}>ລ້າງ</Text>
          </TouchableOpacity>
        </View>

        <FlatList 
          data={cart}
          keyExtractor={(item) => item.id!.toString()}
          renderItem={renderCartItem}
          style={{flex: 1}}
          contentContainerStyle={{padding: 10}}
        />

        <View style={styles.cartSummary}>
          <View style={styles.summaryRow}>
            <Text>ລວມ:</Text>
            <Text style={styles.summaryVal}>{formatNumber(subTotal)} ₭</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.checkoutBtn}
            onPress={() => setPaymentModalVisible(true)}
          >
            <Text style={styles.checkoutBtnText}>ຊຳລະເງິນ</Text>
            <Text style={styles.checkoutBtnText}>{formatNumber(subTotal)} ₭</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* --- Payment Modal --- */}
      <Modal visible={isPaymentModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.paymentModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>ຊຳລະເງິນ</Text>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.paymentBody}>
              <Text style={styles.totalLabel}>ຍອດລວມທັງໝົດ</Text>
              <Text style={styles.totalBig}>{formatNumber(finalTotal)} ₭</Text>

              {/* Discount Input -> 🟢 ໃຊ້ CurrencyInput */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>ສ່ວນຫຼຸດ (₭)</Text>
                <CurrencyInput
                  style={styles.input}
                  value={discount}
                  onChangeValue={setDiscount} // ໃຊ້ onChangeValue ແທນ onChangeText
                  placeholder="0"
                />
              </View>

              {/* Amount Received -> 🟢 ໃຊ້ CurrencyInput */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>ຮັບເງິນມາ (₭)</Text>
                <CurrencyInput
                  style={styles.input}
                  value={amountReceived}
                  onChangeValue={setAmountReceived} // ໃຊ້ onChangeValue ແທນ onChangeText
                  placeholder="0"
                />
              </View>

              <View style={styles.changeBox}>
                <Text style={styles.changeLabel}>ເງິນທອນ:</Text>
                <Text style={styles.changeValue}>{formatNumber(change)} ₭</Text>
              </View>

              <View style={styles.methodRow}>
                <TouchableOpacity 
                  style={[styles.methodBtn, paymentMethod === 'CASH' && styles.methodBtnActive]}
                  onPress={() => setPaymentMethod('CASH')}
                >
                  <Ionicons name="cash-outline" size={20} color={paymentMethod === 'CASH' ? 'white' : '#333'} />
                  <Text style={paymentMethod === 'CASH' ? {color:'white'} : {color:'#333'}}>ເງິນສົດ</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.methodBtn, paymentMethod === 'QR' && styles.methodBtnActive]}
                  onPress={() => setPaymentMethod('QR')}
                >
                  <Ionicons name="qr-code-outline" size={20} color={paymentMethod === 'QR' ? 'white' : '#333'} />
                  <Text style={paymentMethod === 'QR' ? {color:'white'} : {color:'#333'}}>QR Code</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.confirmPayBtn} onPress={handlePayment}>
              <Text style={styles.confirmPayText}>ຢືນຢັນການຊຳລະ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#F5F9FA' },
  leftPane: { flex: 2, padding: 10 },
  rightPane: { flex: 1, backgroundColor: 'white', borderLeftWidth: 1, borderColor: '#eee' },
  filterSection: { marginBottom: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 10, padding: 10, marginBottom: 10 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  categoryScroll: { flexDirection: 'row' },
  categoryChip: { paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#e0e0e0', borderRadius: 20, marginRight: 8 },
  categoryChipActive: { backgroundColor: '#008B94' },
  categoryText: { color: '#333' },
  categoryTextActive: { color: 'white', fontWeight: 'bold' },
  productList: { paddingBottom: 20 },
  productCard: { flex: 1, backgroundColor: 'white', borderRadius: 10, padding: 10, margin: 5, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  imagePlaceholder: { width: 60, height: 60, backgroundColor: '#f0f0f0', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  productImage: { width: 60, height: 60, borderRadius: 8 },
  productName: { fontSize: 14, textAlign: 'center', marginBottom: 5, height: 35 },
  productPrice: { fontSize: 14, fontWeight: 'bold', color: '#008B94' },
  productStock: { fontSize: 10, color: '#999' },
  cartHeader: { padding: 15, borderBottomWidth: 1, borderColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cartTitle: { fontSize: 18, fontWeight: 'bold' },
  cartItem: { flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderColor: '#f5f5f5' },
  cartItemName: { fontSize: 14 },
  cartItemPrice: { fontSize: 12, color: '#008B94', fontWeight: 'bold' },
  qtyControls: { flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
  qtyBtn: { backgroundColor: '#008B94', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  qtyText: { marginHorizontal: 8, fontSize: 14, fontWeight: 'bold' },
  cartSummary: { padding: 15, backgroundColor: '#f9f9f9', borderTopWidth: 1, borderColor: '#eee' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  summaryVal: { fontSize: 18, fontWeight: 'bold' },
  checkoutBtn: { backgroundColor: '#008B94', padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between' },
  checkoutBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  paymentModal: { width: 350, backgroundColor: 'white', borderRadius: 15, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  paymentBody: { marginBottom: 20 },
  totalLabel: { textAlign: 'center', color: '#666' },
  totalBig: { textAlign: 'center', fontSize: 32, fontWeight: 'bold', color: '#008B94', marginBottom: 20 },
  inputGroup: { marginBottom: 15 },
  label: { marginBottom: 5, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 18, backgroundColor: '#f9f9f9' },
  changeBox: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, padding: 10, backgroundColor: '#e0f7fa', borderRadius: 8 },
  changeLabel: { fontWeight: 'bold', color: '#006064' },
  changeValue: { fontWeight: 'bold', color: '#006064', fontSize: 18 },
  methodRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  methodBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  methodBtnActive: { backgroundColor: '#008B94', borderColor: '#008B94' },
  confirmPayBtn: { backgroundColor: '#008B94', padding: 15, borderRadius: 10, alignItems: 'center' },
  confirmPayText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});

export default POSScreen;