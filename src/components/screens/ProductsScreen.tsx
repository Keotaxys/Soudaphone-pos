import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    FlatList,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { COLORS, formatNumber, Product } from '../../types';

interface ProductsScreenProps {
  products: Product[];
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
}

export default function ProductsScreen({ 
  products, 
  onAddProduct, 
  onEditProduct, 
  onDeleteProduct 
}: ProductsScreenProps) {

  const [searchQuery, setSearchQuery] = useState('');

  // ກັ່ນຕອງສິນຄ້າຕາມການຄົ້ນຫາ
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.barcode && p.barcode.includes(searchQuery))
  );

  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.card}>
        {/* ຮູບພາບສິນຄ້າ */}
        <View style={styles.imageWrapper}>
            <Image 
                source={item.imageUrl ? { uri: item.imageUrl } : { uri: 'https://via.placeholder.com/150' }} 
                style={styles.image} 
            />
            {/* Tag ສະກຸນເງິນ */}
            <View style={[styles.tag, { backgroundColor: item.priceCurrency === 'LAK' ? COLORS.primary : COLORS.secondary }]}>
                <Text style={styles.tagText}>{item.priceCurrency}</Text>
            </View>
        </View>

        {/* ລາຍລະອຽດ */}
        <View style={styles.details}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.price}>
                {formatNumber(item.price)} {item.priceCurrency === 'LAK' ? '₭' : '฿'}
            </Text>
            <Text style={[styles.stock, item.stock <= 5 && { color: COLORS.danger }]}>
                ຄົງເຫຼືອ: {item.stock}
            </Text>
        </View>

        {/* ປຸ່ມຈັດການ (ແກ້ໄຂ / ລຶບ) */}
        <View style={styles.actions}>
            <TouchableOpacity style={styles.editBtn} onPress={() => onEditProduct(item)}>
                <Ionicons name="pencil" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => onDeleteProduct(item.id!)}>
                <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
            </TouchableOpacity>
        </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* ຊ່ອງຄົ້ນຫາ */}
      <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput 
            style={styles.searchInput} 
            placeholder="ຄົ້ນຫາຊື່ ຫຼື ບາໂຄດ..." 
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#ccc" />
              </TouchableOpacity>
          )}
      </View>

      {/* ລາຍການສິນຄ້າ */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id!}
        renderItem={renderProductItem}
        contentContainerStyle={{ padding: 15, paddingBottom: 100 }}
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Ionicons name="cube-outline" size={60} color="#ddd" />
                <Text style={styles.emptyText}>ບໍ່ພົບສິນຄ້າ</Text>
            </View>
        }
      />

      {/* ປຸ່ມເພີ່ມສິນຄ້າ (Floating Action Button) */}
      <TouchableOpacity style={styles.fab} onPress={onAddProduct}>
          <Ionicons name="add" size={30} color="white" />
          <Text style={styles.fabText}>ເພີ່ມສິນຄ້າ</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', margin: 15, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, elevation: 2 },
  searchInput: { flex: 1, marginLeft: 10, fontFamily: 'Lao-Regular', fontSize: 16 },

  card: { flexDirection: 'row', backgroundColor: 'white', marginBottom: 10, borderRadius: 12, padding: 10, alignItems: 'center', elevation: 1 },
  imageWrapper: { position: 'relative', width: 70, height: 70, borderRadius: 10, overflow: 'hidden', backgroundColor: '#f0f0f0' },
  image: { width: '100%', height: '100%' },
  tag: { position: 'absolute', top: 0, left: 0, paddingHorizontal: 6, paddingVertical: 2, borderBottomRightRadius: 8 },
  tagText: { color: 'white', fontSize: 10, fontFamily: 'Lao-Bold' },

  details: { flex: 1, marginLeft: 15 },
  name: { fontFamily: 'Lao-Bold', fontSize: 16, color: COLORS.text },
  price: { fontFamily: 'Lao-Bold', fontSize: 15, color: COLORS.primary, marginTop: 4 },
  stock: { fontFamily: 'Lao-Regular', fontSize: 12, color: '#888', marginTop: 2 },

  actions: { flexDirection: 'row', gap: 10 },
  editBtn: { padding: 8, backgroundColor: '#E0F2F1', borderRadius: 8 },
  deleteBtn: { padding: 8, backgroundColor: '#FFEBEE', borderRadius: 8 },

  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: COLORS.secondary, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, flexDirection: 'row', alignItems: 'center', elevation: 5 },
  fabText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 16, marginLeft: 5 },

  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontFamily: 'Lao-Regular', color: '#ccc', marginTop: 10 }
});