import { ShoppingCart, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

// --- Types ---
interface Product {
  id: string;
  name: string;
  price: number;
}

interface CartItem extends Product {
  qty: number;
}

export default function POSScreen() {
  // --- Mock Data ---
  const products: Product[] = [
    { id: '1', name: 'ນ້ຳມັນເຄື່ອງ 1 ລິດ', price: 50000 },
    { id: '2', name: 'ຫົວທຽນ', price: 25000 },
    { id: '3', name: 'ຢາງນອກ', price: 120000 },
    { id: '4', name: 'ກອງນ້ຳມັນ', price: 15000 },
    { id: '5', name: 'ໂສ້', price: 65000 },
    { id: '6', name: 'ນ້ຳມັນເບກ', price: 20000 },
  ];

  // --- States ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currency, setCurrency] = useState<'LAK' | 'THB' | 'USD'>('LAK');
  const [overrideTotal, setOverrideTotal] = useState<string>('');
  const [amountReceived, setAmountReceived] = useState<string>('');

  // --- Logic ---
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const finalTotal = overrideTotal !== '' ? parseFloat(overrideTotal) : subtotal;
  const calculatedDiscount = subtotal - finalTotal;
  const received = parseFloat(amountReceived) || 0;
  const change = received - finalTotal;

  // --- Functions ---
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === product.id);
      if (existing) {
        return prev.map(p => p.id === product.id ? { ...p, qty: p.qty + 1 } : p);
      }
      return [...prev, { ...product, qty: 1 }];
    });
    setOverrideTotal(''); 
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(p => p.id !== id));
    setOverrideTotal('');
  };

  const handleConfirmSale = () => {
    Alert.alert("Success", "ບັນທຶກການຂາຍສຳເລັດ!");
    setCart([]);
    setAmountReceived('');
    setOverrideTotal('');
  };

  return (
    <View style={styles.container}>
      
      {/* --- Top: Product List (Horizontal Scroll) --- */}
      <View style={styles.sectionHeader}>
        <ShoppingCart size={20} color="#333" />
        <Text style={styles.headerTitle}>ລາຍການສິນຄ້າ</Text>
      </View>
      
      <View style={{ height: 120 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productList}>
          {products.map(product => (
            <TouchableOpacity
              key={product.id}
              onPress={() => addToCart(product)}
              style={styles.productCard}
            >
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productPrice}>{product.price.toLocaleString()} LAK</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* --- Middle: Cart Items (Vertical Scroll) --- */}
      <View style={[styles.sectionHeader, { marginTop: 10 }]}>
         <Text style={styles.headerTitle}>ກະຕ່າສິນຄ້າ ({cart.length})</Text>
      </View>

      <ScrollView style={styles.cartContainer}>
        {cart.length === 0 ? (
          <Text style={styles.emptyText}>ຍັງບໍ່ມີລາຍການ</Text>
        ) : (
          cart.map(item => (
            <View key={item.id} style={styles.cartItem}>
              <View>
                <Text style={styles.cartItemName}>{item.name}</Text>
                <Text style={styles.cartItemDetail}>
                  {item.price.toLocaleString()} x {item.qty}
                </Text>
              </View>
              <View style={styles.cartRight}>
                <Text style={styles.cartItemTotal}>{(item.price * item.qty).toLocaleString()}</Text>
                <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                  <Trash2 size={20} color="red" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* --- Bottom: Payment Section --- */}
      <View style={styles.paymentSection}>
        
        {/* Currency Selector */}
        <View style={styles.rowBetween}>
          <Text style={styles.label}>ສະກຸນເງິນ:</Text>
          <View style={styles.currencyRow}>
            {(['LAK', 'THB', 'USD'] as const).map((curr) => (
              <TouchableOpacity
                key={curr}
                onPress={() => setCurrency(curr)}
                style={[styles.currencyBtn, currency === curr && styles.currencyBtnActive]}
              >
                <Text style={[styles.currencyText, currency === curr && styles.currencyTextActive]}>
                  {curr}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Totals */}
        <View style={styles.rowBetween}>
          <Text style={styles.subText}>ລວມລາຄາສິນຄ້າ:</Text>
          <Text style={styles.subText}>{subtotal.toLocaleString()}</Text>
        </View>
        
        {calculatedDiscount > 0 && (
          <View style={styles.rowBetween}>
            <Text style={styles.discountText}>ສ່ວນຫຼຸດ:</Text>
            <Text style={styles.discountText}>-{calculatedDiscount.toLocaleString()}</Text>
          </View>
        )}

        <View style={[styles.rowBetween, { marginTop: 5 }]}>
          <Text style={styles.totalLabel}>ຍອດຕ້ອງຊຳລະ:</Text>
          <View style={styles.inputWrapper}>
             <TextInput
                value={overrideTotal !== '' ? overrideTotal : (subtotal === 0 ? '' : subtotal.toString())}
                onChangeText={setOverrideTotal}
                keyboardType="numeric"
                style={styles.totalInput}
                placeholder="0"
             />
             <Text style={styles.currencySuffix}>{currency}</Text>
          </View>
        </View>

        {/* Payment Inputs */}
        <View style={styles.paymentBox}>
           <Text style={styles.inputLabel}>ຮັບເງິນມາ:</Text>
           <TextInput
              value={amountReceived}
              onChangeText={setAmountReceived}
              keyboardType="numeric"
              style={styles.moneyInput}
              placeholder="ປ້ອນຈຳນວນເງິນ..."
           />
           <View style={styles.rowBetween}>
              <Text style={styles.changeLabel}>ເງິນທອນ:</Text>
              <Text style={[styles.changeValue, { color: change < 0 ? 'red' : 'green' }]}>
                {change.toLocaleString()} {currency}
              </Text>
           </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          onPress={handleConfirmSale}
          disabled={cart.length === 0}
          style={[styles.confirmBtn, cart.length === 0 && styles.disabledBtn]}
        >
          <Text style={styles.confirmBtnText}>ຢືນຢັນການຂາຍ</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  
  // Product List
  productList: { paddingRight: 20 },
  productCard: { 
    width: 140, height: 100, backgroundColor: 'white', borderRadius: 8, padding: 10, marginRight: 10,
    justifyContent: 'center', borderWidth: 1, borderColor: '#eee'
  },
  productName: { fontWeight: 'bold', fontSize: 14, marginBottom: 5 },
  productPrice: { color: 'green', fontSize: 12 },

  // Cart
  cartContainer: { flex: 1, backgroundColor: 'white', borderRadius: 8, padding: 10, marginBottom: 10 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 20 },
  cartItem: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 8 },
  cartItemName: { fontWeight: '500' },
  cartItemDetail: { fontSize: 12, color: '#666' },
  cartRight: { alignItems: 'flex-end' },
  cartItemTotal: { fontWeight: 'bold', marginBottom: 4 },

  // Payment Section
  paymentSection: { backgroundColor: 'white', padding: 15, borderRadius: 12, elevation: 3 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  label: { fontSize: 14, color: '#444' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 8 },
  subText: { fontSize: 14, color: '#666' },
  discountText: { fontSize: 14, color: 'green' },
  totalLabel: { fontSize: 16, fontWeight: 'bold' },
  
  // Inputs
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: '#ccc', width: '50%' },
  totalInput: { flex: 1, fontSize: 18, fontWeight: 'bold', textAlign: 'right', color: 'blue', padding: 2 },
  currencySuffix: { fontSize: 12, color: '#888', marginLeft: 4 },
  
  // Currency Btns
  currencyRow: { flexDirection: 'row', gap: 5 },
  currencyBtn: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 4, borderWidth: 1, borderColor: '#ddd' },
  currencyBtnActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  currencyText: { fontSize: 12, color: '#333' },
  currencyTextActive: { color: 'white' },

  // Payment Box
  paymentBox: { backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8, marginTop: 10, marginBottom: 10 },
  inputLabel: { fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 4 },
  moneyInput: { backgroundColor: 'white', borderWidth: 1, borderColor: '#ddd', borderRadius: 4, padding: 8, fontSize: 16, marginBottom: 8 },
  changeLabel: { fontSize: 14, fontWeight: 'bold' },
  changeValue: { fontSize: 18, fontWeight: 'bold' },

  // Confirm Btn
  confirmBtn: { backgroundColor: '#22c55e', padding: 12, borderRadius: 8, alignItems: 'center' },
  disabledBtn: { backgroundColor: '#ccc' },
  confirmBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});