import { signInAnonymously } from 'firebase/auth';
import { onValue, ref } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Button, FlatList, StyleSheet, Text, View } from 'react-native';
import { auth, db } from '../../src/firebase';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setErrorMsg(null);

    // 1. ເລີ່ມ Login
    signInAnonymously(auth)
      .then(() => {
        console.log("Login success!");
        
        // 2. ດຶງຂໍ້ມູນ
        const productsRef = ref(db, 'products');
        
        // 🟢 ເພີ່ມ Error Callback (parameter ທີ 2)
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
        }, (error) => {
          // 🛑 ຖ້າເກີດ Error (ເຊັ່ນ: Permission Denied) ມັນຈະເຂົ້າບ່ອນນີ້
          console.error("Firebase Read Error:", error);
          setErrorMsg("ອ່ານຂໍ້ມູນບໍ່ໄດ້: " + error.message);
          setLoading(false);
        });

        return unsubscribe;
      })
      .catch((error) => {
        console.error("Auth Error:", error);
        setErrorMsg("ເຂົ້າສູ່ລະບົບບໍ່ໄດ້: " + error.message);
        setLoading(false);
      });

  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{marginTop: 10}}>ກຳລັງໂຫຼດຂໍ້ມູນ...</Text>
      </View>
    );
  }

  // 🟢 ສະແດງ Error ຖ້າມີບັນຫາ
  if (errorMsg) {
    return (
      <View style={styles.center}>
        <Text style={{color: 'red', marginBottom: 10, textAlign: 'center'}}>{errorMsg}</Text>
        <Button title="ລອງໃໝ່" onPress={() => setErrorMsg(null)} />
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  card: { backgroundColor: 'white', padding: 15, marginBottom: 10, borderRadius: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  price: { fontSize: 16, color: 'green', fontWeight: 'bold' },
  stock: { color: 'gray' },
  outOfStock: { color: 'red', fontWeight: 'bold' }
});