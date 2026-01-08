import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, Alert, Image, Dimensions, Modal, SafeAreaView, ScrollView } from 'react-native';
import { ref, onValue, push, update } from 'firebase/database';
import { db } from '../../src/firebase'; 
import { Ionicons } from '@expo/vector-icons'; 
import { useFonts } from 'expo-font'; // 🟢 1. Import ຄຳສັ່ງໂຫຼດ Font

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
  priceCurrency?: 'LAK' | 'THB';
}

interface CartItem extends Product {
  quantity: number;
}

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const CARD_WIDTH = (width / COLUMN_COUNT) - 20; 

// 🎨 Theme Colors (ຂຽວພາສເທວ + ສົ້ມ)
const COLORS = {
  primary: '#4DB6AC',    // ຂຽວພາສເທວ
  primaryDark: '#009688', // ຂຽວເຂັ້ມ
  secondary: '#FFB74D',  // ສີສົ້ມ
  secondaryDark: '#F57C00', // ສົ້ມເຂັ້ມ
  background: '#F0F4F4', 
  cardBg: '#FFFFFF',
  text: '#424242',
  textLight: '#757575',
  danger: '#EF5350'
};

export default function App() {
  // 🟢 2. ໂຫຼດ Font ຈາກໂຟນເດີ assets/fonts
  const [fontsLoaded] = useFonts({
    'Lao-Bold': require('../../assets/fonts/NotoSansLao-Bold.ttf'),
    'Lao-Regular': require('../../assets/fonts/NotoSansLao-Regular.ttf'),
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const productsRef = ref(db, 'products');
    const unsubscribe = onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const productList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setProducts(productList as Product[]);
      } else {
        setProducts([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      Alert.alert('ສິນຄ້າໝົດ', 'ບໍ່ມີໃນສະຕັອກ');
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
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

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const orderData = {
        items: cart,
        total: totalAmount,
        date: new Date().toISOString(),
        status: 'ສຳເລັດ',
        source: 'Mobile App'
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
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'ເກີດຂໍ້ຜິດພາດ');
    }
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalLAK = cart.filter(i => i.priceCurrency !== 'THB').reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const totalTHB = cart.filter(i => i.priceCurrency === 'THB').reduce((sum, i) => sum + (i.price * i.quantity), 0);

  // 🟢 3. ລໍຖ້າໃຫ້ Font ໂຫຼດແລ້ວກ່ອນຈຶ່ງສະແດງໜ້າຈໍ
  if (!fontsLoaded || loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Soudaphone POS</Text>
        <TouchableOpacity style={styles.iconBtn}><Ionicons name="search" size={24} color={COLORS.text} /></TouchableOpacity>
      </View>

      <FlatList
        data={products}
        keyExtractor={item => item.id}
        numColumns={COLUMN_COUNT}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 10 }}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => addToCart(item)} activeOpacity={0.8}>
            <View style={styles.imageContainer}>
                {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.productImage} resizeMode="cover" />
                ) : (
                    <View style={styles.imagePlaceholder}><Text style={styles.placeholderText}>{item.name.charAt(0)}</Text></View>
                )}
                <View style={[styles.currencyBadge, { backgroundColor: item.priceCurrency === 'THB' ? COLORS.secondary : COLORS.primary }]}>
                    <Text style={styles.currencyText}>{item.priceCurrency || 'LAK'}</Text>
                </View>
                {item.stock <= 5 && <View style={styles.stockBadge}><Text style={styles.stockText}>{item.stock}</Text></View>}
            </View>
            <View style={styles.cardContent}>
                {/* 🟢 4. ໃຊ້ fontFamily: 'Lao-Regular' */}
                <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
                
                {/* 🟢 5. ໃຊ້ fontFamily: 'Lao-Bold' */}
                <Text style={[styles.price, { color: item.priceCurrency === 'THB' ? COLORS.secondaryDark : COLORS.primaryDark }]}>
                    {Number(item.price).toLocaleString()} {item.priceCurrency === 'THB' ? '฿' : '₭'}
                </Text>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}>
                <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      {/* Bottom Bar */}
      {cart.length > 0 && (
        <TouchableOpacity style={styles.bottomBar} onPress={() => setModalVisible(true)} activeOpacity={0.9}>
            <View style={styles.cartIconBadge}>
                <Ionicons name="cart" size={28} color="white" />
                <View style={styles.badge}><Text style={styles.badgeText}>{totalItems}</Text></View>
            </View>
            <View style={{flex: 1, marginLeft: 15}}>
                <Text style={styles.cartInfo}>ຍອດລວມທັງໝົດ</Text>
                <View style={{flexDirection: 'row', gap: 10}}>
                    {totalLAK > 0 && <Text style={styles.cartTotal}>{totalLAK.toLocaleString()} ₭</Text>}
                    {totalTHB > 0 && <Text style={styles.cartTotal}>{totalTHB.toLocaleString()} ฿</Text>}
                </View>
            </View>
            <View style={styles.viewCartBtn}>
                <Text style={styles.viewCartText}>ເບິ່ງກະຕ່າ</Text>
                <Ionicons name="chevron-up" size={20} color={COLORS.primaryDark} />
            </View>
        </TouchableOpacity>
      )}

      {/* Cart Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>ກະຕ່າສິນຄ້າ ({totalItems})</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                        <Ionicons name="close-circle" size={30} color="#ccc" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                    {cart.map(item => (
                        <View key={item.id} style={styles.cartItem}>
                            {item.imageUrl ? (
                                <Image source={{ uri: item.imageUrl }} style={styles.cartItemImage} />
                            ) : (
                                <View style={[styles.cartItemImage, {backgroundColor: '#eee'}]} />
                            )}
                            <View style={{flex: 1, paddingHorizontal: 10}}>
                                <Text style={styles.cartItemName} numberOfLines={1}>{item.name}</Text>
                                <Text style={[styles.cartItemPrice, { color: item.priceCurrency === 'THB' ? COLORS.secondaryDark : COLORS.primaryDark }]}>
                                    {item.price.toLocaleString()} {item.priceCurrency === 'THB' ? '฿' : '₭'}
                                </Text>
                            </View>
                            <View style={styles.qtyControls}>
                                <TouchableOpacity onPress={() => updateQuantity(item.id, -1)} style={styles.qtyBtn}><Ionicons name="remove" size={16} color="#555" /></TouchableOpacity>
                                <Text style={styles.qtyText}>{item.quantity}</Text>
                                <TouchableOpacity onPress={() => updateQuantity(item.id, 1)} style={styles.qtyBtn}><Ionicons name="add" size={16} color="#555" /></TouchableOpacity>
                            </View>
                            <TouchableOpacity onPress={() => removeFromCart(item.id)} style={{marginLeft: 10}}>
                                <Ionicons name="trash-outline" size={22} color={COLORS.danger} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>

                <View style={styles.modalFooter}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>ຍອດລວມ:</Text>
                        <View style={{alignItems: 'flex-end'}}>
                            {totalLAK > 0 && <Text style={[styles.finalTotal, {color: COLORS.primaryDark}]}>{totalLAK.toLocaleString()} ₭</Text>}
                            {totalTHB > 0 && <Text style={[styles.finalTotal, {color: COLORS.secondaryDark}]}>{totalTHB.toLocaleString()} ฿</Text>}
                        </View>
                    </View>
                    <TouchableOpacity style={styles.confirmBtn} onPress={handleCheckout}>
                        <Text style={styles.confirmBtnText}>ຢືນຢັນການຊຳລະເງິນ</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Header Style
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    padding: 15, backgroundColor: 'white', marginTop: 30,
    borderBottomWidth: 1, borderBottomColor: '#E0E0E0'
  },
  headerTitle: { fontSize: 22, color: COLORS.primaryDark, fontFamily: 'Lao-Bold' }, 
  iconBtn: { padding: 5 },
  
  // Card Style
  card: { 
    width: CARD_WIDTH, backgroundColor: 'white', marginBottom: 15, 
    borderRadius: 16, overflow: 'hidden', elevation: 2, 
    shadowColor: COLORS.primary, shadowOpacity: 0.1, shadowRadius: 5 
  },
  imageContainer: { height: 130, width: '100%', backgroundColor: '#f0f0f0', position: 'relative' },
  productImage: { width: '100%', height: '100%' },
  imagePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 30, color: '#ccc', fontFamily: 'Lao-Bold' },
  
  // Badges
  currencyBadge: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  currencyText: { color: 'white', fontSize: 10, fontFamily: 'Lao-Bold' },
  stockBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: COLORS.danger, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  stockText: { color: 'white', fontSize: 10, fontFamily: 'Lao-Bold' },
  
  cardContent: { padding: 12 },
  title: { fontSize: 14, color: '#333', marginBottom: 4, fontFamily: 'Lao-Regular' },
  price: { fontSize: 16, fontFamily: 'Lao-Bold' },
  
  // Add Button
  addBtn: { 
    position: 'absolute', bottom: 10, right: 10, 
    backgroundColor: COLORS.secondary, 
    width: 36, height: 36, borderRadius: 18, 
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 2, elevation: 3
  },

  // Bottom Bar
  bottomBar: { 
    position: 'absolute', bottom: 20, left: 15, right: 15, 
    backgroundColor: COLORS.primaryDark, 
    borderRadius: 20, padding: 15, flexDirection: 'row', alignItems: 'center', 
    elevation: 10, shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 10 
  },
  cartIconBadge: { position: 'relative' },
  badge: { 
    position: 'absolute', top: -5, right: -5, 
    backgroundColor: COLORS.secondary, 
    width: 20, height: 20, borderRadius: 10, 
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.primaryDark 
  },
  badgeText: { color: 'white', fontSize: 10, fontFamily: 'Lao-Bold' },
  cartInfo: { color: '#E0F2F1', fontSize: 10, textTransform: 'uppercase', fontFamily: 'Lao-Regular' },
  cartTotal: { color: 'white', fontSize: 16, fontFamily: 'Lao-Bold' },
  viewCartBtn: { 
    backgroundColor: 'white', paddingHorizontal: 15, paddingVertical: 8, 
    borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 5 
  },
  viewCartText: { color: COLORS.primaryDark, fontSize: 12, fontFamily: 'Lao-Bold' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 25, borderTopRightRadius: 25, height: '80%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 15 },
  modalTitle: { fontSize: 20, color: '#333', fontFamily: 'Lao-Bold' },
  modalBody: { flex: 1 },
  cartItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, backgroundColor: '#f9f9f9', padding: 10, borderRadius: 12 },
  cartItemImage: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#ddd' },
  cartItemName: { fontSize: 14, color: '#333', fontFamily: 'Lao-Regular' },
  cartItemPrice: { fontSize: 14, fontFamily: 'Lao-Bold' },
  qtyControls: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  qtyBtn: { padding: 5, width: 30, alignItems: 'center' },
  qtyText: { fontSize: 14, fontFamily: 'Lao-Bold', width: 20, textAlign: 'center' },
  
  modalFooter: { borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 20 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  totalLabel: { fontSize: 16, color: '#888', fontFamily: 'Lao-Regular' },
  finalTotal: { fontSize: 20, fontFamily: 'Lao-Bold' },
  confirmBtn: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 15, alignItems: 'center' },
  confirmBtnText: { color: 'white', fontSize: 18, fontFamily: 'Lao-Bold' }
});