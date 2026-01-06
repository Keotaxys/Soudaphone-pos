import { onValue, ref } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
// 🟢 ຖອຍອອກ 2 ຂັ້ນ (../../) ເພື່ອໄປຫາ src/firebase.js
import { db } from '../../src/firebase';

// 🟢 ກຳນົດ Type ໃຫ້ສິນຄ້າ
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const productsRef = ref(db, 'products');
    
    // 🟢 ໃສ່ : any ເພື່ອບໍ່ໃຫ້ TS ຟ້ອງ Error
    const unsubscribe = onValue(productsRef, (snapshot: any) => {
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>ກຳລັງໂຫຼດຂໍ້ມູນຮ້ານ...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>ສິນຄ້າໃນຮ້ານ ({products.length})</Text>
      
      <FlatList
        data={products}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.name}</Text>
            <View style={styles.row}>
              <Text style={styles.price}>{Number(item.price).toLocaleString()} ກີບ</Text>
              <Text style={item.stock > 0 ? styles.stock : styles.outOfStock}>
                ຄົງເຫຼືອ: {item.stock}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5', paddingTop: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  card: { backgroundColor: 'white', padding: 15, marginBottom: 10, borderRadius: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  price: { fontSize: 16, color: 'green', fontWeight: 'bold' },
  stock: { color: 'gray' },
  outOfStock: { color: 'red', fontWeight: 'bold' }
});