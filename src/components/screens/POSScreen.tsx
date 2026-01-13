import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { CartItem, COLORS, formatNumber, Product } from '../../types';

const { width } = Dimensions.get('window');

// Props ທີ່ຮັບມາຈາກ index.tsx
interface POSScreenProps {
  products: Product[];
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
  onCheckout: (details: any) => void;
  openEditProductModal?: (product: Product) => void;
}

export default function POSScreen({
  products,
  cart,
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  onCheckout,
}: POSScreenProps) {
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);

  // ຄຳນວນ Category ແລະ Filter ສິນຄ້າ
  useEffect(() => {
    // 1. ດຶງ Category ທັງໝົດອອກມາ
    const uniqueCats = ['All', ...new Set(products.map(p => p.category || 'ອື່ນໆ'))];
    setCategories(uniqueCats);

    // 2. Filter ສິນຄ້າ
    const filtered = products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.barcode && p.barcode.includes(searchQuery));
      const matchCat = selectedCategory === 'All' || (p.category || 'ອື່ນໆ') === selectedCategory;
      return matchSearch && matchCat;
    });
    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, products]);

  // ຄຳນວນຍອດລວມ
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Component: ບັດສິນຄ້າ (Product Card)
  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity 
      style={styles.productCard} 
      onPress={() => {
        if(item.stock > 0) addToCart(item);
      }}
      activeOpacity={0.7}
    >
      <Image 
        source={item.imageUrl ? { uri: item.imageUrl } : { uri: 'https://via.placeholder.com/150' }} 
        style={[styles.productImage, item.stock === 0 && { opacity: 0.5 }]} 
      />
      
      {/* ປ້າຍບອກ Stock */}
      {item.stock <= 5 && (
        <View style={[styles.stockBadge, item.stock === 0 ? {backgroundColor: '#D32F2F'} : {backgroundColor: '#FF9800'}]}>
          <Text style={styles.stockText}>{item.stock === 0 ? 'ໝົດ' : `ເຫຼືອ ${item.stock}`}</Text>
        </View>
      )}

      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.productPrice}>{formatNumber(item.price)} ₭</Text>
      </View>
    </TouchableOpacity>
  );

  // Component: ລາຍການໃນກະຕ່າ (Cart Item)
  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <View style={{flex: 1}}>
        <Text style={styles.cartItemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.cartItemPrice}>{formatNumber(item.price)} x {item.quantity}</Text>
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
      
      <TouchableOpacity onPress={() => removeFromCart(item.id!)} style={styles.removeBtn}>
        <Ionicons name="trash-outline" size={18} color="#FF5252" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* ---------------- ສ່ວນທີ 1: ລາຍການສິນຄ້າ (ຊ້າຍ) ---------------- */}
      <View style={styles.leftSection}>
        {/* Search Bar */}
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

        {/* Category Chips */}
        <View style={{ height: 50 }}>
          <FlatList 
            horizontal
            data={categories}
            keyExtractor={item => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 10, paddingVertical: 5 }}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.catChip, selectedCategory === item && styles.activeCatChip]}
                onPress={() => setSelectedCategory(item)}
              >
                <Text style={[styles.catText, selectedCategory === item && styles.activeCatText]}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Product Grid */}
        <FlatList
          data={filteredProducts}
          keyExtractor={item => item.id!}
          numColumns={2} // ສະແດງ 2 ຖັນ
          columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 10 }}
          contentContainerStyle={{ paddingBottom: 20, paddingTop: 10 }}
          renderItem={renderProductItem}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 50 }}>
              <Ionicons name="cube-outline" size={50} color="#ccc" />
              <Text style={{ color: '#999', marginTop: 10 }}>ບໍ່ພົບສິນຄ້າ</Text>
            </View>
          }
        />
      </View>

      {/* ---------------- ສ່ວນທີ 2: ກະຕ່າສິນຄ້າ (ຂວາ) ---------------- */}
      <View style={styles.rightSection}>
        <View style={styles.cartHeader}>
          <Text style={styles.cartTitle}>ກະຕ່າ ({cart.reduce((a,b)=>a+b.quantity,0)})</Text>
          <TouchableOpacity onPress={clearCart}>
            <Text style={styles.clearText}>ລ້າງ</Text>
          </TouchableOpacity>
        </View>

        <FlatList 
          data={cart}
          keyExtractor={item => item.id!}
          renderItem={renderCartItem}
          contentContainerStyle={{ padding: 10 }}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 }}>
              <Ionicons name="cart-outline" size={40} color="#eee" />
              <Text style={{ color: '#ccc', marginTop: 10 }}>ຍັງບໍ່ມີລາຍການ</Text>
            </View>
          }
        />

        {/* Footer: ຍອດລວມ & ປຸ່ມຈ່າຍເງິນ */}
        <View style={styles.cartFooter}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>ລວມທັງໝົດ:</Text>
            <Text style={styles.totalAmount}>{formatNumber(totalAmount)} ₭</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.payBtn, cart.length === 0 && { opacity: 0.6 }]}
            disabled={cart.length === 0}
            onPress={() => onCheckout({ amountReceived: totalAmount, paymentMethod: 'CASH' })}
          >
            <Text style={styles.payBtnText}>ຊຳລະເງິນ</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#F5F9FA' },
  
  // Left Section (Products)
  leftSection: { flex: 0.65, paddingRight: 5 }, // ກວມເອົາ 65% ຂອງໜ້າຈໍ
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', margin: 10, paddingHorizontal: 15, height: 45, borderRadius: 25, elevation: 1 },
  searchInput: { flex: 1, marginLeft: 10, fontFamily: 'Lao-Regular' },
  
  catChip: { paddingHorizontal: 15, paddingVertical: 6, backgroundColor: 'white', borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#eee', justifyContent: 'center' },
  activeCatChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catText: { fontFamily: 'Lao-Regular', color: '#666', fontSize: 12 },
  activeCatText: { color: 'white', fontFamily: 'Lao-Bold' },

  productCard: { width: '48%', backgroundColor: 'white', borderRadius: 12, marginBottom: 10, padding: 8, elevation: 2, position: 'relative' },
  productImage: { width: '100%', height: 100, borderRadius: 8, backgroundColor: '#f0f0f0', resizeMode: 'cover' },
  productInfo: { marginTop: 8 },
  productName: { fontFamily: 'Lao-Bold', fontSize: 14, color: '#333' },
  productPrice: { fontFamily: 'Lao-Bold', fontSize: 14, color: COLORS.primary },
  stockBadge: { position: 'absolute', top: 5, right: 5, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, zIndex: 1 },
  stockText: { color: 'white', fontSize: 10, fontFamily: 'Lao-Bold' },

  // Right Section (Cart)
  rightSection: { flex: 0.35, backgroundColor: 'white', borderLeftWidth: 1, borderLeftColor: '#eee' }, // ກວມເອົາ 35%
  cartHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', alignItems: 'center' },
  cartTitle: { fontFamily: 'Lao-Bold', fontSize: 16, color: '#333' },
  clearText: { color: '#FF5252', fontFamily: 'Lao-Regular', fontSize: 12 },
  
  cartItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f9f9f9' },
  cartItemName: { fontFamily: 'Lao-Regular', fontSize: 14, color: '#333' },
  cartItemPrice: { fontFamily: 'Lao-Bold', fontSize: 12, color: COLORS.primary },
  
  qtyControls: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 15, padding: 2, marginHorizontal: 5 },
  qtyBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  qtyText: { paddingHorizontal: 10, fontFamily: 'Lao-Bold', fontSize: 14 },
  removeBtn: { padding: 5 },

  cartFooter: { padding: 15, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#FAFAFA' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  totalLabel: { fontFamily: 'Lao-Regular', fontSize: 16, color: '#666' },
  totalAmount: { fontFamily: 'Lao-Bold', fontSize: 20, color: COLORS.primary },
  
  payBtn: { backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 25, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, elevation: 3 },
  payBtnText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 16 }
});