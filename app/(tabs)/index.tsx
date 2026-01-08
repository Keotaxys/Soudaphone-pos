import { Ionicons } from '@expo/vector-icons';
import { onValue, push, ref, update } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../src/firebase';

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
const CARD_WIDTH = (width / COLUMN_COUNT) - 20; // ຄຳນວນຂະໜາດບັດໃຫ້ພໍດີຈໍ

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. ດຶງຂໍ້ມູນສິນຄ້າ
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

  // 2. ເພີ່ມລົງກະຕ່າ
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      Alert.alert('ສິນຄ້າໝົດ!', 'ສິນຄ້ານີ້ບໍ່ມີໃນສະຕັອກ');
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
            Alert.alert('ເຕືອນ', 'ຈຳນວນສິນຄ້າບໍ່ພໍ');
            return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  // 3. ສັ່ງຊື້
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
        if (product) {
          updates[`products/${item.id}/stock`] = product.stock - item.quantity;
        }
      });
      await update(ref(db), updates);

      Alert.alert('ສຳເລັດ!', 'ຂາຍສິນຄ້າຮຽບຮ້ອຍແລ້ວ');
      setCart([]);
    } catch (error) {
      Alert.alert('ຜິດພາດ', 'ບໍ່ສາມາດບັນທຶກການຂາຍໄດ້');
      console.error(error);
    }
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalLAK = cart.filter(i => i.priceCurrency !== 'THB').reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const totalTHB = cart.filter(i => i.priceCurrency === 'THB').reduce((sum, i) => sum + (i.price * i.quantity), 0);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text style={{marginTop: 10}}>ກຳລັງໂຫຼດ...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={item => item.id}
        numColumns={COLUMN_COUNT}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => addToCart(item)}>
            {/* 🟢 ສ່ວນສະແດງຮູບພາບ (Image) */}
            <View style={styles.imageContainer}>
                {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.productImage} resizeMode="cover" />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Text style={styles.placeholderText}>{item.name.charAt(0)}</Text>
                    </View>
                )}
                
                {/* ປ້າຍບອກສະກຸນເງິນ */}
                <View style={[styles.currencyBadge, { backgroundColor: item.priceCurrency === 'THB' ? '#007AFF' : '#34C759' }]}>
                    <Text style={styles.currencyText}>{item.priceCurrency || 'LAK'}</Text>
                </View>

                {/* ປ້າຍບອກສະຕັອກ (ຖ້າໃກ້ໝົດ) */}
                {item.stock <= 5 && (
                    <View style={styles.stockBadge}>
                        <Text style={styles.stockText}>{item.stock}</Text>
                    </View>
                )}
            </View>

            <View style={styles.cardContent}>
                <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.price, { color: item.priceCurrency === 'THB' ? '#007AFF' : '#34C759' }]}>
                    {Number(item.price).toLocaleString()} {item.priceCurrency === 'THB' ? '฿' : '₭'}
                </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* 🟢 ແຖບກະຕ່າ (Bottom Bar) */}
      {cart.length > 0 && (
        <View style={styles.bottomBar}>
            <View>
                <Text style={styles.cartInfo}>{totalItems} ລາຍການ</Text>
                <View style={{flexDirection: 'row', gap: 10}}>
                    {totalLAK > 0 && <Text style={styles.cartTotal}>{totalLAK.toLocaleString()} ₭</Text>}
                    {totalTHB > 0 && <Text style={styles.cartTotal}>{totalTHB.toLocaleString()} ฿</Text>}
                </View>
            </View>
            <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
                <Text style={styles.checkoutText}>ຢືນຢັນຂາຍ</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2', padding: 10, paddingTop: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { 
    width: CARD_WIDTH,
    backgroundColor: 'white', 
    marginBottom: 15, 
    borderRadius: 12, 
    overflow: 'hidden',
    elevation: 3, 
    shadowColor: '#000', 
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  // 🟢 Style ສຳລັບຮູບພາບ
  imageContainer: { height: 140, width: '100%', position: 'relative' },
  productImage: { width: '100%', height: '100%' },
  imagePlaceholder: { width: '100%', height: '100%', backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 40, color: '#aaa', fontWeight: 'bold' },
  
  // Badges
  currencyBadge: { position: 'absolute', top: 5, left: 5, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  currencyText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  stockBadge: { position: 'absolute', top: 5, right: 5, backgroundColor: 'red', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, minWidth: 20, alignItems: 'center' },
  stockText: { color: 'white', fontSize: 10, fontWeight: 'bold' },

  cardContent: { padding: 10 },
  title: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  price: { fontSize: 16, fontWeight: 'bold' },
  
  // Bottom Bar
  bottomBar: {
    position: 'absolute', bottom: 30, left: 20, right: 20,
    backgroundColor: '#222', borderRadius: 50, padding: 15, paddingHorizontal: 25,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    elevation: 10, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10
  },
  cartInfo: { color: '#aaa', fontSize: 12 },
  cartTotal: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  checkoutBtn: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: '#0a7ea4', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 30 
  },
  checkoutText: { color: 'white', fontWeight: 'bold', marginRight: 5 }
});
