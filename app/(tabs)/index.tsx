import { Ionicons } from '@expo/vector-icons'; // ໄອຄອນງາມໆ
import { onValue, push, ref, update } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCartModal, setShowCartModal] = useState(false);

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

  // 2. ຟັງຊັນເພີ່ມລົງກະຕ່າ
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

  // 3. ຟັງຊັນສັ່ງຊື້ (Checkout)
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      // ກຽມຂໍ້ມູນອໍເດີ
      const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const orderData = {
        items: cart,
        total: totalAmount,
        date: new Date().toISOString(),
        status: 'ສຳເລັດ',
        source: 'Mobile App'
      };

      // ບັນທຶກລົງ Firebase Orders
      await push(ref(db, 'sales'), orderData);

      // ຕັດສະຕັອກ
      const updates: any = {};
      cart.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (product) {
          updates[`products/${item.id}/stock`] = product.stock - item.quantity;
        }
      });
      await update(ref(db), updates);

      Alert.alert('ສຳເລັດ!', 'ຂາຍສິນຄ້າຮຽບຮ້ອຍແລ້ວ');
      setCart([]); // ລ້າງກະຕ່າ
      setShowCartModal(false);
    } catch (error) {
      Alert.alert('ຜິດພາດ', 'ບໍ່ສາມາດບັນທຶກການຂາຍໄດ້');
      console.error(error);
    }
  };

  // ຄຳນວນຍອດລວມ
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

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
      {/* 🟢 ສ່ວນສະແດງສິນຄ້າ */}
      <FlatList
        data={products}
        keyExtractor={item => item.id}
        numColumns={2} // ສະແດງ 2 ຖັນ
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => addToCart(item)} // 👈 ໃສ່ onPress ໃຫ້ກົດໄດ້ແລ້ວ!
          >
            <View style={styles.imagePlaceholder}>
               <Text style={styles.placeholderText}>{item.name.charAt(0)}</Text>
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.title} numberOfLines={2}>{item.name}</Text>
                <View style={styles.row}>
                    <Text style={styles.price}>{Number(item.price).toLocaleString()} {item.priceCurrency === 'THB' ? '฿' : '₭'}</Text>
                    {item.stock <= 5 && (
                        <Text style={styles.lowStock}>{item.stock}</Text>
                    )}
                </View>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* 🟢 ແຖບກະຕ່າທາງລຸ່ມ (ສະແດງເມື່ອມີສິນຄ້າ) */}
      {cart.length > 0 && (
        <View style={styles.bottomBar}>
            <View>
                <Text style={styles.cartInfo}>{totalItems} ລາຍການ</Text>
                <Text style={styles.cartTotal}>{total.toLocaleString()} ກີບ</Text>
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
    flex: 1, 
    backgroundColor: 'white', 
    margin: 5, 
    borderRadius: 12, 
    overflow: 'hidden',
    elevation: 3, // ເງົາ Android
    shadowColor: '#000', // ເງົາ iOS
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  imagePlaceholder: {
    height: 100,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  placeholderText: { fontSize: 30, color: '#888', fontWeight: 'bold' },
  cardContent: { padding: 10 },
  title: { fontSize: 14, fontWeight: 'bold', marginBottom: 5, height: 40 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 14, color: '#0a7ea4', fontWeight: 'bold' },
  lowStock: { fontSize: 10, color: 'white', backgroundColor: 'red', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  
  // Bottom Bar Styles
  bottomBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#333',
    borderRadius: 50,
    padding: 15,
    paddingHorizontal: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10
  },
  cartInfo: { color: '#aaa', fontSize: 12 },
  cartTotal: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  checkoutBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#0a7ea4', 
    paddingVertical: 8, 
    paddingHorizontal: 15, 
    borderRadius: 20 
  },
  checkoutText: { color: 'white', fontWeight: 'bold', marginRight: 5 }
});