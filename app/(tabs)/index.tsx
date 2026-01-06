import { onValue, ref } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { db } from '../../src/firebase'; // ດຶງ db ມາໃຊ້ໂດຍກົງ

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
    // 🟢 ບໍ່ຕ້ອງ Login ແລ້ວ! ດຶງຂໍ້ມູນເລີຍ
    const productsRef = ref(db, 'products');
    
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
      setLoading(false); // ຢຸດໝຸນເມື່ອໄດ້ຂໍ້ມູນ
    }, (error) => {
      console.error("Error reading db:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{marginTop: 10}}>ກຳລັງເຊື່ອມຕໍ່ຖານຂໍ້ມູນ...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>ສິນຄ້າໃນຮ້ານ ({products.length})</Text>
      
      {products.length === 0 ? (
        <View style={styles.center}>
          <Text style={{color: 'gray'}}>ຍັງບໍ່ມີສິນຄ້າ</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View>
                <Text style={styles.title}>{item.name}</Text>
                <Text style={styles.price}>{Number(item.price).toLocaleString()} ₭</Text>
              </View>
              <Text style={item.stock > 0 ? styles.stock : styles.outOfStock}>
                {item.stock}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5', paddingTop: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  card: { 
    backgroundColor: 'white', 
    padding: 15, 
    marginBottom: 10, 
    borderRadius: 10, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    elevation: 2 
  },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  price: { fontSize: 16, color: 'green', fontWeight: 'bold' },
  stock: { fontSize: 18, color: 'gray', fontWeight: 'bold', backgroundColor: '#eee', padding: 8, borderRadius: 5 },
  outOfStock: { fontSize: 14, color: 'white', fontWeight: 'bold', backgroundColor: 'red', padding: 8, borderRadius: 5 }
});